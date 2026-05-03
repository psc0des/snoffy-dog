# 🐕 Snoffy Dog - Security Scanner Rules

## Overview

Snoffy Dog uses a comprehensive rule-based security scanner that detects various types of security vulnerabilities in your codebase. The scanner is built with extensibility in mind, making it easy to add new rules.

## Rule Structure

Each security rule consists of:

```typescript
{
    id: string;              // Unique identifier (e.g., 'aws-access-key-id')
    name: string;            // Display name (e.g., 'AWS Access Key ID')
    description: string;     // What the rule detects
    pattern: RegExp;         // Regular expression to match
    severity: 'high' | 'medium' | 'low';
    category: 'secret' | 'dangerous-pattern' | 'dev-url';
}
```

## Current Rule Pack

### 🔑 Secrets (10 rules)

#### 1. AWS Access Key ID
- **ID**: `aws-access-key-id`
- **Pattern**: `AKIA[0-9A-Z]{16}`
- **Severity**: HIGH
- **Example**: `AKIAIOSFODNN7EXAMPLE`

#### 2. AWS Secret Access Key
- **ID**: `aws-secret-access-key`
- **Pattern**: 40-character base64-like strings assigned to AWS secret variables
- **Severity**: HIGH
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

#### 3. Generic API Key
- **ID**: `generic-api-key`
- **Pattern**: Variables named `api_key`, `apikey`, `api_token`, `access_token`, `auth_token` with long values
- **Severity**: HIGH
- **Example**: `const apiKey = "sk_live_51H8xYz..."`

#### 4. Generic Secret
- **ID**: `generic-secret`
- **Pattern**: Variables named `secret` or `SECRET` with non-placeholder values
- **Severity**: HIGH
- **Example**: `const SECRET = "my-super-secret-value"`

#### 5. JWT Token
- **ID**: `jwt-token`
- **Pattern**: Three base64 parts separated by dots (JWT format)
- **Severity**: HIGH
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123`

#### 6. Private Key
- **ID**: `private-key`
- **Pattern**: `-----BEGIN PRIVATE KEY-----` blocks
- **Severity**: HIGH
- **Example**: Private key PEM blocks

#### 7. Hardcoded Password
- **ID**: `hardcoded-password`
- **Pattern**: Variables named `password`, `passwd`, `pwd` with non-placeholder values
- **Severity**: HIGH
- **Example**: `const password = "SuperSecret123!"`

#### 8. GitHub Token
- **ID**: `github-token`
- **Pattern**: `ghp_` or `github_pat_` prefixed tokens
- **Severity**: HIGH
- **Example**: `ghp_1234567890abcdefghijklmnopqrstuv`

#### 9. Slack Token
- **ID**: `slack-token`
- **Pattern**: `xox[baprs]-` prefixed tokens
- **Severity**: HIGH
- **Example**: `xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx`

#### 10. Stripe API Key
- **ID**: `stripe-key`
- **Pattern**: `sk_live_` or `pk_live_` prefixed keys
- **Severity**: HIGH
- **Example**: `sk_live_51H8xYzAbCdEfGhIjKlMnOpQrStUvWxYz`

### ⚠️ Dangerous Patterns (6 rules)

#### 1. eval() Usage
- **ID**: `eval-usage`
- **Pattern**: `eval(` function calls
- **Severity**: HIGH
- **Description**: Can lead to code injection vulnerabilities

#### 2. exec() Usage
- **ID**: `exec-usage`
- **Pattern**: `exec(` function calls
- **Severity**: HIGH
- **Description**: Can lead to code injection vulnerabilities

#### 3. SQL Injection Risk
- **ID**: `sql-injection-risk`
- **Pattern**: SQL keywords with string concatenation using `+`
- **Severity**: HIGH
- **Example**: `"SELECT * FROM users WHERE id = " + userId`

#### 4. SQL String Concatenation
- **ID**: `sql-string-concat`
- **Pattern**: SQL queries built with `+=` or string concatenation
- **Severity**: HIGH
- **Example**: `query += "WHERE username = '" + username + "'"`

#### 5. Command Injection
- **ID**: `command-injection`
- **Pattern**: Shell command execution with string concatenation
- **Severity**: HIGH
- **Example**: `exec('ls -la ' + userInput)`

#### 6. Unsafe Deserialization
- **ID**: `unsafe-deserialization`
- **Pattern**: `pickle.loads`, `yaml.load`, `unserialize` calls
- **Severity**: MEDIUM
- **Description**: Can lead to remote code execution

### 🌐 Development URLs (6 rules)

#### 1. Localhost URL
- **ID**: `localhost-url`
- **Pattern**: `http://localhost` or `https://localhost`
- **Severity**: LOW
- **Example**: `http://localhost:3000/api`

#### 2. Development URL
- **ID**: `dev-url`
- **Pattern**: URLs with `dev.` subdomain
- **Severity**: MEDIUM
- **Example**: `https://api.dev.example.com`

#### 3. Staging URL
- **ID**: `staging-url`
- **Pattern**: URLs with `staging.`, `stage.`, or `stg.` subdomain
- **Severity**: MEDIUM
- **Example**: `https://staging.example.com/api`

#### 4. Test URL
- **ID**: `test-url`
- **Pattern**: URLs with `test.` subdomain
- **Severity**: MEDIUM
- **Example**: `https://test.example.com/api`

#### 5. Internal IP Address
- **ID**: `internal-ip`
- **Pattern**: Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- **Severity**: MEDIUM
- **Example**: `http://192.168.1.100:8080`

#### 6. Example/Placeholder URL
- **ID**: `example-url`
- **Pattern**: `example.com`, `example.org`, `test.com`, etc.
- **Severity**: LOW
- **Example**: `https://example.com/api`

## False Positive Reduction

The scanner includes smart filtering to reduce false positives:

### Comment Detection
Lines starting with `//`, `#`, `/*`, or `*` are skipped.

### Placeholder Detection
Matches containing these keywords are skipped:
- `example`, `test`, `dummy`, `placeholder`, `sample`
- `your_`, `your-`, `todo`, `fixme`
- `xxx`, `yyy`, `fake`, `mock`, `demo`

### Short Password Detection
Passwords shorter than 4 characters are considered placeholders.

## File Scanning

### Included File Types
- JavaScript/TypeScript: `.js`, `.ts`, `.jsx`, `.tsx`
- Python: `.py`
- Java: `.java`
- Go: `.go`
- Ruby: `.rb`
- PHP: `.php`
- C/C++: `.c`, `.cpp`, `.h`, `.hpp`, `.cs`
- Config: `.json`, `.yaml`, `.yml`, `.env`
- Shell: `.sh`, `.bash`
- SQL: `.sql`
- Web: `.html`, `.css`, `.scss`, `.sass`, `.vue`, `.svelte`

### Excluded Directories
- `node_modules/` - Node.js dependencies
- `.git/` - Git repository data
- `dist/`, `build/`, `out/` - Build outputs
- `target/` - Java/Maven builds
- `.next/`, `.nuxt/` - Framework builds
- `vendor/` - PHP dependencies
- `__pycache__/`, `.venv/`, `venv/` - Python artifacts
- `*.min.js`, `*.bundle.js` - Minified files

## Finding Structure

Each finding includes:

```typescript
{
    id: string;              // Unique identifier
    type: FindingType;       // SECRET | DANGEROUS_PATTERN | DEV_URL
    severity: FindingSeverity; // HIGH | MEDIUM | LOW
    file: string;            // Relative file path
    line: number;            // Line number (0-based)
    column: number;          // Column number (0-based)
    length: number;          // Length of matched text
    message: string;         // Display message with emoji
    description: string;     // Detailed description
    snippet: string;         // Code snippet (trimmed line)
}
```

## Adding New Rules

To add a new security rule:

1. Open `src/securityRules.ts`
2. Add a new rule to the `SECURITY_RULES` array:

```typescript
{
    id: 'my-new-rule',
    name: 'My Security Check',
    description: 'Detects something dangerous',
    pattern: /your-regex-pattern/gi,
    severity: FindingSeverity.HIGH,
    category: 'secret' // or 'dangerous-pattern' or 'dev-url'
}
```

3. Recompile: `npm run compile`
4. Test with F5 in VS Code

### Regex Tips

- Use `gi` flags for case-insensitive global matching
- Use capturing groups `()` to extract specific parts
- Test your regex at [regex101.com](https://regex101.com)
- Be careful with performance on large files

### Example: Adding a New Secret Type

```typescript
{
    id: 'sendgrid-api-key',
    name: 'SendGrid API Key',
    description: 'SendGrid API key detected',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: FindingSeverity.HIGH,
    category: 'secret'
}
```

## Performance Considerations

- The scanner processes files sequentially
- Progress updates every file
- Small delay every 10 files to keep UI responsive
- Regex patterns are optimized for speed
- False positive filtering reduces noise

## Testing Your Rules

Use the test files in `test-samples/`:
- `vulnerable-code.js` - JavaScript examples
- `python-vulnerable.py` - Python examples

Add your own test cases to verify rules work correctly.

## Future Enhancements

Potential improvements:
- Configuration file (`.snoffyrc.json`) for custom rules
- Ignore patterns (`.snoffyignore`)
- Rule severity customization
- Per-project rule enabling/disabling
- Export findings to JSON/CSV
- Integration with CI/CD pipelines
- Custom rule plugins
- Machine learning-based detection

## Contributing Rules

When contributing new rules:
1. Ensure the pattern is specific enough to avoid false positives
2. Test against real-world code samples
3. Document the rule clearly
4. Include examples in test files
5. Consider performance impact

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)
- [Regular Expressions Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)