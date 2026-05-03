# Troubleshooting Snoffy Dog

## Issue: All findings show as "? Needs Review" even with AI credentials

If you've set up your watsonx.ai credentials but all findings still appear in "Needs Review" instead of being categorized, follow these steps:

### Step 1: Verify Environment Variables Are Set

**In PowerShell, check if variables are set:**
```powershell
echo $env:WATSONX_API_KEY
echo $env:WATSONX_PROJECT_ID
echo $env:WATSONX_URL
```

**Expected output:**
- API Key should show your IBM Cloud API key (starts with letters/numbers)
- Project ID should show a UUID format: `12345678-1234-1234-1234-123456789abc`
- URL should show: `us-south.ml.cloud.ibm.com` (or your region)

**If any are empty or show nothing:**
```powershell
# Set them again in PowerShell
$env:WATSONX_API_KEY = "your-api-key-here"
$env:WATSONX_PROJECT_ID = "your-project-id-here"
$env:WATSONX_URL = "us-south.ml.cloud.ibm.com"
```

### Step 2: Launch VS Code from the Same PowerShell Window

**IMPORTANT:** Environment variables set in PowerShell only apply to processes launched from that window.

```powershell
# After setting environment variables, launch VS Code from PowerShell:
code .
```

**OR** if VS Code is already open:
```powershell
# Close VS Code completely first, then:
code .
```

### Step 3: Check Extension Output for Errors

1. Open VS Code Output panel: `View` → `Output`
2. Select "Snoffy Dog" from the dropdown
3. Look for messages like:
   - ✅ `Granite AI filter enabled` - Good! AI is working
   - ❌ `Granite AI filter disabled: Missing WATSONX_API_KEY or WATSONX_PROJECT_ID` - Variables not detected
   - ❌ `Failed to get IAM token` - API key is invalid
   - ❌ `Failed to filter findings with Granite AI` - API call failed

### Step 4: Check for AI Processing Message

When you click "Go Sniffing!", you should see:
- A popup message: `🤖 Granite AI is analyzing findings...`

**If you DON'T see this message:**
- Environment variables are not being detected
- Go back to Step 1 and Step 2

**If you DO see this message but still get "Needs Review":**
- Check the Output panel for error messages
- The API call might be failing

### Step 5: Verify API Key Permissions

1. Log in to [IBM Cloud](https://cloud.ibm.com/)
2. Go to `Manage` → `Access (IAM)` → `API keys`
3. Find your API key
4. Verify it has access to watsonx.ai service

### Step 6: Verify Project ID

1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
2. Open your project
3. Click `Manage` tab
4. Copy the Project ID from the General section
5. Make sure it matches what you set in `WATSONX_PROJECT_ID`

### Step 7: Check Model Availability

The extension uses `ibm/granite-4-h-small` model. Verify it's available:

1. In watsonx.ai, go to your project
2. Try creating a prompt with the model selector
3. Search for "granite-4-h-small"
4. If not available, the model might not be in your region

**Alternative:** You can temporarily change the model in `src/graniteFilterService.ts` line 28:
```typescript
private readonly modelId = 'ibm/granite-3-8b-instruct'; // Fallback model
```

### Step 8: Test with Debug Logging

Add this to check if environment variables are being read:

1. Open Developer Tools: `Help` → `Toggle Developer Tools`
2. Go to Console tab
3. Run a scan
4. Look for any error messages

### Common Issues and Solutions

#### Issue: "Environment variables not found"
**Solution:** Launch VS Code from PowerShell after setting variables:
```powershell
$env:WATSONX_API_KEY = "your-key"
$env:WATSONX_PROJECT_ID = "your-project"
code .
```

#### Issue: "Failed to get IAM token"
**Solution:** 
- Verify API key is correct (no extra spaces)
- Check API key hasn't expired
- Ensure API key has watsonx.ai permissions

#### Issue: "Request timeout"
**Solution:**
- Check your internet connection
- Verify watsonx.ai service is accessible from your network
- Try increasing timeout in `src/graniteFilterService.ts` line 28

#### Issue: "Model not found"
**Solution:**
- Verify `granite-4-h-small` is available in your region
- Try using `granite-3-8b-instruct` instead
- Check watsonx.ai service status

### Still Not Working?

1. **Check VS Code Extension Host logs:**
   - `Help` → `Toggle Developer Tools` → `Console` tab
   - Look for red error messages

2. **Verify network connectivity:**
   ```powershell
   Test-NetConnection us-south.ml.cloud.ibm.com -Port 443
   ```

3. **Try a minimal test:**
   - Create a file with just one obvious secret: `const key = "sk-1234567890abcdef";`
   - Run scan
   - Check if it gets categorized

4. **Check IBM Cloud status:**
   - Visit [IBM Cloud Status](https://cloud.ibm.com/status)
   - Verify watsonx.ai service is operational

### Getting Help

If you're still having issues:

1. Check the Output panel (`View` → `Output` → "Snoffy Dog")
2. Copy any error messages
3. Check the Developer Console for JavaScript errors
4. Note which step above failed

### Quick Verification Checklist

- [ ] Environment variables are set in PowerShell
- [ ] VS Code was launched from that PowerShell window
- [ ] "Granite AI filter enabled" appears in Output panel
- [ ] "🤖 Granite AI is analyzing findings..." popup appears during scan
- [ ] No errors in Output panel
- [ ] API key is valid and has watsonx.ai access
- [ ] Project ID is correct
- [ ] Model `granite-4-h-small` is available in your region