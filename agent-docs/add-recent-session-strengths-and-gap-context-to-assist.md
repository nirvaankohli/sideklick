## What changed

- Expanded assist context so each new request now includes richer recent-session information from the same class.
- Added explicit `knownStrengths` in student memory based on recently covered session topics.
- Added more detailed `recentSessions` records with request count and a `detailedContext` string that includes summary, covered topics, carry-forward, and timing.
- Updated the model instructions so “connect to what I know” prefers recent strengths and covered topics, while still using saved gaps separately.

## Files touched

- `src/main/server/services/context.ts`
- `src/main/server/services/openai.ts`
- `src/main/server/schema/index.ts`
- `src/main/server/type/domain.ts`

## Validation

- `npx tsc --noEmit src/main/server/services/context.ts src/main/server/services/openai.ts src/main/server/schema/index.ts src/main/server/type/domain.ts`
