# ADR 0003: Plotly.js Choropleth World Map for Global Currency Rate Visualization

> **Status:** Accepted  
> **Tanggal:** 2 September 2026  
> **Deciders:** Core Engineering Team, Subagent 3 (SDLC & Architecture)  
> **Konteks:** Visualisasi persebaran nilai tukar mata uang global (World Currency Strength & Exchange Rate Map) secara interaktif menggunakan Choropleth projection

---

## 1. Konteks & Masalah

Pengguna platform `kurs-world` memerlukan cara cepat, intuitif, dan komprehensif untuk melihat perbandingan kekuatan mata uang global terhadap Rupiah (IDR) atau mata uang acuan lainnya secara geografis. Tampilan tabel komparasi dan konverter teks biasa memberikan detail angka presisi, namun kurang memberikan pemahaman spasial mengenai disparitas nilai tukar regional (Asia Tenggara, Eropa, Timur Tengah, Amerika, Asia Timur).

Tantangan teknis utama dalam membangun visualisasi peta dunia interaktif di browser:
1. **Network & Asset Payload Overhead**: Pendekatan tradisional menggunakan pustaka GIS (D3.js, Leaflet, TopoJSON, MapLibre) umumnya memerlukan pengunduhan file eksternal GeoJSON / TopoJSON peta dunia berukuran besar (>5 MB) saat runtime, yang memperlambat *First Contentful Paint* (FCP) dan *Largest Contentful Paint* (LCP).
2. **Third-Party Tile Server Dependency**: Penggunaan tile map (OpenStreetMap, Mapbox, Google Maps) bergantung pada penyedia eksternal, membutuhkan API key, menimbulkan risiko *rate limiting*, dan memiliki ketergantungan koneksi jaringan aktif ke tile server.
3. **Reactivity & Lifecycle Management di Svelte 5**: Pustaka visualisasi harus dapat beradaptasi dengan lifecycle modern Svelte 5 (Runes `$state`, `$derived`, `$effect`, `onMount`) untuk dynamic rendering, resize otomatis, dan tema gelap (*Dark Mode* / Tailwind CSS v4) tanpa memicu memory leak.

---

## 2. Pilihan Solusi yang Dievaluasi

| Kriteria | Opsi A: D3.js + TopoJSON Manual | Opsi B: Leaflet / Mapbox GL | Opsi C: `plotly.js-dist-min` (Choropleth) |
|---|---|---|---|
| **Kebutuhan External GeoJSON** | Wajib unduh file TopoJSON (2-5 MB) | Mengunduh raster/vector tiles kontinu | **Tidak Perlu** (Built-in ISO-3 TopoJSON internal) |
| **Ketergantungan Tile Server** | Tidak | Wajib (OSM / Mapbox API) | **Bebas Tile Server** (Pure Vector SVG) |
| **ISO-3 Code Mapping** | Manual join data poligon | Manual layer matching | **Native ISO-3 Country Code mapping** |
| **Interaktivitas & Tooltips** | Wajib kode manual dari nol | Plugin popup manual | **Built-in responsive hover tooltips & zoom/pan** |
| **Dark Theme Styling** | Kustom manual D3 CSS | Kustom tile style | **Konfigurasi layout JSON deklaratif** |
| **Kompleksitas Kode** | Sangat Tinggi (~400 baris) | Sedang (~250 baris) | **Ringkas & Deklaratif (~150 baris)** |

---

## 3. Keputusan Arsitektur

### 3.1 Pemilihan `plotly.js-dist-min`
Kami memutuskan untuk mengadopsi **`plotly.js-dist-min`** sebagai engine visualisasi Choropleth World Map pada platform `@kurs-world/frontend`:
1. **Built-in World Country Boundaries**: Plotly menyertakan geometri batas negara dunia standar ISO 3166-1 alpha-3 secara internal yang telah dioptimalkan secara biner. Aplikasi tidak perlu melakukan request network 5MB+ untuk mengambil file TopoJSON/GeoJSON eksternal.
2. **Zero Tile Server Dependency**: Peta dirender langsung sebagai SVG/WebGL di sisi klien tanpa request tile ke server eksternal, menjamin ketersediaan tinggi dan zero-cost.
3. **Deklaratif & Kustomisasi Tema Gelap**: Layout peta disesuaikan secara presisi dengan palet tema gelap aplikasi (`slate-950` untuk background, `slate-900` untuk daratan, `slate-800` untuk batas negara/coastline, dan colorscale kustom *Indigo-Purple-Emerald* untuk indikator nilai tukar).

### 3.2 Pemetaan Mata Uang ke Kode Negara (ISO 4217 -> ISO 3166-1 Alpha-3)
Dibuat pemetaan komprehensif antara kode mata uang (contoh: `USD`, `EUR`, `SGD`, `JPY`, `MYR`, `CNY`, `AUD`, `GBP`, `SAR`, dll.) ke kode ISO-3 negara terkait:
- `USD` -> `USA`
- `EUR` -> Negara-negara Zona Euro (`DEU`, `FRA`, `ITA`, `ESP`, `NLD`, `BEL`, `AUT`, `IRL`, `PRT`, `FIN`, `GRC`, dll.)
- `SGD` -> `SGP`
- `JPY` -> `JPN`
- `MYR` -> `MYS`
- `CNY` -> `CHN`
- `AUD` -> `AUS`
- `GBP` -> `GBR`
- `SAR` -> `SAU`
- `IDR` -> `IDN` (Base Currency)

### 3.3 Integrasi Svelte 5 (Runes) & Zero CLS Architecture
1. **Komponen `WorldRateMap.svelte`**:
   - Memanfaatkan `onMount` untuk inisialisasi awal container peta via `Plotly.newPlot`.
   - Menggunakan `$effect` reaktif untuk memperbarui data choropleth secara instan saat base currency atau daftar kurs berubah via `Plotly.react` tanpa merekonstruksi DOM.
   - Menyediakan fungsi cleanup `Plotly.purge(chartElement)` pada saat komponen di-unmount untuk mencegah memory leak.
   - Menyediakan event listener `window.addEventListener('resize', ...)` dengan `Plotly.Plots.resize(chartElement)` untuk responsivitas penuh di perangkat mobile maupun desktop.
2. **High-Fidelity Shimmer Skeleton (`MapSkeleton.svelte`)**:
   - Sesuai standar `AGENTS.md` Bagian 6, saat data kurs atau modul visualisasi sedang dimuat, ditampilkan shimmer skeleton dengan rasio aspek dan layout yang presisi untuk mencegah *Cumulative Layout Shift* (CLS < 0.1).

---

## 4. Konsekuensi

### Positif:
- **Performa & Zero External Latency**: Tidak ada network round-trip untuk mengunduh TopoJSON/GeoJSON berukuran 5MB+ saat pertama kali membuka halaman peta.
- **Pengalaman Pengguna Interaktif**: Hover tooltip informatif menampilkan nama negara, kode mata uang, nilai tukar terhadap IDR, serta label bank penyedia terbaik.
- **Kepatuhan Desain UI/UX**: Selaras dengan sistem desain Tailwind CSS v4, tema gelap `kurs-world`, dan standar Svelte 5 Runes.

### Negatif / Mitigasi:
- **Ukuran Paket `plotly.js-dist-min`**: Pustaka berukuran bundle ~3.5MB unminified / ~1MB minified -> Dimitigasi dengan Vite dynamic module tree shaking dan browser HTTP cache, serta ditampilkan shimmer skeleton (`MapSkeleton.svelte`) secara halus selama inisialisasi.
