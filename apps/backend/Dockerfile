FROM node:22-bookworm-slim

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ curl wget && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/telemetry/package.json packages/telemetry/package.json
COPY packages/test-utils/package.json packages/test-utils/package.json

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["node", "--import", "tsx", "--eval", "import('./apps/backend/src/server.ts').then((mod) => { const api = mod.startServer ? mod : mod.default; return api.startServer({ host: process.env.HOST ?? '0.0.0.0', port: Number(process.env.PORT ?? 3001) }); })"]
