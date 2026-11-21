---
name: Industrial Field Ops
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4a607c'
  primary: '#00162e'
  on-primary: '#ffffff'
  primary-container: '#142b45'
  on-primary-container: '#7d93b2'
  inverse-primary: '#b2c8e9'
  secondary: '#455f87'
  on-secondary: '#ffffff'
  secondary-container: '#b5d0fd'
  on-secondary-container: '#3e5980'
  tertiary: '#221200'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e2400'
  on-tertiary-container: '#ca8100'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e4ff'
  primary-fixed-dim: '#b2c8e9'
  on-primary-fixed: '#031c36'
  on-primary-fixed-variant: '#334863'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#adc8f5'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#2d486d'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-code:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-reliability, mission-critical interface engineered specifically for field engineers, maintenance technicians, and plant operators working in demanding physical environments. The personality is disciplined, functional, rugged, and unambiguous. It balances the precision of heavy industrial engineering with modern digital ergonomics.

The visual style blends **Corporate / Modern utilitarianism** with **tactile industrial clarity**. The interface eliminates non-essential decorative styling, prioritizing immediate scanability, direct information architecture, and rapid manual execution under harsh lighting, low visibility, and physically restrictive conditions (such as gloved operation). Visual hierarchy is driven by high-contrast structure, crisp structural division, and purposeful color coding that prevents cognitive fatigue and eliminates operational errors.

## Colors

The color palette is built for extreme legibility in varied field lighting, from direct sunlight to low-light mechanical rooms.

### Core Tokens
- **Primary (`#142B45`)**: Deep industrial navy used for high-emphasis containers, primary actions, navigation headers, and primary focal structures.
- **Secondary (`#1E3A5F`)**: Slate steel blue used for secondary containers, active tabs, sub-headers, and intermediate structural frames.
- **Tertiary / Warning (`#F59E0B`)**: Amber caution orange used for preventive alerts, scheduled maintenance, and non-blocking warnings.
- **Neutral Base (`#64748B`)**: Mid-tone technical slate for metadata, inactive states, icons, and non-critical labels.
- **Neutral Dark (`#334155`)**: Charcoal slate for primary reading text, ensuring crisp legibility without harsh black-on-white vibration.
- **Background (`#F1F4F8`)**: Low-strain cool gray-blue surface that reduces glare in high-luminosity environments.
- **Surface (`#FFFFFF`)**: Pure white reserved for actionable cards, input surfaces, and data display units to ensure separation from the background.

### Operational Status Tokens
Operational states must be mutually exclusive and immediately recognizable across the UI:
- **Operational (`#16A34A`)**: Running / optimal status. Always paired with high-contrast text (`#FFFFFF` on dark, or `#16A34A` on light green container `#DCFCE7`).
- **In Maintenance (`#F59E0B`)**: Under active service or planned intervention. Background container `#FEF3C7` with `#B45309` text.
- **Out of Service / Paused (`#64748B`)**: Planned stoppage or unpowered unit. Background container `#F1F5F9` with `#334155` text.
- **Critical / Fault (`#DC2626`)**: Unscheduled downtime, critical trip, or emergency stoppage. Background container `#FEE2E2` with `#991B1B` text.

### Network Status
- **Online**: Subtle `#16A34A` indicator dot with muted `#64748B` typography.
- **Offline / Syncing**: Persistent, non-blocking `#1E3A5F` top-anchored badge with `#F59E0B` icon indicating queued local sync items.

## Typography

Inter was selected for its tall x-height, neutral letterforms, distinct open apertures, and exceptional readability at quick glance under physical vibration or awkward screen angles.

- **Numerics & Machine Identifiers**: Equipment IDs, tag names, telemetry readouts, and timestamps rely on tabular figures (`tnum`) to maintain structural alignment across vertically aligned data sets.
- **Font Weights**: Limited to 400 (Body reading), 500 (Labels and descriptive pairs), 600 (Semibold headers and buttons), and 700 (Alert headings and critical status indicators). Light weights (300 and below) are strictly prohibited.
- **Letter Spacing**: Maintained at neutral or slightly widened (+0.01em to +0.02em) on all uppercase labels (such as operational status tags and equipment serial badges) to ensure quick recognition from arm’s length.

## Layout & Spacing

The layout is built on a **fluid mobile-first grid** governed by an 8-point baseline rhythm. For industrial mobile use, touch target ergonomics take priority over extreme density.

### Breakpoints and Adaptations
- **Mobile Handheld (360px – 599px)**: Single-column flow with 16px (`1rem`) outer margins and 16px gutters. Interactive elements span full-width or equal 50/50 splits to facilitate one-handed thumb interaction and gloved taps.
- **Rugged Tablet / Vehicle Mount (600px – 1024px)**: 2-column asymmetric split (35% asset list / 65% inspection detail) with 24px outer margins and 16px gutters.
- **Touch Target Safeguard**: Minimum hit-box size across all platforms is 48px × 48px, with high-frequency critical targets (such as checklist confirmations and emergency work order starts) elevated to 52px or 56px height.
- **Thumb Zone Anchor**: Primary actions, confirmation footers, and inspection progress bars are pinned to the bottom viewport zone for rapid execution without excessive reach.

## Elevation & Depth

To maintain high contrast and avoid muddy screens under bright outdoor sunlight, this design system uses **low-contrast structural outlines combined with restrained, solid ambient elevation**. It avoids heavy blur effects and frosted glass.

- **Level 0 (Floor/Canvas)**: Background surface `#F1F4F8`. Flat, non-elevated.
- **Level 1 (Cards, Modules, Input Fields)**: Background `#FFFFFF` with a 1px solid structural border in `#CBD5E1`. Shadow is minimal: `0 1px 3px rgba(20, 43, 69, 0.06)`. This defines crisp mechanical boundaries even when sun glare hits the protective screen cover.
- **Level 2 (Active Sheets, Sticky Footers, Dropdowns)**: Background `#FFFFFF` with a 1px border in `#94A3B8` and a directional shadow: `0 4px 12px rgba(20, 43, 69, 0.12)`.
- **Level 3 (Modal Dialogs, Emergency Confirmation Overlays)**: Surface `#FFFFFF` enclosed in a 2px border in `#1E3A5F` and an elevated shadow: `0 12px 28px rgba(20, 43, 69, 0.22)`, accompanied by a 60% opacity dark backdrop (`#0F1E30`).

## Shapes

The design system employs **Level 1 (Soft)** shape geometry (4px baseline, 8px on cards, 12px on large modals).

Industrial software demands a stable, grounded appearance. Overly rounded bubbles or circular pills feel consumer-oriented and waste valuable horizontal screen space on dense diagnostic data screens. Modest 4px-8px corners provide a clean, modern aesthetic while maintaining the crisp corners and structural integrity expected in precision diagnostic tools.

## Components

### Buttons
- **Touch Ergonomics**: All interactive buttons have a minimum height of **52px** (primary actions) and **48px** (secondary/compact actions) with a minimum 16px internal horizontal padding to allow confident gloved tapping.
- **Primary Button**: Solid `#142B45` background, `#FFFFFF` text, bold `label-lg`, 6px corner radius. Active/pressed state shifts to `#0C1A2A`.
- **Secondary Button**: Background `#FFFFFF`, 1.5px border `#1E3A5F`, text `#1E3A5F`. Active state shifts background to `#F1F4F8`.
- **Destructive/Emergency Action**: Background `#DC2626`, `#FFFFFF` text. Minimum height 56px with full-width container anchor.
- **Haptic/Visual Feedback**: 150ms active state depress animation with a high-contrast inset border change to verify taps in noisy plant conditions where audio cues fail.

### Cards & Equipment Tiles
- **Structure**: Surface `#FFFFFF`, 1px border `#CBD5E1`, 8px corner radius, internal padding of 16px (`space-md`).
- **Hierarchy**: Top section displays Equipment Tag (e.g., `PUMP-301-B`) in `label-code` and operational status chip. Body contains key telemetry metrics (Vibration, Temperature, Hours). Footer provides a direct 48px action link ("Iniciar Ronda" / "Ver Historial").
- **Spacing Principle**: Zero decorative background patterns. Information density is managed via clear typography hierarchy and 8px/12px horizontal and vertical gutters.

### Status Chips & Badges
- **Dimensions**: Minimum 32px height, 12px horizontal padding, 4px corner radius.
- **Operativo**: Background `#DCFCE7`, border 1px solid `#86EFAC`, text `#15803D` with a filled 8px circle dot.
- **En Mantenimiento**: Background `#FEF3C7`, border 1px solid `#FCD34D`, text `#B45309` with a wrench glyph icon.
- **Fuera de Servicio**: Background `#F1F5F9`, border 1px solid `#CBD5E1`, text `#475569` with a pause indicator.
- **En Falla**: Background `#FEE2E2`, border 1.5px solid `#FCA5A5`, text `#B91C1C` with an alert triangle icon.

### Form Inputs & Checklists
- **Input Fields**: 52px minimum height, 1.5px border `#CBD5E1`, background `#FFFFFF`, text `#334155`. On focus: 2px border `#142B45`.
- **Industrial Checkboxes & Radio Toggles**: 28px × 28px square tap target seated inside a 52px interactive hit zone. Checkmarks are 3px stroke width for instantaneous verification.
- **Pass/Fail Inspection Segmented Controls**: Large side-by-side switches (Conforme / No Conforme) spanning the full card width, with minimum 52px height each. "Conforme" activates green `#16A34A`; "No Conforme" activates red `#DC2626`.

### Lists & Tables
- **Row Heights**: Minimum 60px height per item to prevent accidental mis-taps on adjacent equipment records.
- **Separators**: 1px solid line `#E2E8F0`. Zebra striping is avoided in favor of clean white rows with a clear `#E2E8F0` hover/tap highlight.

### Offline & Connectivity Indicator
- **Global Header Bar**: Pinned, low-profile 28px banner under the system status bar.
- **States**:
  - *Normal/Connected*: Hidden or collapsed into a micro-dot (4px) beside the shift clock.
  - *Modo Offline*: `#1E3A5F` slate background with `#FFFFFF` text and amber `#F59E0B` sync badge: `"Modo Local — 4 registros pendientes de sincronización"`.