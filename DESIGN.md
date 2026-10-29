---
name: Universe attendee checklist
description: An independent attendee tool reflecting the public Universe 2026 web treatment.
colors:
  background: "#E4EBE6"
  foreground: "#101411"
  card: "#F2F5F3"
  primary: "#08872B"
  primary-foreground: "#FFFFFF"
  signal-green: "#0FBF3E"
  accent: "#BFFFD1"
  border: "#B6BFB8"
  muted-foreground: "#46534A"
typography:
  title:
    fontFamily: '"Mona Sans Variable", sans-serif'
    fontSize: "clamp(42px, 9.5vw, 88px)"
    fontWeight: 650
    lineHeight: 1.05
  body:
    fontFamily: '"Mona Sans Variable", sans-serif'
    fontSize: "13px"
    lineHeight: 1.6
rounded:
  control: "4px"
  card: "6px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
---

# Design System

## Overview

The public Universe 2026 website, observed on October 28, 2026, is the visual
reference: pale gray-green, black ink, green actions, wide readable headings,
code-like single-line section names, and fine bordered subdivisions.

This is a functional, unofficial attendee app, not an official event property.
The qualifier remains visible. Do not copy the event lockup, mascot, imagery, or
other protected artwork.

## Colors

Use the GitHub neutral/green palette published in the
[color guide](https://brand.github.com/foundations/color). Green 5 is used for
buttons and links to retain contrast on the light background; Green 1 identifies
the next/current session face. Borders and neutral surfaces carry most structure.
Functional red and amber states are editorial interface choices, not event colors.

## Typography

Use self-hosted, unmodified Mona Sans with its OFL license. The
[typography guide](https://brand.github.com/foundations/typography) establishes
the family; sizes are adapted to the app. No Impact, faux condensed lettering,
metallic gradients, or heavily tracked uppercase body text.

Use monospace only for compact dates and timing metadata. Normal titles wrap
without truncation and use Mona Sans at 19–22px.

## Layout

Center a bordered stage up to 920px wide. The header carries independent-tool
identity and search/information controls. A `my-agenda/` title and a quiet grid
echo the observed public site's technical composition; the grid is an intentional
reference-led choice, not a claim that the brand guide mandates it.

Day tabs directly precede session groups. Mobile uses tighter 12px interior
gutters. Preserve 320px usability and bottom space for fixed navigation.

## Elevation & Depth

Use flat color and fine borders. Only the fixed navigation has a modest offset
shadow. No silver simulation, neon glow, olive outer framing, or sculpted tickets.

## Shapes

Rectangular subdivisions and small 3–6px corner radii. Do not restore sports-card
silhouettes, circular arrow backgrounds, or floating pill navigation.

## Components

- Session cards: format, text badges, full title, official link, and venue.
- Card control row: check-in, start/end time, and manual availability.
- Context: inline disclosure with rationale and transition warnings.
- Day tabs: green active state, bordered neutral inactive state.
- Navigation: dark rectangular dock with visible icon labels; pale-green active item.
- Settings: explicit manual availability, replay, origin-local storage, and
  unofficial-tool limitations alongside install/reset actions.

## Do's and Don'ts

- **Do** cite the official event site and published brand sources in documentation.
- **Do** keep data and recording limitations visible and text-based.
- **Don't** claim GitHub approval or affiliation from visual resemblance.
- **Don't** redistribute official logos or artwork without permission.
- **Don't** treat a source scan as publication or trademark clearance.
