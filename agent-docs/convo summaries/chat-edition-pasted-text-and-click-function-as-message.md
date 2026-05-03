# Chat edition pasted text and click function as message

## Summary
Updated incoming payload chat rendering to match chat-edit behavior:

- `text` is displayed as a pasted-style card (compact code-like block with `PASTED` badge).
- `click_function` is displayed as the assistant chat message text.
- Click behavior still executes using the same existing mapping.

## How to run
1. Start app:

npm run dev

2. Send payload:

Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"const root = document.querySelector('' .window-shell'');","click_function":"restore-window"}'

3. Verify:
- First new message appears as pasted card for `text`.
- Next assistant message is exactly `restore-window`.
- `restore-window` action still executes.

4. Run test:

npm test
