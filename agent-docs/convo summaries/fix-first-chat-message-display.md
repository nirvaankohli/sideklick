## Summary

Fixed the first-message chat display glitch where manual chat submissions showed the action label `Ask SideClick` instead of the actual typed message. Manual chat requests now render the user's real text directly with normal spacing. Also cleaned the thumbs up/down feedback buttons so they render reliably using safe Unicode escape sequences instead of corrupted encoded characters.

## How To Run

1. Start the app:

```powershell
npm start
```

2. Start a session and send a normal chat message by typing in the chat box.

Expected behavior:

- The user bubble shows the actual typed message
- It does not show `Ask SideClick`
- Spacing is normal
- Feedback buttons render as thumbs up and thumbs down

Verification:

```powershell
npm run check
node -e "require('./tests/renderer.incoming-payload.test.js')"
```
