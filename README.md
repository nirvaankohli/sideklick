# SideKlick

SideKlick is organized as a pnpm workspace monorepo.

## Structure

```text
sideklick/
  apps/
    desktop/
      package.json
      src/
      assets/
    backend/
      package.json
      src/
      migrations/
    extension/
      package.json
      manifest.json
      background.js
      icons/
    web/
      package.json
      src/
  packages/
    contracts/
    api-client/
    domain/
    telemetry/
    config/
    test-utils/
  tests/
  scripts/
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  tsconfig.base.json
```

`apps/web` is currently a placeholder workspace.

## Root Commands

```bash
pnpm install
pnpm dev
pnpm dev:desktop:local-backend
pnpm env:split
pnpm start
pnpm test
pnpm check
pnpm desktop:build
pnpm desktop:pack
pnpm desktop:dist
```

## Environment Files

- Desktop development runtime settings: `.env.desktop` (copy from `.env.desktop.example`)
- Backend development runtime settings: `.env.backend` (copy from `.env.backend.example`)
- Temporary compatibility fallback remains `.env` when a split env file is absent.
- You can auto-populate split env files from your current `.env` with `pnpm env:split`.
- `pnpm dev:desktop:local-backend` forces desktop dev into local-backend mode by setting `SIDEKLICK_FORCE_LOCAL_BACKEND=true` and clearing managed backend env vars.

## Desktop Commands

```bash
pnpm desktop:dev
pnpm desktop:start
```

## Backend Commands

```bash
pnpm backend:dev
pnpm backend:start
```

## Extension Commands

```bash
pnpm extension:dev
pnpm extension:build
```

Then load `apps/extension/` as an unpacked extension in the browser.
