import { FindingSeverity } from './types';

/**
 * Security rule definition
 */
export interface SecurityRule {
    /** Unique rule identifier */
    id: string;
    /** Rule name for display */
    name: string;
    /** Description of what this rule detects */
    description: string;
    /** Regular expression pattern to match */
    pattern: RegExp;
    /** Severity level */
    severity: FindingSeverity;
    /** Category of the security issue */
    category: 'secret' | 'dangerous-pattern' | 'dev-url';
}

/**
 * Comprehensive security rule pack
 */
export const SECURITY_RULES: SecurityRule[] = [
    // ==================== SECRETS ====================
    
    {
        id: 'aws-access-key-id',
        name: 'AWS Access Key ID',
        description: 'AWS Access Key ID detected (AKIA...)',
        pattern: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'aws-secret-access-key',
        name: 'AWS Secret Access Key',
        description: 'Possible AWS Secret Access Key (40 character base64-like string)',
        pattern: /(?:aws_secret_access_key|aws_secret|secret_key)\s*[=:]\s*['"]([A-Za-z0-9/+=]{40})['"]|['"]([A-Za-z0-9/+=]{40})['"]\s*(?:\/\/|#).*(?:aws|secret)/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'generic-api-key',
        name: 'Generic API Key',
        description: 'Generic API key or token detected',
        pattern: /(?:api[_-]?key|apikey|api[_-]?token|access[_-]?token|auth[_-]?token)\s*[=:]\s*['"]([a-zA-Z0-9_\-]{20,})['"]|(?:api[_-]?key|apikey|api[_-]?token|access[_-]?token|auth[_-]?token)\s*[=:]\s*([a-fA-F0-9]{32,})/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'generic-secret',
        name: 'Generic Secret',
        description: 'Variable named "secret" with a value',
        pattern: /(?:secret|SECRET)\s*[=:]\s*['"]([^'"]{8,})['"](?!\s*(?:\/\/|#).*(?:example|test|dummy|placeholder))/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'jwt-token',
        name: 'JWT Token',
        description: 'JSON Web Token (JWT) detected',
        pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'private-key',
        name: 'Private Key',
        description: 'Private key block detected',
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'hardcoded-password',
        name: 'Hardcoded Password',
        description: 'Hardcoded password detected',
        pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{3,})['"](?!\s*(?:\/\/|#).*(?:example|test|dummy|placeholder|your_password))/gi,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'github-token',
        name: 'GitHub Token',
        description: 'GitHub personal access token detected',
        pattern: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'slack-token',
        name: 'Slack Token',
        description: 'Slack API token detected',
        pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    {
        id: 'stripe-key',
        name: 'Stripe API Key',
        description: 'Stripe API key detected',
        pattern: /(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}/g,
        severity: FindingSeverity.HIGH,
        category: 'secret'
    },
    
    // ==================== DANGEROUS PATTERNS ====================
    
    {
        id: 'eval-usage',
        name: 'eval() Usage',
        description: 'Dangerous eval() function call detected',
        pattern: /\beval\s*\(/gi,
        severity: FindingSeverity.HIGH,
        category: 'dangerous-pattern'
    },
    
    {
        id: 'exec-usage',
        name: 'exec() Usage',
        description: 'Dangerous exec() function call detected',
        pattern: /\bexec\s*\(/gi,
        severity: FindingSeverity.HIGH,
        category: 'dangerous-pattern'
    },
    
    {
        id: 'sql-injection-risk',
        name: 'SQL Injection Risk',
        description: 'Possible SQL injection via string concatenation',
        pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*?\+\s*['"]|['"].*?\+.*?(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi,
        severity: FindingSeverity.HIGH,
        category: 'dangerous-pattern'
    },
    
    {
        id: 'sql-string-concat',
        name: 'SQL String Concatenation',
        description: 'SQL query built with string concatenation',
        pattern: /(?:query|sql|statement)\s*[=:]\s*['"](?:SELECT|INSERT|UPDATE|DELETE).*?['"]\s*\+|(?:query|sql|statement)\s*\+=\s*['"].*?(?:WHERE|FROM|SET)/gi,
        severity: FindingSeverity.HIGH,
        category: 'dangerous-pattern'
    },
    
    {
        id: 'command-injection',
        name: 'Command Injection Risk',
        description: 'Possible command injection via shell execution',
        pattern: /(?:child_process|exec|spawn|execSync|spawnSync)\s*\([^)]*\+|(?:os\.system|subprocess\.call|subprocess\.run)\s*\([^)]*\+/gi,
        severity: FindingSeverity.HIGH,
        category: 'dangerous-pattern'
    },
    
    {
        id: 'unsafe-deserialization',
        name: 'Unsafe Deserialization',
        description: 'Potentially unsafe deserialization detected',
        pattern: /(?:pickle\.loads|yaml\.load|eval|unserialize)\s*\(/gi,
        severity: FindingSeverity.MEDIUM,
        category: 'dangerous-pattern'
    },
    
    // ==================== DEV/STAGING URLS ====================
    
    {
        id: 'localhost-url',
        name: 'Localhost URL',
        description: 'Localhost URL found in code',
        pattern: /(?:http|https):\/\/localhost(?::\d+)?(?:\/[^\s'"]*)?/gi,
        severity: FindingSeverity.LOW,
        category: 'dev-url'
    },
    
    {
        id: 'dev-url',
        name: 'Development URL',
        description: 'Development environment URL detected',
        pattern: /(?:http|https):\/\/(?:[a-zA-Z0-9-]+\.)?dev\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s'"]*)?/gi,
        severity: FindingSeverity.MEDIUM,
        category: 'dev-url'
    },
    
    {
        id: 'staging-url',
        name: 'Staging URL',
        description: 'Staging environment URL detected',
        pattern: /(?:http|https):\/\/(?:[a-zA-Z0-9-]+\.)?(?:staging|stage|stg)\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s'"]*)?/gi,
        severity: FindingSeverity.MEDIUM,
        category: 'dev-url'
    },
    
    {
        id: 'test-url',
        name: 'Test URL',
        description: 'Test environment URL detected',
        pattern: /(?:http|https):\/\/(?:[a-zA-Z0-9-]+\.)?test\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s'"]*)?/gi,
        severity: FindingSeverity.MEDIUM,
        category: 'dev-url'
    },
    
    {
        id: 'internal-ip',
        name: 'Internal IP Address',
        description: 'Internal/private IP address detected',
        pattern: /(?:http|https):\/\/(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(?::\d+)?/gi,
        severity: FindingSeverity.MEDIUM,
        category: 'dev-url'
    },
    
    {
        id: 'example-url',
        name: 'Example/Placeholder URL',
        description: 'Example or placeholder URL that should be replaced',
        pattern: /(?:http|https):\/\/(?:example\.com|example\.org|test\.com|placeholder\.com|your-domain\.com)/gi,
        severity: FindingSeverity.LOW,
        category: 'dev-url'
    }
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: 'secret' | 'dangerous-pattern' | 'dev-url'): SecurityRule[] {
    return SECURITY_RULES.filter(rule => rule.category === category);
}

/**
 * Get rule by ID
 */
export function getRuleById(id: string): SecurityRule | undefined {
    return SECURITY_RULES.find(rule => rule.id === id);
}

/**
 * Get all rule IDs
 */
export function getAllRuleIds(): string[] {
    return SECURITY_RULES.map(rule => rule.id);
}

// Made with Bob
