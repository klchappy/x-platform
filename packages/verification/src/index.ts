import bcrypt from 'bcryptjs';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

const KEY_PREFIX_LIVE = 'x_live_';
const KEY_PREFIX_SVC = 'x_svc_';

export function generateApiKey(): { raw: string; prefix: string } {
  const random = randomBytes(24).toString('hex');
  const raw = `${KEY_PREFIX_LIVE}${random}`;
  return { raw, prefix: raw.slice(0, 12) };
}

export function generateServiceKey(): { raw: string; prefix: string } {
  const random = randomBytes(24).toString('hex');
  const raw = `${KEY_PREFIX_SVC}${random}`;
  return { raw, prefix: raw.slice(0, 12) };
}

export async function hashApiKey(raw: string): Promise<string> {
  return bcrypt.hash(raw, 12);
}

export async function verifyApiKey(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

export function hmacSha256(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = hmacSha256(payload, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildSignatureV2(timestamp: number, payload: string, secret: string): string {
  const sig = hmacSha256(`${timestamp}.${payload}`, secret);
  return `t=${timestamp},v1=${sig}`;
}

export function parseSignatureV2(header: string): { timestamp: number; signature: string } | null {
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return null;
  return { timestamp: Number(parts.t), signature: parts.v1 };
}

export function verifySignatureV2(header: string, payload: string, secret: string, toleranceSec = 300): boolean {
  const parsed = parseSignatureV2(header);
  if (!parsed) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > toleranceSec) return false;
  const expected = hmacSha256(`${parsed.timestamp}.${payload}`, secret);
  return verifyHmac(`${parsed.timestamp}.${payload}`, expected, secret);
}
