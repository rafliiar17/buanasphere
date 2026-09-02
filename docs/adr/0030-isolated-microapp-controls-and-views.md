# ADR 0030: Isolated Micro-App Controls, Tooltips, and Views Architecture

## Status
**Accepted**

## Context & Problem Statement
Platform GeoGlobe mendukung berbagai aplikasi mikro berbasis geolocation 3D (`/kurs`, `/time`, `/flight`, `/passport`). Sebelumnya, komponen pusat kontrol peta (kanan), hover tooltip negara, dan bottom dock di `WorldRateMap.svelte` masih terikat (*tightly coupled*) pada fitur Kurs (kalkulator konversi Rupiah, metrik kurs nominal, ticker valas).

Saat pengguna membuka route non-kurs seperti `http://localhost:5173/time`, antarmuka peta masih menampilkan kalkulator kurs dan tooltip mata uang. Diperlukan arsitektur modular di mana setiap aplikasi mikro memiliki komponen **Pusat Kontrol Peta**, **Tooltip Hover**, **Bottom Dock/Ticker**, dan **Visualisasi 3D** yang terisolasi 100%.

## Architecture Decisions

### 1. Modular Directory Structure (`frontend/src/lib/apps/`)
Setiap aplikasi mikro dikelompokkan ke dalam subfolder mandiri:
- `frontend/src/lib/apps/kurs/`:
  - `KursControls.svelte`: Quick converter valas, metrik kurs/24h/bendera, filter kawasan.
  - `KursTooltip.svelte`: Tooltip kurs tengah, kurs beli/jual, spread margin, badge 24h.
  - `KursBottomDock.svelte`: Ticker valas dunia & navigasi tab (Peta, Google Chart FX, Matrix, Converter).
- `frontend/src/lib/apps/time/`:
  - `TimeControls.svelte`: Filter jam kantor (09:00 - 17:00), format waktu 12h/24h, solar daylight heatmap.
  - `TimeTooltip.svelte`: Jam digital lokal, status siang/malam, selisih waktu vs WIB (UTC+7).
  - `TimeBottomDock.svelte`: Ticker jam digital kota finansial utama dunia (Tokyo, Singapore, Jakarta, London, New York).
- `frontend/src/lib/apps/flight/`:
  - `FlightControls.svelte`: Filter koridor remitansi (Timur Tengah, ASEAN, Asia Timur, Barat), kontrol kecepatan partikel busur 3D.
  - `FlightTooltip.svelte`: Rute koridor ke Jakarta, volume tahunan ($M USD), estimasi pekerja migran, rata-rata biaya transfer.
  - `FlightBottomDock.svelte`: Ticker 10 koridor pengiriman dana terbesar ke Indonesia.
- `frontend/src/lib/apps/passport/`:
  - `PassportControls.svelte`: Filter status visa WNI (Bebas Visa, VoA, Butuh Visa), ranking mobilitas global.
  - `PassportTooltip.svelte`: Peringkat paspor dunia, jumlah negara bebas visa, status izin masuk WNI.
  - `PassportBottomDock.svelte`: Ticker ranking paspor terkuat dunia (Singapura #1, Jepang #2, Jerman #3, Indonesia #68).

### 2. Universal Map Shell Dynamic Delegation
`WorldRateMap.svelte` dan `Globe3DView.svelte` mendelegasikan render komponen secara dinamis berdasarkan `geoStore.activeAppId`. Saat berpindah route, Three.js canvas dipertahankan di memori (0ms reload) sementara layer pewarnaan poligon, 3D arcs, tooltip, dan toolbar kontrol diganti secara instan.

## Consequences
- **Positif**:
  - Isolasi total antar aplikasi mikro tanpa saling mencemari (*zero cross-pollution*).
  - Penambahan aplikasi mikro baru di masa depan (misal `/weather` atau `/club`) hanya membutuhkan 1 subfolder baru di `apps/`.
  - Transisi antar aplikasi mikro sub-10ms tanpa reload WebGL scene.
- **Negatif**:
  - Menambah jumlah file komponen Svelte di frontend.
