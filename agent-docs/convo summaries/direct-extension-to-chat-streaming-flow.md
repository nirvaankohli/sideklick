## Summary

Reworked the Chrome extension and Electron chat flow to remove the Request Inbox and execute extension actions directly. The extension now sends structured action payloads to the local Electron bridge, the main process opens or focuses the chat window and forwards the action immediately, and the chat renderer runs the assist request directly, shows a small waiting animation, and streams the final response into the message bubble after the backend returns.

## How To Run

1. Start the app from the repo root:

```powershell
npm start
```

2. Reload the Chrome extension:

```text
chrome://extensions
Reload the unpacked extension
```

3. Use the extension on a page:

- Select text and choose a SideClick action
- Or right-click blank space for page actions
- Or click the extension icon to just open the chat window

4. Verification commands:

```powershell
npm run check
node -e "require('./tests/renderer.incoming-payload.test.js')"
```
