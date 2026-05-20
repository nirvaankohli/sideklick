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
pnpm start
pnpm test
pnpm check
```

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
