---
version: alpha
name: SideKlick
description: >
  A Windows-native desktop study interface built from translucent glass cards,
  icy blue accents, rounded capsules, and dense but readable academic surfaces.
colors:
  primary: "#132033"
  secondary: "#5CB5FF"
  tertiary: "#8FD3FF"
  neutral: "#F4F7FC"
  neutral-dark: "#070A12"
  surface-light-page: "#EDF2F7"
  surface-light-shell: "#F4F7FCAD"
  surface-light-card: "#FFFFFF7A"
  surface-light-panel: "#FFFFFF75"
  surface-light-button: "#FFFFFF94"
  surface-light-menu: "#FCFDFFF5"
  surface-dark-page: "#0A0F16"
  surface-dark-shell: "#070A12CC"
  surface-dark-card: "#FFFFFF0D"
  surface-dark-panel: "#FFFFFF0F"
  surface-dark-button: "#FFFFFF17"
  surface-dark-menu: "#0A0E16F5"
  text-light-primary: "#132033"
  text-light-secondary: "#1320339E"
  text-dark-primary: "#F4F7FB"
  text-dark-secondary: "#E2E9F6B3"
  border-light: "#FFFFFFB3"
  border-light-muted: "#24487A24"
  border-dark: "#FFFFFF24"
  border-dark-muted: "#FFFFFF14"
  border-accent-soft: "#8FD3FF3D"
  border-accent-strong: "#5CB5FF80"
  accent-gradient-start: "#8FD3FFF5"
  accent-gradient-end: "#5CB5FFDB"
  ambient-blue: "#5CB5FF42"
  ambient-cyan: "#8FD3FF1A"
  ambient-violet: "#A274FF29"
  success: "#6FD68D"
  error: "#FF6B72"
  warning: "#FFC94D"
typography:
  display-xl:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 6rem
    fontWeight: 600
    lineHeight: 0.93
    letterSpacing: -0.10em
  headline-lg:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.03em
  headline-md:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.03em
  title-sm:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 1.04rem
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-md:
    fontFamily: '"Segoe UI Variable Text", "Aptos", "Segoe UI", sans-serif'
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  body-sm:
    fontFamily: '"Segoe UI Variable Text", "Aptos", "Segoe UI", sans-serif'
    fontSize: 0.94rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  meta-sm:
    fontFamily: '"Segoe UI Variable Text", "Aptos", "Segoe UI", sans-serif'
    fontSize: 0.8rem
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  label-caps:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 0.72rem
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.16em
  brand-sm:
    fontFamily: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif'
    fontSize: 0.95rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: 0.08em
  body-serif:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 0.95rem
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  body-serif-lg:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0em
  code-sm:
    fontFamily: '"Consolas", "Cascadia Mono", "Courier New", monospace'
    fontSize: 0.72rem
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0em
rounded:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 22px
  xxl: 24px
  xxxl: 28px
  hero: 36px
  full: 999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 28px
  xxxl: 36px
  hero: 42px
  shell-padding: 10px
  card-padding: 18px
  panel-padding: 22px
layout:
  onboarding-max-width: 1320px
  onboarding-max-height: 900px
  overlay-content-width: 880px
  chat-measure: 34rem
  folder-grid-min-column: 210px
  quiz-explanation-min: 260px
shadows:
  overlay-light: "0 22px 56px #18273D2E, inset 0 1px 0 #FFFFFFB3"
  overlay-dark: "0 24px 64px #00000061, inset 0 1px 0 #FFFFFF1F"
  panel-light: "0 18px 36px #12284714, inset 0 1px 0 #FFFFFFCC"
  panel-dark: "0 20px 44px #0308142E, inset 0 1px 0 #FFFFFF0F"
  floating-light: "0 20px 42px #1228471F"
  floating-dark: "0 20px 42px #00000047"
  accent-glow: "0 0 24px #5CB5FF38"
elevation:
  overlay-light: "{shadows.overlay-light}"
  overlay-dark: "{shadows.overlay-dark}"
  panel-light: "{shadows.panel-light}"
  panel-dark: "{shadows.panel-dark}"
  floating-light: "{shadows.floating-light}"
  floating-dark: "{shadows.floating-dark}"
motion:
  duration-fast: "120ms"
  duration-standard: "180ms"
  duration-panel: "220ms"
  duration-progress: "240ms"
  duration-emphasis: "260ms"
  duration-pulse: "900ms"
  easing-standard: "ease"
  easing-exit: "ease-out"
  easing-breathing: "ease-in-out"
  hover-lift: "translateY(-1px)"
  entry-lift-sm: "translateY(8px)"
  entry-lift-md: "translateY(10px)"
  pulse-lift: "translateY(-2px)"
components:
  shell-light:
    backgroundColor: "{colors.surface-light-shell}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.xxxl}"
    padding: "{spacing.card-padding}"
    shadow: "{shadows.overlay-light}"
  shell-dark:
    backgroundColor: "{colors.surface-dark-shell}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xxxl}"
    padding: "{spacing.card-padding}"
    shadow: "{shadows.overlay-dark}"
  button-primary:
    backgroundColor: "{colors.accent-gradient-start}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 12px
    typography: "{typography.body-md}"
  button-ghost-light:
    backgroundColor: "{colors.surface-light-button}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.full}"
    padding: 10px
    typography: "{typography.body-sm}"
  button-ghost-dark:
    backgroundColor: "{colors.surface-dark-button}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.full}"
    padding: 10px
    typography: "{typography.body-sm}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.full}"
    padding: 10px
    typography: "{typography.body-sm}"
  input-light:
    backgroundColor: "{colors.surface-light-card}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
    typography: "{typography.body-md}"
  input-dark:
    backgroundColor: "{colors.surface-dark-card}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
    typography: "{typography.body-md}"
  card-browser-light:
    backgroundColor: "{colors.surface-light-panel}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.xxxl}"
    padding: "{spacing.panel-padding}"
    shadow: "{shadows.panel-light}"
  card-browser-dark:
    backgroundColor: "{colors.surface-dark-card}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xxxl}"
    padding: "{spacing.panel-padding}"
    shadow: "{shadows.panel-dark}"
  menu-floating-light:
    backgroundColor: "{colors.surface-light-menu}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.lg}"
    padding: 10px
    shadow: "{shadows.floating-light}"
  menu-floating-dark:
    backgroundColor: "{colors.surface-dark-menu}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.lg}"
    padding: 10px
    shadow: "{shadows.floating-dark}"
  chat-bubble-assistant-light:
    backgroundColor: "#DFE4ECEA"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
    typography: "{typography.body-md}"
  chat-bubble-assistant-dark:
    backgroundColor: "#D0D6E029"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
    typography: "{typography.body-md}"
  chat-bubble-user-light:
    backgroundColor: "#57B4FFF0"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
    typography: "{typography.body-md}"
  chat-bubble-user-dark:
    backgroundColor: "#4EABFF6B"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
    typography: "{typography.body-md}"
  quiz-card-light:
    backgroundColor: "#FFFFFFF2"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.xxl}"
    padding: 20px
    shadow: "{shadows.panel-light}"
  quiz-card-dark:
    backgroundColor: "#07121F7A"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xxl}"
    padding: 20px
    shadow: "{shadows.panel-dark}"
---

## Overview

SideKlick should feel like a focused desktop study cockpit rather than a playful student app or a generic AI dashboard. The visual identity is built around frosted-glass shells, cool academic blues, and soft rounded containers that sit comfortably inside a desktop window. The mood is crisp, calm, and slightly futuristic, with enough density to support real work but enough softness to stay approachable during long study sessions.

Light mode is the canonical presentation: cloudy paper-whites, dark navy ink, and translucent panels that feel like polished acrylic. Dark mode is a low-glare companion, not a different brand. It keeps the same hierarchy and softness, but shifts into inky navy-black surfaces, milky text, and restrained accent glow.

The brand can support a friendly mascot, but the product UI itself should stay composed. The interface is more “late-night study desk” than “cartoon productivity app.”

## Colors

The palette is anchored by three families:

- **Ink Navy:** deep blue-black used for text, structure, and quiet authority.
- **Icy Cyan:** the primary interaction color. It carries buttons, focus, selection, information states, and ambient glow.
- **Soft Neutrals:** foggy whites and slate-tinted translucency that create the glass effect without looking sterile.

Coral red is reserved for destructive or incorrect states. Mint green is reserved for success and correctness. Violet can appear as a subtle environmental glow, but never as a core action color.

Color should usually appear through layers, not flat slabs. Most surfaces feel lightly frosted, lightly bordered, and gently illuminated rather than fully opaque. When in doubt, use contrast and translucency before introducing another hue.

## Typography

The primary typographic voice is Windows-native and practical: Segoe UI Variable and Aptos give the product a familiar desktop feel without becoming visually anonymous. Headlines are slightly tightened and compact, with enough weight to feel decisive. Body text is straightforward and readable, optimized for scanning, notes, and AI responses.

Uppercase labels use small sizes with generous tracking. They act as section markers, not as loud badges. Monospace is reserved for captured text, snippets, and machine-like payloads.

A serif voice appears only in reflective study artifacts such as saved summaries or session recaps. That contrast is intentional. Sans-serif handles the operational interface; serif handles the “study material” feel.

## Layout

This is a desktop-first system. The frame should feel contained inside a window, with a small outer margin around the shell and a larger interior rhythm inside cards and panels.

- Outer shell padding is tight and controlled.
- Primary shells use medium internal padding.
- Browsers, settings panes, quiz panels, and summary cards use larger interior padding.
- Typical gutters sit in the 12px to 18px range.
- Content is dense but not cramped; it should read as efficient, not crowded.

Long-form assistant copy should stay near a readable measure instead of stretching edge to edge. Grid cards should keep a comfortable minimum width so icons, metadata, and summary excerpts never feel squeezed.

## Elevation & Depth

Depth comes from layered translucency, inner highlights, and long soft shadows rather than hard stacking or heavy outlines. The visual model is “glass over atmosphere,” not flat cards on a blank canvas.

Use these depth cues together:

- a translucent or gradient-washed fill
- a faint border
- a subtle top-edge inner highlight
- a soft shadow with a wide blur radius

Floating menus should feel denser and more opaque than their parent surfaces. Accent glow should appear sparingly on special actions, selected controls, or active study states. It should never flood the entire screen.

## Shapes

The shape language is soft and highly consistent. Most controls live in one of three families:

- **Pills:** for ghost buttons, action chips, badges, and window controls
- **Soft rectangles:** for cards, inputs, menus, and question blocks
- **Orbs / circles:** for icon-only controls and status dots

Sharp corners do not belong here. Even utilitarian controls should feel polished and slightly cushioned. Larger study panels can become especially generous, but they should still stay compact enough to feel desktop-native rather than mobile-card oversized.

## Components

### Shells and Cards

The main application shell is a large frosted card with strong rounding and soft shadow. Interior regions such as home browsers, chat panes, settings cards, and quiz surfaces reuse the same language at slightly different opacities.

Cards should feel layered, not boxed. Borders stay quiet. Backgrounds do most of the work.

### Buttons

Primary actions should use the bright cyan family and feel slightly luminous. Secondary and ghost actions should be translucent pills that inherit the surrounding theme. Hover states should lift subtly, never jump. Destructive actions use coral sparingly and should remain obvious without turning the whole screen red.

### Inputs

Inputs are soft inset rectangles with enough fill contrast to read immediately against the shell. Focus should be shown with border emphasis and a light cyan halo, not a harsh browser-default outline.

### Chat

Assistant messages should read as neutral frosted bubbles. User messages should be the most saturated object in the conversation: a blue gradient bubble with a faint glow in both themes. Captured payloads and raw context can switch into a more technical, compact presentation using monospaced text and denser cards.

### Study Artifacts

Folder cards, session previews, and quiz panels should feel like academic objects housed inside the glass system. Small icon tiles can carry the cyan accent. Summary excerpts may switch to serif to make saved study material feel distinct from navigation chrome.

Quiz surfaces should be especially legible: large rounded panels, clear selection states, explicit correctness colors, and restrained helper badges.

### Menus and Overlays

Attach trays, create menus, and modal surfaces should float above the shell with slightly darker or brighter opacity than the parent. They should feel compact and precise, not sprawling.

## Do's and Don'ts

- Do keep the interface anchored in icy cyan, ink navy, and frosted neutrals.
- Do preserve the same structure across light and dark modes; only the atmosphere should change.
- Do use serif selectively for summaries, recaps, and saved study artifacts.
- Do keep interactions compact, slightly elevated, and calm.
- Do favor translucent layers over flat opaque blocks.

- Don't introduce multiple loud accent families on one screen.
- Don't turn the product into a purple-heavy generic AI aesthetic.
- Don't use razor-sharp corners, hard black borders, or flat white rectangles.
- Don't over-animate; motion should confirm structure, not distract from studying.
- Don't treat dark mode as a neon theme. It should stay subdued, legible, and low-glare.
