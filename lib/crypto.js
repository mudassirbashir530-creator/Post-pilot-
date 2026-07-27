import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits IV recommended for GCM

function getEncryptionKey() {
  const keyStr = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Fallback 32-char key for dev
  return Buffer.from(keyStr.padEnd(32, '0').substring(0, 32), 'utf8');
}

/**
 * Encrypts cleartext string using AES-256-GCM
 * @param {string} text 
 * @returns {string} ivHex:authTagHex:encryptedHex
 */
export function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts encrypted string format ivHex:authTagHex:encryptedHex
 * @param {string} encryptedText 
 * @returns {string} cleartext
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Fallback for unencrypted legacy tokens if any in dev
      return encryptedText;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt access token');
  }
}
