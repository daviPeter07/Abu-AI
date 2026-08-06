# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.19.0-alpine3.23@sha256:244cc2b53f46f9e876304391d17682b0ddae9ac33491f4857e25e35a36ba7995

FROM node:${NODE_VERSION} AS base

ARG PNPM_VERSION=10.26.1

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM dependencies AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN pnpm build

FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --store-dir=/pnpm/store

FROM node:${NODE_VERSION} AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node docker/healthcheck.mjs ./docker/healthcheck.mjs
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "docker/healthcheck.mjs"]

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "dist/main.js"]
