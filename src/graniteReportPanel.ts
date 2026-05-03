import * as vscode from 'vscode';
import { SecurityFinding, VerificationStatus } from './types';

/**
 * Manages the Granite Report webview panel
 */
export class GraniteReportPanel {
    private static currentPanel: GraniteReportPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private findings: SecurityFinding[] = [];

    private constructor(panel: vscode.WebviewPanel, findings: SecurityFinding[]) {
        this.panel = panel;
        this.findings = findings;
        
        this.panel.webview.html = this.getHtmlContent();
        
        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message.type === 'openFile') {
                    this.openFile(message.file, message.line);
                }
            }
        );
        
        this.panel.onDidDispose(() => {
            GraniteReportPanel.currentPanel = undefined;
        });
    }

    public static show(extensionUri: vscode.Uri, findings: SecurityFinding[]) {
        const column = vscode.ViewColumn.One;

        // If we already have a panel, show it
        if (GraniteReportPanel.currentPanel) {
            GraniteReportPanel.currentPanel.findings = findings;
            GraniteReportPanel.currentPanel.panel.webview.html = GraniteReportPanel.currentPanel.getHtmlContent();
            GraniteReportPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'snoffyGraniteReport',
            'Snoffy Report — Granite Verdicts',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        GraniteReportPanel.currentPanel = new GraniteReportPanel(panel, findings);
    }

    private async openFile(file: string, line: number) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, file);
        
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(document);
            
            const position = new vscode.Position(line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${file}`);
        }
    }

    private getHtmlContent(): string {
        const verified = this.findings.filter(f => f.verificationStatus === VerificationStatus.VERIFIED).length;
        const filtered = this.findings.filter(f => f.verificationStatus === VerificationStatus.FILTERED).length;
        const needsReview = this.findings.filter(f => 
            f.verificationStatus === VerificationStatus.UNVERIFIED && 
            f.verification?.reason !== 'Failed to parse AI response'
        ).length;
        const errors = this.findings.filter(f => 
            f.verificationStatus === VerificationStatus.UNVERIFIED && 
            f.verification?.reason === 'Failed to parse AI response'
        ).length;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Granite Report</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        
        .header {
            margin-bottom: 20px;
        }
        
        h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
        }
        
        .summary {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 15px;
        }
        
        .summary-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .stat {
            padding: 8px 12px;
            border-radius: 4px;
            background-color: var(--vscode-input-background);
        }
        
        .stat-verified { border-left: 3px solid #00c800; }
        .stat-filtered { border-left: 3px solid #666; }
        .stat-review { border-left: 3px solid #999; }
        .stat-error { border-left: 3px solid #ff8c00; }
        
        .search-box {
            width: 100%;
            max-width: 400px;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            margin-bottom: 15px;
        }
        
        .search-box:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        th {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid var(--vscode-panel-border);
            cursor: pointer;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        th:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        th.sortable::after {
            content: ' ⇅';
            opacity: 0.3;
        }
        
        th.sort-asc::after {
            content: ' ↑';
            opacity: 1;
        }
        
        th.sort-desc::after {
            content: ' ↓';
            opacity: 1;
        }
        
        tr {
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        tr:nth-child(even) {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        tr:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        td {
            padding: 8px;
        }
        
        .file-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            font-family: var(--vscode-editor-font-family);
            cursor: pointer;
        }
        
        .file-link:hover {
            text-decoration: underline;
        }
        
        .snippet {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .verdict-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .verdict-verified {
            background-color: rgba(0, 200, 0, 0.2);
            color: #00c800;
        }
        
        .verdict-filtered {
            background-color: rgba(100, 100, 100, 0.15);
            color: #666;
        }
        
        .verdict-review {
            background-color: rgba(150, 150, 150, 0.2);
            color: #999;
        }
        
        .verdict-error {
            background-color: rgba(255, 140, 0, 0.2);
            color: #ff8c00;
        }
        
        .confidence-cell {
            min-width: 80px;
        }
        
        .confidence-bar {
            width: 100%;
            height: 4px;
            background-color: var(--vscode-input-background);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 4px;
        }
        
        .confidence-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-background);
            transition: width 0.3s ease;
        }
        
        .reason-cell {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .severity-high { color: #f48771; }
        .severity-medium { color: #cca700; }
        .severity-low { color: #89d185; }
        
        .no-results {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 Snoffy Report — Granite Verdicts</h1>
        <div class="summary">${this.findings.length} issues scanned</div>
        <div class="summary-stats">
            <div class="stat stat-verified">✓ ${verified} verified</div>
            <div class="stat stat-filtered">✗ ${filtered} filtered</div>
            <div class="stat stat-review">? ${needsReview} needs review</div>
            <div class="stat stat-error">⚠ ${errors} errors</div>
        </div>
        <input type="text" class="search-box" id="searchBox" placeholder="Search by file, rule, snippet, or reason...">
    </div>
    
    <table id="reportTable">
        <thead>
            <tr>
                <th class="sortable" data-column="file">File:Line</th>
                <th class="sortable" data-column="rule">Rule</th>
                <th class="sortable" data-column="snippet">Snippet</th>
                <th class="sortable" data-column="severity">Severity</th>
                <th class="sortable" data-column="verdict">Granite Verdict</th>
                <th class="sortable" data-column="confidence">Confidence</th>
                <th class="sortable" data-column="reason">Reason</th>
            </tr>
        </thead>
        <tbody id="tableBody">
            ${this.findings.map(f => this.renderRow(f)).join('')}
        </tbody>
    </table>
    
    <script>
        const vscode = acquireVsCodeApi();
        let sortColumn = null;
        let sortDirection = 'asc';
        
        // File link clicks
        document.querySelectorAll('.file-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                vscode.postMessage({
                    type: 'openFile',
                    file: link.dataset.file,
                    line: parseInt(link.dataset.line)
                });
            });
        });
        
        // Search functionality
        const searchBox = document.getElementById('searchBox');
        const tableBody = document.getElementById('tableBody');
        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        
        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            allRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
        
        // Sorting functionality
        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                
                // Toggle direction if same column
                if (sortColumn === column) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = column;
                    sortDirection = 'asc';
                }
                
                // Update header styles
                document.querySelectorAll('th').forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                
                // Sort rows
                const sortedRows = allRows.sort((a, b) => {
                    const aVal = a.dataset[column] || '';
                    const bVal = b.dataset[column] || '';
                    
                    // Numeric comparison for confidence
                    if (column === 'confidence') {
                        const aNum = parseFloat(aVal) || 0;
                        const bNum = parseFloat(bVal) || 0;
                        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
                    }
                    
                    // String comparison
                    const comparison = aVal.localeCompare(bVal);
                    return sortDirection === 'asc' ? comparison : -comparison;
                });
                
                // Re-append rows in sorted order
                sortedRows.forEach(row => tableBody.appendChild(row));
            });
        });
    </script>
</body>
</html>`;
    }

    private renderRow(finding: SecurityFinding): string {
        const fileLocation = `${finding.file}:${finding.line + 1}`;
        const snippet = (finding.snippet || '').substring(0, 40);
        const snippetDisplay = snippet.length < (finding.snippet || '').length ? snippet + '...' : snippet;
        
        let verdictBadge = '';
        let verdictClass = '';
        let verdictText = '';
        
        if (finding.verificationStatus === VerificationStatus.VERIFIED) {
            verdictBadge = '✓ verified';
            verdictClass = 'verdict-verified';
            verdictText = 'verified';
        } else if (finding.verificationStatus === VerificationStatus.FILTERED) {
            verdictBadge = '✗ filtered';
            verdictClass = 'verdict-filtered';
            verdictText = 'filtered';
        } else if (finding.verification?.reason === 'Failed to parse AI response') {
            verdictBadge = '⚠ error';
            verdictClass = 'verdict-error';
            verdictText = 'error';
        } else {
            verdictBadge = '? needs review';
            verdictClass = 'verdict-review';
            verdictText = 'needs-review';
        }
        
        const confidence = finding.verification?.confidence || 0;
        const confidencePercent = Math.round(confidence * 100);
        const reason = finding.verification?.reason || 'No AI analysis';
        const reasonTruncated = reason.length > 60 ? reason.substring(0, 60) + '...' : reason;
        
        return `
            <tr 
                data-file="${fileLocation}"
                data-rule="${finding.message}"
                data-snippet="${snippet}"
                data-severity="${finding.severity}"
                data-verdict="${verdictText}"
                data-confidence="${confidence}"
                data-reason="${reason}"
            >
                <td>
                    <a href="#" class="file-link" data-file="${finding.file}" data-line="${finding.line}">
                        ${fileLocation}
                    </a>
                </td>
                <td>${finding.message}</td>
                <td class="snippet" title="${finding.snippet || ''}">${snippetDisplay}</td>
                <td class="severity-${finding.severity}">${finding.severity}</td>
                <td>
                    <span class="verdict-badge ${verdictClass}">${verdictBadge}</span>
                </td>
                <td class="confidence-cell">
                    <div>${confidencePercent}%</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                    </div>
                </td>
                <td class="reason-cell" title="${reason}">${reasonTruncated}</td>
            </tr>
        `;
    }
}

// Made with Bob
