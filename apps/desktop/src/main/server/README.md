# Local Backend

This folder contains the lightweight local backend that runs inside the Electron app.

## Current pieces

- `index.ts`
  Starts the Express server and registers API routes.
- `db/index.ts`
  Opens the local SQLite database and creates tables on first boot.
- `routes/classes.ts`
  `POST /api/classes` for creating or updating a class profile.
- `routes/assist.ts`
  `POST /api/assist` validates the request, builds context, calls OpenAI, validates the model output, stores memory updates, and returns the normalized app response.
- `routes/feedback.ts`
  `POST /api/feedback` applies simple helpful or not-helpful feedback to the gaps linked to an interaction.
- `services/classes.ts`
  Read/write helpers for class profile storage.
- `services/context.ts`
  `buildContext(classId, requestInput)` gathers model-ready context from saved data.
- `services/assist.ts`
  Orchestrates request validation, context building, model calling, and response normalization.
- `services/memory.ts`
  Stores successful interactions and updates long-term gap memory plus `gap_events`.
- `services/openai.ts`
  Sends the built context and current request to OpenAI and expects strict JSON back.
- `schema/index.ts`
  Zod validation for incoming requests and model output.
- `type/`
  Shared TypeScript types used by routes and services.

## Data flow so far

1. Electron main process calls `startServer()` during app startup.
2. Server startup initializes SQLite.
3. Client sends `POST /api/classes` to create or update a class profile.
4. `POST /api/assist` validates the request, calls `buildContext(...)`, sends that context to the model, validates the model response, normalizes it into the app response shape, then stores the interaction and gap memory updates.
5. `POST /api/feedback` slightly lowers or raises linked gap weights based on whether the answer helped.

## Main unfinished pieces

- Save session records.
- Add screenshot ingestion if the renderer eventually sends image-derived context.

## Notes for handoff

- `classId` can come from the explicit `buildContext(classId, requestInput)` argument or from `requestInput.classId`.
- `keyConcepts` is stored as JSON text in SQLite to keep the schema simple for now.
- Session goal currently comes from `sessions.title` first, then `sessions.notes`.
- Folder names are currently `schema` and `type` in the repo, even though the original plan mentioned plural names.
- `services/openai.ts` expects `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
- Put local backend secrets in `.env.backend` (or `.env` fallback). The file is ignored by git.
- Model output is validated in two stages: OpenAI structured parsing, then local Zod parsing again before normalization.
- Successful assist calls now write request payload, response payload, and built context into `interactions`.
- Gap memory is updated heuristically by topic match within a class, using `weight`, `evidence_count`, `last_seen_at`, and a new `gap_events` record for each returned model gap.
- `/api/assist` expects: `classId`, optional `sessionId`, `actionType`, `selectedText`, optional `surroundingText`, optional `pageTitle`, optional `pageUrl`, and optional `userNote`.
- `/api/assist` returns an `interactionId`, which the frontend should hold onto for later `/api/feedback` calls.
- `/api/feedback` expects: `interactionId` and `helped`.
- The Electron UI now reaches the backend through preload/main-process IPC helpers, which proxy requests to the local Express server.
