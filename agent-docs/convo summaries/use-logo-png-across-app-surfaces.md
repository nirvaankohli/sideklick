## What changed

- Replaced generic header icons with `assets/images/logo/logo.png` in the main app surfaces.
- Added the logo to:
  - home
  - active session overlay
  - onboarding
- Set the Electron `BrowserWindow` icon to the same PNG asset so native window surfaces use the real logo too.

## Files touched

- `src/home.html`
- `src/index.html`
- `src/onboarding.html`
- `src/styles.css`
- `src/main.js`

## Validation

- `node --check src/main.js`
