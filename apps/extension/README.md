# SideKlick Chrome Extension

This extension sends SideKlick context-menu actions to the desktop app via **Chrome Native Messaging**.

Security model:
- Extension -> Native host uses Chrome's native messaging channel.
- Native host -> SideKlick app uses a local IPC socket (`~/.sideklick/native-bridge.sock` on macOS/Linux).
- No localhost HTTP bridge secrets are required in the extension.

## Load In Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this `apps/extension/` folder
5. Copy the extension ID shown on the card

## Register Native Host

Run from repo root:

```bash
node scripts/install-native-host.js <extension_id>
```

For Chromium instead of Chrome:

```bash
node scripts/install-native-host.js <extension_id> chromium
```

Then restart Chrome.

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

## Troubleshooting

- `Specified native messaging host not found.`
  - Re-run `node scripts/install-native-host.js <extension_id>` and restart Chrome.
- `Access to the specified native messaging host is forbidden.`
  - Extension ID in Chrome does not match the one in the installed native host manifest.
- `Failed to reach desktop app`
  - Start SideKlick desktop app so it opens the native IPC socket.
