# SideKlick

SideKlick is organized as a Bun workspace monorepo.

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
  bun.lock
  tsconfig.base.json
```

`apps/web` is currently a placeholder workspace.

## Root Commands

```bash
bun install
bun run dev
bun run start
bun run test
bun run check
```

## Desktop Commands

```bash
bun run desktop:dev
bun run desktop:start
```

## Backend Commands

```bash
bun run backend:dev
bun run backend:start
```

## Extension Commands

```bash
bun run extension:dev
```

Then load `apps/extension/` as an unpacked extension in the browser.
