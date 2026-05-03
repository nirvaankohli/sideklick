# Hide overflow across UI

Summary:
- Added explicit `overflow: hidden` rules to the main shell, layout containers, cards, chat surfaces, message bubbles, and compose area.
- This reduces visual bleed from child elements and keeps rounded containers clipping correctly.

How to run:
```powershell
npm run dev
```

Check the main windows and chat UI for content clipping and rounded-corner behavior.
