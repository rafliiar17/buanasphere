# ADR 0055: Pembersihan Label Kota 3D pada Jam Global (/time) — Nama Kota Murni Tanpa Broken Glyph '??' dan Jam

## Status
Accepted

## Konteks & Problem Statement
Pada micro-app **TimeWorld (`/time`)**, teks label 3D kota sebelumnya diformat sebagai:
```ts
const displayText = `${city.flagEmoji} ${city.cityName} • ${local.formatted} ${phase.emoji}`;
```
Hal ini menimbulkan dua masalah kritis pada tampilan pengguna:
1. **Broken Glyph `??` dan `?`**:
   - WebGL Canvas 2D texture generator pada Three.js / `Globe.gl` tidak mendukung font warna emoji Unicode (khususnya bendera dua-karakter komposit seperti `🇮🇩` yang diurai sebagai `U+1F1EE U+1F1E9` dan emoji matahari `☀️` / bulan `🌙`).
   - Akibatnya, browser merender glyph pengganti berupa karakter tanda tanya ganda `??` sebelum nama kota dan `?` setelah jam (contoh: `?? Banda Aceh • 11:39 ?`).
2. **Kepadatan Teks & Tumpang Tindih (Clutter & Overlap)**:
   - String label yang panjang (`?? Banda Aceh • 11:39 ?`) memakan ruang horizontal yang lebar, menyebabkan teks kota-kota yang berdekatan (seperti di Pulau Jawa, Sumatera, atau Eropa Barat) saling tumpang tindih dan sulit dibaca.

## Keputusan Arsitektur

### 1. Label Bola Dunia Murni Nama Kota
- Mengubah properti `text` dan `shortText` yang dikembalikan oleh `worldTimeApp.getCustomLabels` menjadi **hanya nama kotanya saja**:
  ```ts
  const displayText = city.cityName;
  const shortText = city.cityName;
  ```
- Contoh hasil rendering pada bola dunia 3D:
  - `Banda Aceh`
  - `Medan`
  - `Jakarta`
  - `Denpasar (Bali)`
  - `Balikpapan / IKN Nusantara`
  - `Jayapura`
  - `Tokyo`
  - `London`
  - `New York`

### 2. Eliminasi Broken Glyph & Penurunan Beban Rendering
- Dengan hanya menggunakan karakter teks alfabetik baku, tekstur Canvas 2D WebGL bebas dari broken glyph (`??` dan `?`).
- Ukuran tekstur canvas yang digenerate Three.js menjadi jauh lebih kecil, meningkatkan performa frame rate (60 FPS) dan meminimalisir visual overlap.

### 3. Informasi Jam & Zona Waktu Tetap Presisi di DOM UI
- Jam lokal, offset UTC, selisih vs WIB/WITA/WIT, status kantor, dan fase matahari tetap disajikan secara lengkap dan interaktif pada:
  - **Floating Top-Right Controls Card** (menampilkan jam digital kota/negara terpilih).
  - **Indonesian 3-Timezone Synchronization Ribbon** (WIB • WITA • WIT).
  - **Interactive 24-Hour Time Scrubber**.
  - **Bottom Drawer Inspector** (HTML DOM penuh dengan rendering emoji & ikon SVG yang sempurna).

## Konsekuensi & Keuntungan
- Tampilan bola dunia 3D menjadi bersih, rapi, terbaca jelas, dan estetis tanpa ada broken glyph.
- Tidak ada teks panjang yang menumpuk di atas daratan geografis.
