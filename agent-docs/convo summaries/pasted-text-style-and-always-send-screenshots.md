## Summary

Updated the direct extension-to-chat flow so selected-text actions now render as two user-side elements in the chat: the action label as a normal user bubble and the selected text as the earlier pasted-text card style. Also changed screenshot handling so every assist request includes a screenshot: the Chrome extension captures the visible tab for browser-triggered actions, and Electron captures a screen screenshot before every backend assist call, falling back to any provided screenshot if capture fails.

## How To Run

1. Start the app:

```powershell
npm start
```

2. Reload the unpacked extension in Chrome.

3. Start a class session in the app.

4. Use `Explain this` on selected text.

Expected behavior:

- A normal user bubble shows the action label
- A pasted-style card shows the selected text
- The assistant shows a waiting animation
- The assistant response streams into the chat bubble
- A screenshot is attached to the assist request

Verification:

```powershell
npm run check
node -e "require('./tests/renderer.incoming-payload.test.js')"
```
