import * as vscode from 'vscode';
import { SecurityFinding, FindingSeverity } from './types';

/**
 * Manages VS Code diagnostics (red squiggles) for security findings
 */
export class DiagnosticsProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('snoffyDog');
    }

    /**
     * Update diagnostics based on security findings
     */
    updateDiagnostics(findings: SecurityFinding[]): void {
        // Clear existing diagnostics
        this.diagnosticCollection.clear();

        // Group findings by file
        const findingsByFile = this.groupFindingsByFile(findings);

        // Create diagnostics for each file
        for (const [filePath, fileFindings] of findingsByFile.entries()) {
            const uri = this.getFileUri(filePath);
            if (!uri) {
                continue;
            }

            const diagnostics: vscode.Diagnostic[] = fileFindings.map(finding => 
                this.createDiagnostic(finding)
            );

            this.diagnosticCollection.set(uri, diagnostics);
        }
    }

    /**
     * Create a VS Code diagnostic from a security finding
     */
    private createDiagnostic(finding: SecurityFinding): vscode.Diagnostic {
        const range = new vscode.Range(
            finding.line,
            finding.column,
            finding.line,
            finding.column + finding.length
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            finding.message,
            this.getSeverity(finding.severity)
        );

        diagnostic.source = 'Snoffy Dog';
        diagnostic.code = finding.type;

        return diagnostic;
    }

    /**
     * Map finding severity to VS Code diagnostic severity
     */
    private getSeverity(severity: FindingSeverity): vscode.DiagnosticSeverity {
        switch (severity) {
            case FindingSeverity.HIGH:
                return vscode.DiagnosticSeverity.Error;
            case FindingSeverity.MEDIUM:
                return vscode.DiagnosticSeverity.Warning;
            case FindingSeverity.LOW:
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    /**
     * Group findings by file path
     */
    private groupFindingsByFile(findings: SecurityFinding[]): Map<string, SecurityFinding[]> {
        const grouped = new Map<string, SecurityFinding[]>();

        for (const finding of findings) {
            const existing = grouped.get(finding.file) || [];
            existing.push(finding);
            grouped.set(finding.file, existing);
        }

        return grouped;
    }

    /**
     * Get URI for a file path
     */
    private getFileUri(filePath: string): vscode.Uri | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        // Assume first workspace folder
        const workspaceRoot = workspaceFolders[0].uri;
        return vscode.Uri.joinPath(workspaceRoot, filePath);
    }

    /**
     * Clear all diagnostics
     */
    clear(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose of the diagnostic collection
     */
    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

// Made with Bob
