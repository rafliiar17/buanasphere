# ADR 0008: Procedural Flag Pattern Engine & Multi-Stripe Sovereign Shader

## Status
**Accepted**

## Context & Problem Statement
Pengguna menginginkan area poligon negara (seperti Prancis, Indonesia, Jerman, Italia, Chad, dll.) menampilkan **corak multi-warna bendera kebangsaan yang sesungguhnya** (contoh: Prancis dengan 3 garis vertikal Biru-Putih-Merah; Indonesia dengan 2 garis horizontal Merah-Putih; Jerman dengan 3 garis horizontal Hitam-Merah-Emas; dll.), bukan sekadar satu warna solid tunggal.

Tantangan teknis utama:
1. Memuat gambar raster bitmap eksternal (PNG/JPEG) dari jaringan secara massal (195+ negara) rawan kegagalan koneksi, CORS, dan menyebabkan layar hitam pada WebGL.
2. Geometri poligon bola bumi pada `globe.gl` memerlukan pemetaan tekstur deterministik yang mandiri dan bebas dari ketergantungan jaringan.

## Decision
Kami mengimplementasikan **Procedural Vexillological Pattern Generator** di sisi klien:

### 1. Klasifikasi Pola Vexillologis (*Pattern Archetypes*)
Setiap negara dipetakan ke dalam salah satu arketipe corak geometris bendera:
- **`vertical-tricolor`** (3 Garis Vertikal):
  - 🇫🇷 Prancis: Biru (`#1d4ed8`), Putih (`#ffffff`), Merah (`#dc2626`)
  - 🇹🇩 Chad: Biru (`#1d4ed8`), Kuning (`#eab308`), Merah (`#dc2626`)
  - 🇮🇹 Italia: Hijau (`#15803d`), Putih (`#ffffff`), Merah (`#dc2626`)
  - 🇧🇪 Belgia: Hitam (`#18181b`), Kuning (`#eab308`), Merah (`#dc2626`)
  - 🇮🇪 Irlandia: Hijau (`#15803d`), Putih (`#ffffff`), Oranye (`#ea580c`)
  - 🇷🇴 Rumania: Biru (`#1d4ed8`), Kuning (`#eab308`), Merah (`#dc2626`)
  - 🇵🇪 Peru: Merah (`#dc2626`), Putih (`#ffffff`), Merah (`#dc2626`)
- **`horizontal-bicolor`** (2 Garis Horizontal):
  - 🇮🇩 Indonesia: Merah (`#dc2626`) atas, Putih (`#ffffff`) bawah
  - 🇵🇱 Polandia: Putih (`#ffffff`) atas, Merah (`#dc2626`) bawah
  - 🇺🇦 Ukraina: Biru Langit (`#0284c7`) atas, Kuning Gandum (`#eab308`) bawah
  - 🇸🇬 Singapura: Merah (`#dc2626`) atas, Putih (`#ffffff`) bawah
- **`horizontal-tricolor`** (3 Garis Horizontal):
  - 🇩🇪 Jerman: Hitam (`#18181b`), Merah (`#dc2626`), Emas (`#d97706`)
  - 🇳🇱 Belanda: Merah (`#dc2626`), Putih (`#ffffff`), Biru (`#1e40af`)
  - 🇷🇺 Rusia: Putih (`#ffffff`), Biru (`#1d4ed8`), Merah (`#dc2626`)
  - 🇦🇹 Austria: Merah (`#dc2626`), Putih (`#ffffff`), Merah (`#dc2626`)
  - 🇭🇺 Hongaria: Merah (`#dc2626`), Putih (`#ffffff`), Hijau (`#15803d`)
  - 🇪🇬 Mesir: Merah (`#dc2626`), Putih (`#ffffff`), Hitam (`#18181b`)
- **`circle-disc`** (Bulatan Tengah):
  - 🇯🇵 Jepang: Dasar Putih (`#ffffff`) dengan bulatan Merah Hinomaru (`#dc2626`) di tengah
  - 🇧🇩 Bangladesh: Dasar Hijau (`#047857`) dengan bulatan Merah (`#dc2626`)
- **`nordic-cross`** (Salib Skandinavia):
  - 🇸🇪 Swedia: Dasar Biru (`#0284c7`) dengan salib Kuning (`#eab308`)
  - 🇳🇴 Norwegia: Dasar Merah (`#dc2626`) dengan salib Biru & Putih
  - 🇩🇰 Denmark: Dasar Merah (`#dc2626`) dengan salib Putih (`#ffffff`)
  - 🇫🇮 Finlandia: Dasar Putih (`#ffffff`) dengan salib Biru (`#1d4ed8`)
- **`cross`** (Salib Tengah):
  - 🇨🇭 Swiss: Dasar Merah (`#dc2626`) dengan salib Putih (`#ffffff`) di tengah
- **`canton-stripes`** (Garis Belang & Kanto Sudut):
  - 🇺🇸 Amerika Serikat: Kanto Biru Navy (`#1e3a8a`) dengan belang Merah-Putih
  - 🇬🇷 Yunani: Kanto Salib Biru dengan belang Biru-Putih
  - 🇲🇾 Malaysia: Kanto Biru-Kuning dengan belang Merah-Putih
- **`diamond-emblem`** (Belah Ketupat & Lingkaran):
  - 🇧🇷 Brasil: Dasar Hijau (`#15803d`) dengan belah ketupat Kuning (`#eab308`) & lingkaran Biru (`#1e40af`)
- **`star-field`** (Bintang & Warna Dominan):
  - 🇨🇳 Tiongkok: Dasar Merah (`#dc2626`) dengan bintang Emas (`#eab308`)
  - 🇻🇳 Vietnam: Dasar Merah (`#dc2626`) dengan bintang Emas (`#eab308`) di tengah
  - 🇹🇷 Turki: Dasar Merah (`#dc2626`) dengan bulan sabit & bintang Putih (`#ffffff`)
  - 🇸🇦 Arab Saudi: Dasar Hijau Zamrud (`#047857`) dengan pedang & kaligrafi Putih

### 2. Mekanisme Rendering Dinamis Tanpa Dependensi Jaringan
- Menggunakan **Offscreen Canvas Texture Generator** (`createFlagCanvasTexture(countryPattern)`) yang menggambar pola piksel secara lokal di memori (0ms network cost, 100% offline-ready).
- Menggunakan `THREE.CanvasTexture` dengan UV bounds per poligon atau `ShaderMaterial` untuk memetakan corak secara proporsional.
- Pada 2D Flat Map (Plotly), memetakan warna dominan dan badge bendera di tengah negara.

## Consequences
- **Positif**:
  - Tampilan visual negara langsung menyerupai bendera aslinya (Prancis biru-putih-merah, Indonesia merah-putih, dll.) secara akurat dan memukau.
  - 100% bebas dari lag jaringan, CORS error, atau masalah layar hitam WebGL.
  - Resolusi tajam dan berjalan konstan pada 60 FPS.
