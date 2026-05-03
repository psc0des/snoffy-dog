"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.ScanState = exports.FindingSeverity = exports.FindingType = void 0;
/**
 * Types of security issues Snoffy can detect
 */
var FindingType;
(function (FindingType) {
    FindingType["SECRET"] = "secret";
    FindingType["DANGEROUS_PATTERN"] = "dangerous-pattern";
    FindingType["DEV_URL"] = "dev-url";
})(FindingType || (exports.FindingType = FindingType = {}));
/**
 * Severity levels for findings
 */
var FindingSeverity;
(function (FindingSeverity) {
    FindingSeverity["HIGH"] = "high";
    FindingSeverity["MEDIUM"] = "medium";
    FindingSeverity["LOW"] = "low";
})(FindingSeverity || (exports.FindingSeverity = FindingSeverity = {}));
/**
 * Scanning state for UI updates
 */
var ScanState;
(function (ScanState) {
    ScanState["IDLE"] = "idle";
    ScanState["SCANNING"] = "scanning";
    ScanState["COMPLETE"] = "complete";
    ScanState["ERROR"] = "error";
})(ScanState || (exports.ScanState = ScanState = {}));
/**
 * Message types for webview communication
 */
var MessageType;
(function (MessageType) {
    MessageType["START_SCAN"] = "startScan";
    MessageType["SCAN_PROGRESS"] = "scanProgress";
    MessageType["SCAN_COMPLETE"] = "scanComplete";
    MessageType["NAVIGATE_TO_FINDING"] = "navigateToFinding";
    MessageType["CLEAR_FINDINGS"] = "clearFindings";
})(MessageType || (exports.MessageType = MessageType = {}));
// Made with Bob
