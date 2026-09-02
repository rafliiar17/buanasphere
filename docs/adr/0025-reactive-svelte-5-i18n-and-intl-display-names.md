# ADR 0025: Svelte 5 Reactive i18n Rune State & Universal Country/Currency Localization

## Status
**Accepted**

## Context & Problem Statement
Meskipun kamus penerjemahan telah diperluas pada ADR-0024, verifikasi visual menunjukkan bahwa ketika pengguna mengubah bahasa di `Navbar` (misalnya beralih ke `EN`), komponen peta (`MapControlsToolbar.svelte`, `CountryInspectorDrawer.svelte`, `WorldRateMap.svelte`, dll.) tidak langsung memperbarui teks tampilannya. Hal ini terjadi karena:
1. `t()` sebelumnya membaca variabel internal closure statis (`currentLocaleState`) alih-alih Svelte 5 `$state` rune, sehingga Svelte 5 reactivity engine tidak mendeteksi ketergantungan reaktif (*reactive dependency*) pada pemanggilan `t('...')` di dalam template markup.
2. Nama 195+ negara (seperti `Amerika Serikat`, `Jepang`, `Jerman`) dan nama valas masih bersifat statis (hardcoded bahasa Indonesia) dari dataset `country-mapping.ts` tanpa konversi dinamis ke bahasa Inggris (`United States`, `Japan`, `Germany`).

## Decision Drivers
- **Zero-Refresh Seamless Language Switch**: Seluruh teks, kontrol toolbar, pencarian, dan drawer wajib berganti bahasa seketika saat tombol bahasa diklik tanpa reload halaman.
- **Universal Country & Currency Localization**: Seluruh 195+ nama negara dan nama mata uang dunia wajib diterjemahkan secara dinamis sesuai bahasa aktif (ID vs EN).
- **Standards-Compliant**: Menggunakan ECMAScript Standard Web API `Intl.DisplayNames` (zero runtime bloat, performa tinggi, standar browser modern).

## Architecture Decisions

### 1. Svelte 5 `$state` Rune for i18n (`frontend/src/lib/i18n/state.svelte.ts`)
Membuat state reaktif menggunakan Svelte 5 Rune `$state` dalam file `.svelte.ts`:
```ts
class LocaleStore {
  current = $state<SupportedLocale>(getInitialLocale());
}
export const localeState = new LocaleStore();
```
Ketika fungsi `t(...)` dipanggil di dalam template mana pun, ia membaca `localeState.current`. Ketergantungan ini dicatat secara otomatis oleh Svelte 5, sehingga mutasi `setLocale('en')` langsung memicu *fine-grained re-render* pada seluruh node teks yang menggunakan `t()`.

### 2. Universal Country & Currency Name Localizer (`getCountryName` & `getCurrencyName`)
Mengimplementasikan resolver nama negara dan mata uang menggunakan `Intl.DisplayNames`:
- `getCountryName(iso3, fallbackName?, targetLocale?)`: Mengonversi ISO-3 ➔ ISO-2 ➔ `Intl.DisplayNames(locale, { type: 'region' })`.
  - Contoh: `USA` ➔ `Amerika Serikat` (ID) / `United States` (EN).
  - Contoh: `JPN` ➔ `Jepang` (ID) / `Japan` (EN).
  - Contoh: `SAU` ➔ `Arab Saudi` (ID) / `Saudi Arabia` (EN).
- `getCurrencyName(currencyCode, fallbackName?, targetLocale?)`:
  - Contoh: `USD` ➔ `Dolar Amerika Serikat` (ID) / `US Dollar` (EN).
  - Contoh: `JPY` ➔ `Yen Jepang` (ID) / `Japanese Yen` (EN).

### 3. Reactive Map Country Data & Search Engine
Memperbarui `mapData`, `searchResults`, dan `selectedCountry` agar nama negara dan mata uang di-generate secara reaktif menggunakan `getCountryName` dan `getCurrencyName`.

## Consequences
- **Positif**:
  - Seluruh komponen di seluruh aplikasi (peta 3D/2D, toolbar kontrol, drawer inspektor, tabel matriks, kalkulator konversi, grafik Google) langsung berganti bahasa seketika secara sinkron.
  - Nama seluruh 195+ negara dan mata uang dunia secara otomatis tersedia dalam bahasa Indonesia baku dan bahasa Inggris baku.
- **Negatif**:
  - Membutuhkan pemetaan ISO-3 ke ISO-2 yang lengkap untuk 195+ negara anggota PBB (disediakan di `iso-mapping.ts`).
