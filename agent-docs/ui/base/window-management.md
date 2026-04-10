# Window Management

## Purpose

This document explains how the overlay window system is managed, how window templates work, how startup windows are chosen, and what to change when you want to tune behavior per window.

## Where Window Management Lives

The main files involved are:

- `src/config/windows.js`
- `src/main.js`
- `src/preload.js`
- `src/renderer.js`

## Window Configuration

All window management starts in `src/config/windows.js`.

The file now has three main sections:

- `sharedWindowTemplate`
- `windowTemplates`
- `firstRunStartupWindows`
- `startupWindows`

This is the intended place to manage nearly everything about a window.

That includes which renderer file it loads through `htmlFile`.

## Template Model

### `sharedWindowTemplate`

This is the base template applied to every window unless overridden.

It contains:

- `htmlFile`
- `title`
- `htmlFile`
- `startMode`
- `browserWindow`
- `layout`

`browserWindow` contains native Electron window settings such as:

- `transparent`
- `frame`
- `alwaysOnTop`
- `resizable`
- `roundedCorners`
- `hasShadow`
- `maximizable`
- `fullscreenable`
- `skipTaskbar`

`layout` contains app-level placement and sizing settings:

- `expanded.width`
- `expanded.height`
- `expanded.minWidth`
- `expanded.minHeight`
- `compact.width`
- `compact.height`
- `anchor.horizontal`
- `anchor.vertical`
- `anchor.padding`
- `anchor.topOffset`

### `windowTemplates`

This object contains named reusable presets.

Current examples:

- `home`
- `focus`

Each template can override anything from `sharedWindowTemplate`.

Examples of what a template can customize:

- title
- expanded size
- compact size
- minimum size
- always-on-top behavior
- future startup defaults

### `startupWindows`

This controls which windows are created on app startup.

Each entry can be:

- a string template key, or
- an object with:
  - `windowKey`
  - `template`
  - `overrides`

Current pattern:

```js
const startupWindows = [
  {
    windowKey: "home",
    template: "home"
  }
];
```

This means:

- `windowKey` is the live instance name
- `template` picks which reusable template to use
- `overrides` lets you customize that one startup instance without changing the template itself

### `firstRunStartupWindows`

This controls which windows are created only on the first launch ever for that user profile.

Use this for:

- onboarding
- welcome screens
- setup flows
- first-time explanation windows

After the first run, the app uses `startupWindows` instead.

## Recommended Way To Manage Windows

If you want easy control over windows, use this workflow:

1. Put shared defaults in `sharedWindowTemplate`
2. Create a named preset in `windowTemplates`
3. Add a first-run entry in `firstRunStartupWindows` if needed
4. Add a normal startup entry in `startupWindows`
5. Use `overrides` only for one-off startup tweaks

Example use cases:

- `onboarding` for first launch only
- `chat` for the normal default overlay
- `focus` for a smaller meeting overlay
- `agenda` for a taller reading-oriented overlay
- `debug` for a development-only variant

## Window Creation

The BrowserWindow is created in `src/main.js` inside `createManagedWindow(windowKey, templateKey, config)`.

Important settings:

- `frame: false`
- `transparent: true`
- `alwaysOnTop: true`
- `resizable: true`
- `roundedCorners: true`
- `hasShadow: true`
- `contextIsolation: true`
- `nodeIntegration: false`

This creates a safe frameless overlay shell with native resizing still enabled, but now the actual values come from the resolved template config.

## Two Window Modes

Each managed window currently has two application-level modes:

### Expanded mode

This is the full overlay.

Behavior:

- uses the regular configured width and height
- opens near the top-right of the screen
- shows the main content
- allows resizing by dragging the window edges or corners

### Compact mode

This is the pinned pill state.

Behavior:

- shrinks to `compactWidth` and `compactHeight`
- moves to the top-right anchor based on `anchorPadding`
- hides the main content
- shows the compact pinned UI only

## How Positioning Works

Two helper functions in `src/main.js` determine window bounds from the resolved template config:

### `getDefaultBounds(config)`

Used for expanded mode.

It:

- reads the primary display work area
- places the window near the top-right
- uses the configured expanded width and height

### `getAnchorBounds(config)`

Used for compact mode.

It:

- reads the primary display work area
- places the compact window in the top-right corner
- uses compact size plus `anchorPadding`

## How Mode Switching Works

Mode switching is handled by `setWindowMode(win, mode)` in `src/main.js`.

The function now reads per-window config from the internal `windowState` map rather than using one global overlay config.

### When switching to compact

The function:

- computes compact bounds
- keeps the window always on top
- makes the window visible across workspaces
- resizes and repositions the window
- sends the new mode to the renderer

### When switching to expanded

The function:

- computes the expanded default bounds
- restores a larger size when coming from compact mode
- preserves current bounds where appropriate
- sends the new mode to the renderer

## IPC API

The preload file exposes a small renderer API:

- `minimizeToDock()`
- `expandWindow()`
- `minimizeNative()`
- `closeWindow()`
- `setThemeSource(source)`
- `onThemeChanged(callback)`
- `onWindowMode(callback)`

These are defined in `src/preload.js`.

## Renderer Controls

The renderer uses these APIs in `src/renderer.js`.

Current behavior:

- compact button in expanded mode calls `minimizeToDock()`
- expand button in compact mode calls `expandWindow()`
- both close buttons call `closeWindow()`
- theme buttons call `setThemeSource(...)`
- mode changes update `data-mode`
- theme changes update `data-tone`

## How To Resize

The window is resizable because `browserWindow.resizable: true` is set in `src/config/windows.js` and passed into the BrowserWindow options.

How resizing works in practice:

- move the cursor to the outer edges or corners of the expanded window
- drag the edge or corner to resize

Important note:

- the app is frameless, so the resize affordance is more subtle than a normal native window
- compact mode is intentionally fixed to its compact bounds when pinned

## How To Change Compact Window Feel

If you want a different compact appearance, start here:

### Size

Change in `src/config/windows.js`:

- `layout.compact.width`
- `layout.compact.height`

### Placement

Change in `src/config/windows.js`:

- `layout.anchor.padding`
- `layout.anchor.topOffset`

### Shape and centering

Change in `src/styles.css`:

- `.window-shell[data-mode="compact"] .overlay-card`
- `.compact-strip`
- `.compact-actions`
- `.compact-copy`

## How To Add More Window Controls

If you need more window actions later:

1. Add a new IPC handler in `src/main.js`
2. Expose it through `src/preload.js`
3. Attach it to a button in `src/index.html`
4. Wire it in `src/renderer.js`

That keeps the renderer isolated from direct Electron access.

## How To Add Another Startup Window

Example:

```js
const startupWindows = [
  {
    windowKey: "home",
    template: "home"
  },
  {
    windowKey: "focus-right",
    template: "focus",
    overrides: {
      title: "Right Focus Overlay",
      layout: {
        anchor: {
          padding: 28,
          topOffset: 120
        }
      }
    }
  }
];
```

This lets you boot multiple named windows from reusable templates.

## First-Run Behavior

First-run detection is stored in the same Electron `userData` preferences file used for theme preference persistence.

Current behavior:

- if `hasLaunchedBefore` is not set, the app launches `firstRunStartupWindows`
- after that launch, `hasLaunchedBefore` is written as `true`
- all future launches use `startupWindows`
- theme preference still remains shared across all windows

## What To Edit For "Everything About That Window"

If you want to control a specific window from `windows.js`, these are the main knobs:

- `title`
- `startMode`
- `browserWindow.transparent`
- `browserWindow.frame`
- `browserWindow.alwaysOnTop`
- `browserWindow.resizable`
- `browserWindow.roundedCorners`
- `layout.expanded.width`
- `layout.expanded.height`
- `layout.expanded.minWidth`
- `layout.expanded.minHeight`
- `layout.compact.width`
- `layout.compact.height`
- `layout.anchor.padding`
- `layout.anchor.topOffset`

## Recommended Next Improvements

- add a visible resize affordance for the expanded overlay if native frameless resizing feels too hidden
- add persistence for the last window bounds per `windowKey`
- load window-specific UI content based on `templateKey` or `windowKey`
- add keyboard shortcuts for compact and expand actions
