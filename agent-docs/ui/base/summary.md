# UI Base Summary

## Goal

Build a first-pass Electron overlay UI based on the requirements in `tasks/ui/base.md`.

The final result is a transparent, frameless, always-on-top Electron window with:

- an expanded overlay state
- a compact pinned state in the top-right
- readable light and dark tint modes
- draggable window behavior
- resizable expanded window behavior
- simple window controls with circular icon buttons
- template-based window configuration through `src/config/windows.js`

## What Was Built

The app was scaffolded from scratch because the repository did not already contain an Electron app.

The implementation now includes:

- Electron app setup through `package.json`
- main process window creation, template resolution, and mode switching in `src/main.js`
- preload bridge in `src/preload.js`
- renderer event wiring in `src/renderer.js`
- overlay markup in `src/index.html`
- overlay styling in `src/styles.css`
- central window template and startup config in `src/config/windows.js`

## Config Management

Window management is no longer based on a single hardcoded overlay object.

It now uses a template system in `src/config/windows.js` with:

- `sharedWindowTemplate`
- `windowTemplates`
- `startupWindows`

This means you can:

- define reusable template presets such as `home` and `focus`
- override layout and BrowserWindow behavior per template
- choose which named windows start automatically
- choose a separate startup window set for the very first launch
- attach per-startup overrides without rewriting the main process

The current startup model is set up so you can declare entries like:

- a first-run `onboarding` window
- a default `chat` window for all later launches
- future specialized windows with their own sizes and compact behavior

## Window Behavior

The overlay has two main states:

### Expanded

- transparent frameless window
- always on top
- draggable shell
- resizable from the outer edges and corners
- simple top-right controls:
  - compact / pin button
  - red close button

### Compact

- repositions to the top-right of the primary display
- becomes a small pill-shaped pinned window
- centered compact content
- compact controls:
  - `Pinned` label
  - expand button
  - red close button

## Styling Direction

The visual direction was revised several times to make the UI feel cleaner and less awkward.

The final style direction is:

- dark glass overlay by default
- optional light tint mode
- subtle atmospheric glows
- rounded shell and internal cards
- centered, fixed-size circular icon buttons
- internal scrolling only, with no outer window scrollbar

## Key UX Adjustments Made During Iteration

- removed clutter from the main chrome
- made controls mode-specific so expanded and compact states are easy to understand
- removed outer scrolling and kept overflow inside the app only
- made compact mode more pill-like
- centered compact content and actions
- replaced text glyph controls with centered SVG icon buttons
- kept the expanded window resizable

## Final File Layout

- `package.json`
- `package-lock.json`
- `src/main.js`
- `src/preload.js`
- `src/renderer.js`
- `src/index.html`
- `src/styles.css`
- `src/config/windows.js`

## Verification

The code was verified with:

```powershell
npm run check
```

This confirms syntax validity for:

- `src/main.js`
- `src/preload.js`
- `src/renderer.js`

## How To Run

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm start
```
