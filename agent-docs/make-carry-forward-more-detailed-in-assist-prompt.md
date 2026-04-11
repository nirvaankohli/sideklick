## What changed

- Updated the assist system prompt so `next_step` is treated as a detailed carry-forward item instead of a vague reminder.
- The model is now told to include:
  - the topic or skill
  - the concrete action to take
  - the goal of that action

## Files touched

- `src/main/server/services/openai.ts`

## Validation

- `npx tsc --noEmit src/main/server/services/openai.ts`
