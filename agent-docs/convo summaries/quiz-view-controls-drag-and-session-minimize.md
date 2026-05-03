## What changed

- Added top window controls to the quiz modal header so the quiz view still has theme toggle, minimize, and close access at the top.
- Made the quiz header a drag region so the window can be dragged from the quiz modal.
- Changed the quiz layout so questions use the full width until `Explain Answer` is opened, then the explanation panel appears beside them.
- Minimized the home window right after starting a session.

## Files touched

- `src/home.html`
- `src/home.js`
- `src/styles.css`

## Validation

- `node --check src/home.js`
