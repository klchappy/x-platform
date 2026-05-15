import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { httpError } from '@x/shared';
import { withTenant } from '@x/module-api';
import {
  computeChainHash,
  computeEvidenceHash,
  computeTrustScore,
  haversineMeters,
  maskIp,
  verifyNfcSignature,
} from '../lib/verification';

const router = Router();

const { damgaAttendanceEvents, damgaLocations } = schema;

const StampSchema = z.object({
  type: z.enum(['check_in', 'check_out']),
  client_time: z.string().datetime().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  gps_accuracy_m: z.number().int().optional(),
  location_id: z.string().uuid().optional(),
  nfc_payload: z.string().optional(),
  qr_code_payload: z.string().optional(),
  wifi_bssid: z.string().optional(),
  device_id: z.string().optional(),
  notes: z.string().max(500).optional(),
});

router.post(
  '/',
  withTenant(async (req, res, _next, t) => {
    const data = StampSchema.parse(req.body);
    const db = getDb();
    const nowIso = new Date().toISOString();
    const clientTime = data.client_time ?? nowIso;

    // Konum doğrulaması
    let location: typeof damgaLocations.$inferSelect | null = null;
    let distance: number | null = null;
    const methods: string[] = [];

    if (data.location_id) {
      location = (await db.query.damgaLocations.findFirst({
        where: (l, { and: a, eq: e }) => a(e(l.id, data.location_id!), e(l.org_id, t.orgId)),
      })) ?? null;
    }

    if (location && data.latitude !== undefined && data.longitude !== undefined) {
      distance = haversineMeters(location.latitude, location.longitude, data.latitude, data.longitude);
      if (distance <= location.geofence_radius_m) methods.push('gps_in_geofence');
    }

    // NFC doğrulama (NFC_SIGNING_SECRET env'inden)
    let nfcTagId: string | null = null;
    let nfcSignature: string | null = null;
    if (data.nfc_payload) {
      const secret = process.env.NFC_SIGNING_SECRET ?? process.env.SESSION_SECRET ?? '';
      if (secret && verifyNfcSignature(data.nfc_payload, secret)) {
        const parts = data.nfc_payload.split('|');
        nfcTagId = parts[1] ?? null;
        nfcSignature = parts[4] ?? null;
        methods.push('nfc');
      }
    }

    // QR doğrulama (basit: location qr_codes whitelist'inde mi)
    if (data.qr_code_payload && location?.qr_codes.includes(data.qr_code_payload)) {
      methods.push('qr');
    }

    if (data.wifi_bssid && location?.wifi_bssids.includes(data.wifi_bssid)) {
      methods.push('wifi');
    }

    if (data.device_id) methods.push('device_known'); // primitive; future: check user.device_ids

    // Zaman penceresi (work hours içinde mi)
    if (location) {
      const now = new Date();
      const hh = now.getUTCHours().toString().padStart(2, '0');
      const mm = now.getUTCMinutes().toString().padStart(2, '0');
      const nowStr = `${hh}:${mm}`;
      if (nowStr >= location.work_hours_start && nowStr <= location.work_hours_end) {
        methods.push('time_window');
      }
    }

    const trustScore = computeTrustScore(methods);
    const reviewStatus =
      trustScore < 60 ? 'rejected' : trustScore < 80 ? 'pending_review' : 'approved';

    const evidenceHash = computeEvidenceHash({
      client_time: clientTime,
      latitude: data.latitude,
      longitude: data.longitude,
      gps_accuracy_m: data.gps_accuracy_m,
      nfc_tag_id: nfcTagId,
      qr_code_payload: data.qr_code_payload,
      wifi_bssid: data.wifi_bssid,
      device_id: data.device_id,
      user_agent: req.headers['user-agent'] ?? null,
    });

    // Önceki event'in hash'i (aynı org için)
    const previousEvent = await db
      .select({ this_event_hash: damgaAttendanceEvents.this_event_hash })
      .from(damgaAttendanceEvents)
      .where(eq(damgaAttendanceEvents.org_id, t.orgId))
      .orderBy(desc(damgaAttendanceEvents.server_time))
      .limit(1);
    const previousHash = previousEvent[0]?.this_event_hash ?? null;

    const thisHash = computeChainHash({
      previousHash,
      orgId: t.orgId,
      userId: t.userId,
      type: data.type,
      effectiveTime: clientTime,
      evidenceHash,
    });

    const reviewReasons: string[] = [];
    if (data.latitude === undefined) reviewReasons.push('no_gps');
    if (distance !== null && location && distance > location.geofence_radius_m)
      reviewReasons.push('out_of_geofence');
    if (data.gps_accuracy_m !== undefined && data.gps_accuracy_m > 100) reviewReasons.push('low_gps_accuracy');
    if (!data.wifi_bssid) reviewReasons.push('no_wifi');
    if (!data.device_id) reviewReasons.push('unknown_device');

    const [event] = await db
      .insert(damgaAttendanceEvents)
      .values({
        org_id: t.orgId,
        user_id: t.userId,
        type: data.type,
        client_time: new Date(clientTime),
        effective_time: new Date(clientTime),
        timezone_at_time: 'Europe/Istanbul',
        latitude: data.latitude,
        longitude: data.longitude,
        gps_accuracy_m: data.gps_accuracy_m,
        location_id: data.location_id,
        distance_from_office_m: distance,
        nfc_tag_id: nfcTagId,
        nfc_signature: nfcSignature,
        qr_code_payload: data.qr_code_payload,
        wifi_bssid: data.wifi_bssid,
        device_id: data.device_id,
        ip_address: maskIp(req.ip),
        user_agent: req.headers['user-agent'] ?? null,
        verification_methods: methods,
        verification_score: trustScore,
        evidence_hash: evidenceHash,
        previous_event_hash: previousHash,
        this_event_hash: thisHash,
        review_status: reviewStatus,
        review_reasons: reviewReasons,
        flags: trustScore < 60 ? ['low_trust'] : [],
      })
      .returning();

    res.status(201).json({
      ...event,
      meta: {
        verification_methods: methods,
        review_required: reviewStatus !== 'approved',
        review_reasons: reviewReasons,
      },
    });
  }),
);

router.get(
  '/',
  withTenant(async (req, res, _next, t) => {
    const isManager = ['owner', 'admin', 'manager'].includes(t.role);
    const limit = Math.min(500, Number(req.query.limit ?? 50));
    const filterUserId = typeof req.query.userId === 'string' ? req.query.userId : null;
    const targetUserId = isManager && filterUserId ? filterUserId : t.userId;
    const where =
      isManager && !filterUserId
        ? eq(damgaAttendanceEvents.org_id, t.orgId)
        : and(eq(damgaAttendanceEvents.org_id, t.orgId), eq(damgaAttendanceEvents.user_id, targetUserId));
    const rows = await getDb()
      .select()
      .from(damgaAttendanceEvents)
      .where(where)
      .orderBy(desc(damgaAttendanceEvents.server_time))
      .limit(limit);
    res.json(rows);
  }),
);

router.get(
  '/verify-chain',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const rows = await db
      .select({
        id: damgaAttendanceEvents.id,
        previous_event_hash: damgaAttendanceEvents.previous_event_hash,
        this_event_hash: damgaAttendanceEvents.this_event_hash,
        user_id: damgaAttendanceEvents.user_id,
        type: damgaAttendanceEvents.type,
        effective_time: damgaAttendanceEvents.effective_time,
        evidence_hash: damgaAttendanceEvents.evidence_hash,
      })
      .from(damgaAttendanceEvents)
      .where(eq(damgaAttendanceEvents.org_id, t.orgId))
      .orderBy(damgaAttendanceEvents.server_time);

    let prev: string | null = null;
    const broken: string[] = [];
    for (const r of rows) {
      const expected = computeChainHash({
        previousHash: prev,
        orgId: t.orgId,
        userId: r.user_id,
        type: r.type,
        effectiveTime: r.effective_time.toISOString(),
        evidenceHash: r.evidence_hash,
      });
      if (expected !== r.this_event_hash) broken.push(r.id);
      prev = r.this_event_hash;
    }
    res.json({
      total: rows.length,
      brokenLinks: broken,
      ok: broken.length === 0,
    });
  }),
);

router.get(
  '/stats',
  withTenant(async (_req, res, _next, t) => {
    const db = getDb();
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(damgaAttendanceEvents)
      .where(eq(damgaAttendanceEvents.org_id, t.orgId));
    const [pending] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(damgaAttendanceEvents)
      .where(and(eq(damgaAttendanceEvents.org_id, t.orgId), eq(damgaAttendanceEvents.review_status, 'pending_review')));
    res.json({
      totalEvents: total?.count ?? 0,
      pendingReview: pending?.count ?? 0,
    });
  }),
);

export default router;
