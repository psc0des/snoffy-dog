import * as vscode from 'vscode';
import { SnoffyPanel } from './snoffyPanel';
import { ScannerService } from './scannerService';
import { DiagnosticsProvider } from './diagnosticsProvider';
import { StatusBarManager } from './statusBar';
import { GraniteReportPanel } from './graniteReportPanel';
import { ScanProgress, ScanState, SecurityFinding } from './types';

/**
 * Main extension activation function
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Snoffy Dog extension is now active!');

    // Initialize services
    const scannerService = new ScannerService(context);
    const diagnosticsProvider = new DiagnosticsProvider();
    const statusBarManager = new StatusBarManager();
    
    // Store last scan findings for report
    let lastScanFindings: SecurityFinding[] = [];

    // Create the Snoffy panel provider
    const snoffyPanel = new SnoffyPanel(
        context.extensionUri,
        async () => {
            await handleStartScan();
        },
        () => {
            handleClearFindings();
        },
        () => {
            handleCancelScan();
        },
        () => {
            handleViewReport();
        }
    );

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SnoffyPanel.viewType,
            snoffyPanel
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('snoffyDog.startScan', async () => {
            await handleStartScan();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('snoffyDog.clearFindings', () => {
            handleClearFindings();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('snoffyDog.openPanel', () => {
            vscode.commands.executeCommand('snoffyDog.panel.focus');
        })
    );

    // Register disposables
    context.subscriptions.push(diagnosticsProvider);
    context.subscriptions.push(statusBarManager);

    /**
     * Handle start scan command
     */
    async function handleStartScan(): Promise<void> {
        // Check if already scanning
        if (scannerService.isScanning()) {
            return;
        }

        // Check if workspace is open
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a workspace folder to scan.');
            return;
        }

        try {
            // Update UI to scanning state
            statusBarManager.showScanning();

            // Start the scan with progress callback and log callback
            const findings = await scannerService.startScan(
                (progress: ScanProgress) => {
                    // Update webview panel with progress
                    snoffyPanel.updateProgress(progress);

                    // Update diagnostics as findings come in
                    if (progress.findings && progress.findings.length > 0) {
                        diagnosticsProvider.updateDiagnostics(progress.findings);
                    }
                },
                (message: string) => {
                    // Send log messages to webview
                    snoffyPanel.logMessage(message);
                }
            );

            // Store findings for report
            lastScanFindings = findings;
            
            // Update UI with final results
            snoffyPanel.updateComplete(findings);
            diagnosticsProvider.updateDiagnostics(findings);
            statusBarManager.updateFromFindings(findings);

            // Show completion message
            if (findings.length === 0) {
                vscode.window.showInformationMessage('🐕 Snoffy found no security issues!');
            } else {
                vscode.window.showWarningMessage(
                    `🐕 Snoffy found ${findings.length} security issue${findings.length > 1 ? 's' : ''}!`
                );
            }
        } catch (error) {
            statusBarManager.showError();
            vscode.window.showErrorMessage(`Scan failed: ${error}`);
            console.error('Scan error:', error);
        }
    }

    /**
     * Handle cancel scan command
     */
    function handleCancelScan(): void {
        scannerService.cancelScan();
        diagnosticsProvider.clear();
        statusBarManager.updateStatusBar(0);
        snoffyPanel.updateCancelled();
    }

    /**
     * Handle clear findings command
     */
    function handleClearFindings(): void {
        scannerService.clearFindings();
        diagnosticsProvider.clear();
        statusBarManager.updateStatusBar(0);
        lastScanFindings = [];
        vscode.window.showInformationMessage('🐕 Snoffy cleared all findings!');
    }
    
    /**
     * Handle view report command
     */
    function handleViewReport(): void {
        if (lastScanFindings.length === 0) {
            vscode.window.showInformationMessage('No scan results to display. Run a scan first!');
            return;
        }
        GraniteReportPanel.show(context.extensionUri, lastScanFindings);
    }

    // Show welcome message
    vscode.window.showInformationMessage('🐕 Snoffy Dog is ready to sniff out security issues!');
}

/**
 * Extension deactivation function
 */
export function deactivate() {
    console.log('Snoffy Dog extension is now deactivated.');
}

// Made with Bob
