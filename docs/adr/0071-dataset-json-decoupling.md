# ADR 0071: Dekopling Menyeluruh Dataset Statis TypeScript ke Format JSON

## Status
Accepted

## Context
Pada arsitektur awal dan beberapa iterasi penambahan fitur (ADR 0052, 0054, 0063), beberapa dataset spasial dan demografi ditulis secara langsung (*hardcoded*) di dalam file TypeScript (`.ts`), antara lain:
1. `worldCitiesTimeData.ts` (1.830 baris, 43.2 KB) — memuat array `WORLD_CITIES_TIME`.
2. `worldCapitalsDetail.ts` (540 baris, 18.0 KB) — memuat `CAPITAL_COORDINATES_MAP` dan `NATIONAL_ANTHEMS_MAP`.
3. `financialHubsData.ts` (284 baris, 6.3 KB) — memuat array `GLOBAL_FINANCIAL_HUBS`.
4. `country-flag-colors.ts` (208 baris, 10.2 KB) — memuat `COUNTRY_FLAG_COLOR_MAP`.
5. `country-map.ts` (backend, 302 baris) & `country-mapping.ts` (frontend, 371 baris) — memuat `COUNTRY_CURRENCY_LIST`.

Kondisi *hardcoded* ini bertentangan dengan prinsip pemisahan data & kode (*Data-Code Decoupling*, ADR 0047), menyebabkan:
- Beban parsing dan memori pada TypeScript compiler (`tsc` dan `svelte-check`) membengkak.
- File kode logika tercampur dengan ribuan baris data literal mentah.
- Duplikasi data statis antara backend dan frontend tidak tersentralisasi.

## Decision
1. **Ekstraksi ke File `.json` Terpisah**:
   - `worldCitiesTimeData.ts` ➔ Ekstrak ke `world_cities_time_dataset.json`. File `.ts` hanya mengekspor interface `WorldCityTimeInfo` dan typed loader `WORLD_CITIES_TIME`.
   - `worldCapitalsDetail.ts` ➔ Ekstrak ke `capital_details_dataset.json` yang memuat `coordinates` dan `anthems`. File `.ts` hanya mengekspor interface dan typed map.
   - `financialHubsData.ts` ➔ Ekstrak ke `financial_hubs_dataset.json`. File `.ts` hanya mengekspor interface `FinancialHubData` dan typed array.
   - `country-flag-colors.ts` ➔ Ekstrak ke `country_flag_colors.json`. File `.ts` mengekspor typed map `COUNTRY_FLAG_COLOR_MAP`.
   - `country_currency_dataset.json` ➔ Ekstrak `COUNTRY_CURRENCY_LIST` ke file JSON sentral yang dapat diakses frontend dan backend.

2. **Jaminan Kontrak & Type-Safety**:
   - Seluruh file wrapper `.ts` tetap mengekspor nama konstanta, fungsi, dan tipe TypeScript yang identik (*100% backwards-compatible*).
   - Penggunaan `import ... from './...json'` dengan typed casting memastikan tidak ada *breaking change* pada seluruh consumer kode (GlobeScene, plugin, inspektur, dan unit test).

3. **Pelaksanaan Menggunakan Subagents**:
   - Pekerjaan ekstraksi dan validasi data didelegasikan ke subagents secara terisolasi dan paralel untuk memastikan akurasi data JSON serta kelulusan seluruh test suite.

## Consequences
### Positif
- Pengurangan ribuan baris kode TypeScript di codebase, menghasilkan waktu kompilasi `svelte-check` dan build Vite yang jauh lebih cepat.
- Pemisahan tanggung jawab yang bersih: data statis murni berada di `.json`, sedangkan tipe dan fungsi logika murni berada di `.ts`.
- 100% konsisten dengan 9 dataset JSON yang telah ada sebelumnya.

### Negatif / Trade-offs
- File `.json` berukuran besar membutuhkan konfigurasi `resolveJsonModule: true` di TypeScript (yang sudah aktif secara default di Bun & Vite).
