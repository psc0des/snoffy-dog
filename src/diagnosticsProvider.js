"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsProvider = void 0;
var vscode = require("vscode");
var types_1 = require("./types");
/**
 * Manages VS Code diagnostics (red squiggles) for security findings
 */
var DiagnosticsProvider = /** @class */ (function () {
    function DiagnosticsProvider() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('snoffyDog');
    }
    /**
     * Update diagnostics based on security findings
     */
    DiagnosticsProvider.prototype.updateDiagnostics = function (findings) {
        var _this = this;
        // Clear existing diagnostics
        this.diagnosticCollection.clear();
        // Group findings by file
        var findingsByFile = this.groupFindingsByFile(findings);
        // Create diagnostics for each file
        for (var _i = 0, _a = findingsByFile.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], filePath = _b[0], fileFindings = _b[1];
            var uri = this.getFileUri(filePath);
            if (!uri) {
                continue;
            }
            var diagnostics = fileFindings.map(function (finding) {
                return _this.createDiagnostic(finding);
            });
            this.diagnosticCollection.set(uri, diagnostics);
        }
    };
    /**
     * Create a VS Code diagnostic from a security finding
     */
    DiagnosticsProvider.prototype.createDiagnostic = function (finding) {
        var range = new vscode.Range(finding.line, finding.column, finding.line, finding.column + finding.length);
        var diagnostic = new vscode.Diagnostic(range, finding.message, this.getSeverity(finding.severity));
        diagnostic.source = 'Snoffy Dog';
        diagnostic.code = finding.type;
        return diagnostic;
    };
    /**
     * Map finding severity to VS Code diagnostic severity
     */
    DiagnosticsProvider.prototype.getSeverity = function (severity) {
        switch (severity) {
            case types_1.FindingSeverity.HIGH:
                return vscode.DiagnosticSeverity.Error;
            case types_1.FindingSeverity.MEDIUM:
                return vscode.DiagnosticSeverity.Warning;
            case types_1.FindingSeverity.LOW:
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    };
    /**
     * Group findings by file path
     */
    DiagnosticsProvider.prototype.groupFindingsByFile = function (findings) {
        var grouped = new Map();
        for (var _i = 0, findings_1 = findings; _i < findings_1.length; _i++) {
            var finding = findings_1[_i];
            var existing = grouped.get(finding.file) || [];
            existing.push(finding);
            grouped.set(finding.file, existing);
        }
        return grouped;
    };
    /**
     * Get URI for a file path
     */
    DiagnosticsProvider.prototype.getFileUri = function (filePath) {
        var workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        // Assume first workspace folder
        var workspaceRoot = workspaceFolders[0].uri;
        return vscode.Uri.joinPath(workspaceRoot, filePath);
    };
    /**
     * Clear all diagnostics
     */
    DiagnosticsProvider.prototype.clear = function () {
        this.diagnosticCollection.clear();
    };
    /**
     * Dispose of the diagnostic collection
     */
    DiagnosticsProvider.prototype.dispose = function () {
        this.diagnosticCollection.dispose();
    };
    return DiagnosticsProvider;
}());
exports.DiagnosticsProvider = DiagnosticsProvider;
// Made with Bob
