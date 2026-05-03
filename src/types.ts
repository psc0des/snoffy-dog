import * as vscode from 'vscode';

/**
 * Types of security issues Snoffy can detect
 */
export enum FindingType {
    SECRET = 'secret',
    DANGEROUS_PATTERN = 'dangerous-pattern',
    DEV_URL = 'dev-url'
}

/**
 * Severity levels for findings
 */
export enum FindingSeverity {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'
}

/**
 * Verification status from Granite AI
 */
export enum VerificationStatus {
    VERIFIED = 'verified',       // is_real=true, confidence > 0.7
    UNVERIFIED = 'unverified',   // confidence <= 0.7
    FILTERED = 'filtered'        // is_real=false, confidence > 0.7
}

/**
 * Granite AI verification result
 */
export interface GraniteVerification {
    is_real: boolean;
    confidence: number;
    reason: string;
}

/**
 * Represents a security finding discovered by Snoffy
 */
export interface SecurityFinding {
    /** Unique identifier for the finding */
    id: string;
    /** Type of security issue */
    type: FindingType;
    /** Severity level */
    severity: FindingSeverity;
    /** File path relative to workspace */
    file: string;
    /** Line number (0-based) */
    line: number;
    /** Column number (0-based) */
    column: number;
    /** Length of the problematic code */
    length: number;
    /** Human-readable message */
    message: string;
    /** Detailed description */
    description?: string;
    /** Code snippet */
    snippet?: string;
    /** Verification status from Granite AI */
    verificationStatus?: VerificationStatus;
    /** Granite AI verification details */
    verification?: GraniteVerification;
}

/**
 * Scanning state for UI updates
 */
export enum ScanState {
    IDLE = 'idle',
    SCANNING = 'scanning',
    COMPLETE = 'complete',
    ERROR = 'error'
}

/**
 * Scan progress information
 */
export interface ScanProgress {
    state: ScanState;
    filesScanned: number;
    totalFiles: number;
    currentFile?: string;
    findings: SecurityFinding[];
}

/**
 * Message types for webview communication
 */
export enum MessageType {
    START_SCAN = 'startScan',
    CANCEL_SCAN = 'cancelScan',
    SCAN_PROGRESS = 'scanProgress',
    SCAN_COMPLETE = 'scanComplete',
    SCAN_CANCELLED = 'scanCancelled',
    LOG_MESSAGE = 'logMessage',
    NAVIGATE_TO_FINDING = 'navigateToFinding',
    CLEAR_FINDINGS = 'clearFindings',
    VIEW_REPORT = 'viewReport'
}

/**
 * Message structure for webview communication
 */
export interface WebviewMessage {
    type: MessageType;
    payload?: any;
}

// Made with Bob
