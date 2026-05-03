# How to test the chat UI

## Summary
This guide explains how to test the chat UI manually in the running Electron app and with the automated Node test.

## How to run
1. Start the app:

npm run dev

2. In a second terminal, send an incoming payload to localhost 4353:

Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"Hello from payload","click_function":"restore-window"}'

3. Verify UI behavior:
- Chat shows a quoted incoming message.
- Chat shows only the click function name.
- The mapped click action executes.

4. Run the automated test:

npm test

5. Optional: run only the incoming payload test:

node --test tests/renderer.incoming-payload.test.js
