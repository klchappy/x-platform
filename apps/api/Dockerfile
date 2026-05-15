# =====================================================
# X Platform API — production image
# Build context: monorepo root
# =====================================================

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

# ---- 1) deps ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/verification/package.json ./packages/verification/
COPY packages/ai/package.json ./packages/ai/
COPY packages/module-api/package.json ./packages/module-api/
COPY modules/damga/package.json ./modules/damga/
COPY modules/santral/package.json ./modules/santral/
COPY modules/sayman/package.json ./modules/sayman/
COPY modules/etik/package.json ./modules/etik/
COPY modules/envanter/package.json ./modules/envanter/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @x/api... --filter "@x/mod-*"

# ---- 2) runtime ----
FROM base AS runtime
RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/verification/node_modules ./packages/verification/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/module-api/node_modules ./packages/module-api/node_modules
COPY --from=deps /app/modules/damga/node_modules ./modules/damga/node_modules
COPY --from=deps /app/modules/santral/node_modules ./modules/santral/node_modules
COPY --from=deps /app/modules/sayman/node_modules ./modules/sayman/node_modules
COPY --from=deps /app/modules/etik/node_modules ./modules/etik/node_modules
COPY --from=deps /app/modules/envanter/node_modules ./modules/envanter/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY packages ./packages
COPY modules ./modules
COPY apps/api ./apps/api

EXPOSE 4250

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:4250/health >/dev/null || exit 1

# Entrypoint: migrate + seed (idempotent) + start API
CMD ["sh", "-c", "pnpm --filter @x/db exec tsx src/migrate.ts && pnpm --filter @x/db exec tsx src/seed.ts && pnpm --filter @x/api exec tsx src/index.ts"]
