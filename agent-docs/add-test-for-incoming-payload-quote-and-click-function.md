# Add test for incoming payload quote and click function

## Summary
Added an automated test for incoming payload behavior in the overlay renderer.

The test verifies:
- Incoming `text` is rendered as a quoted message.
- Incoming `click_function` is displayed as only the function name.
- `click_function` still triggers the mapped UI behavior (`restore-window` -> `expandWindow`).

## How to run
1. Install dependencies (already done in this update):

```powershell
npm install
```

2. Run tests:

```powershell
npm test
```
