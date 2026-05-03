import * as vscode from 'vscode';
import { SecurityFinding, FindingType, FindingSeverity, ScanState, ScanProgress } from './types';
import { SECURITY_RULES, SecurityRule } from './securityRules';
import { GraniteFilterService } from './graniteFilterService';

/**
 * Service responsible for scanning workspace files for security issues
 */
export class ScannerService {
    private findings: SecurityFinding[] = [];
    private scanState: ScanState = ScanState.IDLE;
    private graniteFilter: GraniteFilterService;
    private fileContents: Map<string, string> = new Map();
    private abortController: AbortController | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.graniteFilter = new GraniteFilterService();
    }

    /**
     * Start scanning the workspace for security issues
     * @param progressCallback Callback to report scan progress
     * @param logCallback Optional callback for log messages
     */
    async startScan(
        progressCallback: (progress: ScanProgress) => void,
        logCallback?: (message: string) => void
    ): Promise<SecurityFinding[]> {
        this.findings = [];
        this.fileContents.clear();
        this.scanState = ScanState.SCANNING;
        this.abortController = new AbortController();

        try {
            // Get all files in workspace (excluding noise directories)
            const files = await this.getWorkspaceFiles();
            
            let filesScanned = 0;
            const totalFiles = files.length;

            // Report initial progress
            progressCallback({
                state: ScanState.SCANNING,
                filesScanned: 0,
                totalFiles,
                findings: []
            });

            // Scan each file with real rule-based detection
            for (const file of files) {
                // Check if scan was cancelled
                if (this.abortController.signal.aborted) {
                    throw new Error('Scan cancelled');
                }

                const relativePath = vscode.workspace.asRelativePath(file);
                logCallback?.(`sniffing ${relativePath}...`);

                await this.scanFile(file);
                filesScanned++;

                // Report progress every file
                progressCallback({
                    state: ScanState.SCANNING,
                    filesScanned,
                    totalFiles,
                    currentFile: relativePath,
                    findings: [...this.findings]
                });

                // Small delay to keep UI responsive
                if (filesScanned % 10 === 0) {
                    await this.delay(10);
                }
            }

            // Check if scan was cancelled before Granite filtering
            if (this.abortController.signal.aborted) {
                throw new Error('Scan cancelled');
            }

            // Log scan completion
            const findingsCount = this.findings.length;
            logCallback?.(`scan done. found ${findingsCount} thing${findingsCount !== 1 ? 's' : ''}. asking granite to verify...`);

            // Apply Granite AI filtering if enabled
            if (this.graniteFilter.isEnabled()) {
                vscode.window.showInformationMessage('🤖 Granite AI is analyzing findings...');
                this.findings = await this.graniteFilter.filterFindings(
                    this.findings,
                    this.fileContents,
                    this.abortController.signal,
                    logCallback
                );
            }

            this.scanState = ScanState.COMPLETE;

            // Report completion
            progressCallback({
                state: ScanState.COMPLETE,
                filesScanned: totalFiles,
                totalFiles,
                findings: [...this.findings]
            });

            return this.findings;
        } catch (error) {
            if (error instanceof Error && error.message === 'Scan cancelled') {
                this.scanState = ScanState.IDLE;
                // Return empty findings on cancellation
                return [];
            }
            this.scanState = ScanState.ERROR;
            throw error;
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Cancel the current scan
     */
    cancelScan(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.scanState = ScanState.IDLE;
        }
    }

    /**
     * Check if a scan is currently running
     */
    isScanning(): boolean {
        return this.scanState === ScanState.SCANNING;
    }

    /**
     * Get all scannable files in the workspace, excluding noise directories
     */
    private async getWorkspaceFiles(): Promise<vscode.Uri[]> {
        // Find all code files, excluding common build/dependency directories
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,py,java,go,rb,php,cs,cpp,c,h,hpp,json,yaml,yml,env,sh,bash,sql,xml,html,css,scss,sass,vue,svelte}',
            '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**,**/target/**,**/.next/**,**/.nuxt/**,**/vendor/**,**/__pycache__/**,**/.venv/**,**/venv/**,**/*.min.js,**/*.bundle.js}'
        );

        return files;
    }

    /**
     * Scan a single file for security issues using rule-based detection
     */
    private async scanFile(fileUri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const text = document.getText();
            const relativePath = vscode.workspace.asRelativePath(fileUri);
            const lines = text.split('\n');

            // Store file contents for Granite AI context
            this.fileContents.set(relativePath, text);

            // Apply each security rule to the file
            for (const rule of SECURITY_RULES) {
                // Reset regex lastIndex for global patterns
                rule.pattern.lastIndex = 0;
                
                let match: RegExpExecArray | null;
                
                // Find all matches in the file
                while ((match = rule.pattern.exec(text)) !== null) {
                    // Calculate line and column from match index
                    const position = this.getLineAndColumn(text, match.index);
                    
                    // Extract the matched text
                    const matchedText = match[0];
                    const lineText = lines[position.line].trim();
                    
                    // Skip if this looks like a comment or example
                    if (this.isLikelyFalsePositive(lineText, matchedText)) {
                        continue;
                    }
                    
                    // Create finding
                    const finding: SecurityFinding = {
                        id: `${relativePath}-${position.line}-${position.column}-${rule.id}`,
                        type: this.mapCategoryToType(rule.category),
                        severity: rule.severity,
                        file: relativePath,
                        line: position.line,
                        column: position.column,
                        length: matchedText.length,
                        message: `${this.getSeverityEmoji(rule.severity)} ${rule.name}`,
                        description: rule.description,
                        snippet: lineText
                    };
                    
                    this.findings.push(finding);
                    
                    // Prevent infinite loops on zero-width matches
                    if (match.index === rule.pattern.lastIndex) {
                        rule.pattern.lastIndex++;
                    }
                }
            }
        } catch (error) {
            // Silently skip files that can't be read
            console.error(`Error scanning file ${fileUri.fsPath}:`, error);
        }
    }

    /**
     * Calculate line and column number from character index
     */
    private getLineAndColumn(text: string, index: number): { line: number; column: number } {
        const lines = text.substring(0, index).split('\n');
        return {
            line: lines.length - 1,
            column: lines[lines.length - 1].length
        };
    }

    /**
     * Check if a match is likely a false positive
     */
    private isLikelyFalsePositive(lineText: string, matchedText: string): boolean {
        const lowerLine = lineText.toLowerCase();
        const lowerMatch = matchedText.toLowerCase();
        
        // Skip comments
        if (lowerLine.trim().startsWith('//') || 
            lowerLine.trim().startsWith('#') || 
            lowerLine.trim().startsWith('/*') ||
            lowerLine.trim().startsWith('*')) {
            return true;
        }
        
        // Skip obvious examples/placeholders
        const exampleKeywords = [
            'example', 'test', 'dummy', 'placeholder', 'sample',
            'your_', 'your-', 'todo', 'fixme', 'xxx', 'yyy',
            'fake', 'mock', 'demo'
        ];
        
        for (const keyword of exampleKeywords) {
            if (lowerLine.includes(keyword) || lowerMatch.includes(keyword)) {
                return true;
            }
        }
        
        // Skip very short passwords (likely placeholders)
        if (lowerLine.includes('password') && matchedText.length < 4) {
            return true;
        }
        
        return false;
    }

    /**
     * Map rule category to finding type
     */
    private mapCategoryToType(category: string): FindingType {
        switch (category) {
            case 'secret':
                return FindingType.SECRET;
            case 'dangerous-pattern':
                return FindingType.DANGEROUS_PATTERN;
            case 'dev-url':
                return FindingType.DEV_URL;
            default:
                return FindingType.DANGEROUS_PATTERN;
        }
    }

    /**
     * Get emoji for severity level
     */
    private getSeverityEmoji(severity: FindingSeverity): string {
        switch (severity) {
            case FindingSeverity.HIGH:
                return '🔴';
            case FindingSeverity.MEDIUM:
                return '🟡';
            case FindingSeverity.LOW:
                return '🔵';
            default:
                return '⚠️';
        }
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current findings
     */
    getFindings(): SecurityFinding[] {
        return [...this.findings];
    }

    /**
     * Clear all findings
     */
    clearFindings(): void {
        this.findings = [];
        this.scanState = ScanState.IDLE;
    }

    /**
     * Get current scan state
     */
    getScanState(): ScanState {
        return this.scanState;
    }
}

// Made with Bob
