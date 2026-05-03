"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarManager = void 0;
var vscode = require("vscode");
/**
 * Manages the status bar item showing Snoffy's findings count
 */
var StatusBarManager = /** @class */ (function () {
    function StatusBarManager() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'snoffyDog.openPanel';
        this.updateStatusBar(0);
        this.statusBarItem.show();
    }
    /**
     * Update status bar with findings count
     */
    StatusBarManager.prototype.updateStatusBar = function (count) {
        if (count === 0) {
            this.statusBarItem.text = '🐕 Snoffy: All clear!';
            this.statusBarItem.tooltip = 'No security issues found. Click to open Snoffy panel.';
        }
        else if (count === 1) {
            this.statusBarItem.text = '🐕 Snoffy found 1 thing to chew on';
            this.statusBarItem.tooltip = 'Click to see the security issue';
        }
        else {
            this.statusBarItem.text = "\uD83D\uDC15 Snoffy found ".concat(count, " things to chew on");
            this.statusBarItem.tooltip = "Click to see ".concat(count, " security issues");
        }
    };
    /**
     * Update status bar based on findings array
     */
    StatusBarManager.prototype.updateFromFindings = function (findings) {
        this.updateStatusBar(findings.length);
    };
    /**
     * Show scanning state
     */
    StatusBarManager.prototype.showScanning = function () {
        this.statusBarItem.text = '🐕 Snoffy is sniffing...';
        this.statusBarItem.tooltip = 'Scanning workspace for security issues';
    };
    /**
     * Show error state
     */
    StatusBarManager.prototype.showError = function () {
        this.statusBarItem.text = '🐕 Snoffy encountered an error';
        this.statusBarItem.tooltip = 'Error during security scan';
    };
    /**
     * Dispose of the status bar item
     */
    StatusBarManager.prototype.dispose = function () {
        this.statusBarItem.dispose();
    };
    return StatusBarManager;
}());
exports.StatusBarManager = StatusBarManager;
// Made with Bob
