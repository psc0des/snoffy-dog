# IBM watsonx.ai Integration Setup Guide

## Overview

Snoffy Dog uses IBM watsonx.ai's **Granite-4-h-small** model to intelligently filter security findings and reduce false positives. This guide will help you set up the required credentials.

## Prerequisites

1. An IBM Cloud account
2. Access to IBM watsonx.ai service
3. A watsonx.ai project

## Step 1: Create IBM Cloud API Key

1. Log in to [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to **Manage** → **Access (IAM)** → **API keys**
3. Click **Create an IBM Cloud API key**
4. Give it a descriptive name (e.g., "Snoffy Dog Extension")
5. Click **Create**
6. **Important**: Copy and save the API key immediately - you won't be able to see it again!

## Step 2: Get watsonx.ai Project ID

1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
2. Navigate to your project or create a new one
3. Click on the **Manage** tab in your project
4. Find the **Project ID** in the **General** section
5. Copy the Project ID (it looks like: `12345678-1234-1234-1234-123456789abc`)

## Step 3: Determine Your watsonx.ai Region

Your watsonx.ai URL depends on your IBM Cloud region:

- **US South (Dallas)**: `us-south.ml.cloud.ibm.com` (default)
- **EU Germany (Frankfurt)**: `eu-de.ml.cloud.ibm.com`
- **Japan (Tokyo)**: `jp-tok.ml.cloud.ibm.com`

You can find your region in the watsonx.ai console URL or project settings.

## Step 4: Configure Environment Variables

### Option A: VS Code Settings (Recommended)

1. Open VS Code Settings (File → Preferences → Settings)
2. Search for "Snoffy Dog"
3. Enter your credentials:
   - **Watsonx API Key**: Your IBM Cloud API key
   - **Watsonx Project ID**: Your watsonx.ai project ID
   - **Watsonx URL**: Your region URL (or leave default)

### Option B: Environment Variables

Set these environment variables before launching VS Code:

**Windows (PowerShell):**
```powershell
$env:WATSONX_API_KEY = "your-api-key-here"
$env:WATSONX_PROJECT_ID = "your-project-id-here"
$env:WATSONX_URL = "us-south.ml.cloud.ibm.com"  # Optional, defaults to us-south
```

**Windows (Command Prompt):**
```cmd
set WATSONX_API_KEY=your-api-key-here
set WATSONX_PROJECT_ID=your-project-id-here
set WATSONX_URL=us-south.ml.cloud.ibm.com
```

**macOS/Linux:**
```bash
export WATSONX_API_KEY="your-api-key-here"
export WATSONX_PROJECT_ID="your-project-id-here"
export WATSONX_URL="us-south.ml.cloud.ibm.com"  # Optional
```

### Option C: .env File (Development)

Create a `.env` file in the extension root directory:

```env
WATSONX_API_KEY=your-api-key-here
WATSONX_PROJECT_ID=your-project-id-here
WATSONX_URL=us-south.ml.cloud.ibm.com
```

**Note**: The `.env` file is already in `.gitignore` to prevent accidental commits.

## Step 5: Verify Setup

1. Reload VS Code window (Ctrl+Shift+P → "Developer: Reload Window")
2. Open the Snoffy Dog panel in the sidebar
3. Click "Go Sniffing!" on a project with test files
4. Check the Output panel (View → Output → "Snoffy Dog") for any errors

## How It Works

### AI-Powered False Positive Filtering

When Snoffy scans your code:

1. **Regex Detection**: Finds potential security issues using pattern matching
2. **Context Extraction**: Captures the suspicious line plus surrounding context
3. **AI Classification**: Sends findings to Granite AI in batches of 5
4. **Confidence Scoring**: AI returns whether each finding is real or a false positive
5. **Tri-State Display**: 
   - ✓ **Verified Issues** (confidence > 70%, is_real = true)
   - ? **Needs Review** (confidence ≤ 70%)
   - ✗ **Likely False Positives** (confidence > 70%, is_real = false) - collapsed by default

### Example Classifications

**Real Secret (Verified):**
```javascript
const apiKey = "sk-1234567890abcdef1234567890abcdef";  // ✓ Real API key
```

**False Positive (Filtered):**
```javascript
const exampleKey = "your-api-key-here";  // ✗ Placeholder text
const testToken = "xxx-yyy-zzz";         // ✗ Test/mock value
```

**Uncertain (Needs Review):**
```javascript
const key = process.env.API_KEY || "default";  // ? Could be real or placeholder
```

## Troubleshooting

### "Failed to get IAM token"

- Verify your API key is correct
- Check that the API key has not expired
- Ensure you have internet connectivity

### "Failed to filter findings with Granite AI"

- Verify your Project ID is correct
- Check that your watsonx.ai project is active
- Ensure the Granite-4-h-small model is available in your region
- Check the Output panel for detailed error messages

### "No AI filtering applied"

- Verify environment variables are set correctly
- Reload VS Code window after setting variables
- Check that all three variables are configured (API key, Project ID, URL)

### Rate Limiting

The extension implements:
- Batch processing (5 findings at a time)
- 5-second timeout per batch
- No automatic retries to avoid overwhelming the API

If you hit rate limits, wait a few minutes before scanning again.

## Security Best Practices

1. **Never commit credentials**: The `.env` file is gitignored, but always double-check
2. **Use IAM policies**: Restrict your API key to only watsonx.ai access
3. **Rotate keys regularly**: Create new API keys periodically
4. **Monitor usage**: Check your IBM Cloud usage dashboard regularly

## Cost Considerations

- Granite-4-h-small is an efficient model optimized for classification tasks
- Each scan processes findings in batches to minimize API calls
- Typical scan of 50 findings = ~10 API calls
- Monitor your usage in the IBM Cloud dashboard

## Support

For issues with:
- **IBM Cloud/watsonx.ai**: [IBM Cloud Support](https://cloud.ibm.com/unifiedsupport/supportcenter)
- **Snoffy Dog Extension**: Check the GitHub repository or extension marketplace

## Additional Resources

- [IBM watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [IBM Cloud IAM Documentation](https://cloud.ibm.com/docs/account?topic=account-iamoverview)
- [Granite Models Overview](https://www.ibm.com/granite)