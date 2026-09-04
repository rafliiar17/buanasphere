# ADR 0073: Peningkatan Microapp /quake dengan USGS FDSN Web Services & BMKG Open Data

## Status
Accepted

## Context
Microapp `/quake` (Earthquake Tracker, ADR 0065 & ADR 0068) saat ini mengintegrasikan feed GeoJSON statis USGS 24 jam (`4.5_day.geojson`) dan daftar gempa terkini BMKG (`gempaterkini.json`). 

Berdasarkan audit dokumentasi resmi:
1. **USGS FDSN Event Web Service (`https://earthquake.usgs.gov/fdsnws/event/1/`)**:
   - Mendukung endpoint query dinamis (`/query?format=geojson`) dengan fleksibilitas filter magnitudo (`minmagnitude`), batas data (`limit`), rentang waktu (`starttime`/`endtime`), dan pengurutan (`orderby=time`).
2. **BMKG Open Data (`https://data.bmkg.go.id/gempabumi/`)**:
   - Menyediakan `autogempa.json` (kejadian gempa bumi paling mutakhir di Indonesia beserta wilayah episenter, status potensi tsunami, shakemap, dan daftar wilayah yang merasakan getaran).
   - Menyediakan `gempadirasakan.json` (15 gempa bumi yang dirasakan masyarakat Indonesia, termasuk magnitudo di bawah 5.0).

Pengguna menginginkan peningkatan integrasi agar `/quake` dapat memanfaatkan dokumentasi dan kemampuan penuh dari kedua sumber otoritatif tersebut.

## Decision
1. **Peningkatan Service Ingestion (`liveEarthquakeService.ts`)**:
   - Menambahkan konstanta endpoint:
     - `BMKG_AUTOGEMPA_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'`
     - `BMKG_GEMPADIRASAKAN_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'`
     - `USGS_FDSN_QUERY_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query'`
   - Membangun parser `parseBmkgAutoGempa` untuk mengonversi data `autogempa.json` ke dalam format standar `EarthquakeRecord` yang diperkaya dengan atribut `potensiTsunami: boolean`, `wilayahPusat: string`, `dirasakanMmi: string`, dan `shakemapUrl?: string`.
   - Membangun fungsi `fetchUsgsCustomEvents` yang mendukung filter query parameter dinamis (`minMagnitude`, `limit`).
   - Membangun fungsi `fetchLatestBmkgAutoGempa` untuk mengambil status gempa bumi mutakhir Indonesia.
   - Memperbarui `fetchLiveEarthquakes` dengan in-memory cache TTL 3 menit dan pertahanan timeout 5 detik (`AbortSignal.timeout(5000)`).

2. **Penyempurnaan Antarmuka `/quake`**:
   - **`QuakeBottomDock.svelte`**:
     - Menambahkan kartu **"Gempa Mutakhir BMKG"** di sisi kiri dock yang menampilkan informasi breaking news gempa Indonesia (potensi tsunami, wilayah terdekat) serta tombol travel kamera 3D instan ke episentrum.
   - **`QuakeControls.svelte`**:
     - Memperkaya filter magnitudo interaktif (`M4.5+ Global`, `M5.0+ Kuat`, `M6.0+ Signifikan`, `Gempa Dirasakan BMKG`).
   - **`earthquakeApp.ts`**:
     - Memperbarui tooltip dan ring visualisasi gelombang episentrum 3D dengan warna semantik kedalaman (merah untuk dangkal <50 km, oranye untuk menengah, biru untuk dalam).

## Consequences
### Positif
- Data gempa bumi Indonesia menjadi sangat mutakhir (*real-time auto*) langsung dari sistem deteksi BMKG.
- Status peringatan potensi tsunami tersaji secara transparan dan instan kepada pengguna.
- Fleksibilitas filter data gempa global via standar internasional USGS FDSN.
- Ketahanan jaringan tetap terjamin dengan timeout 5 detik dan fallback offline dataset.

### Negatif / Trade-offs
- Endpoint BMKG memiliki batas akses 60 request per menit per IP; mitigasi dilakukan dengan cache TTL 3 menit pada level client/worker.
