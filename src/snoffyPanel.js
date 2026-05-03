"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnoffyPanel = void 0;
var vscode = require("vscode");
var types_1 = require("./types");
/**
 * Manages the Snoffy Dog webview panel in the sidebar
 */
var SnoffyPanel = /** @class */ (function () {
    function SnoffyPanel(extensionUri, onStartScan, onClearFindings) {
        this.extensionUri = extensionUri;
        this.onStartScan = onStartScan;
        this.onClearFindings = onClearFindings;
    }
    /**
     * Called when the view is first created
     */
    SnoffyPanel.prototype.resolveWebviewView = function (webviewView, context, token) {
        var _this = this;
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(function (message) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = message.type;
                        switch (_a) {
                            case types_1.MessageType.START_SCAN: return [3 /*break*/, 1];
                            case types_1.MessageType.NAVIGATE_TO_FINDING: return [3 /*break*/, 3];
                            case types_1.MessageType.CLEAR_FINDINGS: return [3 /*break*/, 4];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.onStartScan()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        this.navigateToFinding(message.payload);
                        return [3 /*break*/, 5];
                    case 4:
                        this.onClearFindings();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Update the webview with scan progress
     */
    SnoffyPanel.prototype.updateProgress = function (progress) {
        if (this.view) {
            this.view.webview.postMessage({
                type: types_1.MessageType.SCAN_PROGRESS,
                payload: progress
            });
        }
    };
    /**
     * Update the webview with scan completion
     */
    SnoffyPanel.prototype.updateComplete = function (findings) {
        if (this.view) {
            this.view.webview.postMessage({
                type: types_1.MessageType.SCAN_COMPLETE,
                payload: findings
            });
        }
    };
    /**
     * Navigate to a specific finding in the editor
     */
    SnoffyPanel.prototype.navigateToFinding = function (finding) {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceFolders, fileUri, document_1, editor, position, range, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            return [2 /*return*/];
                        }
                        fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, finding.file);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, vscode.workspace.openTextDocument(fileUri)];
                    case 2:
                        document_1 = _a.sent();
                        return [4 /*yield*/, vscode.window.showTextDocument(document_1)];
                    case 3:
                        editor = _a.sent();
                        position = new vscode.Position(finding.line, finding.column);
                        range = new vscode.Range(position, position);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        vscode.window.showErrorMessage("Could not open file: ".concat(finding.file));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate the HTML content for the webview
     */
    SnoffyPanel.prototype.getHtmlContent = function (webview) {
        return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Snoffy Dog</title>\n    <style>\n        body {\n            padding: 10px;\n            font-family: var(--vscode-font-family);\n            color: var(--vscode-foreground);\n            background-color: var(--vscode-sideBar-background);\n        }\n        \n        .snoffy-container {\n            text-align: center;\n            padding: 20px 0;\n        }\n        \n        .snoffy-dog {\n            font-size: 64px;\n            animation: idle 2s ease-in-out infinite;\n        }\n        \n        .snoffy-dog.walking {\n            animation: walk 0.5s ease-in-out infinite;\n        }\n        \n        @keyframes idle {\n            0%, 100% { transform: translateY(0px); }\n            50% { transform: translateY(-5px); }\n        }\n        \n        @keyframes walk {\n            0%, 100% { transform: translateX(-5px); }\n            50% { transform: translateX(5px); }\n        }\n        \n        .status-text {\n            margin: 10px 0;\n            font-size: 14px;\n            color: var(--vscode-descriptionForeground);\n        }\n        \n        .scan-button {\n            background-color: var(--vscode-button-background);\n            color: var(--vscode-button-foreground);\n            border: none;\n            padding: 8px 16px;\n            cursor: pointer;\n            border-radius: 2px;\n            font-size: 13px;\n            margin: 5px;\n        }\n        \n        .scan-button:hover {\n            background-color: var(--vscode-button-hoverBackground);\n        }\n        \n        .scan-button:disabled {\n            opacity: 0.5;\n            cursor: not-allowed;\n        }\n        \n        .progress-bar {\n            width: 100%;\n            height: 4px;\n            background-color: var(--vscode-progressBar-background);\n            margin: 10px 0;\n            border-radius: 2px;\n            overflow: hidden;\n            display: none;\n        }\n        \n        .progress-bar.active {\n            display: block;\n        }\n        \n        .progress-fill {\n            height: 100%;\n            background-color: var(--vscode-progressBar-background);\n            transition: width 0.3s ease;\n        }\n        \n        .findings-list {\n            margin-top: 20px;\n            text-align: left;\n        }\n        \n        .finding-item {\n            background-color: var(--vscode-list-hoverBackground);\n            padding: 10px;\n            margin: 5px 0;\n            border-radius: 3px;\n            cursor: pointer;\n            border-left: 3px solid var(--vscode-errorForeground);\n        }\n        \n        .finding-item:hover {\n            background-color: var(--vscode-list-activeSelectionBackground);\n        }\n        \n        .finding-item.medium {\n            border-left-color: var(--vscode-editorWarning-foreground);\n        }\n        \n        .finding-item.low {\n            border-left-color: var(--vscode-editorInfo-foreground);\n        }\n        \n        .finding-title {\n            font-weight: bold;\n            margin-bottom: 5px;\n        }\n        \n        .finding-location {\n            font-size: 12px;\n            color: var(--vscode-descriptionForeground);\n        }\n        \n        .empty-state {\n            text-align: center;\n            padding: 20px;\n            color: var(--vscode-descriptionForeground);\n        }\n    </style>\n</head>\n<body>\n    <div class=\"snoffy-container\">\n        <div class=\"snoffy-dog\" id=\"snoffyDog\">\uD83D\uDC15</div>\n        <div class=\"status-text\" id=\"statusText\">Snoffy is ready to sniff!</div>\n        <div class=\"progress-bar\" id=\"progressBar\">\n            <div class=\"progress-fill\" id=\"progressFill\"></div>\n        </div>\n        <button class=\"scan-button\" id=\"scanButton\" onclick=\"startScan()\">\n            \uD83D\uDD0D Go Sniffing!\n        </button>\n        <button class=\"scan-button\" id=\"clearButton\" onclick=\"clearFindings()\" style=\"display: none;\">\n            \uD83E\uDDF9 Clear Findings\n        </button>\n    </div>\n    \n    <div class=\"findings-list\" id=\"findingsList\"></div>\n    \n    <script>\n        const vscode = acquireVsCodeApi();\n        let isScanning = false;\n        \n        function startScan() {\n            if (isScanning) return;\n            vscode.postMessage({ type: 'startScan' });\n        }\n        \n        function clearFindings() {\n            vscode.postMessage({ type: 'clearFindings' });\n            document.getElementById('findingsList').innerHTML = '';\n            document.getElementById('clearButton').style.display = 'none';\n            document.getElementById('statusText').textContent = 'Snoffy is ready to sniff!';\n        }\n        \n        function navigateToFinding(finding) {\n            vscode.postMessage({ \n                type: 'navigateToFinding',\n                payload: finding\n            });\n        }\n        \n        window.addEventListener('message', event => {\n            const message = event.data;\n            \n            if (message.type === 'scanProgress') {\n                handleScanProgress(message.payload);\n            } else if (message.type === 'scanComplete') {\n                handleScanComplete(message.payload);\n            }\n        });\n        \n        function handleScanProgress(progress) {\n            const snoffyDog = document.getElementById('snoffyDog');\n            const statusText = document.getElementById('statusText');\n            const progressBar = document.getElementById('progressBar');\n            const progressFill = document.getElementById('progressFill');\n            const scanButton = document.getElementById('scanButton');\n            \n            if (progress.state === 'scanning') {\n                isScanning = true;\n                snoffyDog.classList.add('walking');\n                progressBar.classList.add('active');\n                scanButton.disabled = true;\n                \n                const percent = (progress.filesScanned / progress.totalFiles) * 100;\n                progressFill.style.width = percent + '%';\n                \n                statusText.textContent = `Sniffing... ${progress.filesScanned}/${progress.totalFiles} files`;\n                \n                if (progress.findings && progress.findings.length > 0) {\n                    updateFindingsList(progress.findings);\n                }\n            }\n        }\n        \n        function handleScanComplete(findings) {\n            const snoffyDog = document.getElementById('snoffyDog');\n            const statusText = document.getElementById('statusText');\n            const progressBar = document.getElementById('progressBar');\n            const scanButton = document.getElementById('scanButton');\n            const clearButton = document.getElementById('clearButton');\n            \n            isScanning = false;\n            snoffyDog.classList.remove('walking');\n            progressBar.classList.remove('active');\n            scanButton.disabled = false;\n            \n            if (findings.length === 0) {\n                statusText.textContent = 'All clear! No issues found \uD83C\uDF89';\n                document.getElementById('findingsList').innerHTML = \n                    '<div class=\"empty-state\">No security issues detected!</div>';\n            } else {\n                statusText.textContent = `Found ${findings.length} issue${findings.length > 1 ? 's' : ''}!`;\n                updateFindingsList(findings);\n                clearButton.style.display = 'inline-block';\n            }\n        }\n        \n        function updateFindingsList(findings) {\n            const findingsList = document.getElementById('findingsList');\n            \n            findingsList.innerHTML = findings.map(finding => `\n                <div class=\"finding-item ${finding.severity}\" onclick='navigateToFinding(${JSON.stringify(finding)})'>\n                    <div class=\"finding-title\">${finding.message}</div>\n                    <div class=\"finding-location\">${finding.file}:${finding.line + 1}</div>\n                </div>\n            `).join('');\n        }\n    </script>\n</body>\n</html>";
    };
    SnoffyPanel.viewType = 'snoffyDog.panel';
    return SnoffyPanel;
}());
exports.SnoffyPanel = SnoffyPanel;
// Made with Bob
