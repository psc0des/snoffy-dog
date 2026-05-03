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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScannerService = void 0;
var vscode = require("vscode");
var types_1 = require("./types");
/**
 * Service responsible for scanning workspace files for security issues
 */
var ScannerService = /** @class */ (function () {
    function ScannerService(context) {
        this.context = context;
        this.findings = [];
        this.scanState = types_1.ScanState.IDLE;
    }
    /**
     * Start scanning the workspace for security issues
     * @param progressCallback Callback to report scan progress
     */
    ScannerService.prototype.startScan = function (progressCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var files, filesScanned, totalFiles, _i, files_1, file, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.findings = [];
                        this.scanState = types_1.ScanState.SCANNING;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, this.getWorkspaceFiles()];
                    case 2:
                        files = _a.sent();
                        filesScanned = 0;
                        totalFiles = files.length;
                        // Report initial progress
                        progressCallback({
                            state: types_1.ScanState.SCANNING,
                            filesScanned: 0,
                            totalFiles: totalFiles,
                            findings: []
                        });
                        _i = 0, files_1 = files;
                        _a.label = 3;
                    case 3:
                        if (!(_i < files_1.length)) return [3 /*break*/, 7];
                        file = files_1[_i];
                        return [4 /*yield*/, this.scanFile(file)];
                    case 4:
                        _a.sent();
                        filesScanned++;
                        // Report progress
                        progressCallback({
                            state: types_1.ScanState.SCANNING,
                            filesScanned: filesScanned,
                            totalFiles: totalFiles,
                            currentFile: vscode.workspace.asRelativePath(file),
                            findings: __spreadArray([], this.findings, true)
                        });
                        // Small delay to simulate scanning work
                        return [4 /*yield*/, this.delay(50)];
                    case 5:
                        // Small delay to simulate scanning work
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7:
                        this.scanState = types_1.ScanState.COMPLETE;
                        // Report completion
                        progressCallback({
                            state: types_1.ScanState.COMPLETE,
                            filesScanned: totalFiles,
                            totalFiles: totalFiles,
                            findings: __spreadArray([], this.findings, true)
                        });
                        return [2 /*return*/, this.findings];
                    case 8:
                        error_1 = _a.sent();
                        this.scanState = types_1.ScanState.ERROR;
                        throw error_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all scannable files in the workspace
     */
    ScannerService.prototype.getWorkspaceFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx,py,java,go,rb,php,cs,cpp,c,h,hpp,json,yaml,yml,env}', '**/node_modules/**')];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files];
                }
            });
        });
    };
    /**
     * Scan a single file for security issues (stub implementation)
     */
    ScannerService.prototype.scanFile = function (fileUri) {
        return __awaiter(this, void 0, void 0, function () {
            var document_1, text, relativePath, line, line, line, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, vscode.workspace.openTextDocument(fileUri)];
                    case 1:
                        document_1 = _a.sent();
                        text = document_1.getText();
                        relativePath = vscode.workspace.asRelativePath(fileUri);
                        // STUB: Add mock findings for demonstration
                        // In real implementation, this would use regex patterns to detect issues
                        // Mock finding 1: Hardcoded API key (if file contains certain patterns)
                        if (text.includes('API_KEY') || text.includes('api_key')) {
                            line = this.findLineWithText(text, 'API_KEY') || this.findLineWithText(text, 'api_key');
                            if (line !== null) {
                                this.findings.push({
                                    id: "".concat(relativePath, "-").concat(line, "-secret"),
                                    type: types_1.FindingType.SECRET,
                                    severity: types_1.FindingSeverity.HIGH,
                                    file: relativePath,
                                    line: line,
                                    column: 0,
                                    length: 20,
                                    message: '🔑 Possible hardcoded API key detected',
                                    description: 'API keys should be stored in environment variables or secure vaults, not in source code.',
                                    snippet: this.getLineText(text, line)
                                });
                            }
                        }
                        // Mock finding 2: eval() usage
                        if (text.includes('eval(')) {
                            line = this.findLineWithText(text, 'eval(');
                            if (line !== null) {
                                this.findings.push({
                                    id: "".concat(relativePath, "-").concat(line, "-dangerous"),
                                    type: types_1.FindingType.DANGEROUS_PATTERN,
                                    severity: types_1.FindingSeverity.HIGH,
                                    file: relativePath,
                                    line: line,
                                    column: 0,
                                    length: 10,
                                    message: '⚠️ Dangerous eval() usage detected',
                                    description: 'Using eval() can lead to code injection vulnerabilities.',
                                    snippet: this.getLineText(text, line)
                                });
                            }
                        }
                        // Mock finding 3: Development URL
                        if (text.includes('localhost') || text.includes('dev.') || text.includes('staging.')) {
                            line = this.findLineWithText(text, 'localhost') ||
                                this.findLineWithText(text, 'dev.') ||
                                this.findLineWithText(text, 'staging.');
                            if (line !== null) {
                                this.findings.push({
                                    id: "".concat(relativePath, "-").concat(line, "-devurl"),
                                    type: types_1.FindingType.DEV_URL,
                                    severity: types_1.FindingSeverity.MEDIUM,
                                    file: relativePath,
                                    line: line,
                                    column: 0,
                                    length: 15,
                                    message: '🌐 Development/staging URL found',
                                    description: 'Development or staging URLs should not be committed to production code.',
                                    snippet: this.getLineText(text, line)
                                });
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        // Silently skip files that can't be read
                        console.error("Error scanning file ".concat(fileUri.fsPath, ":"), error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find the line number containing specific text
     */
    ScannerService.prototype.findLineWithText = function (text, searchText) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i;
            }
        }
        return null;
    };
    /**
     * Get text of a specific line
     */
    ScannerService.prototype.getLineText = function (text, lineNumber) {
        var lines = text.split('\n');
        return lines[lineNumber] || '';
    };
    /**
     * Utility delay function
     */
    ScannerService.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Get current findings
     */
    ScannerService.prototype.getFindings = function () {
        return __spreadArray([], this.findings, true);
    };
    /**
     * Clear all findings
     */
    ScannerService.prototype.clearFindings = function () {
        this.findings = [];
        this.scanState = types_1.ScanState.IDLE;
    };
    /**
     * Get current scan state
     */
    ScannerService.prototype.getScanState = function () {
        return this.scanState;
    };
    return ScannerService;
}());
exports.ScannerService = ScannerService;
// Made with Bob
