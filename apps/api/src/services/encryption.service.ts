import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { config } from "../config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive a 256-bit encryption key from the BETTER_AUTH_SECRET.
 * Uses scrypt with a salt for key derivation.
 */
function deriveKey(salt: Buffer): Buffer {
  return scryptSync(config.BETTER_AUTH_SECRET, salt, 32);
}

/**
 * Encrypt a plaintext string (e.g., an API key).
 * Returns a base64 string containing: salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: salt(32) + iv(16) + tag(16) + ciphertext(variable)
  const packed = Buffer.concat([salt, iv, tag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string back to plaintext.
 */
export function decrypt(encryptedBase64: string): string {
  const packed = Buffer.from(encryptedBase64, "base64");

  const salt = packed.subarray(0, SALT_LENGTH);
  const iv = packed.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = packed.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const ciphertext = packed.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Mask an API key for display: show first 8 and last 4 chars.
 * e.g., "sk-ant-abc123...xyz9"
 */
export function maskKey(key: string): string {
  if (key.length <= 16) return key.slice(0, 4) + "..." + key.slice(-2);
  return key.slice(0, 8) + "..." + key.slice(-4);
}
