# ADR 0056: Dynamic Zoom-Aware City Level-of-Detail (LOD) Filtering pada Jam Global (/time)

## Status
Accepted

## Konteks & Problem Statement
Aplikasi Jam Global (**TimeWorld `/time`**) telah memiliki dataset komprehensif berisi 120+ kota dunia dengan koordinat geografis presisi dan representasi 3 zona waktu Indonesia (WIB, WITA, WIT). Label pada kanvas bola dunia 3D juga telah dibersihkan sehingga hanya menampilkan teks nama kota murni (ADR-0055).

Namun, saat kamera bola dunia berada pada jarak pandang jauh (*zoom out default*, altitude ~2.2), menampilkan seluruh 120+ kota sekaligus menyebabkan kepadatan label yang tinggi di wilayah geografis yang padat seperti Pulau Jawa, Sumatera, atau Eropa Barat. Label-label kota yang berdekatan menjadi bertumpukan sehingga menyulitkan pembacaan.

## Keputusan Arsitektur

### 1. Dynamic Zoom-Aware LOD Threshold (Altitude 1.4)
- Menambahkan parameter `cameraAltitude?: number` pada fungsi `getCustomLabels` di antarmuka `GeoAppPlugin`.
- Menetapkan threshold kamera altitude: `1.4`
  - **Zoom Out Jauh (`altitude > 1.4`)**:
    - Hanya merender kota-kota **Major Global Hubs** (`isMajorHub === true`), mencakup kota-kota metropolis dunia (~25 kota besar: Jakarta, Denpasar/Bali, Balikpapan/IKN, Jayapura, Tokyo, Seoul, Beijing, Singapura, Kuala Lumpur, Bangkok, New Delhi, Dubai, Riyadh, London, Paris, Berlin, Moskow, New York, Chicago, Los Angeles, Toronto, Sao Paulo, Sydney, Kairo, Johannesburg).
    - **Pengecualian Negara Terpilih**: Seluruh kota dari negara yang sedang aktif dipilih (`city.countryIso3 === selectedIso3`) tetap dimunculkan sehingga pengguna tetap dapat melihat seluruh titik kota pada negara yang sedang mereka inspeksi.
  - **Zoom In Dekat (`altitude <= 1.4`)**:
    - Merender **Seluruh 120+ Kota** di dunia dan daerah regional secara lengkap (Banda Aceh, Medan, Pekanbaru, Padang, Palembang, Semarang, Yogyakarta, Surabaya, Banjarmasin, Manado, Ambon, Sorong, Merauke, Osaka, Busan, dll.).

### 2. Integrasi OrbitControls Listener di `Globe3DView.svelte`
- `Globe3DView.svelte` mendengarkan perubahan orientasi/jarak kamera melalui `globeInstance.controls().addEventListener('change', ...)` dan memperbarui state reaktif `cameraAltitude`.
- Memanfaatkan hysteresis / threshold minimal (0.15) agar kalkulasi LOD tidak menyebabkan thrashing render yang tidak perlu, menjaga performa tetap stabil di 60 FPS.

### 3. Konsistensi Teks Murni
- Seluruh label pada kedua tingkat LOD (baik jauh maupun dekat) tetap mempertahankan prinsip ADR-0055: hanya berupa teks nama kota murni tanpa broken glyph `??` dan tanpa teks jam.

## Konsekuensi & Keuntungan
- Bola dunia tampak sangat bersih, lega, dan estetis saat dilihat dari jarak jauh.
- Pengguna yang melakukan zoom in mendapatkan pengalaman visual yang kaya dengan seluruh kota regional muncul secara dinamis.
- Mengurangi jumlah draw calls dan memory overhead texture Three.js hingga >60% saat zoom out.
