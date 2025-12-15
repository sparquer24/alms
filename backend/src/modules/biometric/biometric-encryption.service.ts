import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Biometric Encryption Service
 * Handles encryption/decryption of fingerprint templates at rest
 * 
 * SECURITY NOTES:
 * - Uses AES-256-GCM for authenticated encryption
 * - Each template gets a random IV
 * - Auth tag ensures data integrity
 * - Encryption key derived from environment
 */
@Injectable()
export class BiometricEncryptionService {
    private readonly logger = new Logger(BiometricEncryptionService.name);
    private readonly encryptionKey: Buffer;
    private readonly algorithm = 'aes-256-gcm';

    constructor() {
        // In production: load encryption key from secure key management service
        // For now, derive from environment variable
        const keyEnv = process.env.BIOMETRIC_ENCRYPTION_KEY;

        if (!keyEnv) {
            this.logger.warn(
                'BIOMETRIC_ENCRYPTION_KEY not set in environment. Using default key for development only.',
            );
            // Development-only default (NEVER use in production)
            this.encryptionKey = crypto.scryptSync('default-biometric-key-dev-only', 'salt', 32);
        } else {
            // Ensure key is exactly 32 bytes (256 bits)
            this.encryptionKey = Buffer.isBuffer(keyEnv)
                ? keyEnv
                : crypto.scryptSync(keyEnv, 'biometric-salt', 32);
        }
    }

    /**
     * Encrypt a biometric template
     * @param template - Raw template string/binary
     * @returns Encrypted template with IV and auth tag
     */
    async encryptTemplate(template: string): Promise<string> {
        try {
            // Generate random IV (initialization vector)
            const iv = crypto.randomBytes(16);

            // Create cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

            // Encrypt the template
            const encrypted = Buffer.concat([
                cipher.update(Buffer.isBuffer(template) ? template : Buffer.from(template, 'utf-8')),
                cipher.final(),
            ]);

            // Get auth tag for GCM mode
            const authTag = cipher.getAuthTag();

            // Combine: IV + auth tag + encrypted data
            // Format: base64(iv || authTag || encrypted)
            const combined = Buffer.concat([iv, authTag, encrypted]);
            const encryptedString = combined.toString('base64');

            this.logger.debug(`Template encrypted successfully`);
            return encryptedString;
        } catch (error: any) {
            this.logger.error(`Template encryption failed: ${error.message}`);
            throw new Error(`Biometric encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt a biometric template
     * @param encryptedTemplate - Encrypted template (base64)
     * @returns Decrypted template string
     */
    async decryptTemplate(encryptedTemplate: string): Promise<string> {
        try {
            // Parse the encrypted data
            const combined = Buffer.from(encryptedTemplate, 'base64');

            // Extract components
            const iv = combined.slice(0, 16); // First 16 bytes
            const authTag = combined.slice(16, 32); // Next 16 bytes
            const encrypted = combined.slice(32); // Rest is encrypted data

            // Create decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

            // Set auth tag for verification
            decipher.setAuthTag(authTag);

            // Decrypt
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

            this.logger.debug(`Template decrypted successfully`);
            return decrypted.toString('utf-8');
        } catch (error: any) {
            this.logger.error(`Template decryption failed: ${error.message}`);
            throw new Error(`Biometric decryption failed: ${error.message}`);
        }
    }

    /**
     * Hash a template for comparison without decryption
     * Useful for quick lookups without exposing plaintext
     * @param template - Template string
     * @returns SHA-256 hash
     */
    hashTemplate(template: string): string {
        return crypto.createHash('sha256').update(template).digest('hex');
    }

    /**
     * Verify template integrity
     * @param template - Original template
     * @param hash - Hash to verify against
     * @returns boolean
     */
    verifyTemplateHash(template: string, hash: string): boolean {
        const computedHash = this.hashTemplate(template);
        return computedHash === hash;
    }

    /**
     * Get encryption key status (for health checks)
     */
    getEncryptionStatus(): { isConfigured: boolean; algorithm: string } {
        return {
            isConfigured: !!this.encryptionKey,
            algorithm: this.algorithm,
        };
    }
}
