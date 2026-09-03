# ADR 0061: Modular globe.gl Architecture with Full Dynamic Filtering in FE1

## Status
Accepted

## Context
Di frontend utama (`fe1` di `frontend/`), komponen `Globe3DView.svelte` berukuran 1.275 baris kode monolitik yang menggabungkan berbagai tanggung jawab: Three.js Shader-LUT (ADR 0038), konfigurasi dan instansiasi `globe.gl`, kalkulasi 3D arcs remitansi & koridor penerbangan, paths meridian zona waktu, rings episentrum gempa, label LOD kota/negara, interaksi kamera 2-tahap (ADR 0049), serta logika dynamic filtering multi-aplikasi geospasial (`geoStore.isCountryMatched`, `activeApp.getPolygonColor`, `activeApp.getTooltipHtml`, dll.).

Setelah memvalidasi arsitektur kanonikal `globe.gl` yang modular dan bersih di `frontend-2`, pengguna meminta agar arsitektur modular tersebut diimplementasikan ke dalam `fe1` dengan tetap mempertahankan 100% kapabilitas dynamic filtering, integrasi microapp polimorfik, procedural flags, dan mode Shader-LUT Turbo.

## Decision
1. **Pemisahan Modular ke `frontend/src/lib/features/map/globe/`**:
   - `types.ts`: Interface TypeScript untuk konfigurasi layer, state kamera, dan theme.
   - `theme.ts`: Konfigurasi warna atmosfer, background, dan palet dark/light.
   - `camera.ts`: Kamera navigasi (Point-of-View, Great-Circle math, 2-stage swoop travel, zoom controls, reset view).
   - `layers/polygonLayer.ts`: Logika poligon negara GeoJSON, choropleth kurs spot / tren 24 jam, hook polimorfik `activeApp.getPolygonColor`, dynamic filtering `geoStore.isCountryMatched` (peredupan opasitas 0.20-0.35 bagi negara yang tidak match filter), procedural flags material, elevasi 3D, dan tooltip HTML interaktif.
   - `layers/arcLayer.ts`: 3D parabolic arcs untuk aliran remitansi dan penerbangan global, filter `flightCorridorFilter`, dan hook `activeApp.getArcData` / `getArcs`.
   - `layers/pathLayer.ts`: 3D paths untuk 24 meridian bujur zona waktu dan hook `activeApp.getPaths`.
   - `layers/ringLayer.ts`: 3D rings pulsa seismik episentrum gempa dan hook `activeApp.getRingData`.
   - `layers/labelLayer.ts`: 3D pin labels dengan Level-of-Detail (LOD) filtering dan hook `activeApp.getCustomLabels`.
2. **Refactor Ramping pada `Globe3DView.svelte`**:
   - `Globe3DView.svelte` fokus murni sebagai *view coordinator* & *lifecycle manager*:
     - Inisialisasi `globe.gl` via dynamic import.
     - Mengorkestrasi pemanggilan layer helper modular.
     - Mengelola mesh Shader-LUT untuk Turbo Mode 1-draw-call (ADR 0038).
     - Menghubungkan event handler pointer/klik ke `mapState` dan callbacks.
3. **Preservasi 100% Kontrak & Antarmuka Komponen**:
   - Seluruh props `Globe3DView` (`geoJsonFeatures`, `mapData`, `mapState`, `currentTheme`, `onCountryClick`, `onCountryHover`, `onReady`) dan method yang diekspor (`flyTo`, `travelToCountry`, `zoomIn`, `zoomOut`, `resetView`) dipertahankan tanpa breaking change.

## Consequences
### Positif
- Kode `Globe3DView.svelte` menyusut secara signifikan, bersih, dan mudah dipahami.
- Setiap layer visual (poligon, busur, jalur, cincin, label) memiliki modul terisolasi yang dapat diuji secara unit test mandiri.
- Seluruh fitur dynamic filtering (`timeFilter`, `flightCorridorFilter`, `passportVisaFilter`, `activeRegion`, `isCountryMatched`) tetap berjalan 100% tanpa degradasi fungsi.

### Negatif / Trade-offs
- File imports bertambah, memerlukan manajemen ekspor barrel yang rapi.
