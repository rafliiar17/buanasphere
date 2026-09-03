# ADR 0066: Microapp Plugin `/population` (Population World) & Integrasi World Bank Open Data API

## Status
Accepted

## Context
Platform Kurs World / GeoGlobe memerlukan microapp ke-8 (`/population`) untuk memvisualisasikan dinamika demografi dan persebaran populasi dunia secara spasial di atas bola dunia 3D (Globe.gl). Informasi demografi merupakan fondasi analisis geopolitik, kekuatan pasar valuta asing (FX), dan kepadatan aktivitas ekonomi global.

Bank Dunia (World Bank) menyediakan Open Data API resmi yang bersifat publik, gratis, tanpa memerlukan API key (CORS open), dan mencakup 260 negara/wilayah:
1. `SP.POP.TOTL`: Total Populasi
2. `EN.POP.DNST`: Kepadatan Penduduk (jiwa / km²)
3. `SP.POP.GROW`: Laju Pertumbuhan Penduduk Tahunan (%)
4. `SP.URB.TOTL.IN.ZS`: Persentase Populasi di Kawasan Urban / Perkotaan (%)

## Decision
1. **Model Data Demografi (`populationData.ts`)**:
   - Definisikan tipe `CountryPopulationData` yang mencakup `totalPopulation`, `densityKm2`, `growthRateAnnual`, `urbanPopulationPercent`, `globalRank`, `medianAge`, dan `capitalCity`.
   - Siapkan dataset bundled statis offline untuk 195+ negara (berdasarkan basis World Bank & UN DESA 2024).
   - Sediakan helper `getPopulationDataForCountry(iso3)`.

2. **Layanan Pengambilan Data Live (`livePopulationService.ts`)**:
   - Implementasikan fungsi `fetchWorldBankPopulation()` untuk mengambil data terbaru langsung dari endpoint World Bank Open Data API.
   - Gunakan `AbortSignal.timeout(5000)` sebagai pertahanan timeout terhadap latensi jaringan.
   - Sediakan in-memory caching dengan TTL 60 menit (karena data demografi tahunan relatif jarang berubah).
   - Terapkan *graceful fallback* ke dataset bundled offline saat jaringan terputus atau API tidak merespons.

3. **Plugin GeoAppPlugin (`populationApp.ts`)**:
   - Daftarkan plugin dengan `id: 'population-world'`, `canonicalPath: '/population'`, dan alias `['/demographics', '/populasi', '/people']`.
   - Konfigurasi 4 metrik spasial:
     - `population_total`: Total Populasi (gradien biru muda ke biru elektrik intensif).
     - `population_density`: Kepadatan Penduduk (gradien hijau ke kuning, oranye, dan merah pekat untuk kepadatan >1000/km²).
     - `population_growth`: Laju Pertumbuhan (%) (gradien biru ke emerald dan merah untuk depopulasi).
     - `urbanization`: Tingkat Urbanisasi (%) (gradien ungu ke cyan).
   - Konfigurasi filter cepat:
     - `all`: Semua Negara
     - `megacountries`: Negara Raksasa (>100 Juta Penduduk)
     - `dense`: Wilayah Sangat Padat (>300 jiwa/km²)
     - `fast_growing`: Pertumbuhan Cepat (>2.0% / tahun)
     - `urban`: Mayoritas Urban (>75% perkotaan)
   - Sediakan widget visualisasi inspektur lengkap dengan perbandingan peringkat dunia dan statistik demografi utama.

4. **Integrasi Routing & App Registry**:
   - Daftarkan route `/population` ke `frontend/src/lib/framework/geoglobe/router.ts`.
   - Daftarkan plugin `populationApp` ke registry aplikasi GeoGlobe.

## Consequences
### Positif
- Pengguna dapat mengeksplorasi demografi dunia secara interaktif di atas bola dunia 3D.
- Data mutakhir terhubung langsung ke sumber otoritatif World Bank Open Data.
- Mendukung mode offline 100% tanpa risiko crash atau layout shift.
- Skema warna choropleth semantik memudahkan pembacaan disparitas populasi global.

### Negatif / Trade-offs
- Endpoint bulk World Bank memerlukan penanganan normalisasi format respon yang teliti (array berindeks ganda `[metadata, data]`). Hal ini dimitigasi dengan pengujian unit parser yang ketat.
