# Debug Setup for F5 (Extension Development)

## Problem
When you press F5 to debug the extension, the Extension Development Host doesn't inherit your PowerShell environment variables.

## Solution: Two Options

### Option 1: Use System Environment Variables (Recommended)

Set environment variables at the system level so they're available to all processes:

**Windows:**
1. Press `Win + X` → Select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
5. Add these three variables:
   - Name: `WATSONX_API_KEY`, Value: `your-api-key-here`
   - Name: `WATSONX_PROJECT_ID`, Value: `your-project-id-here`
   - Name: `WATSONX_URL`, Value: `us-south.ml.cloud.ibm.com`
6. Click OK to save
7. **Restart VS Code completely** (close all windows)
8. Press F5 to debug

### Option 2: Edit launch.json Directly

I've added a second launch configuration called "Run Extension (with AI credentials)".

**To use it:**

1. Open `.vscode/launch.json`
2. Find the "Run Extension (with AI credentials)" configuration
3. Replace the placeholder values:
   ```json
   "env": {
     "WATSONX_API_KEY": "paste-your-actual-api-key-here",
     "WATSONX_PROJECT_ID": "paste-your-actual-project-id-here",
     "WATSONX_URL": "us-south.ml.cloud.ibm.com"
   }
   ```
4. Save the file
5. In the Debug panel (Ctrl+Shift+D), select "Run Extension (with AI credentials)" from the dropdown
6. Press F5

**⚠️ IMPORTANT:** If you use Option 2, **DO NOT commit** `.vscode/launch.json` with your real credentials!

## Verify It's Working

After pressing F5:

1. **Check the Debug Console:**
   - Look for: `Granite AI filter enabled`
   - Should NOT see: `Granite AI filter disabled`

2. **In the Extension Development Host window:**
   - Open Snoffy Dog panel
   - Click "Go Sniffing!"
   - Should see popup: `🤖 Granite AI is analyzing findings...`

3. **Check findings categorization:**
   - Should see 3 sections: ✓ Verified, ? Needs Review, ✗ Likely False Positives
   - Not just one "? Needs Review" section

## Current Launch Configurations

### "Run Extension" (Default)
- Reads from system environment variables
- Use this if you set variables at system level (Option 1)

### "Run Extension (with AI credentials)"
- Has hardcoded credentials in launch.json
- Use this for quick testing (Option 2)
- **Remember:** Don't commit your real credentials!

## Troubleshooting

### Still seeing "Granite AI filter disabled"?

**Check Debug Console output:**
```
View → Debug Console
```

Look for the exact error message.

### Variables not being read from system?

After setting system environment variables:
1. Close ALL VS Code windows
2. Open a new terminal/PowerShell
3. Verify variables are set:
   ```powershell
   echo $env:WATSONX_API_KEY
   ```
4. Launch VS Code from that terminal:
   ```powershell
   code .
   ```
5. Press F5

### Using IBM BoB IDE?

The same principles apply:
1. Set system environment variables, OR
2. Edit the launch configuration in the IDE
3. Restart the IDE completely
4. Press F5 to debug

## Quick Test

To verify your setup works:

1. Create a test file: `test-secret.js`
   ```javascript
   const apiKey = "sk-1234567890abcdef1234567890abcdef";
   const fakeKey = "your-api-key-here";
   ```

2. Press F5 to debug
3. In Extension Development Host, click "Go Sniffing!"
4. You should see:
   - `apiKey` → ✓ Verified Issues (real secret)
   - `fakeKey` → ✗ Likely False Positives (placeholder)

If both appear in "? Needs Review", the AI isn't running.

## For IBM BoB Hackathon Demo

**Best practice for demo:**
1. Use Option 1 (system environment variables)
2. This way credentials work everywhere (F5, terminal, packaged extension)
3. No risk of committing credentials to git

**Alternative for demo:**
1. Use Option 2 (launch.json with credentials)
2. Create a separate branch for demo
3. Don't push that branch to public repo