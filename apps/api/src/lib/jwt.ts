import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SECRET = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET env required (min 32 chars)');
  }
  return s;
};

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const norm = (input + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(norm, 'base64');
}

export interface JwtClaims {
  sub: string; // user id
  email: string;
  org?: string | null;
  role?: string;
  iat: number;
  exp: number;
  jti?: string;
}

export function signJwt(claims: Omit<JwtClaims, 'iat' | 'exp' | 'jti'>, ttlSec = 60 * 60 * 24 * 30): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = {
    ...claims,
    iat: now,
    exp: now + ttlSec,
    jti: randomBytes(8).toString('hex'),
  };
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const sig = createHmac('sha256', SECRET()).update(`${h}.${p}`).digest();
  return `${h}.${p}.${b64url(sig)}`;
}

export function verifyJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = createHmac('sha256', SECRET()).update(`${h}.${p}`).digest();
  const actual = b64urlDecode(s);
  if (actual.length !== expected.length) return null;
  if (!timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(p).toString('utf8')) as JwtClaims;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
