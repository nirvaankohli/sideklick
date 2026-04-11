# Listen on localhost 4353 for text and click_function

## Summary
Added an HTTP listener on `localhost:4353` in the Electron main process. It accepts `POST` JSON payloads with:

- `text`: string
- `click_function`: string

The payload is forwarded to the renderer through IPC (`incoming:payload`).

Renderer behavior:
- If `text` is present, it appends the message to chat.
- If `click_function` is present, it triggers the matching UI action (known button IDs or known action names).

## How to run
1. Start the app normally (existing project run command).
2. Send a POST request to localhost 4353 with JSON body.

Example PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"Hello from extension","click_function":"restore-window"}'
```

Expected result:
- Chat shows `Hello from extension`.
- The `restore-window` click action runs.
