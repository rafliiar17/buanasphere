# Laporan Verifikasi SDLC: Spherical Coordinate Projection & Overseas Territory Filtering (0011)

## 1. Executive Summary
Laporan ini mendokumentasikan investigasi akar masalah, perbaikan matematis koordinat bola, siklus pengujian TDD, dan verifikasi implementasi untuk wilayah negara yang menggunakan corak garis vertikal seperti **Prancis (`FRA`)**, **Portugal (`PRT`)**, **Italia (`ITA`)**, dan **Belgia (`BEL`)** pada mode **`Bendera Negara 🏁`**.

---

## 2. Root Cause Analysis
1. **Formula Invers Koordinat Bujur (Longitude) Bola Tiga Dimensi**:
   - `globe.gl` memetakan garis bujur $\text{lng}$ dengan sudut $\theta = 90^\circ - \text{lng}$.
   - Shader sebelumnya menggunakan `atan(vPos.x, -vPos.z)` yang mengakibatkan pergeseran fase $90^\circ$, sehingga koordinat normalisasi $u$ terpotong ke nilai ekstrem ($u \approx 1.0$ atau $0.0$) pada poligon vertikal di Eropa Barat.
   - Formula yang tepat:
     $$\theta = \text{atan2}(x, z) \times \frac{180^\circ}{\pi} \implies \text{lng} = 90^\circ - \theta$$
2. **Distorsi Bounding Box Akibat Teritori Seberang Laut (*Overseas Territories*)**:
   - Poligon negara Prancis mencakup Guyana Prancis di Amerika Selatan (Lon $-54^\circ$) bersamaan dengan Prancis Daratan (Lon $-4.5^\circ$ s.d. $+9.5^\circ$).
   - Hal ini membuat rentang bujur global $\Delta\text{Lon} = 64^\circ$, sehingga Prancis Daratan hanya menempati sedikit persentase di ujung kanan strip warna merah.
   - Solusi: Memfilter sub-poligon teritori seberang laut yang berjarak $>20^\circ$ dari centroid label negara saat menghitung bounding box daratan utama.
3. **Penanganan Properti ISO_A3 bernilai `"-99"`**:
   - Prancis dan Norwegia pada data Natural Earth memiliki properti `ISO_A3: "-99"`. Kode diperbaiki agar memprioritaskan `ADM0_A3` (`FRA` / `NOR`).

---

## 3. Solusi Arsitektur (ADR 0011)
Sesuai dengan dokumen arsitektur [ADR 0011](../adr/0011-spherical-coordinate-projection-and-overseas-filtering.md):
- **Prancis (`FRA`)**: Terproyeksi presisi menjadi 3 garis vertikal: **Biru (`#1d4ed8`) di Barat — Putih (`#ffffff`) di Tengah — Merah (`#dc2626`) di Timur**.
- **Portugal (`PRT`)**: Terproyeksi presisi menjadi 2 bagian vertikal: **Hijau (`#15803d`) di Barat — Merah (`#dc2626`) di Timur**.
- **Italia (`ITA`)**: Terproyeksi presisi menjadi 3 garis vertikal: **Hijau (`#15803d`) di Barat — Putih (`#ffffff`) di Tengah — Merah (`#dc2626`) di Timur**.
- **Belgia (`BEL`)**: Terproyeksi presisi menjadi 3 garis vertikal: **Hitam (`#18181b`) di Barat — Kuning (`#eab308`) di Tengah — Merah (`#dc2626`) di Timur**.

---

## 4. Hasil Pengujian & Quality Gates

| Quality Gate | Perintah | Status | Hasil |
|---|---|---|---|
| **Unit Testing (TDD)** | `rtk bun test` | ✅ PASSED | 150 / 150 Test Suites Lulus (100% Green) |
| **Type Check & Diagnostics** | `rtk bun run check` | ✅ PASSED | 0 Errors, 0 Warnings |
| **Production Build** | `rtk bun run build` | ✅ PASSED | Bundle Vite terkompilasi optimal (0 errors) |
| **Git Safety & Clean Tree** | `rtk git status` | ✅ PASSED | Branch `feat/spherical-shader-projection-fix` bersih |

---

## 5. Ringkasan Commit
- `docs(adr): add ADR 0011 for spherical coordinate projection and overseas filtering`
- `feat(map): fix spherical longitude inverse formula and overseas territory filtering for vertical flags`
- `docs(qa): add SDLC verification report for spherical shader projection fix`
