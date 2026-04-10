# Code Summary

## Overview

This document summarizes the code added for the overlay implementation and explains what each file is responsible for.

## `package.json`

This file defines the project as an Electron app.

Key points:

- main entry is `src/main.js`
- `start` runs Electron
- `dev` also runs Electron
- `check` performs syntax checks with `node --check`
- Electron is installed as a development dependency

## `src/config/windows.js`

This file now centralizes the full window template system.

Current exports include:

- `sharedWindowTemplate`
- `windowTemplates`
- `startupWindows`
- `resolveWindowTemplate(templateKey)`
- `getStartupWindowConfigs()`

Why it exists:

- keeps magic numbers out of the main process
- makes window tuning easier without editing control logic
- allows multiple named window presets
- allows startup instances with per-instance overrides

### `sharedWindowTemplate`

Provides the default shape for every window:

- default HTML file
- default title
- default start mode
- shared BrowserWindow settings
- shared expanded and compact layout settings

### `windowTemplates`

Defines reusable presets such as:

- `home`
- `focus`

Templates override the shared default object.

### `startupWindows`

Defines which windows are created when the app boots.

Each entry resolves to:

- `windowKey`
- `templateKey`
- final merged `config`

## `src/main.js`

This is the Electron main process entrypoint.

### Imports

It imports:

- Node `path`
- Electron APIs:
  - `app`
  - `BrowserWindow`
  - `ipcMain`
  - `nativeTheme`
  - `screen`
- local window config

### Window registries

Two registries are created:

- `windowsByKey`
- `windowState`

These keep track of live windows, their startup key, template key, resolved config, and current mode.

### `getAnchorBounds(config)`

Computes compact top-right bounds using the primary display work area.

Returned values:

- `x`
- `y`
- `width`
- `height`

### `getDefaultBounds(config)`

Computes the default expanded bounds using the primary display work area.

It now reads from:

- `config.layout.expanded`
- `config.layout.anchor`

### `sendThemeState()`

Reads Electron native theme state and pushes:

- `themeSource`
- `shouldUseDarkColors`

to every live window through IPC.

### `setWindowMode(win, mode)`

Handles compact and expanded state changes.

Compact path:

- calculates compact bounds
- keeps the window on top
- makes the window visible across workspaces
- resizes and repositions

Expanded path:

- calculates default expanded bounds
- restores a larger size when the previous window was compact-sized
- otherwise preserves the current size while enforcing minimums

At the end, it stores the mode in `windowState` and notifies the renderer.

### `registerWindow(windowKey, templateKey, config, win)`

Stores live window metadata in the runtime registries.

### `unregisterWindow(win)`

Removes live window metadata on close.

### `createManagedWindow(windowKey, templateKey, config)`

Creates one BrowserWindow from a resolved template config.

This is the new generic window creation function.

It loads the renderer using `config.htmlFile`, so future templates can point at different HTML entry files if needed.

### `createStartupWindows()`

Resolves every startup entry from `windows.js` and creates each managed window.

### App lifecycle

The app:

- creates all configured startup windows on `app.whenReady()`
- resends theme updates when the native theme changes
- recreates the configured startup windows on macOS-style activation if no windows are open
- quits on non-macOS platforms when all windows are closed

### IPC handlers

The following handlers are registered:

- `window:minimizeToDock`
- `window:expand`
- `window:minimizeNative`
- `window:close`
- `theme:setSource`

These drive all user-facing chrome actions and theme changes.

## `src/preload.js`

This file exposes a safe renderer API through `contextBridge`.

Exposed methods:

- `minimizeToDock`
- `expandWindow`
- `minimizeNative`
- `closeWindow`
- `setThemeSource`
- `onThemeChanged`
- `onWindowMode`

Why it exists:

- keeps Electron APIs out of the DOM environment
- maintains a narrower interface between renderer and main process

## `src/index.html`

This file defines the overlay structure.

### Expanded mode markup

Main sections:

- top bar
- scrollable content region
- copy block
- developer preset panel

Expanded controls:

- compact / pin icon button
- close icon button

### Compact mode markup

Compact sections:

- `Pinned` label
- expand icon button
- close icon button

### Decorative structure

The shell also includes:

- two background glow layers
- internal content cards
- SVG icon markup for circular icon buttons

## `src/renderer.js`

This file wires DOM controls to the preload API.

### Element lookups

It stores references to:

- theme toggle
- compact button
- close button
- compact close button
- light, dark, and system preset buttons
- compact expand button

### Theme handling

`sources` contains:

- `light`
- `dark`
- `system`

`labelForSource(...)` builds the button label.

`applyThemeState(...)`:

- sets `data-tone`
- updates the current theme index
- updates the theme button label

### Mode handling

`setMode(mode)` updates `data-mode` on the root shell.

This drives compact vs expanded layout styling in CSS.

### Event handlers

Buttons do the following:

- compact button -> `minimizeToDock()`
- close button -> `closeWindow()`
- compact close button -> `closeWindow()`
- light preset -> `setThemeSource("light")`
- dark preset -> `setThemeSource("dark")`
- system preset -> `setThemeSource("system")`
- compact expand button -> `expandWindow()`

The renderer also subscribes to:

- `theme:changed`
- `window:mode`

## `src/styles.css`

This file contains the full visual system.

### CSS variables

Defines:

- dark and light shell colors
- text colors
- panel colors
- accent colors
- danger color
- font stacks

### Shell behavior

The page uses:

- `overflow: hidden` on `html` and `body`
- transparent background
- full-size shell
- draggable outer region

This prevents the outer transparent window from showing ugly scrollbars.

### Overlay card

The overlay card provides:

- the visible rounded glass shell
- blur and saturation
- border and shadow
- hidden overflow for clean rounded edges

### Button system

There are two button families:

- normal pill buttons
- fixed-size circular icon buttons

Important details:

- icon buttons are `40x40`
- icon buttons use SVG paths
- close buttons use a danger treatment
- expand button uses a tinted accent treatment

### Scroll behavior

The main content uses `.scroll-area`.

This means:

- outer window does not scroll
- internal content can scroll if needed
- internal scrollbar stays inside the visual shell

### Compact styling

Compact mode:

- hides expanded content
- turns the overlay into a pill-shaped shell
- centers the compact content
- shows the compact action row

### Responsive behavior

On narrower screens:

- the top bar stacks vertically
- the content grid becomes one column
- controls align more naturally for small widths

## Current Limitations

- frameless resizing works, but the resize affordance is visually subtle
- `window:minimizeNative` still exists in the API and main process but is not currently used by the rendered UI
- theme selection is runtime-only and does not persist between launches
- all templates currently load the same `src/index.html` UI shell

## Current Verification Method

Use:

```powershell
npm run check
```

Run the actual app with:

```powershell
npm start
```
