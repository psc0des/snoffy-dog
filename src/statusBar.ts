import * as vscode from 'vscode';
import { SecurityFinding } from './types';

/**
 * Manages the status bar item showing Snoffy's findings count
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'snoffyDog.openPanel';
        this.updateStatusBar(0);
        this.statusBarItem.show();
    }

    /**
     * Update status bar with findings count
     */
    updateStatusBar(count: number): void {
        if (count === 0) {
            this.statusBarItem.text = '🐕 Snoffy: All clear!';
            this.statusBarItem.tooltip = 'No security issues found. Click to open Snoffy panel.';
        } else if (count === 1) {
            this.statusBarItem.text = '🐕 Snoffy found 1 thing to chew on';
            this.statusBarItem.tooltip = 'Click to see the security issue';
        } else {
            this.statusBarItem.text = `🐕 Snoffy found ${count} things to chew on`;
            this.statusBarItem.tooltip = `Click to see ${count} security issues`;
        }
    }

    /**
     * Update status bar based on findings array
     */
    updateFromFindings(findings: SecurityFinding[]): void {
        this.updateStatusBar(findings.length);
    }

    /**
     * Show scanning state
     */
    showScanning(): void {
        this.statusBarItem.text = '🐕 Snoffy is sniffing...';
        this.statusBarItem.tooltip = 'Scanning workspace for security issues';
    }

    /**
     * Show error state
     */
    showError(): void {
        this.statusBarItem.text = '🐕 Snoffy encountered an error';
        this.statusBarItem.tooltip = 'Error during security scan';
    }

    /**
     * Dispose of the status bar item
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}

// Made with Bob
