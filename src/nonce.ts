import * as crypto from 'crypto';

/** Nonce только для CSP script-src (не секретность). */
export function getNonce(): string {
  return crypto.randomBytes(16).toString('base64url');
}
