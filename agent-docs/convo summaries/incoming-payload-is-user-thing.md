# Incoming payload is user thing

## Summary
Adjusted incoming payload rendering so it is treated as user-side chat content.

- Pasted payload card now renders as a user message bubble.
- `click_function` value is added as a user chat message.
- Existing click-function behavior execution remains unchanged.

## How to run
1. Start app:

npm run dev

2. Send payload:

Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"const root = document.querySelector(''.window-shell'');","click_function":"restore-window"}'

3. Verify:
- Pasted card appears on the user side.
- `restore-window` appears as user chat message text.
- Action still executes.

4. Run test:

npm test
