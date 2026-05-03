# Test example

## Summary
Provided example commands to test incoming payload behavior for the chat UI.

## How to run
1. Start app:

npm run dev

2. Send test payload:

Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"const root = document.querySelector(''.window-shell'');","click_function":"restore-window"}'

3. Run automated test:

npm test
