
<p align="center">
  <img src="apps/web/assets/logo.png" alt="SideKlick logo" width="96" />
</p>

<p align="center">
  <strong>An AI study sidekick for desktop, web, and browser workflows.</strong>
</p>

<p align="center">
  SideKlick is a pnpm workspace monorepo that ships a desktop app, a local backend, a web app, and a browser extension that sends page context into the SideKlick experience.
</p>

<p align="center">
  <a href="https://github.com/nirvaankohli/sideklick/releases">
    <img src="https://img.shields.io/github/downloads/nirvaankohli/sideklick/total?label=downloads" alt="GitHub downloads" />
  </a>
  <a href="https://github.com/nirvaankohli/sideklick/releases/latest">
    <img src="https://img.shields.io/github/v/release/nirvaankohli/sideklick?display_name=release&sort=semver" alt="Latest release" />
  </a>
  <img src="https://img.shields.io/badge/Desktop-Electron-47848F" alt="Electron desktop app" />
  <img src="https://img.shields.io/badge/Web-React%20%2B%20Vite-61DAFB" alt="React and Vite web app" />
  <img src="https://img.shields.io/badge/Extension-Chrome%20%2B%20Native%20Messaging-4285F4" alt="Browser extension" />
  <img src="https://img.shields.io/badge/Backend-Express%20%2B%20SQLite-2F80ED" alt="Express and SQLite backend" />
</p>

<p align="center">

<img width="882" height="674" alt="assist-panel" src="https://github.com/user-attachments/assets/8d7ecbff-137c-4533-92c1-1aabfb9e4834" />
</p>


## Why SideKlick

Most study tools make you bounce between tabs. SideKlick keeps the source, the question, and the review step together so you can stay on task.

It lets you ask for help without losing your place, and turns that context into quizzes, cram plans, and follow-up answers.

You don't have to sacrifice your current workflow to use it. SideKlick fits into how you already study and makes the process faster instead of adding extra steps.

What users get:

- Assessment formats tailored to how your teacher actually makes assessments
- Quizzes generated from your current class material instead of generic summaries
- Cram plans that turn weak spots into a focused review session
- Browser context sent directly into SideKlick so you do not have to copy everything by hand
- A desktop workspace that keeps the full study flow in one place

## What It Does

- Captures live study context from the active session or browser
- Generates quizzes from your class material and review goals
- Produces cram plans for focused study sessions
- Keeps notes, prompts, and study output close to the session
- Bridges browser context into SideKlick so your source material stays connected
- Helps you study in a way that matches how you are actually being tested

## Features

- As you work through class material, SideKlick sits on the side, knows what you understand and what you do not, and helps you get through the hard parts.
- Quiz mode for turning study material into practice questions fast
- Cram mode for short, focused review before a test
- Assessment profiles that shape quizzes to how your teacher actually tests you
- Folder-style organization for classes, materials, and study output
- A fresh take on edtech that feels structured, efficient, and easy to keep using

## Repository Layout

```text
sideklick/
├── apps/
│   ├── desktop/      # Electron app: main process, renderer, onboarding, home UI
│   ├── backend/      # Local Express backend and SQLite data layer
│   ├── extension/    # Browser extension that bridges page context to SideKlick
│   └── web/          # Public site, download pages, and marketing UI
├── packages/
│   ├── contracts/    # Shared request and response contracts
│   ├── api-client/   # API client helpers
│   ├── domain/       # Shared domain models and logic
│   ├── telemetry/    # Telemetry utilities
│   ├── config/       # Shared config helpers
│   └── test-utils/   # Shared test helpers
├── scripts/          # Workspace scripts and release helpers
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

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

- Desktop runtime settings: `.env.desktop` copied from `.env.desktop.example`
- Backend runtime settings: `.env.backend` copied from `.env.backend.example`
- Legacy fallback: `.env` when split files are not present
- `pnpm env:split` can populate split env files from an existing `.env`
- `pnpm dev:desktop:local-backend` forces desktop dev into local-backend mode by setting `SIDEKLICK_FORCE_LOCAL_BACKEND=true` and clearing managed backend env vars

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

Load `apps/extension/` as an unpacked extension in the browser.

## Tech Stack

- Electron for the desktop app shell
- Express for the backend service
- SQLite for local persistence
- React and Vite for the web app
- TypeScript across shared packages and most app code
- pnpm workspaces for package orchestration

## Notes

- `apps/web` is the public-facing site and download surface.
- The desktop app is the primary product surface, but the project is not desktop-only.
- The browser extension is optional and exists to improve capture and handoff from the browser into SideKlick.
