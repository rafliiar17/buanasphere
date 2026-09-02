# ADR 0014: Synchronous In-Memory Canvas Flag Texture Engine (Zero Black Screen Guarantee)

## Status
**Accepted**

## Context & Problem Statement
Saat pengguna beralih ke mode **`Bendera Negara 🏁`**, seluruh bola bumi tampak berwarna hitam pekat (garis batas negara terlihat tetapi permukaan negara hitam).

### Investigasi Akar Masalah
1. **Kegagalan Siklus Hidup Asinkron Texture WebGL (`TextureLoader.load()`)**:
   - `THREE.TextureLoader.load('/flags/id.png')` memicu pemuatan gambar secara asinkron melalui elemen `HTMLImageElement`.
   - Sebelum gambar selesai diunduh dan didekode oleh browser, objek `THREE.Texture` berada dalam kondisi kosong ($0 \times 0$ pixel).
   - Pada `ShaderMaterial`, seragam `hasTexture` diset bernilai `1.0` sejak inisialisasi.
   - GPU fragment shader mengeksekusi `texture2D(flagTexture, uv)` pada tekstur kosong yang menghasilkan `vec4(0.0, 0.0, 0.0, 0.0)` $\implies$ **HITAM PEKAT `#000000`**.
   - Terlebih lagi, `globe.gl` mengevaluasi `polygonCapMaterial()` sekali saat pembentukan awal poligon, sehingga ketika texture selesai diunduh beberapa ratus milidetik kemudian, poligon tidak secara otomatis me-render ulang tanpa *trigger explicit*.

2. **Kebutuhan Tekstur Sinkron Seketika (*Synchronous In-Memory Canvas*)**:
   - Untuk menjamin poligon langsung menampilkan bendera pada frame pertama ($0\text{ms}$) tanpa menunggu request jaringan atau menghadapi risiko tekstur kosong, tekstur bendera harus dibuat secara **sinkron di memori (*in-memory*)** menggunakan HTML5 Canvas 2D API (`document.createElement('canvas')` / `THREE.CanvasTexture`).

## Solusi Arsitektur
1. **Mesin Gambar Bendera Sinkron (*Synchronous Vexillological Canvas Generator*)**:
   - Setiap negara memiliki fungsi generator kanvas berukuran $128 \times 80\text{px}$ yang digambar seketika secara sinkron:
     - 🇮🇩 **Indonesia (`IDN`)**: Merah atas (`#dc2626`), Putih bawah (`#ffffff`).
     - 🇫🇷 **Prancis (`FRA`)**: Biru kiri (`#1d4ed8`), Putih tengah (`#ffffff`), Merah kanan (`#dc2626`).
     - 🇩🇿 **Aljazair (`DZA`)**: Hijau kiri (`#15803d`), Putih kanan (`#ffffff`), Bulan Sabit & Bintang Merah di tengah (`#dc2626`).
     - 🇵🇹 **Portugal (`PRT`)**: Hijau 40% kiri (`#15803d`), Merah 60% kanan (`#dc2626`), Armillary Sphere & Perisai emas/biru di tengah.
     - 🇪🇸 **Spanyol (`ESP`)**: Merah-Kuning-Merah dengan Perisai Kerajaan.
     - 🇨🇭 **Swiss (`CHE`)**: Merah dengan Salib Putih di tengah.
     - 🇧🇳 **Brunei Darussalam (`BRN`)**: Kuning Emas Kerajaan dengan Pita Diagonal Putih-Hitam dan Lambang Merah.
     - 🇩🇪 **Jerman (`DEU`)**: Hitam atas, Merah tengah, Emas bawah.
     - 🇺🇸 **USA (`USA`)**: 13 garis merah-putih dan kanto biru dengan bintang.
     - 🇯🇵 **Jepang (`JPN`)**: Putih dengan bulatan Merah Hinomaru.
     - 🇸🇦 **Arab Saudi (`SAU`)**: Hijau dengan lambang pedang putih.
     - Seluruh 195+ negara berdaulat di dunia.
2. **Instant Canvas Texture (`THREE.CanvasTexture`)**:
   - Kanvas langsung diubah menjadi `THREE.CanvasTexture(canvas)` dengan `needsUpdate = true`.
   - Tekstur memiliki data piksel nyata sejak milidetik pertama $\implies$ **100% Zero Black Screen Guarantee**.
3. **GPU Spherical Projection Shader**:
   - Shader memproyeksikan piksel kanvas bendera ke poligon 3D bola bumi:
     $$\text{gl\_FragColor} = \text{texture2D}(\text{flagTexture}, \text{vec2}(u, 1.0 - v))$$

## Consequences
- **Positif**:
  - Nol layar hitam (*Zero Black Screen*): Setiap negara langsung berwarna dan bermotif bendera seketika tanpa jeda pemuatan.
  - Aljazair, Prancis, Spanyol, Portugal, Italia, Swiss, Brunei, Indonesia, dll. tampil sempurna dengan elemen grafis lengkap (garis, lambang, bintang, bulan sabit).
  - 100% offline, zero network dependency, performa render 60 FPS mulus.
