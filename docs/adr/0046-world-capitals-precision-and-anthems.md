# ADR 0046: Precise Capital Coordinates, Flag Metric, and National Anthem Integration in World Capitals Plugin

## Status
Accepted

## Context
Mikro-aplikasi World Capitals (`/capitals`, ADR 0039) memvisualisasikan 195+ ibukota negara berdaulat dan sejarah kemerdekaan. Namun, terdapat tiga area penyempurnaan utama yang dibutuhkan:
1. **Ketidakakuratan Titik Pin Spasial Ibukota**:
   Sebelumnya, koordinat pin 3D globe diambil dari centroid poligon negara di GeoJSON (`LABEL_Y`, `LABEL_X`). Akibatnya, ibukota negara-negara besar atau kepulauan (Indonesia, USA, Rusia, Australia, Brasil, Kanada, dll.) berada ratusan hingga ribuan kilometer dari lokasi ibukota riil (contoh: Jakarta berada di pedalaman Kalimantan/Laut Jawa, Washington D.C. di Kansas, Canberra di gurun pedalaman).
2. **Ketiadaan Metrik Pewarnaan Bendera**:
   Pengguna ingin dapat mewarnai poligon 195+ negara berdasarkan warna primer bendera nasional autentik (*vexillological primary flag colors*), seperti yang tersedia di plugin kurs.
3. **Ketiadaan Informasi Lagu Kebangsaan (*National Anthem*)**:
   Setiap negara memiliki lagu kebangsaan yang menjadi simbol identitas dan kedaulatan utama bersama ibukota dan hari kemerdekaan. Pengguna membutuhkan judul lagu, komposer, tahun adopsi, serta pemutar audio untuk mendengarkan lagu nasional tersebut.

## Decision
1. **Koordinat Presisi Ibukota Negara**:
   - Memperluas `WorldCapitalData` dengan properti `capitalCoordinates: { lat: number; lng: number }`.
   - Mengisi koordinat astronomis/geografis presisi untuk ibukota 195+ negara (contoh: Jakarta `[-6.2088, 106.8456]`, Washington D.C. `[38.9072, -77.0369]`, Tokyo `[35.6762, 139.6503]`, London `[51.5074, -0.1278]`, Brasília `[-15.7975, -47.8919]`).
   - Memperluas `getPinLabel` pada interface `GeoAppPlugin` di `types.ts` agar dapat mengembalikan `{ lat?: number; lng?: number }`.
   - Pada `Globe3DView.svelte`, perbarui pemetaan `labelsData` untuk memprioritaskan `pinLabel?.lat ?? lat` dan `pinLabel?.lng ?? lng`.
2. **Metrik Pewarnaan Bendera (`flag` Metric)**:
   - Menambahkan definisi metrik `flag` pada `worldCapitalsApp.metrics`.
   - Pada hook `getPolygonColor`, jika `activeMetric === 'flag'`, delegasikan langsung ke `getCountryFlagColor(country.iso3)`.
3. **Data dan Pemutar Lagu Kebangsaan (*National Anthem*)**:
   - Mendefinisikan interface `NationalAnthem` (`title`, `nativeTitle`, `composer`, `adoptedYear`, `audioUrl`).
   - Menyematkan metadata lagu kebangsaan pada seluruh 195+ negara di `worldCapitalsData.ts`.
   - Menampilkan judul lagu nasional pada hover tooltip `getTooltipHtml` (`🎵 Lagu Kebangsaan: ...`).
   - Menampilkan kartu detail lagu kebangsaan lengkap dengan audio player di `renderInspector`.

## Consequences
- Pin ibukota pada bola dunia 3D kini 100% akurat secara kartografis.
- Visualisasi bendera nasional memberikan ragam pilihan tampilan edukatif yang kaya.
- Informasi kedaulatan negara menjadi lengkap dengan kehadiran lagu kebangsaan resmi.
