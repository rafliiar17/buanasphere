# ADR 0009: Full-Viewport (100vh) Map-First Architecture with Top-Right Floating Controls

- **Status**: Accepted
- **Date**: 2026-09-02
- **Author**: Kurs World Engineering Team
- **Deciders**: Lead Architect, Frontend Specialist, Product Lead

---

## 1. Context & Problem Statement

Users requested a pure, map-first, immersive terminal experience similar to interactive GIS applications (Google Maps, Apple Maps, Mapbox):
> *"saya ingin kita fokus ke 1 layar itu peta semua kaya maps namun dengan inputan" di sebelah kanan atas"*

Previously, the layout featured traditional webpage vertical scrolling with masthead text, stacked sections, and static forms. To transform Kurs World into a world-class visual FX terminal, the map canvas needed to occupy the entire viewport (`100vh`/`100vw`) without scrolling, with all search inputs, region filters, metric switches, and quick conversion tools floating neatly in the **top-right corner**.

---

## 2. Decision Drivers

1. **1-Screen Zero-Scroll Viewport**: The application opens directly into a full-screen, high-resolution interactive world FX choropleth map.
2. **Top-Right Floating Control Card**: A modern, translucent glassmorphic panel in the top-right overlaying the map with:
   - Search autocomplete for 195+ countries / currency codes.
   - Metric switcher (Nilai Kurs Rp vs Performa 24 Jam %).
   - Region filter chips (ASEAN, Asia Timur, Eropa, Amerika, dll.).
   - Mini Quick Converter widget with live IDR computation.
   - Reset Zoom / Center Map button.
3. **Bottom Floating Dock**: Floating bottom strip containing the market mover ticker and quick navigation pills for overlaying full analytics (Google FX charts, comparison matrix, multi-currency converter, and rate alert modal).
4. **On-Demand Right Drawer**: Smooth slide-over drawer when any country is clicked on the map.

---

## 3. Decision & Implementation

1. **`App.svelte`**:
   - Converted to `h-screen w-screen overflow-hidden flex flex-col`.
   - Dedicated `main` viewport height `h-[calc(100vh-52px)]` with zero background layout shift.
   - Integrated floating bottom dock with glassmorphism (`backdrop-blur-xl`).
2. **`WorldRateMap.svelte`**:
   - Plotly choropleth container styled to `absolute inset-0 w-full h-full` with dynamic resize observer.
   - Top-right floating controls panel (`absolute top-4 right-4 z-20 w-[92vw] sm:w-[380px]`).
   - Top-left live edge sync pulse indicator.
   - Full slide-over drawer for country inspection.

---

## 4. Consequences & Verification

- Clean, immersive 100vh map experience on desktop and mobile.
- 100% test pass rate across backend & frontend test suites (101/101 tests passed).
- Zero TypeScript and Svelte diagnostics warnings.
