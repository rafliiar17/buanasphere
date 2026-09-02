# ADR 0032: Smooth Metric Material Switching (Flag / Spot Rate / 24h Trend) with Non-Blocking Lazy-Loading

## Status
Accepted

## Konteks
Pada visualisasi 3D Globe di **Kurs World** (`/` atau `/kurs`), pengguna dapat memilih tiga mode pewarnaan metrik poligon:
1. **Kurs Nominal 🪙 (`rate`)**: Menampilkan gradien warna nilai tukar terhadap Rupiah (IDR).
2. **Tren 24 Jam 📈 (`change`)**: Menampilkan indikator performa penguatan (hijau) atau pelemahan (merah) dalam 24 jam terakhir.
3. **Bendera Negara 🏁 (`flag`)**: Menampilkan pola bendera nasional masing-masing negara melalui procedural canvas shaders.

### Masalah yang Ditemukan
1. **Material Retention di Three-Globe**: Ketika mode bendera aktif, `polygonCapMaterial` mengikat `THREE.ShaderMaterial` ke mesh poligon. Saat pengguna beralih kembali ke `rate` atau `change`, `three-globe` tidak melepas material kustom tersebut karena array GeoJSON yang dikirimkan memiliki referensi objek yang sama (`===`), sehingga fungsi `polygonCapColor` diabaikan oleh Three.js.
2. **Ketiadaan Visual Lazy-Loading Transition**: Inisialisasi dan pengikatan 195+ tekstur bendera pada canvas membutuhkan waktu komputasi ~150-250ms pada GPU. Tanpa transisi asinkron dan indikator visual lazy-loading, browser berpotensi mengalami *micro-freeze* dan pengguna tidak mendapatkan kepastian visual bahwa proses perpindahan metrik sedang berlangsung.

---

## Keputusan Arsitektur

1. **Rebinding & Refresh Pipeline Material di `Globe3DView.svelte`**:
   - Menerapkan fungsi asinkron `applyMetricTransition(newMetric: MetricType)`:
     - Set state `isSwitchingMetric = true` dan `transitionLabel` yang informatif.
     - Menggunakan `requestAnimationFrame` / `setTimeout(..., 16)` untuk memberi kesempatan Svelte 5 merender loading HUD terlebih dahulu.
     - Melakukan shallow clone pada data poligon (`geoJsonFeatures.map(f => ({ ...f }))`) sehingga `three-globe` mendeteksi pembaruan data dan membangun ulang material poligon secara bersih.
     - Jika `newMetric === 'flag'`: pasang `polygonCapMaterial((d) => createProceduralFlagMaterial(d, isDark))`.
     - Jika `newMetric !== 'flag'`: set `polygonCapMaterial(() => null)` dan aktifkan `polygonCapColor((d) => getPolygonColor(d))`.
     - Setelah komputasi selesai, set `isSwitchingMetric = false`.

2. **Holographic Lazy-Loading HUD Overlay**:
   - Menambahkan floating HUD pill di bagian tengah-bawah canvas WebGL dengan efek glassmorphism (`backdrop-blur-xl`, border glow):
     - Mode Bendera: *"🎨 Memuat & Memetakan Tekstur Bendera 195+ Negara..."*
     - Mode Kurs: *"🪙 Mengalibrasi Shader Spot Rate Rupiah..."*
     - Mode Tren: *"📈 Mengalibrasi Indikator Performa 24 Jam..."*
   - Dilengkapi animasi spinner halus (`animate-spin`).

3. **Two-Way Synchronization di `KursControls.svelte` & `WorldRateMap.svelte`**:
   - Memastikan interaksi klik tombol metrik `Kurs`, `Tren 24h`, dan `Bendera` langsung sinkron dengan `mapState.setMetric(m)` dan memicu transisi material tanpa delay.

---

## Konsekuensi

### Positif
- Pergantian mode metrik (Kurs <-> Tren 24h <-> Bendera) berfungsi 100% andal tanpa ada material yang tertahan atau poligon yang tidak berganti warna.
- Memberikan feedback visual seketika (*zero perceptual delay*) berkat lazy-loading HUD.
- Menjaga framerate 60 FPS dan pelepasan memori VRAM GPU Three.js yang bersih.

### Mitigasi
- Shallow clone array GeoJSON berukuran ringan (~195 objek) dieksekusi hanya saat metrik berubah, sehingga tidak ada overhead pada loop animasi utama (*render loop*).
