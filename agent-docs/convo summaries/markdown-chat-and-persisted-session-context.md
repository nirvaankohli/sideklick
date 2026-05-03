## Summary

Added Markdown rendering support to the chat UI, tightened the model prompt to ask for clearer Markdown responses, and implemented real session persistence in SQLite. Starting a session now creates a `sessions` row and stores the generated `sessionId` in app state; stopping a session closes it with an `ended_at` timestamp. Session records are now folded into backend memory/context so recent sessions influence future responses.

## How To Run

1. Start the app:

```powershell
npm start
```

2. Start a class session from Home.

3. Ask a few questions in chat or from the extension.

4. Stop the session, then start another session in the same class.

Expected behavior:

- Assistant responses can use Markdown formatting in chat
- Responses should be more direct and clearer
- Session records are saved to SQLite
- Later requests can draw on prior session context

Verification:

```powershell
npm run check
node -e "require('./tests/renderer.incoming-payload.test.js')"
```
