## Summary

Updated the chat feedback controls from text buttons to thumbs up and thumbs down buttons. Also fixed a likely cause of generic `Local API request failed for /api/assist` errors by increasing the backend JSON body limit to handle screenshot-sized requests and improving Electron-side error propagation so raw backend error text is surfaced when JSON parsing fails.

## How To Run

1. Start the app:

```powershell
npm start
```

2. Trigger an assist request from the chat or Chrome extension.

3. If the backend fails, the chat should now show a more specific error instead of only:

```text
Local API request failed for /api/assist
```

4. Verification:

```powershell
npm run check
node -e "require('./tests/renderer.incoming-payload.test.js')"
```
