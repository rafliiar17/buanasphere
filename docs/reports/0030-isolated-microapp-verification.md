# Laporan Verifikasi SDLC 0030: Isolated Micro-App Controls, Tooltips & Views

## 1. Problem Statement & User Requirement
Sebelumnya, antarmuka pusat kontrol peta (kanan), tooltip hover negara, dan bottom dock di `WorldRateMap.svelte` masih *hardcoded* untuk fitur Kurs (kalkulator konversi valas Rupiah, ticker pergerakan valas, metrik kurs nominal). Saat pengguna membuka `/time`, `/flight`, atau `/passport`, kontrol dan tooltip yang muncul masih data valas.

User directive: *"oke gaskan dan ini juga filter/pusat kontrol peta nya buatkan agar terisolasi masing-masing nya ya"*.

## 2. Arsitektur Terisolasi per-Aplikasi Mikro (`frontend/src/lib/apps/`)
Dibangun 4 subfolder modul terisolasi mandiri:

1. **💱 Kurs World (`frontend/src/lib/apps/kurs/`)**:
   - `KursControls.svelte`: Quick converter (USD <-> IDR, EUR <-> IDR), selector metrik (Kurs, 24h, Bendera), filter kawasan.
   - `KursTooltip.svelte`: Tooltip bendera, nama valas, kurs tengah, kurs beli/jual, spread margin, badge 24h.
   - `KursBottomDock.svelte`: Ticker valas dunia, navigasi tab Google Chart FX, Matrix, Converter, Rate Cards, Rate Alert.

2. **🕒 TimeWorld (`frontend/src/lib/apps/time/`)**:
   - `TimeControls.svelte`: Filter jam kantor (09:00 - 17:00), toggle siang/malam, format 24h.
   - `TimeTooltip.svelte`: Jam digital lokal real-time (contoh: `15:52 WIB` / `09:52 CEST`), status siang/malam, selisih vs WIB (Jakarta).
   - `TimeBottomDock.svelte`: Ticker jam digital 8 kota finansial utama dunia (Tokyo, Singapore, Jakarta, Dubai, Frankfurt, London, NY, SF).

3. **✈️ Flow Corridors (`frontend/src/lib/apps/flight/`)**:
   - `FlightControls.svelte`: Filter koridor remitansi (Timur Tengah, ASEAN, Asia Timur, Barat), kontrol partikel busur 3D.
   - `FlightTooltip.svelte`: Rute koridor ke Jakarta, volume tahunan ($M USD), estimasi TKI, rata-rata biaya transfer.
   - `FlightBottomDock.svelte`: Ticker 10 koridor pengiriman dana terbesar ke Indonesia.

4. **🛂 Passport World (`frontend/src/lib/apps/passport/`)**:
   - `PassportControls.svelte`: Filter syarat izin masuk WNI (Bebas Visa, VoA, Butuh Visa), ranking mobilitas global.
   - `PassportTooltip.svelte`: Peringkat paspor dunia, jumlah negara bebas visa, status izin masuk pemegang paspor Indonesia.
   - `PassportBottomDock.svelte`: Ticker ranking paspor terkuat dunia (Singapura #1, Jepang #2, Jerman #3, Indonesia #68).

5. **3D WebGL Globe Pipeline (`Globe3DView.svelte`)**:
   - Poligon negara otomatis berganti pewarnaan (Daylight Amber/Navy untuk `/time`, 3D Animated Particle Arcs untuk `/flight`, Visa mobility score untuk `/passport`, dan spot rates untuk `/kurs`).

## 3. Bukti Quality Gates

| Quality Gate | Perintah | Status | Keterangan |
|---|---|---|---|
| **Unit Test Suite** | `rtk bun test` | ✅ PASSED | **268 / 268 Tests Lulus 100% (16.021 assertions)** |
| **Diagnostics & Check** | `rtk bun run check` | ✅ PASSED | **0 Errors, 0 Warnings** (Backend `tsc` + Frontend `svelte-check`) |
| **Production Build** | `rtk bun run build` | ✅ PASSED | Production bundle build sukses (30.34s) |
| **Git Safety Constraints** | `rtk git status` | ✅ PASSED | Branch `feat/isolated-microapp-controls-and-views` |
