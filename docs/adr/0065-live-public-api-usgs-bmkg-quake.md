# ADR 0065: Integrasi Live Public API USGS & BMKG untuk Pemantauan Gempa Bumi Global

## Status
Accepted

## Context
Microapp `/quake` (`earthquakeApp`) dirancang untuk memantau aktivitas seismik global dan menampilkan cincin pulsa episentrum 3D (*3D seismic wave propagation rings*) di atas globe 3D. Sebelumnya, data yang digunakan bersumber dari file statis lokal (`earthquake_dataset.json`).

Terdapat dua sumber data otoritatif publik yang 100% gratis, tanpa memerlukan registrasi API key, dan menyajikan data berformat GeoJSON standar:
1. **USGS (United States Geological Survey)**:
   - Feed GeoJSON real-time: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson`
   - Memperbarui gempa bumi global berkekuatan M ≥ 4.5 dalam 24 jam terakhir secara otomatis setiap beberapa menit.
2. **BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) Indonesia**:
   - Endpoint resmi: `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`
   - Menyajikan 15 gempa bumi mutakhir di kawasan kepulauan Indonesia.

## Decision
1. **Membuat `liveEarthquakeService.ts`**:
   - Mengambil feed GeoJSON langsung dari USGS dan BMKG.
   - Menggunakan `AbortSignal.timeout(5000)` untuk memastikan UI tidak pernah terhambat (*timeout defense*).
   - Menyediakan in-memory caching (TTL 5 menit) untuk meminimalkan beban jaringan.
   - Menyediakan *graceful fallback* ke dataset lokal (`GLOBAL_EARTHQUAKES` dan `earthquake_dataset.json`) jika pengguna offline atau API eksternal mengalami kendala.
2. **Mengintegrasikan ke `earthquakeApp.ts`**:
   - Fungsi `dataLoader` memanggil `fetchLiveEarthquakes()`.
   - Fungsi `getRingData` menghasilkan cincin gelombang seismik 3D langsung dari gempa bumi aktual hari ini.
   - Indikator live status (`isLive: boolean`, `lastUpdated: string`) dicatat untuk transparansi data pengguna.

## Consequences
### Positif
- Globe 3D kini menyajikan gempa bumi aktual yang benar-benar terjadi di muka bumi hari ini.
- Visualisasi cincin seismik berdenyut di koordinat nyata dengan warna yang proporsional terhadap magnitudo (kuning M4.5+, oranye M5.0+, merah M6.0+).
- Tahan terhadap kondisi offline maupun gangguan jaringan berkat arsitektur fallback transparan.

### Negatif / Trade-offs
- Bergantung pada ketersediaan koneksi internet saat memuat pertama kali, namun tereduksi sepenuhnya oleh mekanisme *graceful fallback*.
