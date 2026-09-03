# ADR 0063: 3D Hexagonal Binning Layer for Global Financial FX Volume

## Status
Accepted

## Context
Platform Kurs World telah berhasil mengadopsi arsitektur kanonikal `GlobeScene.svelte` dari `globe.gl`. Salah satu kapabilitas tercanggih `globe.gl` adalah **Hexagonal Binning** (`hexBinPointsData`), yang memungkinkan visualisasi prisma heksagonal 3D yang menjulang vertikal dari permukaan bumi.

Pengguna menginginkan implementasi fitur ini untuk memvisualisasikan **likuiditas dan volume pasar valas harian di pusat-pusat keuangan dunia** (*Global Financial FX Hubs*) berdasarkan data resmi *Bank for International Settlements* (BIS Triennial FX Survey).

## Decision
1. **Membuat Dataset Pusat Keuangan Global (`financialHubsData.ts`)**:
   - Berisi 20+ pusat keuangan global terkemuka (London, New York, Singapura, Hong Kong, Tokyo, Frankfurt, Zurich, Sydney, Dubai, Jakarta, dsb.).
   - Menyertakan koordinat lat/lng presisi, kode mata uang, estimasi volume transaksi harian (miliar USD / hari), dan persentase pangsa pasar global.
2. **Membuat Modul Layer Heksagonal (`hexBinLayer.ts`)**:
   - Mengonfigurasi `hexBinPointsData`, `hexBinPointLat`, `hexBinPointLng`, `hexBinPointWeight`.
   - Menggunakan resolusi spasial heksagonal H3 `hexBinResolution: 3` dengan margin `hexMargin: 0.18`.
   - Ketinggian prisma (`hexAltitude`): Menggunakan pemetaan logaritmik halus agar hub raksasa (London $3.8T) proporsional dan tidak menembus batas atmosfer, sementara hub berkembang (Jakarta $45B) tetap terlihat jelas menjulang.
   - Pendaran warna: Gradien pendaran neon futuristik (`hexTopColor`, `hexSideColor`).
   - Rich Tooltip HTML: Menampilkan nama hub, volume harian, pangsa pasar global, dan kurs ke Rupiah.
3. **Integrasi ke `GlobeScene.svelte` & `Globe3DView.svelte`**:
   - Menambahkan prop `showHexBins?: boolean` dan `hexBinPoints?: HexBinPointData[]`.
   - Menambahkan toggle kontrol pada toolbar floating untuk mengaktifkan/menonaktifkan layer pilar volume 3D ini.
   - Mendukung klik pada heksagon untuk langsung memicu kamera *two-stage swoop travel* ke pusat finansial yang dipilih.

## Consequences
### Positif
- Menghadirkan visualisasi data valas 3D yang spektakuler dan informatif tanpa padat visual.
- Memberikan pemahaman instan kepada pengguna mengenai di mana likuiditas valas dunia berputar.
- Memperkuat filosofi Kurs World: *"Informasi Dulu, Transaksi Belakangan"*.

### Negatif / Trade-offs
- Sedikit penambahan komputasi Three.js untuk geometri silinder heksagonal, namun diimbangi dengan efisiensi internal binning `globe.gl`.
