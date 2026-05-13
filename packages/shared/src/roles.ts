import { z } from 'zod';

export const PLATFORM_ROLES = ['platform_admin'] as const;
export const ORG_ROLES = ['owner', 'admin', 'manager', 'employee'] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type OrgRole = (typeof ORG_ROLES)[number];

export const OrgRoleSchema = z.enum(ORG_ROLES);

export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  employee: 1,
};

export function hasRole(actual: OrgRole, required: OrgRole): boolean {
  return ROLE_HIERARCHY[actual] >= ROLE_HIERARCHY[required];
}
