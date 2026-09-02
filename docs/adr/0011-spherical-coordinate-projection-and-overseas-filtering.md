# ADR 0011: Precision Spherical Coordinate Projection & Overseas Territory Filtering

## Status
**Accepted**

## Context & Problem Statement
Pada mode visualisasi **`Bendera Negara 🏁`**, negara-negara dengan garis horizontal (seperti Spanyol, Austria, Kroasia, Jerman) berhasil terproyeksi dengan sempurna. Namun, negara dengan garis vertikal (seperti Prancis `FRA`, Portugal `PRT`, Italia `ITA`, Belgia `BEL`) tampil dengan warna solid (misalnya Prancis menjadi hijau/gelap solid, Portugal hijau solid).

### Akar Masalah Teknis
1. **Formula Invers Koordinat Bujur (Longitude) pada Three.js / Globe.gl**:
   - `globe.gl` mengonversi koordinat bola $(\phi, \theta)$ ke koordinat kartesius $(x, y, z)$ dengan formula:
     $$x = R \sin(\phi) \sin(\theta), \quad y = R \cos(\phi) = R \sin(\text{lat}), \quad z = R \sin(\phi) \cos(\theta)$$
     di mana $\theta = 90^\circ - \text{lng}$.
   - Shader sebelumnya menggunakan formula `atan(vPos.x, -vPos.z)` yang keliru bergeser $90^\circ$ fase, sehingga nilai $u$ (longitude) terpotong dan terdistorsi ke tepi.
   - Formula invers yang benar adalah:
     $$\theta = \text{atan2}(x, z) \times \frac{180^\circ}{\pi} \implies \text{lng} = 90^\circ - \theta$$
2. **Karakteristik Properti ISO_A3 GeoJSON (Natural Earth)**:
   - Pada `world-countries.geojson`, Prancis dan Norwegia memiliki properti `ISO_A3: "-99"`, sedangkan kode ISO-3 aslinya tersimpan di `ADM0_A3: "FRA"`. Pengecekan ISO-3 wajib memprioritaskan `ADM0_A3` / `SOV_A3` jika `ISO_A3 === "-99"`.
3. **Penyimpangan Bounding Box Wilayah Seberang Laut (*Overseas Territories Distortions*)**:
   - Poligon negara Prancis mencakup Guyana Prancis (Amerika Selatan pada Lon $-54^\circ$) bersamaan dengan Prancis Daratan (Eropa pada Lon $-4.5^\circ$ hingga $+9.5^\circ$).
   - Menghitung bounding box global dari seluruh koordinat menyebabkan Prancis Daratan hanya menempati sebagian kecil $u \in [0.77, 1.0]$ di tepi kanan (merah).
   - Solusi: Memfilter sub-poligon yang berjarak $>20^\circ$ dari centroid utama (`LABEL_X`, `LABEL_Y`) saat menghitung `minLon`/`maxLon` daratan utama.

## Decision
1. Mengoreksi kalkulasi `lng` di dalam GPU Fragment Shader:
   ```glsl
   float theta = atan(vPos.x, vPos.z) * 57.29577951308232;
   float lon = 90.0 - theta;
   if (lon > 180.0) lon -= 360.0;
   if (lon < -180.0) lon += 360.0;
   ```
2. Memperbaiki fungsi `computeFeatureBounds` untuk memfokuskan bounding box pada daratan utama (*mainland territory*) dengan mengabaikan enklaf/teritori seberang laut yang terpisah jauh dari centroid label.
3. Memperbaiki parsing `iso3` pada `createProceduralFlagMaterial` agar secara konsisten mengekstrak `ADM0_A3` jika `ISO_A3` bernilai `"-99"`.

## Consequences
- **Prancis (`FRA`)**: Terproyeksi sempurna menjadi 3 garis vertikal: **Biru (`#1d4ed8`) di Barat — Putih (`#ffffff`) di Tengah — Merah (`#dc2626`) di Timur**.
- **Portugal (`PRT`)**: Terproyeksi presisi menjadi 2 bagian vertikal: **Hijau (`#15803d`) di Barat — Merah (`#dc2626`) di Timur**.
- **Italia (`ITA`)**: Terproyeksi presisi menjadi 3 garis vertikal: **Hijau (`#15803d`) di Barat — Putih (`#ffffff`) di Tengah — Merah (`#dc2626`) di Timur**.
- **Belgia (`BEL`)**: Terproyeksi presisi menjadi 3 garis vertikal: **Hitam (`#18181b`) di Barat — Kuning (`#eab308`) di Tengah — Merah (`#dc2626`) di Timur**.
