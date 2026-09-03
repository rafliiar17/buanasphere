# ADR 0050: Dynamic High-Contrast Country Labels & Authentic Flag Mode in /capitals

## Status
Accepted

## Context
Pada platform Buanasphere (`kurs-world`), pengguna menjelajahi data global melalui berbagai micro-app 3D WebGL (Three.js / Globe.gl). Berdasarkan tangkapan layar pengguna pada micro-app *Ibukota & Kemerdekaan* (`/capitals`):
1. **Masalah Keterbacaan Label Teks Negara**:
   - Ketika suatu negara dipilih (misalnya Amerika Serikat), teks label nama negara dirender dengan warna cyan tipis (`#38bdf8`) di atas permukaan poligon negara yang juga berwarna biru/cyan (`#0284c7`). Hal ini mengakibatkan efek **cyan di atas cyan**, di mana teks hampir tidak terlihat dan sangat sulit dibaca.
   - Ketinggian 3D pin label (`labelAltitude: 0.020`) terlalu dekat dengan ketinggian poligon saat terpilih (`polygonAltitude: 0.018`), sehingga pada sudut kamera miring (*oblique angles*) terjadi *clipping* atau *z-fighting* antara teks sprite dan poligon 3D.
   - Teks negara pada bola dunia kurang dinamis, tanpa penyertaan emoji bendera negara dan tanpa indikator pin bersinar (*glowing dot*) yang mencolok.
2. **Ketiadaan Visual Bendera Autentik di `/capitals`**:
   - Pada micro-app *Kurs Valas* (`/`), tersedia mode visual bendera negara (*procedural flag material*) yang merender bendera autentik langsung pada poligon 3D (seperti garis-garis merah putih dan kanton biru bintang pada bendera USA).
   - Pengguna mengharapkan visual bendera autentik ini juga dapat dinikmati di micro-app *Ibukota & Kemerdekaan* (`/capitals`), sehingga pengguna dapat beralih antara visualisasi era sejarah kemerdekaan dan visual bendera negara asli.

## Decision
1. **Teks Label Negara Dinamis & Berkontras Tinggi di `Globe3DView.svelte`**:
   - **Contrast-Aware Color on Selection**: Saat negara dipilih (`isSelected`), warna teks label diubah menjadi **Pure White (`#ffffff`)** dengan dot indikator bersinar (*glowing amber/emerald dot* `#fbbf24` / `#10b981`), bukan lagi cyan `#38bdf8` yang bentrok dengan warna poligon.
   - **Elevated 3D Pin Altitude**: Ketinggian label saat negara terpilih dinaikkan ke `labelAltitude: 0.035` (dibandingkan poligon `0.018`) sehingga teks melayang anggun di atas permukaan 3D dan bebas dari *z-fighting* atau terpotong mesh poligon.
   - **Dynamic Flag Emoji & Rich Metadata**: Setiap label teks menyertakan emoji bendera resmi negara secara dinamis (contoh: `🇺🇸 Amerika Serikat` atau `🇺🇸 Washington, D.C. • Amerika Serikat` pada micro-app Capitals).
   - **High-Resolution Canvas Font**: Meningkatkan `labelResolution` menjadi `3` dan memperbesar skala font saat terpilih (`size: 0.80`) untuk keterbacaan tajam pada layar Retina / High-DPI.

2. **Dukungan Penuh Visual Bendera Autentik di `/capitals`**:
   - **Sinkronisasi Deteksi Metrik Bendera**: Di `Globe3DView.svelte`, variabel `isFlag` diperbarui untuk mengecek metrik dari kedua sumber:
     `const isFlag = (mapState.activeMetric === 'flag' || geoStore.activeMetricId === 'flag');`
   - **Penerapan Material Prosedural**: Saat `isFlag` bernilai `true`, `Globe3DView` menerapkan `createProceduralFlagMaterial` ke seluruh poligon negara di globe untuk micro-app `/capitals`.
   - **Preservasi Tekstur Bendera Saat Negara Terpilih**: Dalam mode bendera, negara yang dipilih tidak ditutupi oleh warna flat cyan `#38bdf8`, melainkan tetap mempertahankan tekstur bendera autentik dengan indikasi seleksi berupa ketinggian poligon terangkat (`polygonAltitude: 0.022`), highlight garis tepi (*stroke*), dan pin ibukota 3D yang bersinar.

3. **Penyempurnaan `worldCapitalsApp.ts` & `UniversalAppControls.svelte`**:
   - Memperbarui `getPinLabel` pada `worldCapitalsApp` agar menyertakan emoji bendera dan nama ibukota secara elegan.
   - Memastikan tombol pemilihan metrik "🎨 Bendera Negara" mudah diakses dan sinkron antara `geoStore` dan `mapState`.

## Consequences
- Label teks negara di seluruh bola dunia 3D menjadi jauh lebih jelas, beresolusi tinggi, dan tidak pernah lagi mengalami masalah kontras rendah (*cyan di atas cyan*).
- Pengguna `/capitals` kini dapat menikmati visualisasi bendera autentik 195+ negara di dunia dengan transisi halus antara mode Era Kemerdekaan dan mode Bendera Negara.
