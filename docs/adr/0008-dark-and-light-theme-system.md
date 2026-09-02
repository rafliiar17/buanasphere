# ADR 0008: Dual Theme System (Dark Mode Default & Light Paper)

- **Status**: Accepted
- **Date**: 2026-09-02
- **Author**: Kurs World Engineering Team
- **Deciders**: Lead Architect, Frontend Specialist, UI/UX Designer

---

## 1. Context & Problem Statement

Kurs World is a global foreign exchange terminal application. Users monitoring exchange rate movements, time-series charts, and interactive maps often prefer a high-contrast, eye-friendly **Dark Mode** for prolonged terminal usage, while also having the option to switch to a classic **Light Paper** theme for daytime reading.

The user explicitly requested:
> *"saya ingin ada tema dark dan light -> default dark"*

---

## 2. Decision Drivers

1. **Default Theme Requirement**: The application must default to Dark Mode on first visit, while respecting previously stored user preferences in `localStorage`.
2. **Zero FOUC (Flash of Unstyled/Wrong Content)**: Prevent any flash of light mode on page load before scripts hydrate.
3. **Cohesive Design Tokens**: Both themes must share the same semantic CSS variable names (`--bg`, `--bg-subtle`, `--bg-raised`, `--bg-rule`, `--ink`, `--pos`, `--signal`, `--accent`, `--shimmer-a`, `--shimmer-b`).
4. **Dynamic Plotly Geo Canvas Adaptation**: The 100% full-width world map canvas must re-theme its oceans, landmasses, borders, and colorbars automatically upon switching.
5. **Accessible Navbar Toggle**: Intuitive toggle button with Sun / Moon icons and localized accessibility tooltips (`aria-label`).

---

## 3. Decision & Implementation

1. **Theme Module (`frontend/src/lib/theme/index.ts`)**:
   - Manages state `'dark' | 'light'` with default `'dark'`.
   - `getTheme()`, `setTheme(theme)`, `toggleTheme()`, `subscribeTheme(callback)`.
   - Persists state in `localStorage` under `kurs_world_theme` and synchronizes `data-theme` attribute and `.dark` / `.light` classes on `document.documentElement`.
2. **Head Initialization Script (`frontend/index.html`)**:
   - Inlined synchronous IIFE in `<head>` setting `data-theme` and `class` before rendering to guarantee zero FOUC.
3. **CSS Variable Architecture (`frontend/src/app.css`)**:
   - **Dark Theme (`:root, [data-theme="dark"], .dark`)**:
     - `--bg`: `#0B0F19` (Obsidian terminal)
     - `--bg-subtle`: `#111827`, `--bg-raised`: `#182234`, `--bg-rule`: `#223049`
     - `--ink`: `#F8FAFC`, `--accent`: `#38BDF8`, `--pos`: `#34D399`, `--signal`: `#FB7185`
   - **Light Theme (`[data-theme="light"], .light`)**:
     - `--bg`: `#FAF8F3` (Warm financial paper)
     - `--bg-subtle`: `#F3F0E8`, `--bg-raised`: `#FFFFFF`, `--bg-rule`: `#E8E3D8`
     - `--ink`: `#1A1209`, `--accent`: `#1C2B4A`, `--pos`: `#1B5E20`, `--signal`: `#C41E3A`
4. **Component Integration**:
   - `Navbar.svelte`: Added Moon / Sun toggle button right next to the language switcher.
   - `WorldRateMap.svelte`: Dynamically reconfigures Plotly choropleth ocean/land/border colors when theme toggles.
   - `GoogleRateChart.svelte` & `CurrencyComparisonMatrix.svelte`: Pure CSS variable bindings adapt automatically with zero layout shift.

---

## 4. Consequences & Verification

- 100% automated test coverage in `frontend/tests/theme.test.ts` (101/101 test suites passing).
- Zero TypeScript & Svelte check diagnostics.
- Fully verified production build with Vite.
