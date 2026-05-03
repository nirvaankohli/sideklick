## Summary

Reviewed how the current backend builds model context and identified the main ways to improve response quality. The current context includes class profile data, top active gaps, recent interactions, and a compact summary, but it can be made much stronger by sending structured action intent, better page context, normalized concept memory, and higher-signal session summaries.

## How To Run

Inspect these files from the repo root:

```powershell
Get-Content src/main/server/services/context.ts
Get-Content src/main/server/services/openai.ts
Get-Content src/main/server/services/assist.ts
Get-Content src/main/server/schema/index.ts
```
