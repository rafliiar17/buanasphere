# ADR 0060: Frontend-2 Canonical globe.gl Architecture and Feature Migration

## Status
Accepted

## Context
Aplikasi frontend `kurs-world` (BuanaSphere) saat ini menggabungkan berbagai lapisan fitur: 3D globe via `globe.gl`, 2D Flat Map via Plotly.js (`plotly.js-dist-min` seberat ~4.2MB), procedural flag renderer, shader-LUT kustom Three.js, serta sejumlah microapp geospasial (Kurs, Time, Flight, Flora, Passport, Earthquake, Capitals).

Seiring waktu, arsitektur frontend menjadi padat (79+ file) dengan coupling erat antar komponen dan ukuran bundle yang membengkak karena Plotly. Pengguna meminta pembuatan `frontend-2` baru yang dibangun secara bersih dan modular berdasarkan pola resmi kanonikal [globe.gl](https://github.com/vasturiano/globe.gl), dilanjutkan dengan migrasi fitur-fitur dari `frontend` lama secara bertahap.

## Decision
1. **Membuat Workspace Baru `frontend-2`**:
   - Didaftarkan ke `package.json` workspaces (`["backend", "frontend", "frontend-2"]`).
   - Dijalankan pada port Vite independen (5174) sehingga dapat diuji berdampingan dengan `frontend` (port 5173).
   - Menghilangkan Plotly sepenuhnya dari `frontend-2` untuk memangkas ukuran bundle hingga >85% (<800KB target).
2. **Pola Desain Modular `globe.gl`**:
   - Memisahkan konfigurasi layer ke dalam modul independen:
     - `polygonLayer.ts`: Rendering poligon 195+ negara, hover state, seleksi, dan choropleth (spot rate / 24h change).
     - `arcLayer.ts`: Aliran remitansi global dan koridor penerbangan.
     - `pathLayer.ts`: Garis meridian zona waktu dunia.
     - `ringLayer.ts`: Gelombang pulsa episentrum gempa dunia.
     - `labelLayer.ts`: Pin 3D kota/negara dengan LOD (*Level of Detail*).
     - `camera.ts`: Kamera navigasi, zoom, reset, dan 2-stage swoop travel.
3. **State Management Berbasis Svelte 5 Runes**:
   - Menggunakan `$state` dan `$derived` murni (`globeState.svelte.ts`, `ratesState.svelte.ts`) untuk reaktivitas instan tanpa overhead store legacy.
4. **Strategi Migrasi Bertahap (Multi-Phase)**:
   - **Fase 1**: Scaffold & fondasi kanonikal globe.gl (Vite 6, Svelte 5, Tailwind v4, Bun 1.4+).
   - **Fase 2**: Geodata, GeoJSON Ne-110m, poligon choropleth, hover tooltip, dan seleksi negara.
   - **Fase 3**: Fitur finansial Kurs World (Live rate API, currency converter, matrix perbandingan bank, drawer detail).
   - **Fase 4**: Fitur khusus GeoGlobe (Arcs remitansi, timezone paths, earthquake rings).
   - **Fase 5**: Quality gates (`bun run check`, `bun test`, `bun run build`) dan verifikasi paritas.

## Consequences
### Positif
- Arsitektur bersih, decoupled, dan mudah dirawat.
- Pengurangan drastis ukuran bundle JavaScript (tidak ada Plotly ~4.2MB).
- Proses migrasi aman karena `frontend` lama tetap utuh dan aktif selama pengembangan `frontend-2`.
- Kode layer `globe.gl` dapat dites secara unit test (TDD).

### Negatif / Trade-offs
- Memerlukan pemeliharaan dua workspace frontend sementara sebelum cutover penuh.
- Perlu memastikan sinkronisasi tipe data API antara backend dan `frontend-2`.
