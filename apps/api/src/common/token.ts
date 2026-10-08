import { createHash, randomBytes } from 'node:crypto';
import { SHARE_TOKEN_BYTES } from '@folio/shared';

/** Link tokens (share and invite): the URL carries the token, the DB stores only its hash. */
export function createToken(): { token: string; hash: string } {
  const token = randomBytes(SHARE_TOKEN_BYTES).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
