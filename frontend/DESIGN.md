# Design

<!-- impeccable:design-schema 1 -->

## Visual World

**Indonesian Financial Data Terminal**

The design language of official Indonesian financial information — BI annual reports, Bisnis Indonesia editorial, IDX ticker boards. Authoritative, dense, precise. Paper and ink, not glass and glow.

## Ground

Warm off-white `#FAF8F3` — the felt of BI report stock. Body elevated to white `#FFFFFF`. Subtle `#F3F0E8` for contextual distinction (disclaimer strips, footer).

Light-mode only. The use scene is daytime, office-ambient, high-glare — dark mode would reverse the authority signal.

## Ink Hierarchy

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#1A1209` | Headlines, data values, borders-as-rules |
| `--ink-2` | `#3D3022` | Table cell body text |
| `--ink-3` | `#6B5D4A` | Secondary labels, descriptions |
| `--ink-4` | `#9C8E7E` | Section labels (uppercase, tracked), metadata |
| `--ink-ghost` | `#C4BAB0` | Placeholder text, scrollbar thumb |

## Accent

Deep IDX navy `#1C2B4A` — used strictly for primary CTA buttons and nav active state. Not decorative.

## Signal Colors

Used **only in data** — never as decoration.

| Token | Hex | Meaning |
|---|---|---|
| `--signal` | `#C41E3A` | IDX red — losers, alerts, destructive actions |
| `--pos` | `#1B5E20` | Forest green — gainers, best-buy highlights |

The brand wordmark `.World` uses `--signal` because it signals action, not because it decorates.

## Typography

- **Sans**: Geist / Inter — navigation, labels, UI chrome
- **Serif**: Instrument Serif — editorial headlines only (masthead H1)
- **Figures**: `font-variant-numeric: tabular-nums` everywhere numbers appear
- **Tracking floor**: -0.03em on headings; uppercase labels at +0.08em to +0.1em

Body measure: 65–75ch max-width on prose. Display max: 44px (clamp).

## Grammar

**Hairline rules, not cards.** Data lives on open ground with 1px `--bg-rule` lines separating sections. No `border-radius > 10px` on data surfaces. No `box-shadow` on tables.

**2px double-weight rule** marks section boundaries (masthead bottom, table header bottom, footer top). This is the only "heavy" mark in the system.

**Cards** (`border-radius:var(--radius-lg)` = 10px) reserved for the Rate Alert modal dialog only — it needs interruption focus.

## Refused

Per craft-floor:
- Gradient text (banned — emphasis from weight or size)
- Glass + blur as decoration
- Colored `border-left` > 1px on cards
- Section numbers (01/02/03)
- Rounded-3xl anywhere
- Dark ground (the use scene doesn't call for it)
- Gradient buttons (CTA uses flat `--accent` navy)

## Components

- `.btn-primary` — flat navy `--accent`, no shadow, hover darkens 10%
- `.btn-ghost` — transparent with 1px `--bg-rule` border
- `.field` — white ground, 1px `--bg-rule`, `--accent` border on focus
- `.pill-pos` / `.pill-neg` / `.pill-neutral` — small status labels, pill shape only for status; not for section navigation
- `.nav-tab` — underline reveal on active/hover; no pill/pill-group shape
- `.data-table` — full-width, no external border, `2px var(--ink)` header rule
- `.animate-shimmer` — warm shimmer (`--shimmer-a` / `--shimmer-b`), 1.6s
- `.live-dot` — 8px green dot with pulse ring (forest green, not emerald)

## Motion

Single authored moment: the nav-tab underline `scaleX` transition (160ms cubic-bezier ease). All other transitions are 120ms linear for color/background. No entrance animations on sections. No scatter effects.

## Responsive

Mobile-first. Masthead wraps to stacked column at `< 640px`. Nav tabs scroll horizontally (scrollbar hidden). Data tables scroll horizontally inside their container. Footer stacks to single column.

## Spelling / Language

- Section labels: Indonesian, uppercase, tracked
- Data labels: Indonesian, sentence-case
- English allowed only in technical identifiers (API endpoint names, rate type codes)
