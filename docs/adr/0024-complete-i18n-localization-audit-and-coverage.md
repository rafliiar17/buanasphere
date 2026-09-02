# ADR 0024: 100% i18n Localization Coverage and Strict Translation Key Parity

## Status
**Accepted**

## Context & Problem Statement
Kurs World menyajikan platform komparasi nilai tukar mata uang global untuk audiens Indonesia dan internasional. Sistem i18n sebelumnya telah diperkenalkan di [`frontend/src/lib/i18n/`](file:///home/archy/Projects/kurs-world/frontend/src/lib/i18n/), namun audit mendalam menemukan bahwa:
1. Beberapa komponen UI (seperti `CountryInspectorDrawer.svelte`, `MapControlsToolbar.svelte`, `RateCard.svelte`, `GlobalMoversTicker.svelte`, dan `Footer.svelte`) masih menyisipkan teks hardcoded dalam Bahasa Indonesia atau Inggris pada atribut `alt`, `title`, `aria-label`, string summary clipboard, filter kawasan, dan tombol tindakan.
2. Tidak ada tes otomatis yang menegakkan **100% Simetri Kunci Kamus (*Key Parity*)** antara kamus Bahasa Indonesia ([`locales/id.ts`](file:///home/archy/Projects/kurs-world/frontend/src/lib/i18n/locales/id.ts)) dan Bahasa Inggris ([`locales/en.ts`](file:///home/archy/Projects/kurs-world/frontend/src/lib/i18n/locales/en.ts)).
3. Label filter kawasan di peta (`map-constants.ts`) bersifat statis dan belum merespons pergantian bahasa secara dinamis.

## Decision Drivers
- **Zero Untranslated Strings**: Setiap kata, kalimat, tooltip, placeholder, teks clipboard, dan label aksesibilitas harus dapat diterjemahkan.
- **Strict Key Parity**: Setiap kunci yang didefinisikan pada kamus `id` wajib memiliki padanan di kamus `en` (dan sebaliknya), diverifikasi melalui automated TDD unit tests.
- **Dynamic Localization**: Format tanggal, waktu, mata uang, dan kawasan dunia harus terikat langsung ke locale aktif pengguna.

## Architecture Decisions

### 1. Dictionary Expansion & Parity Invariants
Memperluas namespace kamus penerjemahan:
- `map.*`: Menambahkan kunci `flagAlt`, `closeInspector`, `bankCount`, `openFullConverterBtn`, `resetZoom`, `togglePanel`, `countriesFound`, `popularRecommendations`, `selectKey`, `noCountriesFound`, `noResultsFor`, `togglePinLabels`, `selectFocusRegion`, `countryCount`, `regions.*`.
- `cards.*`: Menambahkan kunci `shareTitle`, `shareSource`, `shareBuy`, `shareSell`, `shareChange`, `shareFooter`.
- `ticker.*`: Menambahkan kunci `rateTitle`.
- `common.*`: Menambahkan kunci `backToMap`.
- `footer.*`: Menambahkan kunci `edgeInfo`.
- `chart.*`: Menambahkan kunci `interactiveChartAria`.

### 2. Formatters & Helpers (`frontend/src/lib/i18n/index.ts`)
- **`formatDateTimeLocale(date, options)`**: Memformat tanggal dan waktu secara presisi berdasarkan locale pengguna (`id-ID` vs `en-US`).
- **`formatTimeLocale(date, options)`**: Memformat komponen jam dan menit.
- **`getLocalizedRegion(regionId, targetLocale?)`**: Mengembalikan nama kawasan dunia yang terlokalisasi.

### 3. Svelte 5 Component Refactoring
Mengganti seluruh string statis di seluruh komponen Svelte 5 (`.svelte`) dengan pemanggilan `t('namespace.key', params)`.

## Consequences
- **Positif**:
  - Pengalaman pengguna bilingual yang sempurna dan konsisten di seluruh layar dan viewport.
  - TDD regression test mencegah penambahan kunci baru tanpa terjemahan bahasa Inggris.
  - Shareable clipboard snapshot sekarang mengikuti bahasa yang sedang aktif.
- **Negatif**:
  - Penambahan teks baru di masa depan wajib memperbarui kedua file kamus (`id.ts` dan `en.ts`).
