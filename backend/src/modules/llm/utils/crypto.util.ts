import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'insighthub-llm-key-salt'; // Salt fixo para derivar chave consistente

/**
 * Deriva uma chave de 32 bytes a partir do JWT_SECRET usando scrypt.
 */
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32);
}

/**
 * Encripta uma string usando AES-256-GCM.
 * Retorna: iv:authTag:ciphertext (tudo em hex, separado por ':')
 */
export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decripta uma string encriptada com AES-256-GCM.
 * Espera o formato: iv:authTag:ciphertext
 */
export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, authTagHex, ciphertext] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Formato de texto encriptado inválido');
  }

  const key = deriveKey(secret);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
