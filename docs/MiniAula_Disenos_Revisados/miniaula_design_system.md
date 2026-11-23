---
name: "MiniAula Design System"
description: "A modern, accessible, and structured design system for the MiniAula LMS platform, supporting both student and instructor experiences."
---

## Overview

MiniAula is an intuitive, modern, friendly SaaS learning platform. The visual identity balances professional academic structure with warm, delightful digital interactions. The system provides clear visual hierarchy, soft elevation, friendly feedback states, and strict adherence to sequential course progression and role-based permissions.

## Colors

The palette embraces an elegant, prestigious aesthetic centered around deep **Emerald Green** (`#0D7A57` / `#0A5C41`) and sophisticated **Slate Charcoal & Cool Gray** neutrals (`#1A202C`, `#4A5568`, `#F8FAFC`). Crisp white surfaces, subtle stone-tinted outlines, and refined status roles provide an executive, high-trust academic presence.

- **Primary:** Deep emerald green representing growth, clarity, high academic standards, and confident focus.
- **Secondary:** Elegant deep charcoal slate used for polished typographic presence, sidebars, and structural headers.
- **Surface & Background:** Off-white cool gray ground (`#F8FAFC`) with crisp pure white card surfaces (`#FFFFFF`).
- **Status Roles:** Contrast-compliant semantic clarity for sequential completion (emerald success), alerts, and locked states.

```yaml
colors:
  primary: "#0A5C41"
  on-primary: "#FFFFFF"
  secondary: "#1A202C"
  on-secondary: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#1A202C"
  surface-variant: "#EDF2F7"
  on-surface-variant: "#4A5568"
  background: "#F8FAFC"
  on-background: "#1A202C"
  success: "#0D7A57"
  on-success: "#FFFFFF"
  success-light: "#E6F4EA"
  warning: "#D97706"
  on-warning: "#1A202C"
  warning-light: "#FEF3C7"
  error: "#DC2626"
  on-error: "#FFFFFF"
  error-light: "#FEE2E2"
  outline: "#E2E8F0"
  outline-light: "#F1F5F9"
```

## Typography

Typography is powered by **Inter** across all UI layers and headings, delivering maximum legibility, balanced tabular figures, and clear weight differentiation between interactive controls, content reading, and metrics.

```yaml
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: "Inter"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: "Inter"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: "Inter"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: "Inter"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 28px
  headline-sm:
    fontFamily: "Inter"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
  body-lg:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  label-lg:
    fontFamily: "Inter"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  label-md:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
  label-sm:
    fontFamily: "Inter"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
```

## Layout & Spacing

MiniAula uses a fluid responsive grid with fixed maximum width limits (1280px on desktop) and responsive collapsibility on mobile (375px+). An 8px base grid rhythm governs component padding, gutters, and structural section splits.

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
```

## Elevation & Depth

Surfaces employ soft, ambient shadows tinted with dark navy (`rgba(36, 36, 58, 0.05)`) and subtle hairline borders (`#E2E5F0`) to establish tactile layering without heavy gradients or visual noise.

- **Level 0 (Flat):** Used for background canvases and table backgrounds.
- **Level 1 (Card):** Used for standard course cards, stats, and widgets with subtle shadow `0 2px 8px -2px rgba(36,36,58,0.06)` and 1px border.
- **Level 2 (Hover/Active):** Elevated cards on hover or active panels with `0 8px 24px -4px rgba(36,36,58,0.1)`.
- **Level 3 (Modal/Dropdown):** Floating contextual controls and dialogs with `0 16px 36px -6px rgba(36,36,58,0.16)`.

## Shapes

Shapes reflect a friendly and approachable feel through generous, smooth corner radii.

```yaml
rounded:
  sm: 6px
  DEFAULT: 10px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Motion & Micro-interaction

Micro-interactions are snappy, crisp, and direct. Button taps, check transitions, and progress bar animates provide immediate visual confirmation of educational milestones.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.4, 0, 0.2, 1)
  surface-enter:
    duration: 250ms
    delay: 0ms
    timingFunction: cubic-bezier(0, 0, 0.2, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.4, 0, 1, 1)
```

## Voice & Content Strategy

MiniAula communicates entirely in natural, encouraging Spanish. The tone is motivating, helpful, and transparent.

- **Capitalization:** Sentence case for headings, buttons, and badges.
- **Button Grammar:** Action verbs naming clear outcomes ("Continuar aprendiendo", "Inscribirme al curso", "Enviar respuestas", "Publicar curso").
- **Sequential Feedback:** Explains why an item is locked ("Completa la lección anterior para desbloquear") and gives honest quiz results without revealing answers prematurely.
- **Empty States:** Encouraging copy with actionable starting points.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html`: `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
- **Tabs** → `@components/tabs.html`: `tabs-horizontal`, `tabs-with-icon`
