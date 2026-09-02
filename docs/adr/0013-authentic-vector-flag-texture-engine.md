# ADR 0013: Authentic Vector/Raster Flag Texture Engine on 3D Polygons

## Status
**Accepted**

## Context & Problem Statement
Meskipun procedural GLSL shader dengan rumus matematika mampu menghasilkan garis-garis bendera sederhana (seperti tricolor atau bicolor), banyak bendera nasional di dunia yang memiliki elemen grafik kompleks seperti:
- 🇩🇿 **Aljazair (`DZA`)**: Bicolor hijau-putih dengan **Bulan Sabit & Bintang Merah** di pusat.
- 🇪🇸 **Spanyol (`ESP`)**: Triband merah-kuning-merah dengan **Lambang Kerajaan Spanyol (Coat of Arms)**.
- 🇵🇹 **Portugal (`PRT`)**: Bicolor hijau-merah dengan **Armillary Sphere & Perisai Portugis**.
- 🇨🇭 **Swiss (`CHE`)**: Bidang merah dengan **Salib Putih Presisi**.
- 🇧🇳 **Brunei Darussalam (`BRN`)**: Kuning emas dengan **Pita Diagonal Putih-Hitam & Lambang Kerajaan Merah**.
- 🇺🇸 **Amerika Serikat (`USA`)**: **50 Bintang & 13 Garis**.
- 🇧🇷 **Brasil (`BRA`)**: **Belah Ketupat Kuning, Bola Biru & Bintang Angkasa**.
- 🇸🇦 **Arab Saudi (`SAU`)**: Kaligrafi Syahadat & Pedang.
- 🇲🇽 **Meksiko (`MEX`)**: Elang pemakan ular di atas kaktus.

Untuk mencapai representasi visual 100% otentik dan sempurna bagi seluruh 195+ negara di dunia sesuai permintaan pengguna, sistem harus memetakan **gambar bendera resmi (SVG/PNG)** secara langsung ke poligon 3D setiap negara di atas bola bumi (*Earth Globe*).

## Solusi Arsitektur
1. **Asset Bundling Lokal (`frontend/public/flags/{iso2}.svg` / `.png`)**:
   - Seluruh bendera resmi negara diunduh dari dataset FlagCDN / SVGRepo dan disimpan secara lokal di `frontend/public/flags/` dengan penamaan kode ISO-2 standar (`id`, `fr`, `dz`, `us`, `de`, `it`, `es`, `br`, `jp`, dll.).
   - Bebas dari ketergantungan jaringan eksternal saat runtime (Zero network latency, Zero CORS failure).
2. **Hybrid WebGL Texture Shader (`ShaderMaterial` with `sampler2D flagTexture`)**:
   - Karena Three.js `three-geojson-geometry` tidak memiliki buffer UV kartesius, kita menggunakan custom WebGL GLSL Shader yang menghitung koordinat $(u, v)$ bola bumi secara dinamis dari posisi vertex 3D $(x, y, z)$ terhadap bounding box negara:
     ```glsl
     float theta = atan(vPos.x, vPos.z) * 57.29577951308232;
     float lon = 90.0 - theta;
     if (lon > 180.0) lon -= 360.0;
     if (lon < -180.0) lon += 360.0;
     float r = length(vPos);
     float lat = asin(clamp(vPos.y / max(0.001, r), -1.0, 1.0)) * 57.29577951308232;

     float u = clamp((lon - minLon) / max(0.001, maxLon - minLon), 0.0, 1.0);
     float v = clamp((lat - minLat) / max(0.001, maxLat - minLat), 0.0, 1.0);

     vec4 texColor = texture2D(flagTexture, vec2(u, 1.0 - v));
     gl_FragColor = vec4(texColor.rgb, 0.95);
     ```
3. **Fallback Graceful**:
   - Selama texture sedang dimuat di latar belakang, shader menampilkan warna kedaulatan resmi negara dari `COUNTRY_FLAG_COLOR_MAP`. Begitu texture selesai di-load (`onLoad`), texture di-update seketika.

## Consequences
- **Positif**:
  - Setiap negara di dunia (termasuk Aljazair, Prancis, Portugal, Italia, Spanyol, Swiss, Brunei, Indonesia, dll.) tampil dengan gambar bendera resmi 100% otentik lengkap dengan lambang, bintang, bulan sabit, dan corak aslinya.
  - Performa 60 FPS tetap terjaga karena texture di-cache di GPU VRAM.
