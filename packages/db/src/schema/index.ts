export * from './orgs';
export * from './users';
export * from './modules';
export * from './audit';
export * from './integrations';
export * from './notifications';
export * from './api-keys';
export * from './plans';
export * from './invitations';
export * from './departments';
export * from './idempotency';
export * from './webhooks';
export * from './magic-links';

// Damga full port (pgSchema('damga') namespace)
export * from './damga/enums';
export * from './damga/locations';
export * from './damga/attendance';
export * from './damga/leaves';
export * from './damga/shifts';
export * from './damga/gamification';

// Stub modules (gradually being replaced by full ports above)
export * from './modules-lokma';
export * from './modules-santral';
export * from './modules-ticaret';
export * from './modules-sayman';
export * from './modules-etik';
export * from './modules-envanter';
