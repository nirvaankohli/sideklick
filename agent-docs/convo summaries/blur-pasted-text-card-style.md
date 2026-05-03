# Blur pasted text card style

## Summary
Adjusted pasted text UI styling to look smoother with subtle blur.

- Added glass-like backdrop blur on the pasted message card.
- Added a very slight text blur/softening for pasted code text.
- Kept readability and existing behavior unchanged.

## How to run
1. Start app:

npm run dev

2. Send payload:

Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"const root = document.querySelector(''.window-shell'');","click_function":"restore-window"}'

3. Verify:
- Pasted card has a subtle blurred glass look.
- Pasted text is slightly softened.
- Behavior remains unchanged.
