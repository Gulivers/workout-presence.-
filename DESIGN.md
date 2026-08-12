---
name: Workout Planner
description: Presence by date in a dark training room—Calendar owns the stage; gold marks only the active win.
colors:
  ink: "#0F0F0F"
  panel: "#171717"
  panel-raised: "#1C1C1C"
  line: "#2A2A2A"
  beige: "#E8E3D8"
  beige-dim: "#C9C3B6"
  silver: "#C0C0C0"
  silver-dim: "#A3A3A3"
  gold: "#D4AF37"
  gold-deep: "#B8962E"
  danger: "#E11D48"
  paper: "#F3EFE6"
  ink-soft: "#1A1814"
  line-soft: "#D6D0C4"
  wash: "#EBE6DB"
  mute: "#6B6560"
typography:
  display:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  title:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.08em"
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow Condensed, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  gutter: "16px"
  content: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.gold-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.beige}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.silver}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  input-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.beige}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.silver}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  nav-link-active:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  brand-mark:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "32px"
  calendar-stage:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.beige}"
    rounded: "{rounded.md}"
    padding: "16px"
  event-chip:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.beige}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  modal-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.beige}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
---

# Design System: Workout Planner

## Overview

**Creative North Star: "The Dark Training Room"**

Workout Planner reads as a charcoal training room where the Calendar Stage holds the floor. Surfaces stay quiet and flat; presence by date is the job. Person color carries ownership on chips and dots; gold is reserved for the active win—selected nav, primary actions, today, and focus—not decoration.

Density is compact and practical: thin hairline rules, condensed uppercase display type for stage titles and chrome, Source Sans 3 for body and fields. Dark is the default world; light mode mirrors the same structure with paper and soft ink, never a second aesthetic.

**Key Characteristics:**
- Charcoal ink/panel stack with beige type and silver secondary
- Gold as scarce active accent only
- Barlow Condensed uppercase for brand, nav, titles, metrics; Source Sans 3 for UI copy
- Hairline borders and tonal layering instead of card stacks
- Calendar Stage as the signature surface: month grid, gold today ring, left-edged event chips

## Colors

Charcoal room, warm paper text, and a single metallic accent used sparingly.

### Primary
- **Medal Gold** (`{colors.gold}`): Active nav fill, primary buttons, today ring/number, focus borders/rings, progress fills, inline links, selected color-swatch ring. Rarity is the point.
- **Medal Gold Deep** (`{colors.gold-deep}`): Hover/pressed deepen on gold fills and link hover.

### Neutral
- **Room Ink** (`{colors.ink}`): Default page background (dark); ink text on gold fills.
- **Panel Charcoal** (`{colors.panel}`): Calendar Stage, modal body, field backgrounds.
- **Panel Raised** (`{colors.panel-raised}`): Hover washes, event chip fill, track under progress bars.
- **Hairline** (`{colors.line}`): Thin dividers, stage border, field border at rest.
- **Warm Beige** (`{colors.beige}`): Primary text and titles on dark.
- **Beige Dim** (`{colors.beige-dim}`): Field labels; calendar day numbers at rest.
- **Steel Silver** (`{colors.silver}`): Inactive nav, ghost button text, secondary chrome.
- **Silver Dim** (`{colors.silver-dim}`): Lede, muted status, metric labels, counts.
- **Signal Rose** (`{colors.danger}`): Errors and destructive text actions only.
- **Paper** (`{colors.paper}`): Light-mode page/header ground and light event chip fill.
- **Ink Soft** (`{colors.ink-soft}`): Light-mode primary text.
- **Line Soft** (`{colors.line-soft}`): Light-mode hairlines and field borders.
- **Warm Wash** (`{colors.wash}`): Light-mode hover surfaces.
- **Mute** (`{colors.mute}`): Light-mode secondary/muted copy.

### Named Rules
**The Active Win Rule.** Gold marks only the active win—selected nav, primary CTA, today, focus, and selected person-color control. Do not flood panels, backgrounds, or idle chrome with gold.

**The Person Color Rule.** Per-person hues are data, not brand tokens. They appear as dots, swatch picks, and the left edge of event chips; they never replace gold as the system accent.

## Typography

**Display Font:** Barlow Condensed (with ui-sans-serif / system-ui)
**Body Font:** Source Sans 3 (with ui-sans-serif / system-ui)

**Character:** Condensed athletic display for stage titles and chrome; open humanist sans for readable planning copy. Display runs uppercase with tracking; body stays sentence case.

### Hierarchy
- **Display** (600, 2.25rem → 3rem at `sm`, tracking `0.04em`, uppercase): Page titles (`.page-title`).
- **Headline** (600, 1.5rem, tracking `0.06em`, uppercase): Modal titles; calendar toolbar month title.
- **Title** (600, 1.25rem, tracking `0.08em`, uppercase): Section heads in Reports; brand wordmark at `lg`/`xl`.
- **Body** (400–600, 0.875rem, normal tracking): Ledes, fields, list rows, event chip labels; lede max-width `max-w-prose`.
- **Label** (500–600, 0.75rem–0.8125rem, tracking `0.12em`–`0.18em`, uppercase): Nav links, metric labels, calendar column headers, exercise block heads.

### Named Rules
**The Condensed Stage Rule.** Barlow Condensed is for brand, navigation, page/section titles, metrics, and calendar chrome. Continuous reading and form values stay in Source Sans 3.

## Layout

Content lives in a centered column (`max-w-6xl` / `{spacing.content}`) with horizontal gutter `{spacing.gutter}` and main vertical padding `{spacing.xl}` (`py-8` / `sm:py-10`). Page sections stack with `{spacing.lg}`–`{spacing.xl}` rhythm; field stacks use tight `6px` label gaps. Header is full-bleed hairline strip; brand row then wrap-capable nav. Filters (person select) sit end-aligned beside the title block from `sm` up. Dashboard metrics use a responsive 1/2/4 column grid separated by hairline rules, not cards. Below `640px`, calendar toolbar stacks and type tightens; horizontal scroll is allowed on the stage.

## Elevation & Depth

Depth is tonal: ink → panel → panel-raised, plus 1px hairlines. Resting UI has no drop shadows. The only structural lift is the workout modal (`0 16px 48px rgba(0,0,0,0.45)`) over a dimmed ink scrim (`ink` at 70%). Focus and calendar button focus use a dual ring (`0 0 0 2px` ink, `0 0 0 4px` gold at 45%). Today is a gold outline circle on the day number, not a floating badge.

### Shadow Vocabulary
- **Modal lift** (`box-shadow: 0 16px 48px rgba(0,0,0,0.45)`): Workout dialog only.
- **Gold focus ring** (`box-shadow: 0 0 0 2px #0F0F0F, 0 0 0 4px rgb(212 175 55 / 0.45)`): Calendar toolbar buttons and analogous focus treatments.
- **Field focus** (`box-shadow` via `ring-2` gold/25; border gold): Text inputs and selects.

### Named Rules
**The Flat Stage Rule.** Surfaces stay flat at rest. Shadows appear only for the modal overlay; never under cards, nav, or the calendar frame.

## Shapes

Corners are quietly rounded: controls and stage use `{rounded.md}` (6px); modal uses `{rounded.lg}` (8px); event chips use `{rounded.sm}` (4px). Color dots, today marker, and progress tracks use `{rounded.full}`. Borders are 1px hairlines in `{colors.line}` (or `{colors.line-soft}` in light). Event chips are left-edged only (1px person color)—no full outline frame.

## Components

### Buttons
- **Shape:** Gently rounded (`{rounded.md}`)
- **Primary:** Gold fill, ink text, `8px 16px`, semibold 0.875rem; hover → gold-deep; disabled → 60% opacity
- **Secondary:** Transparent, silver/35 border, beige text; hover raises border to silver and wash to panel-raised
- **Ghost:** No border, silver text, tighter `6px 12px`; hover panel-raised + beige
- **Danger:** Transparent, danger text; hover danger/10 wash
- **Focus:** Gold ring treatments on interactive chrome (theme toggle `ring-gold/40`)

### Inputs / Fields
- **Style:** Panel fill, hairline border, beige text, `8px 12px`, `{rounded.md}`
- **Label:** Beige-dim medium weight above field
- **Focus:** Border gold + ring gold/25
- **Placeholder:** Silver-dim at 60%
- **Light:** White fill, soft line border, ink-soft text; focus gold-deep border

### Navigation
- **Brand mark:** 32px gold square, WP in condensed bold ink
- **Wordmark:** Condensed uppercase beige, tracking `0.08em`
- **Links:** Condensed uppercase silver; active = gold fill + ink text; idle hover = panel-raised + beige
- **Theme toggle:** Ghost icon button, gold focus ring

### Chips
- **Event chip (Calendar Stage):** Panel-raised fill, beige 0.75rem text, 4px radius, 1px left person-color edge—no full border, no gold fill
- **Person legend:** 10px color dot + silver-dim name; dimmed when filtered out

### Cards / Containers
- **Not a card system.** Sections divide with `.surface-rule` hairlines and spacing
- **Calendar Stage:** Panel fill, line border, `{rounded.md}`, `8–16px` padding
- **Modal:** Panel, line border, `{rounded.lg}`, max-width `42rem`, modal lift shadow
- **Lists:** `divide-y` on hairline; no boxed rows

### Calendar Stage (signature)
- Month dayGrid in the panel frame; toolbar title and buttons use condensed uppercase
- Today: gold 1px ring on day number + faint gold wash on cell (`rgba(212,175,55,0.08)`)
- Active toolbar button: gold fill + ink text
- More-link text: gold
- Person filter and legend sit above the stage, not overlaid on cells

## Do's and Don'ts

### Do:
- **Do** keep gold scarce under **The Active Win Rule**—active nav, primary CTA, today, focus.
- **Do** put planning work on the Calendar Stage: panel frame, hairline grid, compact left-edged chips.
- **Do** use Barlow Condensed uppercase for stage chrome and Source Sans 3 for body/fields.
- **Do** separate sections with hairlines and spacing, not elevated cards.
- **Do** preserve person colors as data marks (dots, chip edges, swatches) distinct from brand gold.

### Don't:
- **Don't** flood backgrounds, idle borders, or every metric with gold.
- **Don't** wrap content in multi-shadow card stacks or soft purple/glow SaaS chrome.
- **Don't** set continuous reading or form values in Barlow Condensed.
- **Don't** treat per-person palette hexes as brand tokens in new surfaces.
- **Don't** invent eyebrow/kicker lines above page titles; titles stand alone with a short lede.
