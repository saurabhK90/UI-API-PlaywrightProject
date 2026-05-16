/**
 * Base64 encoding for test credentials.
 * Prevents plaintext secrets appearing in logs and source files.
 * This is NOT cryptographic security — use a secrets manager for real protection.
 */
export class EncryptionUtils {
  static encode(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  static decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  static encodeCredentials(username: string, password: string): string {
    return EncryptionUtils.encode(`${username}:${password}`);
  }

  static decodeCredentials(encoded: string): { username: string; password: string } {
    const decoded = EncryptionUtils.decode(encoded);
    const separatorIndex = decoded.indexOf(':');
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  }
}
