# SideKlick Chrome Extension

This Chrome extension sends SideKlick context-menu actions directly to the local Electron app bridge at `http://localhost:4353`.

The extension uses signed local requests instead of raw unauthenticated POSTs. Each request includes a per-request nonce, a short expiry, and an HMAC signature over the method, path, expiry, nonce, and JSON body. The desktop app now requires `SIDECLICK_BRIDGE_SECRET` or `BRIDGE_AUTH_SECRET` to be configured before the bridge starts. Keep both values the same in local development if you set both.

## Load In Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this `extension/` folder

## Available Actions

- `Open SideKlick`
- On selected text:
- `Explain this`
- `Connect to what I know`
- `Give me an example`
- `Flag as confusing`
- `I already know this`
- `Add to my notes`
- On blank space:
- `Summarize this page`
- `What should I focus on?`

Each action posts a structured local JSON payload like:

```json
{
  "action_type": "explain",
  "selected_text": "Selected text here",
  "page_title": "Current page",
  "page_url": "https://example.com",
  "screenshot_data_url": "data:image/png;base64,...",
  "click_function": "restore-window"
}
```

Headers sent with each request:

- `x-sideclick-nonce`
- `x-sideclick-expires`
- `x-sideclick-signature`

Signature input:

```text
POST
/
<expires>
<nonce>
<raw-json-body>
```

The desktop app restores the chat window, runs the assist request immediately, shows a waiting animation, and streams the response text into the chat bubble. Browser-triggered actions include a visible-tab screenshot, and Electron also captures a screen screenshot before every assist request.
