import * as https from 'https';
import * as vscode from 'vscode';
import { SecurityFinding, GraniteVerification, VerificationStatus } from './types';
import { IAMTokenManager } from './iamTokenManager';

/**
 * Granite AI chat completions request payload
 */
interface GraniteRequest {
    model_id: string;
    project_id: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
    max_tokens: number;
    temperature: number;
}

/**
 * Service for filtering false positives using IBM Granite AI on watsonx.ai
 * Uses ibm/granite-4-h-small model for efficient classification
 */
export class GraniteFilterService {
    private tokenManager: IAMTokenManager | null = null;
    private readonly watsonxUrl: string;
    private readonly projectId: string;
    private readonly modelId = 'ibm/granite-4-h-small';
    private readonly concurrencyLimit = 5;
    private readonly timeout = 5000; // 5 seconds
    private enabled = false;

    constructor() {
        // Load environment variables
        const apiKey = process.env.WATSONX_API_KEY;
        const projectId = process.env.WATSONX_PROJECT_ID;
        const watsonxUrl = process.env.WATSONX_URL || 'us-south.ml.cloud.ibm.com';

        this.projectId = projectId || '';
        this.watsonxUrl = watsonxUrl;

        // Initialize if credentials are available
        if (apiKey && projectId) {
            this.tokenManager = new IAMTokenManager(apiKey);
            this.enabled = true;
            console.log('Granite AI filter enabled');
        } else {
            console.warn('Granite AI filter disabled: Missing WATSONX_API_KEY or WATSONX_PROJECT_ID');
        }
    }

    /**
     * Check if Granite filtering is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Filter findings using Granite AI in batches
     */
    async filterFindings(
        findings: SecurityFinding[],
        fileContents: Map<string, string>,
        abortSignal?: AbortSignal,
        logCallback?: (message: string) => void
    ): Promise<SecurityFinding[]> {
        if (!this.enabled || !this.tokenManager) {
            // Return all findings as unverified if Granite is disabled
            return findings.map(f => ({
                ...f,
                verificationStatus: VerificationStatus.UNVERIFIED
            }));
        }

        try {
            logCallback?.('granite phase starting...');
            
            // Get IAM token (with logging)
            await this.tokenManager.getToken(logCallback);
            
            // Calculate batches
            const totalBatches = Math.ceil(findings.length / this.concurrencyLimit);
            logCallback?.(`  → starting batch 1/${totalBatches} (${Math.min(this.concurrencyLimit, findings.length)} findings concurrent)`);
            
            // Process findings in batches of 5
            const results: SecurityFinding[] = [];
            let processedCount = 0;
            let batchNum = 0;
            const batchStats: Array<{verified: number, filtered: number, errors: number}> = [];
            
            for (let i = 0; i < findings.length; i += this.concurrencyLimit) {
                // Check if cancelled
                if (abortSignal?.aborted) {
                    throw new Error('Granite filtering cancelled');
                }

                batchNum++;
                const batch = findings.slice(i, i + this.concurrencyLimit);
                
                const batchResults = await Promise.all(
                    batch.map((finding, idx) =>
                        this.verifyFinding(
                            finding,
                            fileContents,
                            abortSignal,
                            logCallback,
                            processedCount + idx + 1,
                            findings.length
                        )
                    )
                );
                
                processedCount += batch.length;
                results.push(...batchResults);
                
                // Calculate batch stats
                const batchVerified = batchResults.filter(f => f.verificationStatus === VerificationStatus.VERIFIED).length;
                const batchFiltered = batchResults.filter(f => f.verificationStatus === VerificationStatus.FILTERED).length;
                const batchErrors = batchResults.filter(f => f.verificationStatus === VerificationStatus.UNVERIFIED && f.verification?.reason === 'Failed to parse AI response').length;
                batchStats.push({verified: batchVerified, filtered: batchFiltered, errors: batchErrors});
                
                // Log batch completion
                logCallback?.(`── batch ${batchNum}/${totalBatches} complete (${batchVerified} verified, ${batchFiltered} filtered, ${batchErrors} error) ──`);
                
                // Log next batch start if not done
                if (i + this.concurrencyLimit < findings.length) {
                    const remaining = findings.length - processedCount;
                    logCallback?.(`── starting batch ${batchNum + 1}/${totalBatches} ──`);
                }
            }

            // Calculate totals
            const totalVerified = results.filter(f => f.verificationStatus === VerificationStatus.VERIFIED).length;
            const totalFiltered = results.filter(f => f.verificationStatus === VerificationStatus.FILTERED).length;
            const totalUnverified = results.filter(f => f.verificationStatus === VerificationStatus.UNVERIFIED).length;
            const totalErrors = results.filter(f => f.verificationStatus === VerificationStatus.UNVERIFIED && f.verification?.reason === 'Failed to parse AI response').length;
            
            // Calculate total time (approximate based on batch count)
            const avgTimePerBatch = 2.5; // Rough estimate
            const totalTime = (batchNum * avgTimePerBatch).toFixed(1);
            
            logCallback?.('── all batches complete ──');
            logCallback?.(`totals: ${totalVerified} verified, ${totalFiltered} filtered, ${totalUnverified} needs review, ${totalErrors} errors`);
            logCallback?.(`total granite time: ${totalTime}s`);

            return results;
        } catch (error) {
            if (error instanceof Error && error.message === 'Granite filtering cancelled') {
                // On cancellation, return findings as unverified
                return findings.map(f => ({
                    ...f,
                    verificationStatus: VerificationStatus.UNVERIFIED
                }));
            }
            console.error('Granite filtering failed:', error);
            // On failure, return all as unverified
            return findings.map(f => ({
                ...f,
                verificationStatus: VerificationStatus.UNVERIFIED
            }));
        }
    }

    /**
     * Verify a single finding using Granite AI
     */
    private async verifyFinding(
        finding: SecurityFinding,
        fileContents: Map<string, string>,
        abortSignal?: AbortSignal,
        logCallback?: (message: string) => void,
        findingNum?: number,
        totalFindings?: number
    ): Promise<SecurityFinding> {
        const startTime = Date.now();
        
        try {
            // Log finding header
            const shortMessage = finding.message.length > 40
                ? finding.message.substring(0, 40) + '...'
                : finding.message;
            const findingLabel = findingNum && totalFindings
                ? `finding ${findingNum}/${totalFindings}`
                : 'finding';
            
            logCallback?.(`${findingLabel} — 🔵 ${shortMessage} in ${finding.file}:${finding.line + 1}`);
            
            // Get context lines
            logCallback?.(`  → preparing prompt (file path + snippet + 2 lines context)`);
            const context = this.getContext(finding, fileContents);
            
            // Build prompt
            const prompt = this.buildPrompt(finding, context);
            
            // Call Granite
            logCallback?.(`  → POST → watsonx.ai (${this.modelId})`);
            logCallback?.(`  → ⏳ waiting for granite...`);
            const verification = await this.callGranite(prompt, abortSignal, logCallback);
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            logCallback?.(`  ← received in ${elapsed}s`);
            
            // Determine verification status
            const status = this.determineStatus(verification);
            
            // Log verdict
            const statusSymbol = status === VerificationStatus.VERIFIED ? '✓' : status === VerificationStatus.FILTERED ? '✗' : '?';
            const statusText = status === VerificationStatus.VERIFIED ? 'verified' : status === VerificationStatus.FILTERED ? 'filtered' : 'needs review';
            const reason = verification.reason.length > 50 ? verification.reason.substring(0, 50) + '...' : verification.reason;
            logCallback?.(`  → verdict: ${statusSymbol} ${statusText} (${verification.is_real ? 'real' : 'placeholder'}, "${reason}")`);
            
            return {
                ...finding,
                verificationStatus: status,
                verification
            };
        } catch (error) {
            if (error instanceof Error && error.message.includes('aborted')) {
                throw error; // Propagate cancellation
            }
            
            // Log error details
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            if (error instanceof Error) {
                if (error.message.includes('timed out')) {
                    logCallback?.(`  ← ⚠ request timed out (after ${this.timeout / 1000}.0s)`);
                } else if (error.message.includes('404')) {
                    logCallback?.(`  ← ⚠ HTTP 404: model not found`);
                } else if (error.message.includes('parse')) {
                    const rawText = error.message.substring(0, 80);
                    logCallback?.(`  ← ⚠ parse failed: no {is_real} pattern found in: ${rawText}`);
                } else {
                    logCallback?.(`  ← ⚠ error: ${error.message.substring(0, 60)}`);
                }
            }
            
            console.error(`Failed to verify finding ${finding.id}:`, error);
            // On error, mark as unverified
            return {
                ...finding,
                verificationStatus: VerificationStatus.UNVERIFIED,
                verification: {
                    is_real: true,
                    confidence: 0.5,
                    reason: 'Failed to parse AI response'
                }
            };
        }
    }

    /**
     * Get surrounding context for a finding
     */
    private getContext(finding: SecurityFinding, fileContents: Map<string, string>): string {
        const content = fileContents.get(finding.file);
        if (!content) {
            return finding.snippet || '';
        }

        const lines = content.split('\n');
        const lineNum = finding.line;
        
        // Get line above, current line, and line below
        const contextLines: string[] = [];
        if (lineNum > 0) {
            contextLines.push(lines[lineNum - 1]);
        }
        contextLines.push(lines[lineNum]);
        if (lineNum < lines.length - 1) {
            contextLines.push(lines[lineNum + 1]);
        }

        return contextLines.join('\n');
    }

    /**
     * Build prompt for Granite AI
     */
    private buildPrompt(finding: SecurityFinding, context: string): string {
        return `You are a security expert analyzing code for false positives. Classify if this security finding is REAL or a PLACEHOLDER/TEST.

File: ${finding.file}
Rule: ${finding.message}
Matched: ${finding.snippet}

Context:
\`\`\`
${context}
\`\`\`

EXAMPLES:
1. REAL: api_key = "sk_live_51H8xYz..." in src/config.ts → {"is_real": true, "confidence": 0.95, "reason": "Live Stripe key in production code"}
2. PLACEHOLDER: password = "your_password_here" in examples/demo.py → {"is_real": false, "confidence": 0.9, "reason": "Obvious placeholder text"}

RULES:
- Files in test/, tests/, examples/, fixtures/, __tests__/, demo/ are usually placeholders
- Values like "YOUR_KEY", "REPLACE_ME", "TODO", "FIXME", "xxx", "example" are placeholders
- Production paths like src/, lib/, app/ with real-looking values are likely real
- Comments are usually examples

Respond ONLY with JSON:
{"is_real": boolean, "confidence": number, "reason": string}`;
    }

    /**
     * Call Granite AI model on watsonx.ai
     */
    private async callGranite(prompt: string, abortSignal?: AbortSignal, logCallback?: (message: string) => void): Promise<GraniteVerification> {
        if (!this.tokenManager) {
            throw new Error('Token manager not initialized');
        }

        // Check if already aborted
        if (abortSignal?.aborted) {
            throw new Error('Request aborted');
        }

        // Get IAM token (without logging here, already logged in filterFindings)
        const token = await this.tokenManager.getToken();

        // Build request for chat completions endpoint
        const requestBody: GraniteRequest = {
            model_id: this.modelId,
            project_id: this.projectId,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 200,
            temperature: 0.1 // Low temperature for consistent classification
        };

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(requestBody);

            const options = {
                hostname: this.watsonxUrl,
                path: '/ml/v1/chat/completions?version=2024-10-21',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: this.timeout
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`Granite API error: ${res.statusCode} ${data}`));
                            return;
                        }

                        const response = JSON.parse(data);
                        
                        // Log raw API response (increased to 500 chars for better visibility)
                        const rawResponsePreview = JSON.stringify(response).slice(0, 500);
                        logCallback?.(`  ← raw API response: ${rawResponsePreview}`);
                        console.log('Granite raw API response:', response);
                        
                        // Extract from chat completions response
                        const generatedText = response.choices?.[0]?.message?.content || '';
                        
                        // Log extracted generated_text (increased to 400 chars)
                        if (generatedText) {
                            const textPreview = generatedText.slice(0, 400);
                            logCallback?.(`  ← extracted generated_text: ${textPreview}`);
                            console.log('Granite generated_text:', generatedText);
                        } else {
                            logCallback?.(`  ⚠ generated_text is empty — wrong endpoint? trying chat completions next?`);
                            console.warn('Granite generated_text is empty. Response structure:', response);
                        }
                        
                        // Log what we're parsing (increased to 300 chars)
                        if (generatedText) {
                            const parsePreview = generatedText.slice(0, 300);
                            logCallback?.(`  → parsing raw text: ${parsePreview}`);
                        }
                        
                        // Parse JSON from response (tolerant parsing)
                        const verification = this.parseGraniteResponse(generatedText);
                        resolve(verification);
                    } catch (error) {
                        reject(new Error(`Failed to parse Granite response: ${error}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Granite request error: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Granite request timed out'));
            });

            // Handle abort signal
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    req.destroy();
                    reject(new Error('Request aborted'));
                });
            }

            req.write(postData);
            req.end();
        });
    }

    /**
     * Parse Granite response with tolerance for markdown fences and extra text
     */
    private parseGraniteResponse(text: string): GraniteVerification {
        try {
            // Extract JSON from markdown code blocks or plain text
            const jsonMatch = text.match(/\{[\s\S]*?"is_real"[\s\S]*?\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate structure
            if (typeof parsed.is_real !== 'boolean' || 
                typeof parsed.confidence !== 'number' ||
                typeof parsed.reason !== 'string') {
                throw new Error('Invalid JSON structure');
            }

            // Clamp confidence to 0-1
            parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

            return parsed;
        } catch (error) {
            // Fallback: mark as unverified
            return {
                is_real: true,
                confidence: 0.5,
                reason: 'Failed to parse AI response'
            };
        }
    }

    /**
     * Determine verification status based on Granite response
     */
    private determineStatus(verification: GraniteVerification): VerificationStatus {
        const { is_real, confidence } = verification;

        if (confidence <= 0.7) {
            // Low confidence → unverified
            return VerificationStatus.UNVERIFIED;
        }

        if (is_real) {
            // High confidence + real → verified
            return VerificationStatus.VERIFIED;
        } else {
            // High confidence + not real → filtered
            return VerificationStatus.FILTERED;
        }
    }
}

// Made with Bob
