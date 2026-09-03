# ADR 0052: Accurate World Cities & Geographic 3D Points in TimeWorld (/time)

## Status
Accepted

## Context
Pada platform Buanasphere (`kurs-world`), aplikasi mikro *TimeWorld* (`https://globe.arafz.id/time`) menyediakan visualisasi jam global real-time, spektrum diurnal 8 fase surya, dan selisih waktu terhadap Waktu Indonesia Barat (WIB).

Namun, visualisasi dan navigasi saat ini masih bersifat *country-centric* (berbasis negara tunggal dengan satu koordinat centroid/ibukota per negara). Hal ini menimbulkan beberapa keterbatasan:
1. **Negara Multi-Zona Waktu**:
   - Negara kepulauan dan benua luas seperti Indonesia (WIB, WITA, WIT), Amerika Serikat (EST, CST, MST, PST, AKST, HST), Australia (AWST, ACST, AEST), Kanada, dan Rusia memiliki banyak zona waktu berbeda. Plotting berbasis satu titik negara tidak dapat membedakan waktu antara Jakarta (WIB UTC+7), Bali/Makassar (WITA UTC+8), dan Jayapura (WIT UTC+9).
2. **Ketiadaan Titik Kota Dunia**:
   - Pengguna jam global terbiasa memantau kota metropolis utama dunia (Tokyo, London, New York, Paris, Dubai, Singapura, Sydney, Los Angeles, Hong Kong, Kairo, Moskow, dsb.). Kanvas bola dunia 3D belum memiliki titik pin kota dengan koordinat lintang/bujur (`lat`, `lng`) yang akurat.
3. **Pencarian Autocomplete Belum Mendukung Kota**:
   - Kolom pencarian di `TimeControls.svelte` saat ini hanya mencari nama negara, belum dapat mencari kota regional seperti Bali, Surabaya, Jayapura, Los Angeles, atau Chicago.

## Decision
1. **Dataset Komprehensif Kota Dunia Akurat (`worldCitiesTimeData.ts`)**:
   - Menyediakan dataset berisi 65+ kota metropolis dan hub waktu global penting di seluruh dunia dengan koordinat lintang/bujur berpresisi tinggi (`lat`, `lng`), offset UTC riil, singkatan zona waktu (`WIB`, `WITA`, `WIT`, `JST`, `GMT`, `EST`, `PST`, `AEST`, dll.), dan bendera negara.
   - Menyediakan kategori `isMajorHub` untuk membedakan kota hub utama (Level-of-Detail rendering) guna menjaga performa 60 FPS pada WebGL.

2. **Ekstensi Polymorphic Plugin Interface (`getCustomLabels` pada `types.ts`)**:
   - Menambahkan hook opsional `getCustomLabels` pada `GeoAppPlugin` yang memungkinkan microapp menyuplai titik-titik pin kustom ke kanvas bola dunia 3D.
   - Pada `worldTimeApp.ts`, fungsi ini menghitung jam lokal per kota secara real-time (`calculateLocalTime`), fase matahari diurnal (☀️ / 🌙), dan mengembalikan pin berformat `${city.flagEmoji} ${city.cityName} • ${cityTime.formatted} ${phase.emoji}`.

3. **Rendering Pin Titik Kota 3D pada `Globe3DView.svelte`**:
   - `Globe3DView.svelte` mengecek `activeApp.getCustomLabels`. Jika tersedia, kanvas 3D menampilkan titik-titik kota dunia dengan dot indikator fase diurnal beranimasi (`labelDotRadius: 0.22`), elevasi melayang `labelAltitude: 0.032` (bebas dari z-fighting), dan resolusi tajam `labelResolution: 3`.
   - Mengklik pin kota pada globe memicu animasi kamera terbang (*travel*) langsung ke koordinat kota tersebut.

4. **Pencarian Autocomplete Kota & Negara pada `TimeControls.svelte`**:
   - Kolom pencarian mendukung pencarian nama kota maupun nama negara.
   - Memilih kota dari dropdown autocomplete otomatis menerbangkan kamera ke koordinat geografis kota tersebut dan mengaktifkan inspeksi waktu kota.

5. **Drawer & Inspector Jam Kota**:
   - Inspector widget menampilkan jam digital kota, selisih jam vs WIB Jakarta, status jam kantor setempat, fase matahari, dan koordinat akurat.

## Consequences
- Tampilan bola dunia pada `/time` menjadi representasi waktu dunia yang akurat, informatif, dan realistis di tingkat kota.
- Negara multi-zona waktu seperti Indonesia, Amerika Serikat, dan Australia terpetakan dengan tepat sesuai zona waktu masing-masing kota.
- Pengguna dapat mencari dan melompat (*travel*) ke kota mana pun di dunia dengan presisi geografis tinggi.
