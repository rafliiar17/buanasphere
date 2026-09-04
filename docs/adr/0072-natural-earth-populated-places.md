# ADR 0072: Integrasi Dataset Natural Earth 110m Populated Places GeoJSON

## Status
Accepted

## Context
Platform BuanaSphere memiliki beberapa microapp spasial yang mengandalkan titik koordinat kota dan ibukota dunia:
1. `/population` (Population World, ADR 0066b) — memvisualisasikan data demografi negara dan aglomerasi perkotaan.
2. `/capitals` (World Capitals, ADR 0046/0069) — memvisualisasikan 195+ ibukota negara dengan titik bercahaya (*radiant dots*).
3. `/time` (World Time, ADR 0056/0070) — memvisualisasikan kota dunia dengan filter Level-of-Detail (LOD) berbasis ketinggian kamera.

Meskipun data ibukota dan kota waktu telah di-decouple ke format JSON (ADR 0071), platform belum memiliki satu dataset spasial standar kartografi internasional yang mencakup **peringkat kota global (*scalerank* / *labelrank*)**, klasifikasi megacity (`megacity: 1`), dan estimasi populasi metropolitan (`pop_max` / `pop_min`) dalam format standar GeoJSON Point.

Kreator `globe.gl` (Vasturiano) secara resmi menggunakan dataset `ne_110m_populated_places_simple.geojson` dari Natural Earth sebagai contoh kanonikal untuk visualisasi titik-titik kota, populasi, dan marker 3D globe.

## Decision
1. **Adopsi Dataset Natural Earth 110m Populated Places**:
   - Menyimpan salinan dataset `ne_110m_populated_places_simple.geojson` (~185.9 KB, 243 kota terkurasi) di [`frontend/src/lib/framework/geoglobe/data/ne_110m_populated_places_simple.geojson`](file:///home/archy/Projects/kurs-world/frontend/src/lib/framework/geoglobe/data/ne_110m_populated_places_simple.geojson).
   - Dataset ini berlisensi *Public Domain*, menjamin kebebasan penggunaan tanpa risiko lisensi komersial.

2. **Penyediaan Typed Loader Wrapper (`populatedPlacesData.ts`)**:
   - Membangun antarmuka terstruktur `PopulatedPlace` yang memetakan properti GeoJSON (`name`, `countryIso3`, `countryName`, `lat`, `lng`, `popMax`, `popMin`, `isCapital`, `isMegacity`, `scaleRank`, `labelRank`).
   - Menyediakan fungsi query dan filtering kartografis:
     - `getAllPopulatedPlaces()`: Mengembalikan seluruh 243 kota.
     - `getMegacities()`: Mengembalikan kota-kota berstatus megacity (`popMax >= 10.000.000` atau `megacity === 1`).
     - `getCapitals()`: Mengembalikan ibukota negara (`isCapital === true`).
     - `getPopulatedPlacesByCountry(iso3)`: Mengembalikan kota-kota dalam negara tertentu.
     - `getPopulatedPlacesByLOD(altitude)`: Memfilter kota berdasarkan ambang batas `scaleRank` yang adaptif terhadap jarak kamera orbit.

3. **Integrasi dengan Microapp `/population`**:
   - Memperkaya microapp `/population` (`populationApp.ts`) dengan titik pilar/lingkaran megacity terpadat dunia di atas choropleth wilayah negara.

## Consequences
### Positif
- Membawa dataset kartografi otoritatif berstandar internasional ke dalam BuanaSphere.
- Mendukung visualisasi titik aglomerasi perkotaan dan megacity secara akurat di atas WebGL 3D Globe.
- Menyediakan skala kartografi resmi (`scalerank` 0–8) untuk menyempurnakan filtering kamera LOD yang mulus.
- Ukuran file ringan (~186 KB mentah, ~40 KB gzip) sehingga tidak membebani initial bundle loading.

### Negatif / Trade-offs
- Dataset 110m difokuskan pada kota-kota utama (243 titik); untuk kota sekunder/tersier tetap didukung oleh dataset kota komplementer lainnya.
