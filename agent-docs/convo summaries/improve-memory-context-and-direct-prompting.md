## Summary

Improved the backend memory context and prompting so the assistant can better reflect recurring student patterns and answer more directly. The context builder now includes a `studentMemory` block derived from recent interactions and active gaps, plus a stronger compact summary. The OpenAI system prompt now explicitly prioritizes answer-first, concise, specific responses and better use of saved memory.

## How To Run

1. Start the app:

```powershell
npm start
```

2. Use the app across several requests in the same class so interaction history and gaps accumulate.

3. Inspect the updated backend files if needed:

```powershell
Get-Content src\main\server\services\context.ts
Get-Content src\main\server\services\openai.ts
Get-Content src\main\server\schema\index.ts
Get-Content src\main\server\type\domain.ts
```

4. Verification:

```powershell
npm run check
```
