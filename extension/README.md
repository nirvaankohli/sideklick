# SideClick Chrome Extension

This Chrome extension sends SideClick context-menu actions directly to the local Electron app bridge at `http://localhost:4353`.

## Load In Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this `extension/` folder

## Available Actions

- `Open SideClick`
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

The desktop app restores the chat window, runs the assist request immediately, shows a waiting animation, and streams the response text into the chat bubble. Browser-triggered actions include a visible-tab screenshot, and Electron also captures a screen screenshot before every assist request.
