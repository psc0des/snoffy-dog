import * as https from 'https';

/**
 * IBM Cloud IAM token response
 */
interface IAMTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    expiration: number;
}

/**
 * Manages IBM Cloud IAM token lifecycle
 * Handles token fetching, caching, and automatic refresh
 */
export class IAMTokenManager {
    private cachedToken: string | null = null;
    private tokenExpiry: number = 0;
    private readonly IAM_URL = 'iam.cloud.ibm.com';
    private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

    constructor(private readonly apiKey: string) {}

    /**
     * Get a valid IAM token (cached or fresh)
     */
    async getToken(logCallback?: (message: string) => void): Promise<string> {
        // Return cached token if still valid
        if (this.cachedToken && this.isTokenValid()) {
            const remainingMinutes = Math.floor((this.tokenExpiry - Date.now()) / 60000);
            logCallback?.(`  ← IAM token cached (valid ${remainingMinutes} min)`);
            return this.cachedToken;
        }

        // Fetch new token
        logCallback?.(`  → fetching IAM bearer token from ${this.IAM_URL}`);
        return await this.fetchNewToken(logCallback);
    }

    /**
     * Check if cached token is still valid
     */
    private isTokenValid(): boolean {
        const now = Date.now();
        return this.tokenExpiry > now + this.REFRESH_BUFFER_MS;
    }

    /**
     * Fetch a new IAM token from IBM Cloud
     */
    private async fetchNewToken(logCallback?: (message: string) => void): Promise<string> {
        return new Promise((resolve, reject) => {
            const postData = new URLSearchParams({
                grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
                apikey: this.apiKey
            }).toString();

            const options = {
                hostname: this.IAM_URL,
                path: '/identity/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 10000 // 10 second timeout
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`IAM token request failed: ${res.statusCode} ${data}`));
                            return;
                        }

                        const response: IAMTokenResponse = JSON.parse(data);
                        
                        // Cache the token
                        this.cachedToken = response.access_token;
                        // Set expiry (expires_in is in seconds)
                        this.tokenExpiry = Date.now() + (response.expires_in * 1000);
                        
                        const expiryMinutes = Math.floor(response.expires_in / 60);
                        logCallback?.(`  ← IAM token cached (valid ${expiryMinutes} min)`);

                        resolve(response.access_token);
                    } catch (error) {
                        reject(new Error(`Failed to parse IAM token response: ${error}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`IAM token request error: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('IAM token request timed out'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Clear cached token (useful for testing or forced refresh)
     */
    clearCache(): void {
        this.cachedToken = null;
        this.tokenExpiry = 0;
    }
}

// Made with Bob
