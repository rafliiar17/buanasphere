# ADR 0041: 3D Timezone Meridian Lines & Pristine Vector Quality Standard

## Status
Accepted

## Context
Pada mikro-aplikasi TimeWorld (`world-time`), pengguna memerlukan pemahaman spasial yang lebih intuitif terkait bagaimana rotasi bumi membagi 24 zona waktu standar (UTC-12 hingga UTC+12) relatif terhadap Indonesia (WIB UTC+7, WITA UTC+8, WIT UTC+9) dan dunia.

Selain itu, eksperimen sebelumnya dengan Shader-LUT 2D texture (ADR 0038) terbukti merusak estetika visual bola dunia: garis tampak bergerigi (pixelated) tanpa hardware anti-aliasing karena batasan resolusi tekstur bitmap 2048x1024 dan NearestFilter, serta membingungkan pengguna dengan tombol toggle "60 FPS" yang berkualitas rendah.

Di sisi lain, mesin utama Globe.gl dengan Three.js vector polygons sudah berjalan mulus di 60 FPS pada GPU modern dengan MSAA hardware anti-aliasing, garis batas kurva yang tajam tak terhingga, dan elevasi 3D timbul saat hover.

## Decision
1. **Penyediaan 3D Timezone Meridian Lines**:
   - Menambahkan kontrak `GeoPath` pada `types.ts` dan hook `getPaths` pada `GeoAppPlugin`.
   - Modul `worldTimeApp.ts` mengimplementasikan `getPaths` yang menghasilkan 24 kurva meridian bujur dari kutub utara (`lat +85°`) hingga kutub selatan (`lat -85°`) setiap kelipatan 15° bujur.
   - Penandaan khusus:
     - **Bujur +105°**: Garis tebal hijau zamrud (`#10b981`) untuk **WIB (UTC+7 / Jakarta Baseline)**.
     - **Bujur +120°**: Garis menyala hijau/cyan untuk **WITA (UTC+8 / Bali / Makassar)**.
     - **Bujur +135°**: Garis menyala hijau/cyan untuk **WIT (UTC+9 / Papua / Tokyo)**.
     - **Bujur 0°**: Garis menyala cyan (`#06b6d4`) untuk **Prime Meridian (UTC 0 / GMT)**.
     - **Bujur ±180°**: Garis putus-putus amber (`#f59e0b`) untuk **International Date Line**.
     - **Meridian lainnya**: Garis bercahaya halus semi-transparan (`rgba(56, 189, 248, 0.25)`).
2. **Integrasi Render Jalur pada Globe3DView**:
   - Menghubungkan `activeApp.getPaths(...)` secara reaktif ke Globe.gl `.pathsData(...)`.
3. **Pembersihan Total Mode 60FPS Shader-LUT**:
   - Menghapus tombol `⚡ 60 FPS` dari UI toolbar (`UniversalAppControls`, `KursControls`, `TimeControls`, `FloraControls`, `FlightControls`, `PassportControls`).
   - Menghapus instance duplikat Shader-LUT dari `Globe3DView.svelte` sehingga bola dunia selalu berada di mode poligon vektor 3D dengan MSAA hardware antialiasing penuh.

## Consequences

### Positif:
- Pengguna dapat langsung melihat garis bujur zona waktu secara global saat memutar bola dunia 3D.
- Visual bola dunia kembali 100% premium, tajam, mulus, dan anti-aliased di semua tingkat pembesaran (zoom).
- Kode lebih bersih, membuang kompleksitas shader eksperimental yang tidak diinginkan.

### Negatif / Trade-offs:
- Sedikit penambahan kurva jalur 3D di WebGL (24 path), namun dengan beban komputasi GPU yang sangat ringan (<0.1ms).
