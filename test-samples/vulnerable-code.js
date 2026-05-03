// Test file with various security vulnerabilities for Snoffy Dog to detect

// ==================== SECRETS ====================

// AWS Keys
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const awsSecret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// API Keys
const apiKey = "sk_live_51H8xYzAbCdEfGhIjKlMnOpQrStUvWxYz";
const API_TOKEN = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";

// JWT Token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Hardcoded Password
const password = "SuperSecret123!";
const dbPassword = "MyDatabasePass2023";

// Private Key
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`;

// GitHub Token
const githubToken = "ghp_1234567890abcdefghijklmnopqrstuv";

// Slack Token
const slackToken = "xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx";

// Generic Secret
const SECRET = "my-super-secret-value-12345";

// ==================== DANGEROUS PATTERNS ====================

// eval() usage
function dangerousEval(userInput) {
    return eval(userInput); // Very dangerous!
}

// exec() usage
const { exec } = require('child_process');
exec('ls -la ' + userInput); // Command injection risk

// SQL Injection via string concatenation
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);

// SQL string concat
let sql = "SELECT * FROM products WHERE ";
sql += "category = '" + category + "'";

// More SQL injection
const statement = "DELETE FROM users WHERE username = '" + username + "'";

// ==================== DEV/STAGING URLS ====================

// Localhost URLs
const apiUrl = "http://localhost:3000/api/users";
const devEndpoint = "https://localhost:8080/auth";

// Development URLs
const devApi = "https://api.dev.example.com/v1/data";
const devServer = "http://dev.myapp.com/api";

// Staging URLs
const stagingUrl = "https://staging.example.com/api";
const stageEndpoint = "http://stage.mycompany.com/users";

// Test URLs
const testApi = "https://test.example.com/api/v2";

// Internal IPs
const internalApi = "http://192.168.1.100:8080/api";
const privateServer = "https://10.0.0.50/admin";

// Example URLs (should be replaced)
const placeholderUrl = "https://example.com/api";

// ==================== VALID CODE (should not trigger) ====================

// These should NOT be flagged:
const examplePassword = "your_password_here"; // placeholder
const testApiKey = "test_key_placeholder"; // example
// const commentedSecret = "this-is-in-a-comment";

// Production URL (should be fine)
const prodApi = "https://api.production.com/v1";

console.log("Test file loaded");

// Made with Bob
