# ADR 0054: Interactive 24-Hour Time Scrubber, Multi-Timezone Indonesia (WIB, WITA, WIT), & Full 120+ Kota Dunia

## Status
Accepted

## Konteks & Problem Statement
Micro-app **TimeWorld (`/time`)** pada Buanasphere telah memiliki visualisasi bola dunia 3D, spektrum diurnal 8 fase, dan 65 titik kota. Namun, untuk menjadi platform pemantauan waktu dunia yang profesional, fungsional, dan relevan bagi masyarakat Indonesia dan global, terdapat 3 kebutuhan utama:
1. **Interactive Time Scrubber (Time Travel)**: Pengguna membutuhkan kemampuan mensimulasikan waktu di masa depan atau lampau (contoh: "Jika di Jakarta jam 14:00, jam berapa di Tokyo, London, dan San Francisco?"). Saat ini waktu hanya berjalan secara pasif sesuai jam lokal perangkat.
2. **Konteks Multi-Zona Waktu Indonesia (WIB, WITA, WIT)**: Indonesia terbentang di 3 zona waktu (WIB UTC+7, WITA UTC+8, WIT UTC+9). Pengguna membutuhkan tampilan visual simultan yang menyandingkan ketiga zona waktu ini, serta kemampuan memilih zona patokan (anchor).
3. **Cakupan Kota Dunia & Indonesia Komprehensif (120+ Kota)**: Pengguna menginginkan representasi kota lengkap yang mencakup seluruh pulau besar Indonesia (Sumatera, Jawa, Kalimantan, Sulawesi, Bali, Nusa Tenggara, Maluku, Papua, hingga IKN Nusantara) dan kota-kota metropolis di seluruh benua.

## Keputusan Arsitektur

### 1. Perluasan Dataset 120+ Kota Dunia & Indonesia (`worldCitiesTimeData.ts`)
- Memperluas dataset kurasi menjadi **120+ kota** yang terdistribusi di seluruh benua dan zona waktu dunia (UTC-12 s/d UTC+14).
- Memetakan secara detail kota-kota di Indonesia:
  - **WIB (UTC+7)**: Jakarta, Surabaya, Bandung, Medan, Palembang, Semarang, Yogyakarta, Banda Aceh, Padang, Pekanbaru, Bandar Lampung, Pontianak.
  - **WITA (UTC+8)**: Denpasar (Bali), Mataram (Lombok), Kupang (NTT), Makassar, Manado, Balikpapan / IKN Nusantara, Samarinda, Banjarmasin, Palu, Kendari.
  - **WIT (UTC+9)**: Jayapura, Sorong, Merauke, Ambon, Ternate, Manokwari.
- Menambahkan metadata zona waktu standar (`timezoneAbbr`, `timezoneName`, `regionGroup`).

### 2. Time-Travel Simulation Engine di `geoStore.svelte.ts` & `geoMath.ts`
- Menyediakan state simulasi waktu reaktif di `geoStore`:
  - `isSimulatingTime: boolean`: menandakan apakah slider sedang aktif atau mode live.
  - `simulatedMinutes: number`: posisi waktu dalam hari (0 - 1439 menit).
  - `simulationAnchorZone: 'WIB' | 'WITA' | 'WIT' | 'UTC' | 'LOCAL'`: acuan patokan waktu slider.
  - `getEffectiveTime(): Date`: menghitung objek `Date` virtual yang disinkronkan dengan posisi slider.
- Menambahkan tombol `🔴 LIVE` yang otomatis muncul saat simulasi aktif, memungkinkan reset seketika ke detik riil saat ini.

### 3. Indonesian 3-Timezone Ribbon (WIB • WITA • WIT) di `TimeControls.svelte`
- Menampilkan komponen ribbon 3 kartu yang menyandingkan:
  - 🇮🇩 **WIB** (UTC+7 Jakarta)
  - 🇮🇩 **WITA** (UTC+8 Bali / IKN)
  - 🇮🇩 **WIT** (UTC+9 Jayapura)
- Setiap kartu menampilkan jam terformat (`HH:mm`), badge status diurnal (☀️ Siang / 🌙 Malam), dan selisih jam.

### 4. Integrasi Pin 3D Real-Time di Kanvas Bola Dunia
- `worldTimeApp.getCustomLabels` dan `getPolygonColor` mengonsumsi `getEffectiveTime()` sehingga ketika slider digeser, seluruh 120+ titik kota di kanvas bola dunia 3D dan spektrum pewarnaan siang/malam di daratan ikut bergeser secara mulus (<16ms per frame).

## Konsekuensi & Keuntungan
- **Responsif & Interaktif**: Pengguna dapat merencanakan meeting, konferensi global, atau panggilan lintas zona waktu secara visual dan intuitif.
- **Identitas Indonesia Kuat**: Menghubungkan seluruh wilayah nusantara (WIB, WITA, WIT) dengan pasar finansial dan kota-kota global.
- **Zero Performance Degradation**: Menjaga efisiensi LOD dan reaktivitas Svelte 5 runes sehingga penambahan titik kota tidak membebani GPU atau memicu re-render berlebih.
