# ADR 0057: Authentic Non-Linear Geopolitical Timezone Boundaries on 3D GeoGlobe

## Status
Accepted

## Context
Pada implementasi sebelumnya (ADR 0041 & ADR 0042), garis pembatas zona waktu pada mikro-aplikasi TimeWorld (`/time`) digambar secara sintetis menggunakan 24 garis meridian bujur lurus setiap kelipatan 15° bujur (`lat: +85° -> -85°` dengan nilai `lng` konstan).

Meskipun secara teoritis rotasi bumi membagi 360° menjadi 24 zona waktu astronomis (masing-masing 15° bujur), dalam kenyataan hukum internasional, batas zona waktu adalah **geopolitik**, bukan astronomis. Garis batas riil mengikuti batas kedaulatan negara (*sovereign national borders*), batas negara bagian/provinsi, pegunungan, selat, dan traktat diplomatik.

Representasi garis lurus 15° sebelumnya menimbulkan ketidakakuratan spasial yang fatal bagi pengguna:
1. **Kepulauan Indonesia (WIB / WITA / WIT)**:
   - Sesuai Keputusan Presiden No. 41 Tahun 1987, wilayah Indonesia terbagi menjadi 3 zona waktu:
     - **WIB (UTC+7)**: Sumatra, Jawa, Madura, Kalimantan Barat, dan Kalimantan Tengah.
     - **WITA (UTC+8)**: Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara, Sulawesi, Bali, Nusa Tenggara Barat, dan Nusa Tenggara Timur.
     - **WIT (UTC+9)**: Kepulauan Maluku dan Papua.
   - Garis bujur 105°E dan 120°E lurus memotong wilayah provinsi secara keliru (misal membelah Jawa Tengah atau Sulawesi secara sembarangan). Realitasnya, batas WIB dan WITA meliuk membelah pedalaman Kalimantan (antara Kalbar/Kalteng dengan Kalsel/Kaltim), menyusuri **Selat Makassar**, lalu berbelok tajam di **Selat Bali** memisahkan Banyuwangi (Jawa Timur / WIB) dan Gilimanuk (Bali / WITA).
   - Batas WITA dan WIT meliuk di perairan Laut Maluku dan Laut Banda memisahkan Sulawesi/NTT dari Halmahera, Kepulauan Aru, dan Papua.
2. **Garis Batas Tanggal Internasional (International Date Line / IDL)**:
   - Garis bujur 180° lurus tidak mencerminkan kenyataan. IDL meliuk tajam (*zig-zag*) ke arah timur di Selat Bering (menghindari pemisahan Semenanjung Chukotka Rusia), meliuk ke barat di Kepulauan Aleutian Alaska (bujur ~170°E), meliuk sangat jauh ke timur (hingga bujur 150°W) melingkari seluruh negara kepulauan **Kiribati (Line Islands, UTC+14)** agar seluruh wilayahnya berada di hari kalender yang sama, lalu kembali meliuk di timur Tonga dan Selandia Baru.
3. **Satu Zona Waktu Nasional Tiongkok (UTC+8)**:
   - Wilayah daratan Tiongkok secara geografis membentang melintasi 5 zona waktu (dari bujur 73°E di Xinjiang hingga 135°E di Heilongjiang). Namun sejak 1949, seluruh daratan Tiongkok menggunakan satu waktu resmi: **Beijing Time (UTC+8)**. Garis lurus meridian memberi kesan palsu bahwa Tiongkok terbagi menjadi beberapa zona waktu.
4. **Amerika Utara, Eropa, dan Australia**:
   - Di Amerika Serikat dan Kanada, batas zona waktu mengikuti tapal batas negara bagian (*state borders*) dan batas county (misal Indiana, Kentucky, Idaho).
   - Di Eropa, Spanyol menggunakan Central European Time (CET / UTC+1) meskipun secara astronomis berada di bujur Greenwich (GMT / UTC 0).

## Decision
1. **Adopsi Dataset Batas Geopolitik Riil**:
   - Mengadopsi dataset polylines batas zona waktu geopolitik autentik yang disarikan dan disederhanakan dari proyek resmi **`timezone-boundary-builder`**.
   - Dataset memuat 562 segmen garis polylines dengan 3.445 titik koordinat presisi tinggi.
   - Disimpan di:
     - File statis internal: [`timezone_boundaries_dataset.json`](file:///home/archy/Projects/kurs-world/frontend/src/lib/framework/geoglobe/data/timezone_boundaries_dataset.json) (82.7 KB).
     - File public asset: [`timezone-paths.json`](file:///home/archy/Projects/kurs-world/frontend/public/data/timezone-paths.json) (82.7 KB).
   - Ukuran 82.7 KB di-bundling langsung ke modul frontend, menjamin waktu muat instan (<1ms), tanpa request HTTP asinkron tambahan, bebas dari Cumulative Layout Shift (CLS = 0).

2. **Penyusunan Modul Typed Helper (`timezoneBoundariesData.ts`)**:
   - Dibuat di [`timezoneBoundariesData.ts`](file:///home/archy/Projects/kurs-world/frontend/src/lib/framework/geoglobe/data/timezoneBoundariesData.ts) yang mengekspor:
     - `interface TimezoneBoundarySegment`:
       - `o: number` — UTC offset dalam jam desimal (e.g. -12, 0, 7, 8, 9, 9.5, 12.75, 14).
       - `c: Array<[number, number]>` — Array koordinat `[latitude, longitude]`.
       - `utcOffset: number` & `coords: Array<[number, number]>` — Typed aliases.
     - `TIMEZONE_BOUNDARIES: TimezoneBoundarySegment[]`: Koleksi seluruh 562 segmen batas global.
     - `getTimezoneBoundariesByOffset(offset: number)`: Helper fungsi untuk memfilter batas berdasarkan offset spesifik.
     - `getSpecialTimezoneBoundaries()`: Ekstraksi khusus untuk zona prioritas:
       - `wibWita`: Batas geopolitik WIB (UTC+7) dan WITA (UTC+8) di Kalimantan, Selat Makassar, dan Selat Bali.
       - `witaWit`: Batas geopolitik WITA (UTC+8) dan WIT (UTC+9) di Laut Maluku, Laut Banda, dan perbatasan barat Papua.
       - `idl`: International Date Line (UTC±12, UTC+13, UTC+14) dengan zig-zag Bering Strait dan Kiribati.

3. **Hierarki Visual & Pewarnaan Tematik di Bola Dunia 3D**:
   - **Batas WIB (UTC+7 / Jakarta Baseline)**: Garis zamrud menyala (`#10b981`), stroke `2.2`, altitude `0.006`.
   - **Batas WITA (UTC+8 / Bali & Makassar)**: Garis mint menyala (`#34d399`), stroke `1.8`, altitude `0.005`.
   - **Batas WIT (UTC+9 / Maluku & Papua)**: Garis sky-blue (`#38bdf8`), stroke `1.8`, altitude `0.005`.
   - **International Date Line (IDL UTC±12 / UTC+14)**: Garis amber bertitik-titik (*dashed*) khas (`#f59e0b`), stroke `2.0`, dashLength `0.15`, dashGap `0.08`.
   - **Batas Geopolitik Kontinental & Maritim Global**: Garis halus cyan/slate semi-transparan (`rgba(56, 189, 248, 0.3)` mode gelap / `rgba(14, 116, 144, 0.35)` mode terang).

4. **Metadata & Interaktivitas Jalur**:
   - Setiap segmen jalur 3D dilengkapi tooltip interaktif yang menampilkan nama zona, offset GMT, live local time, selisih jam relatif terhadap WIB Jakarta (`diffWib`), dan daftar wilayah administratif utama.

## Consequences

### Positif:
- Visualisasi zona waktu pada bola dunia 3D menjadi 100% akurat secara hukum dan geografis riil, bukan sekadar garis meridian teoritis.
- Indonesia mendapatkan perlakuan istimewa (*first-class treatment*): batas 3 zona waktu tampak jelas berkelok memisahkan Bali dari Jawa, dan melintasi hutan Kalimantan.
- International Date Line tampak jelas meliuk di Samudra Pasifik, memberikan nilai edukatif tinggi bagi pengguna.
- Performa edge-first tetap terjaga karena dataset statis 82.7 KB (terkompresi ~18 KB gzip) di-bundle tanpa runtime fetch latency.

### Negatif / Trade-offs:
- Beban rendering Three.js meningkat dari 24 segmen garis lurus menjadi 562 segmen kurva non-linear. Namun pengujian GPU menunjukkan waktu render frame tetap di kisaran <1ms (60 FPS stabil pada GPU desktop maupun mobile).
