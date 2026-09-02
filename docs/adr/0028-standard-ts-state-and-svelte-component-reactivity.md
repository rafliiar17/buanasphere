# ADR 0028: Standard TypeScript State Classes & In-Component Svelte 5 Deep Reactivity

## Status
**Accepted**

## Context & Problem Statement
Ketika macro `$state(...)` ditaruh di dalam file TypeScript terpisah (`state.svelte.ts`, `mapState.svelte.ts`), bundler Vite (esbuild) menganggap file tersebut sebagai TypeScript murni jika di-import tanpa ekstensi file lengkap atau dalam konfigurasi SPA Vite. Akibatnya, pemanggilan `$state()` tidak dikonversi menjadi sinyal reaktif oleh Svelte compiler, melainkan dipanggil secara mentah saat runtime browser, memicu error `Uncaught Svelte error: rune_outside_svelte`.

## Decision Drivers
- **100% Runtime Stability**: Menjamin tidak ada satupun pemanggilan rune mentah di luar boundary komponen `.svelte`.
- **Deep Reactivity Svelte 5**: Memanfaatkan proxy `$state(...)` Svelte 5 secara alami di dalam komponen `.svelte`.
- **Type-Safety & Portability**: Menjaga state logic (i18n locale, map state store) sebagai kelas TypeScript murni yang dapat diuji secara independen di unit testing tanpa membutuhkan mock/polyfill `$state`.

## Architecture Decisions

### 1. Migrasi `state.svelte.ts` ke `state.ts`
- Mengubah `state.svelte.ts` menjadi `frontend/src/lib/i18n/state.ts`.
- Menggunakan standar getter/setter dengan pub-sub listener set (`subscribeLocale`).
- Menghapus ketergantungan polyfill `globalThis.$state`.

### 2. Migrasi `mapState.svelte.ts` ke `mapState.ts`
- Mengubah `mapState.svelte.ts` menjadi `frontend/src/lib/features/map/mapState.ts`.
- Menjadikan `MapState` kelas TypeScript murni dengan properti biasa (`projectionMode: 'globe' | 'flat'`, dll.).
- Di dalam `WorldRateMap.svelte`, objek di-instansiasi dengan deep reactivity Svelte 5:
  ```ts
  const mapState = $state(new MapState());
  ```
  Ini menjadikan seluruh properti `mapState` reaktif secara mendalam (*deep reactive proxy*) di seluruh siklus hidup Svelte 5 tanpa risiko runtime macro.

### 3. Update Import Path & Type Aliases
- Mengarahkan seluruh import `$lib/i18n` dan `$lib/features/map` ke path `.ts` standar.

## Consequences
- **Positif**:
  - Runtime error `rune_outside_svelte` 100% tereliminasi.
  - Reaktivitas komponen tetap berjalan seketika saat locale atau parameter peta berganti.
  - Test suite berjalan lebih cepat tanpa polyfill tiruan di SSR/Bun test runtime.
- **Negatif**:
  - Membutuhkan pembersihan file lama `state.svelte.ts` dan `mapState.svelte.ts`.
