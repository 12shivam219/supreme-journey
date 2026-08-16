import crypto from 'crypto';

export class EncryptionService {
  private static algorithm = 'aes-256-gcm';

  private static getKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY || 'tracker_default_secret_key_32bytes!!';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM.
   * Returns formatted string: iv:authTag:encryptedHex
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const iv = crypto.randomBytes(12); // 12-byte IV for GCM
    const key = this.getKey();
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext formatted as iv:authTag:encryptedHex.
   * Gracefully returns plaintext if string was not encrypted (backwards-compatibility).
   */
  static decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      return ciphertext; // Plaintext legacy record
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = this.getKey();

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.warn('[EncryptionService] Decryption failed, returning original text:', err);
      return ciphertext;
    }
  }
}
