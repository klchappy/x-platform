import { createHash, createHmac } from 'node:crypto';

/**
 * SHA-256 hex digest.
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Hash chain: previous_event_hash + canonical event body → this_event_hash.
 * Append-only guarantee — eğer bir event sonradan değiştirilirse, sonraki
 * tüm hash'ler doğrulamada uyumsuz olur.
 */
export function computeChainHash(input: {
  previousHash: string | null;
  orgId: string;
  userId: string;
  type: string;
  effectiveTime: string;
  evidenceHash: string;
}): string {
  const canonical = JSON.stringify({
    prev: input.previousHash ?? '',
    org: input.orgId,
    user: input.userId,
    type: input.type,
    t: input.effectiveTime,
    evid: input.evidenceHash,
  });
  return sha256Hex(canonical);
}

/**
 * evidence_hash: tüm doğrulama input'larının SHA-256'sı.
 */
export function computeEvidenceHash(payload: {
  client_time: string;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy_m?: number | null;
  nfc_tag_id?: string | null;
  qr_code_payload?: string | null;
  wifi_bssid?: string | null;
  device_id?: string | null;
  user_agent?: string | null;
}): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return sha256Hex(canonical);
}

/**
 * Haversine — iki nokta arası kuşbakışı mesafe (metre).
 */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Trust score: 0-100. Doğrulama yöntemlerinin ağırlıklı toplamı.
 */
export function computeTrustScore(methods: string[]): number {
  const weights: Record<string, number> = {
    nfc: 35,
    qr: 25,
    gps_in_geofence: 25,
    wifi: 15,
    device_known: 10,
    time_window: 5,
  };
  let score = 0;
  for (const m of methods) score += weights[m] ?? 0;
  return Math.min(100, score);
}

export function verifyNfcSignature(payload: string, secret: string): boolean {
  // Damga NFC format: "v1|<tagId>|<ts>|<nonce>|<hmac>"
  const parts = payload.split('|');
  if (parts.length !== 5 || parts[0] !== 'v1') return false;
  const [, tagId, ts, nonce, providedSig] = parts;
  const body = `v1|${tagId}|${ts}|${nonce}`;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return expected === providedSig;
}

export function maskIp(ip?: string | null): string | null {
  if (!ip) return null;
  // IPv4 last 2 octets mask: 1.2.3.4 -> 1.2.x.x
  const m = ip.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (m) return `${m[1]}.${m[2]}.x.x`;
  return ip.length > 12 ? ip.slice(0, 12) + '…' : ip;
}
