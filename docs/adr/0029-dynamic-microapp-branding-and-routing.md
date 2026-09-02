# ADR 0029: Dynamic Micro-App Branding, Direct Routing, and Telemetry Adaptation

## Status
**Accepted**

## Context & Problem Statement
Ketika pengguna mengakses route spesifik seperti `http://localhost:5173/time` (atau `https://globe.arafz.id/time`), antarmuka masih menampilkan branding dan telemetry statis *"Kurs . World"* dan *"Pasar Valuta Asing Global 195+ Negara..."* pada:
1. `GlobalAppSplashScreen.svelte` (Splash screen loading).
2. `Navbar.svelte` (Wordmark logo).
3. `<svelte:head><title>` (Judul tab browser).
4. `WorldRateMap.svelte` / `Globe3DView.svelte` (Layer visualisasi awal).

Hal ini membuat route `/time`, `/flight`, dan `/passport` terasa seperti tetap berada di aplikasi Kurs daripada aplikasi mikro mandiri yang sesuai dengan URL-nya.

## Architecture Decisions

### 1. Dynamic Root Branding Binding via `geoStore.activeApp`
- `GlobalAppSplashScreen.svelte`, `Navbar.svelte`, dan `App.svelte` secara reaktif membaca `geoStore.activeApp`:
  - **`/time` (`world-time`)**:
    - Brand Wordmark: **Time** `.World`
    - Subtitle: *Jam Global Real-time, Solar Daylight & Selisih Waktu vs WIB*
    - Telemetry: *Memuat Zona Waktu & Jam Lokal 195+ Negara...*
    - Head Title: `TimeWorld — Jam Global Real-time 195+ Negara | globe.arafz.id`
    - Default Metric: `local_hour` (Solar Daylight Heatmap)
  - **`/flight` / `/flow` (`remittance-flow`)**:
    - Brand Wordmark: **Flow** `.Corridors`
    - Subtitle: *Jalur Arus Remitansi & Rute Transfer Dana Global ke Indonesia*
    - Telemetry: *Memuat Rute Koridor Remitansi & Jalur Penerbangan 3D...*
    - Head Title: `Flow Corridors — Jalur Arus Remitansi Global ke Indonesia | globe.arafz.id`
    - Default Metric: `volume` (3D Great-Circle Arcs)
  - **`/passport` (`passport-power`)**:
    - Brand Wordmark: **Passport** `.World`
    - Subtitle: *Peta Kekuatan Paspor & Indeks Akses Bebas Visa Global*
    - Telemetry: *Memuat Indeks Bebas Visa & Mobilitas Paspor Global...*
    - Head Title: `Passport World — Peta Kekuatan Paspor & Bebas Visa | globe.arafz.id`
    - Default Metric: `visa_free` (Mobility Score Heatmap)
  - **`/` / `/kurs` (`fx-rates`)**:
    - Brand Wordmark: **Kurs** `.World`
    - Subtitle: *Pasar Valuta Asing Global 195+ Negara Terhadap Rupiah (IDR)*
    - Telemetry: *Memuat Nilai Tukar 195+ Valuta Asing Dunia...*
    - Head Title: `Kurs World — Kurs Valas Real-Time 195+ Negara | globe.arafz.id`
    - Default Metric: `rate` (Spot Rate Heatmap)

### 2. Immediate Path Initialization (Pre-Mount)
- `geoStore.svelte.ts` mengevaluasi `window.location.pathname` saat inisialisasi awal (*instant synchronous evaluation*) agar splash screen dan navbar langsung ter-render dengan branding yang sesuai sejak frame pertama tanpa layout shift atau flicker.

## Consequences
- **Positif**:
  - Direct deep-linking ke `globe.arafz.id/time` langsung menampilkan identitas **TimeWorld** secara konsisten.
  - Setiap aplikasi mikro memiliki identitas visual, telemetry loader, dan layer 3D yang relevan.
- **Negatif**:
  - Membutuhkan sinkronisasi metadata branding di dictionary i18n / plugin config.
