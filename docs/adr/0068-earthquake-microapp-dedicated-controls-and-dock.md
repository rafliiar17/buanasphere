# ADR 0068: Dedicated Controls & Bottom Dock with Camera Swoop for Earthquake Micro-App (/quake)

## Status
Accepted

## Context
1. **Ketimpangan Paritas Micro-App**:
   Di BuanaSphere (`kurs-world`), microapp lain (`kurs`, `time`, `flight`, `flora`, `passport`) telah memiliki arsitektur komponen UI modular khusus di `frontend/src/lib/apps/<app>/`, terdiri dari:
   - `<App>Controls.svelte`: Kontrol filter dan visualisasi floating kanan atas.
   - `<App>BottomDock.svelte`: Dock bawah interaktif dengan metrik spesifik domain.
   - `<App>Tooltip.svelte`: Hover tooltip dengan konten kaya.
   Sebaliknya, microapp **Earthquake Tracker (`/quake`)** sebelumnya merupakan satu-satunya microapp yang belum memiliki folder komponen khusus dan masih mengandalkan fallback `UniversalAppControls.svelte` tanpa bottom dock sama sekali.
2. **Kebutuhan Domain Seismik Real-Time**:
   Pemantauan gempa bumi membutuhkan:
   - Filter cepat berdasarkan magnitudo (M4.0 s/d M8.0+) dan kedalaman gempa (Dangkal `<30 km`, Menengah `30-300 km`, Dalam `>300 km`).
   - Ticker horizontal gempa terkini bersumber dari feed live USGS dan BMKG.
   - Interaksi 3D langsung: ketika salah satu peristiwa gempa pada ticker diklik, kamera 3D Globe harus terbang (*camera swoop*) ke koordinat lintang/bujur episentrum gempa tersebut.

## Decision
1. **Membuat Paket Komponen Modular di `frontend/src/lib/apps/quake/`**:
   - **`QuakeControls.svelte`**: Kontrol spesifik domain gempa dengan filter slider/tombol magnitudo, filter kedalaman, preset Ring of Fire, serta toggle 3D Label & Rotasi.
   - **`QuakeBottomDock.svelte`**: Dock ticker gempa terkini horizontal yang menampilkan waktu kejadian (*time ago*), magnitudo dengan kode warna semantik (merah untuk M6+, oranye untuk M5+, kuning untuk M4.5+), lokasi, kedalaman, dan indikator peringatan tsunami.
   - **`QuakeTooltip.svelte`**: Tooltip hover informatif untuk data seismik.
2. **Interaktivitas Navigasi Kamera Episentrum**:
   - Di `QuakeBottomDock.svelte`, saat pengguna mengklik item gempa, `geoStore.selectCountry(countryIso3)` dipanggil dan sinyal `cameraTravelSignal` dikirimkan ke koordinat lintang & bujur gempa agar bola dunia 3D otomatis mengarahkan fokus ke episentrum.
3. **Pendaftaran Komponen ke `earthquakeApp.ts`**:
   - Mendaftarkan `ControlsComponent: QuakeControls` dan `BottomDockComponent: QuakeBottomDock` ke plugin `earthquakeApp`.
   - Menambahkan preset filter kedalaman dan magnitudo dinamis ke `filterOptions` dan `filterPredicate`.

## Consequences
### Positif
- Microapp `/quake` mencapai 100% paritas UI/UX dengan microapp BuanaSphere lainnya.
- Pengguna mendapatkan pengalaman interaktif yang imersif: dapat langsung melihat gempa bumi terkini di dunia dan mengarahkan pandangan 3D ke lokasi gempa dengan sekali klik.
- Desain konsisten menggunakan styling Tailwind CSS v4 dan shadcn-svelte tokens.

### Negatif / Trade-offs
- Sedikit penambahan ukuran bundle komponen (~5 kB), tertutup oleh pemangkasan Plotly 4.2 MB sebelumnya.
