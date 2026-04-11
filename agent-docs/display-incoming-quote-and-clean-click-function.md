# Display incoming quote and clean click_function

## Summary
Updated incoming payload rendering in the chat overlay UI.

- Incoming `text` now renders as a styled quote.
- Incoming `click_function` now displays only the function name.
- Click behavior is unchanged (`click_function` still triggers the mapped UI action).

## How to run
1. Start the Electron app.
2. Send a payload to `http://localhost:4353` with JSON body:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"This is a quote","click_function":"restore-window"}'
```

Expected:
- Chat shows a quoted message for `text`.
- Chat shows only `restore-window` for `click_function`.
- The `restore-window` action is still executed.
