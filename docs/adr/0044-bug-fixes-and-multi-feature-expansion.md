# ADR 0044: Bug Remediation, Viewport & Plugin Architecture Polish, and Multi-Feature Expansion

## Status
Accepted

## Context
Menindaklanjuti audit menyeluruh codebase pasca ADR-0043, ditemukan dua bug teknis berprioritas tinggi (P1) dan beberapa area friksi arsitektur:
1. **Kebocoran Palet Warna FX-Rates (Bug 1)**:
   Pada `Globe3DView.svelte`, blok fallback pewarnaan poligon negara (`getCountryColorByIso3`) masih memiliki kondisi hardcoded `if (mapState.activeMetric === 'rate' || 'change')` yang memetakan nilai tukar Rupiah. Ketika micro-app non-kurs aktif dan tidak mendefinisikan `getPolygonColor`, tampilan bola dunia keliru menerapkan choropleth mata uang.
2. **Pelanggaran Open-Closed Principle pada Bottom Dock (Bug 2)**:
   `App.svelte` masih mempertahankan rantai `if-else` manual (`else if (activeAppId === 'world-time')`, dst.) untuk memilih dock bawah, mengabaikan hook `BottomDockComponent` yang telah diperkenalkan di ADR-0040.
3. **Peningkatan Kebutuhan Fitur Pengguna**:
   - Pengguna membutuhkan tampilan tren historis langsung di dalam panel inspeksi negara tanpa harus berganti tab (`TrendChart` di `UniversalCountryInspector`).
   - Meta tag SEO dan OpenGraph belum bersifat dinamis per micro-app.
   - Filter negara di `filterEngine.ts` masih menggunakan peta statis dan perlu didelegasikan ke `plugin.filterPredicate`.
   - Modul `RateCard` memerlukan tautan URL mendalam (*deep linking*) yang dapat langsung disalin dan dibagikan.
   - Modal peringatan kurs (*Rate Alert*) memerlukan visualisasi ambang batas yang lebih informatif.
   - Pengguna membutuhkan modul pelacak gempa dan bencana alam (`/quake`) dengan visualisasi episenter gelombang cincin animasi 3D (`ringsData`).

## Decision
1. **Perbaikan Fallback Warna Netral pada Globe3DView**:
   - Menghapus aturan hardcoded `rate` dan `change` di `Globe3DView.svelte`.
   - Mengarahkan fallback pewarnaan poligon tanpa hook plugin ke warna netral bertema (`rgba(51, 65, 85, 0.40)` pada mode gelap dan `rgba(226, 232, 240, 0.60)` pada mode terang).
2. **Deklarasi Eksplisit `BottomDockComponent` pada Plugin**:
   - Mendaftarkan komponen dock langsung ke metadata masing-masing micro-app:
     - `worldTimeApp.BottomDockComponent = TimeBottomDock`
     - `flowCorridorsApp.BottomDockComponent = FlightBottomDock`
     - `passportWorldApp.BottomDockComponent = PassportBottomDock`
     - `fxRatesApp.BottomDockComponent = KursBottomDock`
   - Menyederhanakan `App.svelte` agar hanya merender `geoStore.activeApp?.BottomDockComponent` secara murni polimorfik.
3. **Penyematan Mini Trend Chart di Country Inspector**:
   - Mengintegrasikan visualisasi pergerakan nilai tukar historis ke dalam `UniversalCountryInspector.svelte` untuk negara yang memiliki data mata uang aktif.
4. **Dynamic SEO & OpenGraph Metadata**:
   - Memperbarui `<svelte:head>` pada `App.svelte` dengan judul dinamis, deskripsi, OpenGraph tags (`og:title`, `og:description`, `og:url`), serta Twitter card sesuai `geoStore.activeApp`.
5. **Delegasi Filter Plugin (`filterPredicate`)**:
   - Memperbarui `filterEngine.ts` untuk mendelegasikan evaluasi filter kepada `plugin.filterPredicate` bila didefinisikan oleh micro-app terkait.
6. **Peningkatan Shareable Rate Card & Rate Alert**:
   - Menyediakan fitur salin tautan spesifik pasangan mata uang pada `RateCard.svelte`.
   - Mempercantik antarmuka `RateAlertModal` dengan ringkasan target kurs vs kurs aktual.
7. **Micro-App Earthquake & Disaster Tracker (`/quake`)**:
   - Membuat plugin `earthquakeApp.ts` dengan rute kanonikal `/quake` (alias `/earthquake`, `/gempa`).
   - Mengaktifkan layer `ringsData` pada Globe.gl di `Globe3DView.svelte` untuk menghasilkan efek gelombang episenter gempa 3D yang berdenyut (*pulsing rings*).
   - Menyediakan visualisasi tingkat kerentanan seismik global dan rincian magnitudo/kedalaman gempa bumi.

## Consequences
- Seluruh rendering dock bawah dan pewarnaan poligon menjadi 100% polimorfik dan agnostik terhadap jenis aplikasi.
- Penambahan micro-app baru ke depannya tidak lagi memerlukan modifikasi pada `App.svelte` maupun Three.js core loop di `Globe3DView.svelte`.
- Platform mendapatkan kapabilitas visual baru yang kaya (animasi episenter cincin 3D) serta SEO & shareability yang optimal.
