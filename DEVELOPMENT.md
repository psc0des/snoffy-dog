# 🐕 Snoffy Dog - Development Guide

## Project Structure

```
snoffy-dog/
├── src/
│   ├── extension.ts              # Main entry point - activates extension
│   ├── snoffyPanel.ts            # Webview panel with Snoffy's UI
│   ├── scannerService.ts         # Security scanning logic (stub)
│   ├── diagnosticsProvider.ts    # VS Code diagnostics (red squiggles)
│   ├── statusBar.ts              # Status bar item manager
│   └── types.ts                  # TypeScript interfaces and enums
├── out/                          # Compiled JavaScript (generated)
├── media/
│   └── snoffy-icon.svg           # Extension icon
├── .vscode/
│   ├── launch.json               # Debug configuration
│   └── tasks.json                # Build tasks
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # User documentation
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@types/vscode` - VS Code API type definitions
- `@types/node` - Node.js type definitions
- `typescript` - TypeScript compiler
- `eslint` - Code linting
- `@vscode/vsce` - Extension packaging tool

### 2. Compile TypeScript

```bash
npm run compile
```

This compiles all TypeScript files from `src/` to JavaScript in `out/`.

### 3. Watch Mode (Development)

```bash
npm run watch
```

Automatically recompiles when you save TypeScript files.

## Running the Extension

### Method 1: Press F5
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. A new VS Code window opens with the extension loaded

### Method 2: Run and Debug Panel
1. Open the Run and Debug panel (Ctrl+Shift+D)
2. Select "Run Extension" from the dropdown
3. Click the green play button

## Testing the Extension

Once the Extension Development Host is running:

### 1. Open Snoffy Panel
- Click the dog icon (🐕) in the Activity Bar (left sidebar)
- Or use Command Palette: `Snoffy Dog: Open Snoffy Panel`

### 2. Start a Scan
- Click the "🔍 Go Sniffing!" button in the Snoffy panel
- Watch Snoffy animate as he scans files
- Findings appear in real-time

### 3. View Findings
- Findings list shows in the Snoffy panel
- Red squiggles appear in the editor on problematic lines
- Status bar shows: `🐕 Snoffy found X things to chew on`

### 4. Navigate to Issues
- Click any finding in the list
- VS Code jumps to the exact file and line

### 5. Clear Findings
- Click the "🧹 Clear Findings" button
- Or use Command Palette: `Snoffy Dog: Clear Findings`

## Architecture Overview

### Extension Activation
- **Activation Event**: `onStartupFinished` - loads when VS Code starts
- **Entry Point**: `src/extension.ts` - `activate()` function
- Registers all commands, views, and providers

### Components

#### 1. SnoffyPanel (src/snoffyPanel.ts)
- Implements `WebviewViewProvider`
- Manages the sidebar webview with HTML/CSS/JS
- Handles messages between webview and extension
- Animates Snoffy dog (idle → walking → idle)
- Displays findings list with click-to-navigate

#### 2. ScannerService (src/scannerService.ts)
- Scans workspace files for security issues
- **Current Implementation**: Stub with mock findings
- Detects patterns like:
  - `API_KEY` or `api_key` → Hardcoded secret
  - `eval()` → Dangerous pattern
  - `localhost`, `dev.`, `staging.` → Dev URLs
- Reports progress via callback
- Returns array of `SecurityFinding` objects

#### 3. DiagnosticsProvider (src/diagnosticsProvider.ts)
- Converts findings to VS Code diagnostics
- Creates red squiggles in the editor
- Groups findings by file
- Maps severity levels (HIGH → Error, MEDIUM → Warning, LOW → Info)

#### 4. StatusBarManager (src/statusBar.ts)
- Shows findings count in status bar
- Updates text based on scan state
- Click opens Snoffy panel

#### 5. Types (src/types.ts)
- TypeScript interfaces and enums
- `SecurityFinding` - represents a security issue
- `ScanProgress` - scan state and progress
- `MessageType` - webview communication

### Data Flow

```
User clicks "Go Sniffing!"
    ↓
Command Handler (extension.ts)
    ↓
ScannerService.startScan()
    ↓
For each file:
    - Scan for patterns (stub)
    - Generate SecurityFinding
    - Report progress via callback
    ↓
Progress Callback:
    - Update SnoffyPanel (webview)
    - Update DiagnosticsProvider (squiggles)
    ↓
Scan Complete:
    - Update StatusBarManager
    - Show completion message
```

### Webview Communication

Extension → Webview:
- `scanProgress` - Update progress bar and findings
- `scanComplete` - Show final results

Webview → Extension:
- `startScan` - User clicked "Go Sniffing!"
- `navigateToFinding` - User clicked a finding
- `clearFindings` - User clicked "Clear Findings"

## Stub Implementation Details

The current scanner is a **stub** with mock findings:

### What's Implemented
✅ File traversal (finds all code files)
✅ Progress reporting
✅ Mock pattern detection (simple string matching)
✅ Finding generation with proper structure
✅ UI updates and animations
✅ Diagnostics and navigation

### What's NOT Implemented (Future Work)
❌ Real regex-based pattern matching
❌ Configurable security rules
❌ Ignore patterns (.snoffyignore)
❌ Custom rule plugins
❌ Severity configuration
❌ Export findings to JSON/CSV

### Mock Findings Logic

The stub generates findings when it finds these strings:
- `API_KEY` or `api_key` → Secret finding
- `eval(` → Dangerous pattern finding
- `localhost`, `dev.`, `staging.` → Dev URL finding

**Example**: If a file contains `const key = "API_KEY_123"`, Snoffy will flag it as a hardcoded secret.

## Extending the Scanner

To implement real security scanning:

### 1. Add Pattern Definitions
```typescript
// In scannerService.ts
const SECRET_PATTERNS = [
  { regex: /AWS_ACCESS_KEY_ID\s*=\s*['"][A-Z0-9]{20}['"]/, type: 'aws-key' },
  { regex: /jwt\s*=\s*['"]eyJ[A-Za-z0-9-_]+\./, type: 'jwt-token' },
  // ... more patterns
];
```

### 2. Update scanFile() Method
```typescript
private async scanFile(fileUri: vscode.Uri): Promise<void> {
  const document = await vscode.workspace.openTextDocument(fileUri);
  const text = document.getText();
  
  for (const pattern of SECRET_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.regex, 'g'));
    for (const match of matches) {
      // Create finding from match
      this.findings.push({
        // ... finding details
      });
    }
  }
}
```

### 3. Add Configuration
```typescript
// In package.json contributes section
"configuration": {
  "title": "Snoffy Dog",
  "properties": {
    "snoffyDog.enableSecretScanning": {
      "type": "boolean",
      "default": true,
      "description": "Enable scanning for hardcoded secrets"
    }
  }
}
```

## Debugging

### Console Logs
- Extension logs: Check Debug Console in Extension Development Host
- Webview logs: Right-click webview → "Open Webview Developer Tools"

### Breakpoints
- Set breakpoints in TypeScript files
- They work in the Extension Development Host

### Common Issues

**Extension doesn't activate:**
- Check activation events in package.json
- Look for errors in Debug Console

**Webview doesn't show:**
- Check if view is registered in package.json
- Verify viewType matches in snoffyPanel.ts

**Compilation errors:**
- Run `npm run compile` to see TypeScript errors
- Check tsconfig.json settings

**Diagnostics don't appear:**
- Ensure findings have correct file paths
- Check if workspace folder is open

## Packaging the Extension

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package the extension
vsce package

# This creates snoffy-dog-0.1.0.vsix
```

Install the .vsix file:
1. Open VS Code
2. Extensions panel → "..." menu → "Install from VSIX..."
3. Select the .vsix file

## Next Steps

1. **Implement Real Pattern Matching**
   - Add regex patterns for secrets, dangerous code, dev URLs
   - Use proper AST parsing for code patterns

2. **Add Configuration**
   - Settings for scan sensitivity
   - Ignore patterns
   - Custom rules

3. **Improve UI**
   - Better animations
   - Severity badges with colors
   - Filter findings by type/severity

4. **Add Tests**
   - Unit tests for scanner logic
   - Integration tests for extension

5. **Performance**
   - Incremental scanning (only changed files)
   - Background scanning
   - Caching results

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)