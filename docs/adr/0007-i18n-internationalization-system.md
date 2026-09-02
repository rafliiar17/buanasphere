# ADR 0007: Internationalization (i18n) Architecture & Dual Language System (ID / EN)

- **Status**: Accepted
- **Date**: 2026-09-02
- **Author**: Kurs World Engineering Team
- **Deciders**: Lead Architect, Frontend Specialist, Product Lead

---

## 1. Context & Problem Statement

Kurs World is expanding from an Indonesian domestic rate tool to a comprehensive global foreign exchange information platform covering **195+ world currencies and sovereign nations**. While Indonesian Rupiah (IDR) remains the primary base currency, international users, expats, developers, and global travelers require English language support.

Prior to this decision, UI copy was hardcoded in Indonesian across all components (`Navbar`, `App`, `WorldRateMap`, `GoogleRateChart`, `CurrencyComparisonMatrix`, `CurrencyConverter`, `RateCard`, `Footer`). To ensure a world-class user experience, zero layout shift, and clean code maintainability, we needed a robust, lightweight, zero-overhead internationalization (i18n) system tailored for Svelte 5 Runes.

---

## 2. Decision Drivers

1. **Zero External Runtime Bloat**: Avoid heavy external i18n libraries that inject kilobytes of parsing overhead into edge bundle sizes.
2. **Svelte 5 Runes Native**: Seamless integration with Svelte 5 reactive primitives (`$state()`, `$derived()`, subscription listener).
3. **Dot-Notation Path Resolution & Parameter Interpolation**: Enable nested lookup (e.g. `t('matrix.pagination', { from: 1, to: 20, total: 195 })`).
4. **Instant Language Switching with LocalStorage Persistence**: Switch between `🇮🇩 ID` and `🇬🇧 EN` instantaneously without full-page reloads.
5. **Locale-Aware Formatters**: Number, currency, and date formatting adhering to `id-ID` and `en-US` conventions.

---

## 3. Considered Options

- **Option A**: Heavy external library (e.g., `svelte-i18n`, `i18next`, `formatjs`).
  - *Cons*: Adds bundle size, complex configuration, potential runtime hydration mismatches.
- **Option B**: Native Svelte 5 Runes Reactive i18n Engine (Chosen).
  - *Pros*: Zero dependencies, <3KB bundle footprint, instantaneous reactivity, type-safe dictionaries, dot-notation resolver, param interpolation.

---

## 4. Decision & Implementation

We adopted **Native Svelte 5 Runes i18n Engine**:
1. **Types & Locales**:
   - `frontend/src/lib/i18n/types.ts`: Defined `SupportedLocale = 'id' | 'en'`, `SUPPORTED_LOCALES`, `TranslationParams`.
   - `frontend/src/lib/i18n/locales/id.ts`: Complete Indonesian dictionary covering 100% of UI strings.
   - `frontend/src/lib/i18n/locales/en.ts`: Complete English dictionary mapped 1-to-1 to Indonesian keys.
2. **Core Resolver & Reactive Store**:
   - `frontend/src/lib/i18n/index.ts`:
     - `t(keyPath, params?, targetLocale?)`: Deep dot-notation traversal with `{key}` interpolation and automatic fallback.
     - `setLocale(locale)` / `getLocale()`: Reactive state with `localStorage` and `document.documentElement.lang` persistence.
     - `subscribeLocale(callback)`: Reactive listener for cross-component re-renders.
     - `formatCurrencyLocale(val, code, opts)` & `formatDateLocale(date, opts)`.
3. **Component Integration**:
   - `Navbar.svelte`: Added quick language switch buttons (`🇮🇩 ID` / `🇬🇧 EN`) and localized title/disclaimer strip.
   - `App.svelte`: Localized masthead, section navigation tabs, rate alert modal, and footer strip.
   - `WorldRateMap.svelte`: Localized search bar placeholder, region pills, inspector drawer, quick convert widget, and chart headers.
   - `GoogleRateChart.svelte`: Localized timeframe pills (`1H/1D`, `5H/5D`, `Maks/Max`), statistics grid (`Open`, `High`, `Low`, `Avg`), and crosshair inspection badge.
   - `CurrencyComparisonMatrix.svelte`: Localized table headers, category pills, region filters, search placeholder, sort options, and pagination info.
   - `CurrencyConverter.svelte` & `RateCard.svelte`: Localized calculator fields, preset chips, and copy buttons.

---

## 5. Consequences & Quality Impact

- **Positive**:
  - 100% of UI copy across the application is now localized.
  - Zero bundle weight penalty (<3KB unminified).
  - Full test coverage for both languages (`frontend/tests/i18n.test.ts`).
  - Easy extensibility to future languages (e.g. Japanese, Arabic, Mandarin) by adding a single locale file.
