# Fit overflowing text to available space

Summary:
- Added a small fit-text utility in both the home and chat windows.
- Text elements marked for fit now shrink their font size only when they actually overflow their box.
- Applied to folder titles, folder metadata, chat message copy, chat metadata, and active session labels.
- Added wrapping safeguards in CSS so long strings break before they blow out layout.

How to run:
```powershell
npm run dev
```

Check:
- Long class names
- Long session names
- Long chat messages
- Long saved session summaries in folders
