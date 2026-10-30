import * as crypto from 'crypto';

/**
 * Encryption for stored fingerprint data (templates and fingerprint images).
 *
 * Encrypted values look like `enc:v1:<keyId>:<base64(iv[12] | authTag[16] | ciphertext)>`
 * (AES-256-GCM). Values without the prefix are legacy plain text: they are read as-is so
 * existing records keep working until they are encrypted by the backfill script.
 *
 * The key comes only from BIOMETRIC_ENCRYPTION_KEY; there is no built-in fallback. Without
 * a key nothing is encrypted (writes keep today's plain-text behaviour) and any encrypted
 * value fails to read, so a missing key can never silently produce unreadable data.
 */
export class BiometricCrypto {
  static readonly PREFIX = 'enc:v1:';

  private readonly key: Buffer | null;
  private readonly hmacKey: Buffer | null;
  readonly keyId: string;

  constructor(secret = process.env.BIOMETRIC_ENCRYPTION_KEY, keyId = process.env.BIOMETRIC_ENCRYPTION_KEY_ID || 'k1') {
    this.keyId = keyId;
    if (secret && secret.trim()) {
      const master = crypto.scryptSync(secret.trim(), 'alms-biometric-v1', 32);
      this.key = Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'alms-biometric-encrypt', 32));
      this.hmacKey = Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'alms-biometric-hmac', 32));
    } else {
      this.key = null;
      this.hmacKey = null;
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  isEncrypted(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith(BiometricCrypto.PREFIX);
  }

  encrypt(plain: string): string {
    if (!this.key) throw new Error('BIOMETRIC_ENCRYPTION_KEY is not configured');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const packed = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
    return `${BiometricCrypto.PREFIX}${this.keyId}:${packed}`;
  }

  /** Plain-text (legacy) values are returned unchanged. */
  decrypt(value: string): string {
    if (!this.isEncrypted(value)) return value;
    if (!this.key) throw new Error('Encrypted biometric data found but BIOMETRIC_ENCRYPTION_KEY is not configured');
    const rest = value.slice(BiometricCrypto.PREFIX.length);
    const sep = rest.indexOf(':');
    const keyId = rest.slice(0, sep);
    if (keyId !== this.keyId) throw new Error(`Biometric data was encrypted with key "${keyId}", not the configured "${this.keyId}"`);
    const packed = Buffer.from(rest.slice(sep + 1), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, packed.subarray(0, 12));
    decipher.setAuthTag(packed.subarray(12, 28));
    return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
  }

  /**
   * Identifier/duplicate hash for a raw template. Keyed (HMAC) once a key is configured, so the
   * stored hash can't be used to test guessed templates; plain SHA-256 before that, as today.
   */
  templateHash(template: string): string {
    return this.hmacKey
      ? crypto.createHmac('sha256', this.hmacKey).update(template).digest('hex')
      : crypto.createHash('sha256').update(template).digest('hex');
  }

  /** Encrypt a stored fingerprint's template and image (no-op without a key or if already encrypted). */
  protectFingerprint<T extends Record<string, any>>(fp: T): T {
    if (!this.isConfigured() || !fp) return fp;
    const out: Record<string, any> = { ...fp };
    for (const field of ['template', 'bitmapData']) {
      if (typeof out[field] === 'string' && out[field] && !this.isEncrypted(out[field])) out[field] = this.encrypt(out[field]);
    }
    return out as T;
  }

  /** Decrypt a stored fingerprint's template and image. */
  revealFingerprint<T extends Record<string, any>>(fp: T): T {
    if (!fp) return fp;
    const out: Record<string, any> = { ...fp };
    for (const field of ['template', 'bitmapData']) {
      if (typeof out[field] === 'string') out[field] = this.decrypt(out[field]);
    }
    return out as T;
  }

  /**
   * A biometricData object as general application/license responses may show it: fingerprint
   * templates are removed (served only by the audited template endpoints), images are decrypted
   * for the capture-step previews.
   */
  redactBiometricData(data: any): any {
    if (!data || typeof data !== 'object' || !Array.isArray(data.fingerprints)) return data;
    return {
      ...data,
      fingerprints: data.fingerprints.map((fp: any) => {
        if (!fp || typeof fp !== 'object') return fp;
        const { template, bitmapData, ...rest } = fp;
        let image: string | undefined;
        try {
          image = typeof bitmapData === 'string' ? this.decrypt(bitmapData) : bitmapData;
        } catch {
          image = undefined;
        }
        return { ...rest, hasTemplate: Boolean(template), ...(image ? { bitmapData: image } : {}) };
      }),
    };
  }
}

/** Shared instance for services outside the biometric module. */
export const biometricCrypto = new BiometricCrypto();

/** Redact the `biometricData` relation of an application record (as Prisma returns it) in place-safe fashion. */
export function redactBiometricRelation<T extends Record<string, any> | null | undefined>(record: T): T {
  if (!record || typeof record !== 'object' || !('biometricData' in record)) return record;
  const relation = (record as any).biometricData;
  if (!relation || typeof relation !== 'object') return record;
  // The relation row is { id, applicationId, biometricData: {...} }
  const redacted = 'biometricData' in relation
    ? { ...relation, biometricData: biometricCrypto.redactBiometricData(relation.biometricData) }
    : biometricCrypto.redactBiometricData(relation);
  return { ...record, biometricData: redacted };
}

/**
 * The biometricData to save from a form-save request: fingerprints are never taken from the
 * browser (they are written only by the biometric endpoints), so the stored ones are kept.
 */
export function mergeFormBiometricData(existing: any, incoming: any): any {
  const stored = existing && typeof existing === 'object' ? existing : {};
  const next = { ...(incoming || {}) };
  if (Array.isArray(stored.fingerprints)) next.fingerprints = stored.fingerprints;
  else if (Array.isArray(next.fingerprints)) delete next.fingerprints;
  return next;
}
