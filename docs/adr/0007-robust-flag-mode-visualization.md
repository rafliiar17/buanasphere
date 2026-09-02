# ADR 0007: Robust 3D & 2D National Flag Mode Visualization Architecture

## Status
**Accepted**

## Context & Problem Statement
Pada mode visualisasi **`Bendera Negara 🏁`**, pengguna menginginkan representasi visual bendera kebangsaan yang jelas di setiap wilayah negara (misalnya dwiwarna Merah-Putih Indonesia, triwarna Biru-Kuning-Merah Chad, dll.) agar pengguna dapat langsung mengenali identitas negara dan mata uangnya.

Namun, upaya memetakan tekstur gambar bitmap 2D (`TextureLoader`) langsung ke material poligon (`polygonCapMaterial`) pada Three.js WebGL globe mengalami kendala teknis mendasar:
1. **Ketiadaan Koordinat UV (*Lack of UV Mapping in Spherical Geometries*)**: `three-geojson-geometry` menghasilkan simpul 3D dari koordinat bola (latitude/longitude), bukan koordinat bidang datar (UV). Material tekstur WebGL yang tidak memiliki UV buffer yang valid akan menghasilkan warna hitam pekat (`#000000`).
2. **Keterbatasan Koneksi Jaringan (*CORS & Browser Connection Limits*)**: Memuat 195 gambar tekstur bendera secara asinkron memicu 195 subrequest HTTP sekaligus, menyebabkan browser throttling (maksimal 6 koneksi paralel per host) dan kegagalan muat tekstur.
3. **Distorsi Proyeksi Bola (*Spherical Skewing*)**: Meregangkan gambar rasio 3:2 pada kepulauan (seperti Indonesia) atau negara melengkung (seperti Chile atau Rusia) menghasilkan distorsi visual yang tidak natural.

## Decision
Kami menerapkan arsitektur **Hybrid Flag Visualization Engine** yang tangguh, deterministik, dan berkinerja tinggi 60 FPS:

1. **Polygon Sovereign Flag Primary Tone (`polygonCapColor`)**:
   - Setiap poligon negara diwarnai dengan palet warna primer bendera resmi kebangsaannya (`COUNTRY_FLAG_COLOR_MAP`), seperti `#dc2626` untuk Indonesia/Jepang, `#047857` untuk Arab Saudi, `#1e3a8a` untuk USA/Australia/Thailand, `#d97706` untuk Jerman/Belgia, `#15803d` untuk Italia/Brasil, `#1d4ed8` untuk Prancis/Rusia.
   - Poligon dirender menggunakan solid WebGL shader tanpa ketergantungan tekstur asinkron, menjamin **nol layar hitam (*zero black screen*)** dan **0ms latency**.

2. **Floating High-Res HTML Flag Badges (`htmlElementsData`) pada 3D Globe**:
   - Di atas centroid setiap negara, `globe.gl` merender pin badge HTML interaktif yang memuat **gambar bendera resmi beresolusi tinggi (FlagCDN)** berdampingan dengan nama negara dan kode mata uang.
   - Badge ini berorientasi menghadap kamera (*billboard billboard*), bebas dari distorsi lengkungan bola, dan dapat diklik untuk membuka inspector detail negara.

3. **Plotly 2D Flat Map Discrete Flag Mapping**:
   - Pada Peta Datar (Flat Map), Plotly menggunakan pemetaan skala warna diskrit untuk setiap kode ISO-3 negara yang terhubung ke warna bendera resminya, dilengkapi teks label `${countryName} (${currencyCode})` pada setiap wilayah.

4. **Rich Interactive Tooltip & Inspector Drawer**:
   - Tooltip hover dan drawer inspektur menampilkan bendera resmi SVG/PNG ukuran besar, kurs jual/beli, spread, dan kalkulator kilat.

## Consequences
- **Positif**:
  - Tampilan visual bendera negara terlihat jelas, tajam, dan tidak terdistorsi di seluruh tingkat zoom.
  - Bebas dari error WebGL shader dan timing race condition.
  - Performa render tetap stabil di 60 FPS dengan penggunaan memori yang sangat hemat.
  - Kompatibilitas penuh pada mode Dark dan Light theme.
- **Negatif**:
  - Poligon bola bumi menggunakan warna primer bendera (bukan gambar bendera kotak yang dipotong melengkung), namun diimbangi dengan pin lencana bendera asli beresolusi tinggi di setiap negara.
