# Laporan Verifikasi SDLC 0029: Dynamic Micro-App Branding & View Routing

## 1. Problem Statement
Saat pengguna membuka route spesifik seperti `http://localhost:5173/time`, antarmuka web sebelumnya masih menampilkan branding dan telemetry statis *"Kurs . World"* dan *"Pasar Valuta Asing Global 195+ Negara..."* pada:
- `GlobalAppSplashScreen.svelte` (Splash screen loading).
- `Navbar.svelte` (Wordmark logo).
- `<svelte:head><title>` (Judul tab browser).
- `WorldRateMap.svelte` (Live status pill top-left).

## 2. Solusi & Perubahan Arsitektur
1. **Dynamic Splash Screen Branding (`GlobalAppSplashScreen.svelte`)**:
   - Reaktif membaca `geoStore.activeApp`:
     - `/time` ➔ **Time** `.World` (*"Jam Global Real-time, Solar Daylight & Selisih Waktu vs WIB"*). Telemetry: *"Memuat Zona Waktu & Jam Digital 195+ Negara..."*.
     - `/flight` / `/flow` ➔ **Flow** `.Corridors` (*"Jalur Arus Remitansi & Rute Transfer Dana Global ke Indonesia"*). Telemetry: *"Memuat Rute Koridor Remitansi 3D ke Jakarta..."*.
     - `/passport` ➔ **Passport** `.World` (*"Peta Kekuatan Paspor & Indeks Akses Bebas Visa Global"*). Telemetry: *"Memuat Indeks Kekuatan Paspor & Bebas Visa..."*.
     - `/` / `/kurs` ➔ **Kurs** `.World` (*"Pasar Valuta Asing Global 195+ Negara Terhadap Rupiah (IDR)"*). Telemetry: *"Memuat Nilai Tukar 195+ Valuta Asing Dunia..."*.
2. **Dynamic Navbar Wordmark & Switcher (`Navbar.svelte`)**:
   - Menampilkan logo wordmark dinamis yang menautkan ke canonical path masing-masing app.
   - Menambahkan tombol interaktif **App Switcher** (`🕒 TimeWorld`, `✈️ Flow Corridors`, dll.) untuk berganti micro-app kapan saja.
3. **Dynamic Page Title & Map Status Pill**:
   - Tab title browser `<title>` otomatis sinkron dengan `{activeApp.name} — {activeApp.tagline} | globe.arafz.id`.
   - Status pill di pojok kiri atas canvas peta 3D menampilkan nama aplikasi aktif.

## 3. Bukti Quality Gates

| Quality Gate | Perintah | Status | Keterangan |
|---|---|---|---|
| **Unit Test Suite** | `rtk bun test` | ✅ PASSED | **263 / 263 Tests Lulus 100% (15.969 assertions)** |
| **Diagnostics & Check** | `rtk bun run check` | ✅ PASSED | **0 Errors, 0 Warnings** (Backend `tsc` + Frontend `svelte-check`) |
| **Production Build** | `rtk bun run build` | ✅ PASSED | Production bundle build sukses (26.92s) |
| **Git Safety Constraints** | `rtk git status` | ✅ PASSED | Branch `fix/dynamic-app-branding-and-view-routing` |
