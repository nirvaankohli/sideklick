# Manage chat requests easily

## Summary

Added a request inbox to the chat window so incoming localhost chat payloads can be reviewed and managed instead of executing immediately.

## What changed

- Incoming payloads now enter a `Request Inbox` panel.
- Each request gets a status and action buttons.
- `Apply` runs the queued request and adds it to the chat thread.
- `Dismiss` marks a request as ignored.
- `Reopen` moves a resolved request back to pending.
- `Clear Resolved` removes applied and dismissed requests from the inbox.

## How to run

1. Start the app:

```powershell
npm start
```

2. Send a test request:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4353 -ContentType "application/json" -Body '{"text":"example payload","click_function":"restore-window"}'
```

3. Open the chat window and use the `Request Inbox` panel to apply, dismiss, reopen, or clear requests.

## How to test

```powershell
npm test
```
