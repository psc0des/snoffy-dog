import * as vscode from 'vscode';
import { SecurityFinding, ScanProgress, ScanState, MessageType, WebviewMessage } from './types';

/**
 * Manages the Snoffy Dog webview panel in the sidebar
 */
export class SnoffyPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'snoffyDog.panel';
    private view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly onStartScan: () => Promise<void>,
        private readonly onClearFindings: () => void,
        private readonly onCancelScan: () => void,
        private readonly onViewReport: () => void
    ) {}

    /**
     * Called when the view is first created
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            switch (message.type) {
                case MessageType.START_SCAN:
                    await this.onStartScan();
                    break;
                case MessageType.CANCEL_SCAN:
                    this.onCancelScan();
                    break;
                case MessageType.NAVIGATE_TO_FINDING:
                    this.navigateToFinding(message.payload);
                    break;
                case MessageType.CLEAR_FINDINGS:
                    this.onClearFindings();
                    break;
                case MessageType.VIEW_REPORT:
                    this.onViewReport();
                    break;
            }
        });
    }

    /**
     * Update the webview with scan progress
     */
    public updateProgress(progress: ScanProgress): void {
        if (this.view) {
            this.view.webview.postMessage({
                type: MessageType.SCAN_PROGRESS,
                payload: progress
            });
        }
    }

    /**
     * Update the webview with scan completion
     */
    public updateComplete(findings: SecurityFinding[]): void {
        if (this.view) {
            this.view.webview.postMessage({
                type: MessageType.SCAN_COMPLETE,
                payload: findings
            });
        }
    }

    /**
     * Update the webview when scan is cancelled
     */
    public updateCancelled(): void {
        if (this.view) {
            this.view.webview.postMessage({
                type: MessageType.SCAN_CANCELLED
            });
        }
    }

    /**
     * Send a log message to the webview
     */
    public logMessage(message: string): void {
        if (this.view) {
            this.view.webview.postMessage({
                type: MessageType.LOG_MESSAGE,
                payload: message
            });
        }
    }

    /**
     * Navigate to a specific finding in the editor with decorations
     */
    private async navigateToFinding(finding: SecurityFinding): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, finding.file);
        
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(document);
            
            const position = new vscode.Position(finding.line, finding.column);
            const lineRange = new vscode.Range(
                new vscode.Position(finding.line, 0),
                new vscode.Position(finding.line, document.lineAt(finding.line).text.length)
            );
            
            // Step 2: Add gutter decoration with paw print icon and line highlight
            const pawPrintPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'paw-print.svg');
            
            const gutterDecoration = vscode.window.createTextEditorDecorationType({
                gutterIconPath: pawPrintPath,
                gutterIconSize: 'contain'
            });
            
            // Line highlight with fade effect
            const lineHighlightDecoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255, 200, 0, 0.25)',
                isWholeLine: true,
                overviewRulerColor: 'rgba(255, 200, 0, 0.8)',
                overviewRulerLane: vscode.OverviewRulerLane.Full
            });
            
            // Apply decorations
            editor.setDecorations(gutterDecoration, [lineRange]);
            editor.setDecorations(lineHighlightDecoration, [lineRange]);
            
            // Navigate to the line
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(lineRange, vscode.TextEditorRevealType.InCenter);
            
            // Step 3: Show status bar message
            vscode.window.setStatusBarMessage(
                `🐕 Snoffy sniffed out this issue at ${finding.file}:${finding.line + 1}`,
                2000
            );
            
            // Clear decorations after 2 seconds
            setTimeout(() => {
                gutterDecoration.dispose();
                lineHighlightDecoration.dispose();
            }, 2000);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${finding.file}`);
        }
    }

    /**
     * Generate the HTML content for the webview
     */
    private getHtmlContent(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snoffy Dog</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }
        
        body {
            display: flex;
            flex-direction: column;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
        }
        
        .snoffy-container {
            flex-shrink: 0;
            text-align: center;
            padding: 20px 10px;
        }
        
        .snoffy-dog {
            font-size: 64px;
            animation: idle 2s ease-in-out infinite;
            transition: transform 0.1s ease;
            position: relative;
        }
        
        .snoffy-dog.walking {
            animation: walk 0.5s ease-in-out infinite;
        }
        
        .snoffy-dog.sitting {
            animation: none;
            transform: translateY(0px) translateX(0px);
        }
        
        .snoffy-dog.traveling {
            animation: travel-to-editor 0.5s ease-in-out forwards;
        }
        
        .snoffy-dog.returning {
            animation: return-from-editor 0.5s ease-in-out forwards;
        }
        
        @keyframes idle {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        @keyframes walk {
            0%, 100% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
        }
        
        @keyframes travel-to-editor {
            0% {
                transform: translateX(0px) translateY(0px) scaleX(-1);
            }
            25% {
                transform: translateX(30px) translateY(-3px) scaleX(-1);
            }
            50% {
                transform: translateX(60px) translateY(0px) scaleX(-1);
            }
            75% {
                transform: translateX(90px) translateY(-3px) scaleX(-1);
            }
            100% {
                transform: translateX(120px) translateY(0px) scaleX(-1);
                opacity: 0.3;
            }
        }
        
        @keyframes return-from-editor {
            0% {
                transform: translateX(120px) translateY(0px) scaleX(1);
                opacity: 0.3;
            }
            25% {
                transform: translateX(90px) translateY(-3px) scaleX(1);
                opacity: 0.6;
            }
            50% {
                transform: translateX(60px) translateY(0px) scaleX(1);
                opacity: 0.8;
            }
            75% {
                transform: translateX(30px) translateY(-3px) scaleX(1);
                opacity: 0.9;
            }
            100% {
                transform: translateX(0px) translateY(0px) scaleX(1);
                opacity: 1;
            }
        }
        
        .status-text {
            margin: 10px 0;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .scan-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
            margin: 5px;
        }
        
        .scan-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .scan-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .scan-button.cancel {
            background-color: rgba(255, 100, 50, 0.8);
        }
        
        .scan-button.cancel:hover {
            background-color: rgba(255, 100, 50, 1);
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background-color: var(--vscode-progressBar-background);
            margin: 10px 0;
            border-radius: 2px;
            overflow: hidden;
            display: none;
        }
        
        .progress-bar.active {
            display: block;
        }
        
        .progress-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-background);
            transition: width 0.3s ease;
        }
        
        .findings-list {
            flex: 1;
            overflow-y: auto;
            padding: 0 10px 10px 10px;
            text-align: left;
        }
        
        .findings-section {
            margin-bottom: 15px;
        }
        
        .section-header {
            font-weight: bold;
            padding: 8px;
            background-color: var(--vscode-sideBarSectionHeader-background);
            border-radius: 3px;
            margin-bottom: 5px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .section-header:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .section-count {
            font-size: 11px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 10px;
        }
        
        .section-content {
            display: block;
        }
        
        .section-content.collapsed {
            display: none;
        }
        
        .finding-item {
            background-color: var(--vscode-list-hoverBackground);
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
            border-left: 3px solid var(--vscode-errorForeground);
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        
        .finding-item:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .finding-item.medium {
            border-left-color: var(--vscode-editorWarning-foreground);
        }
        
        .finding-item.low {
            border-left-color: var(--vscode-editorInfo-foreground);
        }
        
        .verification-badge {
            font-size: 16px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .finding-content {
            flex: 1;
        }
        
        .finding-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .finding-location {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .verification-info {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 3px;
            font-style: italic;
        }
        
        .empty-state {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .activity-log {
            flex-shrink: 0;
            margin: 0 10px 0 10px;
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            height: var(--log-height, 100px);
            overflow-y: auto;
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
            line-height: 1.4;
            display: none;
        }
        
        .activity-log.active {
            display: block;
        }
        
        .log-entry {
            color: var(--vscode-editor-foreground);
            padding: 2px 0;
            opacity: 0.8;
        }
        
        .log-entry:last-child {
            opacity: 1;
        }
        
        .resize-handle {
            flex-shrink: 0;
            height: 8px;
            margin: 0 10px;
            cursor: ns-resize;
            background: linear-gradient(
                to bottom,
                transparent 0%,
                transparent 35%,
                var(--vscode-panel-border) 35%,
                var(--vscode-panel-border) 65%,
                transparent 65%,
                transparent 100%
            );
            display: none;
        }
        
        .resize-handle.active {
            display: block;
        }
        
        .resize-handle:hover {
            background: linear-gradient(
                to bottom,
                transparent 0%,
                transparent 30%,
                var(--vscode-focusBorder) 30%,
                var(--vscode-focusBorder) 70%,
                transparent 70%,
                transparent 100%
            );
        }
        
        .inline-badge {
            display: inline-block;
            width: 18px;
            height: 18px;
            line-height: 18px;
            text-align: center;
            border-radius: 3px;
            font-size: 12px;
            margin-right: 6px;
            vertical-align: middle;
        }
        
        .badge-verified {
            background-color: rgba(0, 200, 0, 0.2);
            color: #00c800;
        }
        
        .badge-needs-review {
            background-color: rgba(150, 150, 150, 0.2);
            color: #999;
        }
        
        .badge-error {
            background-color: rgba(255, 140, 0, 0.2);
            color: #ff8c00;
        }
        
        .badge-filtered {
            background-color: rgba(100, 100, 100, 0.15);
            color: #666;
        }
    </style>
</head>
<body>
    <div class="snoffy-container">
        <div class="snoffy-dog" id="snoffyDog">🐕</div>
        <div class="status-text" id="statusText">Snoffy is ready to sniff!</div>
        <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        <button class="scan-button" id="scanButton" onclick="toggleScan()">
            🔍 Go Sniffing!
        </button>
        <button class="scan-button" id="clearButton" onclick="clearFindings()" style="display: none;">
            🧹 Clear Findings
        </button>
        <button class="scan-button" id="reportButton" onclick="viewReport()" style="display: none;">
            📊 View Granite Report
        </button>
    </div>
    
    <div class="activity-log" id="activityLog"></div>
    <div class="resize-handle" id="resizeHandle"></div>
    <div class="findings-list" id="findingsList"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let isScanning = false;
        
        function toggleScan() {
            if (isScanning) {
                cancelScan();
            } else {
                startScan();
            }
        }
        
        function startScan() {
            vscode.postMessage({ type: 'startScan' });
        }
        
        function cancelScan() {
            vscode.postMessage({ type: 'cancelScan' });
        }
        
        function clearFindings() {
            const snoffyDog = document.getElementById('snoffyDog');
            snoffyDog.classList.remove('sitting', 'traveling', 'returning');
            
            vscode.postMessage({ type: 'clearFindings' });
            document.getElementById('findingsList').innerHTML = '';
            document.getElementById('clearButton').style.display = 'none';
            document.getElementById('reportButton').style.display = 'none';
            document.getElementById('statusText').textContent = 'Snoffy is ready to sniff!';
            clearLog();
        }
        
        function viewReport() {
            vscode.postMessage({ type: 'viewReport' });
        }
        
        function navigateToFinding(finding) {
            // Step 1: Snoffy walks to the right edge of the panel
            const snoffyDog = document.getElementById('snoffyDog');
            snoffyDog.classList.remove('idle', 'walking', 'sitting', 'returning');
            snoffyDog.classList.add('traveling');
            
            // After walk animation completes (500ms), send navigation message
            setTimeout(() => {
                // Step 2 & 3: Extension handles editor decoration and status bar
                vscode.postMessage({
                    type: 'navigateToFinding',
                    payload: finding
                });
                
                // Wait a bit for the "arrival" at the line, then walk back
                setTimeout(() => {
                    snoffyDog.classList.remove('traveling');
                    snoffyDog.classList.add('returning');
                    
                    // After return animation (500ms), go back to sitting
                    setTimeout(() => {
                        snoffyDog.classList.remove('returning');
                        if (!isScanning) {
                            snoffyDog.classList.add('sitting');
                        }
                    }, 500);
                }, 1000); // Wait 1 second at the "editor" before returning
            }, 500);
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'scanProgress') {
                handleScanProgress(message.payload);
            } else if (message.type === 'scanComplete') {
                handleScanComplete(message.payload);
            } else if (message.type === 'scanCancelled') {
                handleScanCancelled();
            } else if (message.type === 'logMessage') {
                addLogEntry(message.payload);
            }
        });
        
        // Resize functionality
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        const DEFAULT_LOG_HEIGHT = 100;
        const MIN_LOG_HEIGHT = 50;
        const MAX_LOG_HEIGHT = 400;
        
        // Load saved log height from state
        const state = vscode.getState() || {};
        const savedLogHeight = state.logHeight || DEFAULT_LOG_HEIGHT;
        document.documentElement.style.setProperty('--log-height', savedLogHeight + 'px');
        
        const resizeHandle = document.getElementById('resizeHandle');
        const activityLog = document.getElementById('activityLog');
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = activityLog.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            let newHeight = startHeight + deltaY;
            
            // Clamp height
            newHeight = Math.max(MIN_LOG_HEIGHT, Math.min(MAX_LOG_HEIGHT, newHeight));
            
            document.documentElement.style.setProperty('--log-height', newHeight + 'px');
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                
                // Save height to state
                const currentHeight = activityLog.offsetHeight;
                vscode.setState({ ...state, logHeight: currentHeight });
            }
        });
        
        function addLogEntry(message) {
            const activityLog = document.getElementById('activityLog');
            const resizeHandle = document.getElementById('resizeHandle');
            activityLog.classList.add('active');
            resizeHandle.classList.add('active');
            
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = message;
            
            activityLog.appendChild(entry);
            
            // Auto-scroll to bottom
            activityLog.scrollTop = activityLog.scrollHeight;
            
            // Keep only last 50 entries to prevent memory issues
            while (activityLog.children.length > 50) {
                activityLog.removeChild(activityLog.firstChild);
            }
        }
        
        function clearLog() {
            const activityLog = document.getElementById('activityLog');
            const resizeHandle = document.getElementById('resizeHandle');
            activityLog.innerHTML = '';
            activityLog.classList.remove('active');
            resizeHandle.classList.remove('active');
        }
        
        function handleScanProgress(progress) {
            const snoffyDog = document.getElementById('snoffyDog');
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            const scanButton = document.getElementById('scanButton');
            
            if (progress.state === 'scanning') {
                isScanning = true;
                snoffyDog.classList.add('walking');
                progressBar.classList.add('active');
                
                // Change button to cancel mode
                scanButton.textContent = '🛑 Stop Sniffing';
                scanButton.classList.add('cancel');
                scanButton.disabled = false;
                
                const percent = (progress.filesScanned / progress.totalFiles) * 100;
                progressFill.style.width = percent + '%';
                
                statusText.textContent = \`Sniffing... \${progress.filesScanned}/\${progress.totalFiles} files\`;
                
                if (progress.findings && progress.findings.length > 0) {
                    updateFindingsList(progress.findings);
                }
            }
        }
        
        function handleScanComplete(findings) {
            const snoffyDog = document.getElementById('snoffyDog');
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const scanButton = document.getElementById('scanButton');
            const clearButton = document.getElementById('clearButton');
            const reportButton = document.getElementById('reportButton');
            
            isScanning = false;
            snoffyDog.classList.remove('walking');
            snoffyDog.classList.add('sitting');
            progressBar.classList.remove('active');
            
            // Reset button to scan mode
            scanButton.textContent = '🔍 Go Sniffing!';
            scanButton.classList.remove('cancel');
            scanButton.disabled = false;
            
            if (findings.length === 0) {
                statusText.textContent = 'All clear! No issues found 🎉';
                document.getElementById('findingsList').innerHTML =
                    '<div class="empty-state">No security issues detected!</div>';
            } else {
                const count = findings.length;
                statusText.textContent = \`Snoffy found \${count} thing\${count > 1 ? 's' : ''} to chew on!\`;
                updateFindingsList(findings);
                clearButton.style.display = 'inline-block';
                reportButton.style.display = 'inline-block';
            }
        }
        
        function handleScanCancelled() {
            const snoffyDog = document.getElementById('snoffyDog');
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const scanButton = document.getElementById('scanButton');
            
            isScanning = false;
            snoffyDog.classList.remove('walking');
            snoffyDog.classList.remove('sitting');
            progressBar.classList.remove('active');
            
            // Reset button to scan mode
            scanButton.textContent = '🔍 Go Sniffing!';
            scanButton.classList.remove('cancel');
            scanButton.disabled = false;
            
            // Clear findings list and log
            document.getElementById('findingsList').innerHTML = '';
            statusText.textContent = 'Snoffy is ready to sniff!';
            clearLog();
        }
        
        // Store findings in a Map for lookup by ID
        const findingsMap = new Map();
        
        function updateFindingsList(findings) {
            const findingsList = document.getElementById('findingsList');
            
            // Clear and rebuild the findings map
            findingsMap.clear();
            findings.forEach(f => findingsMap.set(f.id, f));
            
            // Separate findings by verification status (lowercase values from backend)
            const verified = findings.filter(f => f.verificationStatus === 'verified');
            const filtered = findings.filter(f => f.verificationStatus === 'filtered');
            // Errors are unverified findings with "Failed to parse AI response" reason
            const errors = findings.filter(f =>
                f.verificationStatus === 'unverified' &&
                f.verification?.reason === 'Failed to parse AI response'
            );
            const needsReview = findings.filter(f =>
                f.verificationStatus === 'unverified' &&
                f.verification?.reason !== 'Failed to parse AI response'
            );
            
            let html = '';
            
            // Verified Issues section (expanded by default)
            if (verified.length > 0) {
                html += \`
                    <div class="findings-section">
                        <div class="section-header" onclick="toggleSection('verified')">
                            <span>✓ Verified Issues (\${verified.length})</span>
                        </div>
                        <div class="section-content" id="verified-section">
                            \${verified.map(finding => renderFinding(finding, '✓', 'verified')).join('')}
                        </div>
                    </div>
                \`;
            }
            
            // Needs Review section (expanded by default)
            if (needsReview.length > 0) {
                html += \`
                    <div class="findings-section">
                        <div class="section-header" onclick="toggleSection('needs-review')">
                            <span>? Needs Review (\${needsReview.length})</span>
                        </div>
                        <div class="section-content" id="needs-review-section">
                            \${needsReview.map(finding => renderFinding(finding, '?', 'needs-review')).join('')}
                        </div>
                    </div>
                \`;
            }
            
            // Errors section (collapsed by default)
            if (errors.length > 0) {
                html += \`
                    <div class="findings-section">
                        <div class="section-header" onclick="toggleSection('errors')">
                            <span>⚠ Errors (\${errors.length})</span>
                        </div>
                        <div class="section-content collapsed" id="errors-section">
                            \${errors.map(finding => renderFinding(finding, '⚠', 'error')).join('')}
                        </div>
                    </div>
                \`;
            }
            
            // Filtered as Placeholders section (collapsed by default)
            if (filtered.length > 0) {
                html += \`
                    <div class="findings-section">
                        <div class="section-header" onclick="toggleSection('filtered')">
                            <span>✗ Filtered as Placeholders (\${filtered.length})</span>
                        </div>
                        <div class="section-content collapsed" id="filtered-section">
                            \${filtered.map(finding => renderFinding(finding, '✗', 'filtered')).join('')}
                        </div>
                    </div>
                \`;
            }
            
            findingsList.innerHTML = html || '<div class="empty-state">No findings to display</div>';
        }
        
        function renderFinding(finding, badge, badgeClass) {
            const verificationInfo = finding.verification
                ? \`<div class="verification-info">AI: \${finding.verification.reason.substring(0, 60)}\${finding.verification.reason.length > 60 ? '...' : ''}</div>\`
                : '';
            
            return \`
                <div class="finding-item \${finding.severity}" data-finding-id="\${finding.id}">
                    <div class="finding-content">
                        <div class="finding-title">
                            <span class="inline-badge badge-\${badgeClass}">\${badge}</span>
                            \${finding.message}
                        </div>
                        <div class="finding-location">\${finding.file}:\${finding.line + 1}</div>
                        \${verificationInfo}
                    </div>
                </div>
            \`;
        }
        
        // Event delegation for finding clicks
        document.getElementById('findingsList').addEventListener('click', (e) => {
            // Walk up to find the .finding-item element
            let target = e.target;
            while (target && !target.classList.contains('finding-item')) {
                target = target.parentElement;
            }
            
            if (target && target.dataset.findingId) {
                const finding = findingsMap.get(target.dataset.findingId);
                if (finding) {
                    navigateToFinding(finding);
                }
            }
        });
        
        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId + '-section');
            if (section) {
                section.classList.toggle('collapsed');
            }
        }
    </script>
</body>
</html>`;
    }
}

// Made with Bob
