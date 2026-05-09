# Codebase Analysis

## Request Summary

Analyze this codebase and record the current understanding in `agent-docs/codebase.md` so it can be edited into a source of truth before generating a future `AGENTS.md`.

## What This Project Is

This repo is a local desktop study assistant called `SideClick`, built as an Electron app with:

- a renderer-driven desktop UI for onboarding, home, and chat
- a local Express API running inside the Electron main process
- a local SQLite database for classes, sessions, interactions, and gap memory
- a Chrome extension that sends context-menu actions into the desktop app over `http://localhost:4353`

The project is not split into separate deployable services. The desktop app is the product shell and the backend lives inside it.

## High-Level Architecture

### 1. Electron main process

Main entry: `src/main.js`

Responsibilities:

- starts the local backend on `127.0.0.1:3001`
- starts a separate localhost inbox server on `localhost:4353` for extension messages
- creates and manages app windows
- stores lightweight user preferences in `preferences.json` under Electron user data
- proxies renderer IPC calls to the local backend
- owns session lifecycle start/stop
- optionally captures screenshots before assist requests

Important detail:

- the TypeScript backend is loaded at runtime from Electron using `require("tsx/cjs")`
- there is no build step that compiles the backend first

### 2. Renderer windows

The app has 3 window surfaces:

- `src/onboarding.html` + `src/onboarding.js`
  First-run setup for theme, discovery source, and customer profile.
- `src/home.html` + `src/home.js`
  Class explorer, session history, and quiz generation UI.
- `src/index.html` + `src/renderer.js`
  Chat/assistant window for active study sessions.

All windows use one shared stylesheet: `src/styles.css`.

### 3. Preload bridge

Preload entry: `src/preload.js`

This exposes `window.overlayApi`, which is the renderer’s contract with the main process. The renderer does not call the Express API directly.

### 4. Local backend

Backend root: `src/main/server/`

Main files:

- `index.ts`: starts Express and registers routes
- `db/index.ts`: opens SQLite and performs lightweight schema migrations
- `schema/index.ts`: Zod validation for request/response/model-output shapes
- `services/*`: class/session/context/memory/OpenAI/quiz logic
- `routes/*`: thin HTTP route wrappers

### 5. Chrome extension

Extension folder: `extension/`

The extension:

- adds context menu items like `Explain this`, `Give me an example`, `What should I focus on?`
- captures the visible tab screenshot
- posts a JSON payload to `http://localhost:4353`
- can also restore/open the SideClick chat window via `click_function: "restore-window"`

## Runtime Flow

### App startup

1. `npm start` launches Electron from `src/main.js`.
2. Electron starts the local Express backend at `127.0.0.1:3001`.
3. Electron starts a local inbox server at `localhost:4353`.
4. Preferences are read from the Electron user-data directory.
5. If first launch, onboarding opens. Otherwise the home window opens.

### Assist request flow

There are two main ways an assist request starts:

- user types into the chat window
- browser extension sends a payload into the local inbox

Flow:

1. Renderer receives or creates an assist payload.
2. Renderer calls `window.overlayApi.assist(...)`.
3. Main process optionally captures a screenshot if the action is non-chat and no screenshot was already provided.
4. Main process POSTs to `POST /api/assist` on the local backend.
5. Backend validates input with Zod.
6. Backend builds contextual memory from class/session/gaps/interactions.
7. Backend calls OpenAI with structured output parsing.
8. Backend normalizes the model output.
9. Backend persists the interaction and any returned gap candidates.
10. Renderer shows the answer, stores `interactionId`, and exposes thumb feedback buttons.

### Session flow

1. Home window creates a class or picks an existing class.
2. User starts a session from inside a class folder.
3. Main process ensures the class exists in SQLite and creates a `sessions` row.
4. Chat window becomes the active study surface.
5. Assist requests during the session accumulate interaction history.
6. On stop, the session is summarized heuristically from past interactions and saved back into preferences/home explorer state.

### Quiz flow

1. Home window opens the quiz modal inside a class.
2. User can select saved sessions and/or pasted/uploaded study material.
3. Renderer calls `window.overlayApi.generateQuiz(...)`.
4. Backend validates the request, pulls selected sessions and top gaps, and asks OpenAI for structured quiz JSON.
5. Renderer grades the quiz locally and can save it back into the class explorer as a `quiz` item.

## Data Model

SQLite file:

- `big-red-hacks.sqlite` in the repo root

Tables from `src/main/server/db/index.ts`:

- `classes`
  Stores long-lived class profile data.
- `sessions`
  Stores study sessions, summaries, key topics, carry-forward, screenshot preview, and request count.
- `interactions`
  Stores prompts, responses, request/response payload snapshots, and built context.
- `gaps`
  Stores recurring weak spots per class with heuristic weight/evidence.
- `gap_events`
  Stores evidence linking interactions to gaps.

Important storage split:

- SQLite stores durable study data
- Electron `preferences.json` stores UI preferences plus the `classFolders` tree and `currentSession`

That means the source of truth is mixed:

- database for study memory
- preferences file for explorer/home UI structure

## Context and Memory Logic

Main context builder: `src/main/server/services/context.ts`

It constructs a `BuiltContext` object from:

- class profile
- top active gaps
- recent interactions
- recent sessions
- a derived student memory summary
- request guidance about how much to trust current text vs prior memory

Gap ranking is heuristic, based on:

- gap weight
- recency
- keyword overlap with the current request

Session summaries are also heuristic, not model-generated:

- key topics are token-frequency based
- carry-forward is pulled from the most recent saved `nextStep`
- summary text is composed from templates

## OpenAI Usage

Assist model service: `src/main/server/services/openai.ts`

Quiz model service: `src/main/server/services/quiz.ts`

Environment variables:

- `OPENAI_API_KEY` is required
- `OPENAI_MODEL` is optional
- default model is `gpt-5-mini`

Important implementation detail:

- assist responses use `client.responses.parse(...)` with `zodTextFormat(...)`
- screenshot input is sent as `input_image` when available
- output is validated twice: once by SDK parsing and again locally with Zod

## Frontend Behavior

### Chat window

`src/renderer.js` handles:

- Markdown rendering for assistant messages
- simulated streaming into the chat bubble
- pasted image attachment support
- incoming extension payload handling
- action labels like `Explain this` or `Connect to what I know`
- thumbs up/down feedback submission

Notable behavior:

- extension payloads can trigger DOM clicks via `click_function`
- if no active session exists, chat refuses assist requests

### Home window

`src/home.js` handles:

- class folder creation
- session creation
- viewing saved session summaries
- quiz generation and grading
- saving generated quizzes into the folder tree

The home explorer is really a class-centric tree with only these item types:

- `class`
- `session`
- `quiz`

### Onboarding

`src/onboarding.js` is a lightweight first-run wizard for:

- theme preference
- discovery source
- student profile

These values are stored in preferences, not SQLite.

## HTTP and IPC Surface

Local backend routes:

- `POST /api/classes`
- `POST /api/assist`
- `POST /api/feedback`
- `POST /api/quiz`
- `GET /health`

Main-process inbox server:

- `POST http://localhost:4353`

Preload API includes:

- window actions
- theme/preferences APIs
- class folder persistence
- assist/feedback/quiz APIs
- session start/stop/get
- event subscriptions for theme, mode, session, folders, and incoming payloads

## Testing

Current automated tests are minimal.

Test file:

- `tests/renderer.incoming-payload.test.js`

It covers:

- incoming extension payload -> assist flow in the chat renderer
- manual chat submit rendering behavior

There are no backend tests, database tests, or integration tests for OpenAI calls.

## Seed and Demo Data

Script:

- `scripts/seed-fake-ap-csp-data.js`

This seeds:

- one AP CSP class
- multiple fake sessions/interactions
- example gaps/gap events
- matching Electron preferences state

It is intended for demo/dev setup.

## Current Coupling and Design Reality

The codebase is organized, but several responsibilities are still tightly coupled:

- `src/main.js` is large and owns window management, preferences, session orchestration, local API proxying, screenshot capture, and the extension inbox server
- the home explorer state lives in preferences while class/session truth also lives in SQLite
- the backend is embedded in the Electron runtime rather than treated as a standalone package

This is workable for a hackathon/local app, but it means state can drift unless both the DB and preferences are updated carefully.

## Important Things I Learned

- The product is a local-first Electron study assistant, not a web app.
- The real backend is inside Electron, exposed over localhost.
- The extension is not optional fluff; it is part of the primary input mechanism.
- Sessions matter operationally because assist requests are expected to happen inside an active class session.
- Memory is a mix of heuristic summarization and model-assisted gap detection.
- Quiz generation is model-backed, but quiz grading is fully local in the renderer.
- Renderer UIs do not speak directly to the DB or OpenAI; everything goes through preload -> main -> local API.
- There is no TypeScript compile/build pipeline for the backend at runtime; `tsx` loads `.ts` directly.
- The current test coverage is narrow and frontend-focused.

## Risks / Rough Edges

- The DB and `preferences.json` both carry overlapping session/class state.
- `src/main.js` is a main-process god file.
- OpenAI is a hard runtime dependency for assist and quiz generation.
- The extension README says Electron captures a screen screenshot before every assist request, but the code only auto-captures when the action is not `chat` and no screenshot already exists.
- `requirements.txt` is informational only; the project actually uses npm.
- The repo already contains many task logs in `agent-docs/`, which suggests local process/documentation is part of the workflow.

## How To Run

### Desktop app

1. Install Node dependencies:

```powershell
npm install
```

2. Create a repo-root `.env` file with at least:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini
```

3. Start the Electron app:

```powershell
npm start
```

### Checks and tests

Syntax check:

```powershell
npm run check
```

Tests:

```powershell
npm test
```

### Optional Chrome extension

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select `extension/`

The Electron app must already be running so the extension can POST to `http://localhost:4353`.

### Optional demo data

Run the seed script through Electron so it can write both the SQLite DB and Electron preferences:

```powershell
npx electron .\scripts\seed-fake-ap-csp-data.js
```

Note: I have not executed the app or tests during this analysis. This document reflects static inspection of the current codebase.
