import { Router } from 'express';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@x/db/client';
import { schema } from '@x/db';
import { withTenant } from '@x/module-api';

const router = Router();
const { saymanCompanies, saymanPersons, saymanInstitutions, saymanBanks } = schema;

const CompanySchema = z.object({
  name: z.string().min(2),
  legal_name: z.string().optional(),
  tax_number: z.string().optional(),
  tax_office: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
});

const PersonSchema = z.object({
  full_name: z.string().min(2),
  national_id: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  family_group: z.string().optional(),
});

const InstitutionSchema = z.object({
  name: z.string().min(2),
  institution_type: z.string().optional(),
});

router.post('/companies', withTenant(async (req, res, _next, t) => {
  const data = CompanySchema.parse(req.body);
  const [row] = await getDb().insert(saymanCompanies).values({ org_id: t.orgId, created_by: t.userId, ...data, email: data.email || null }).returning();
  res.status(201).json(row);
}));
router.get('/companies', withTenant(async (_req, res, _next, t) => {
  const rows = await getDb().select().from(saymanCompanies).where(eq(saymanCompanies.org_id, t.orgId)).orderBy(desc(saymanCompanies.created_at)).limit(500);
  res.json(rows);
}));

router.post('/persons', withTenant(async (req, res, _next, t) => {
  const data = PersonSchema.parse(req.body);
  const [row] = await getDb().insert(saymanPersons).values({ org_id: t.orgId, created_by: t.userId, ...data, email: data.email || null }).returning();
  res.status(201).json(row);
}));
router.get('/persons', withTenant(async (_req, res, _next, t) => {
  const rows = await getDb().select().from(saymanPersons).where(eq(saymanPersons.org_id, t.orgId)).orderBy(desc(saymanPersons.created_at)).limit(500);
  res.json(rows);
}));

router.post('/institutions', withTenant(async (req, res, _next, t) => {
  const data = InstitutionSchema.parse(req.body);
  const [row] = await getDb().insert(saymanInstitutions).values({ org_id: t.orgId, ...data }).returning();
  res.status(201).json(row);
}));
router.get('/institutions', withTenant(async (_req, res, _next, t) => {
  const rows = await getDb().select().from(saymanInstitutions).where(eq(saymanInstitutions.org_id, t.orgId)).orderBy(desc(saymanInstitutions.created_at));
  res.json(rows);
}));

router.get('/banks', withTenant(async (_req, res, _next, t) => {
  const rows = await getDb().select().from(saymanBanks).where(eq(saymanBanks.org_id, t.orgId)).orderBy(saymanBanks.name);
  res.json(rows);
}));

export default router;
