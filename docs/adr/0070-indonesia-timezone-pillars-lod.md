# ADR 0070: Level-of-Detail (LOD) Hierarchy for Indonesian Cities on /time

## Status
Accepted

## Context
1. **Representasi Zona Waktu Indonesia di `/time`**:
   Di BuanaSphere (`kurs-world`), microapp **TimeWorld (`/time`)** menyediakan dataset 28 kota di Indonesia untuk mencakup seluruh kepulauan secara komprehensif pada ketiga zona waktu resmi:
   - WIB (UTC+7): 12 kota (Jakarta, Surabaya, Bandung, Medan, Palembang, dll.)
   - WITA (UTC+8): 10 kota (Denpasar, Makassar, Manado, Balikpapan, dll.)
   - WIT (UTC+9): 6 kota (Jayapura, Ambon, Sorong, Ternate, dll.)
2. **Permasalahan Visual Overcrowding**:
   Karena `selectedIso3` secara default bernilai `'IDN'` (konteks lokal Indonesia), filter Level-of-Detail (LOD) sebelumnya:
   `city.isMajorHub || (selectedIso3 && city.countryIso3 === selectedIso3)`
   mengeksekusi dan merender **seluruh 28 kota Indonesia** sekaligus pada posisi kamera global (zoom-out jauh). Sementara negara lain (seperti AS, Jepang, Inggris) hanya menampilkan 1–2 kota hub utama. Hal ini membuat wilayah kepulauan Nusantara tampak sangat padat dan saling bertumpuk labelnya saat bola dunia 3D dilihat secara keseluruhan.

## Decision
1. **Penerapan 3 Pilar Representasi Waktu Indonesia pada Zoom-Out (`alt > 1.4`)**:
   - Membatasi kota Indonesia yang ditampilkan saat kamera berada pada posisi global menjadi **3 pilar representasi zona waktu**:
     - **WIB (UTC+7)**: Jakarta (`id-jkt`)
     - **WITA (UTC+8)**: Denpasar (`id-dps`)
     - **WIT (UTC+9)**: Jayapura (`id-djb`)
2. **Render Lengkap 28 Kota pada Zoom-In (`alt <= 1.4`)**:
   - Ketika kamera didekatkan (zoom-in) ke arah Indonesia, seluruh 28 kota akan dirender secara lengkap dan berbobot populasi tanpa menimbulkan kepadatan label yang saling bertumpuk.

## Consequences
### Positif
- Tampilan 3D Globe pada `/time` saat dilihat dari jauh menjadi sangat bersih, seimbang, dan proporsional.
- Representasi 3 zona waktu nasional (WIB, WITA, WIT) tetap dipertahankan secara akurat melalui 3 pilar representatif (Jakarta, Denpasar, Jayapura).
- Ketika pengguna mendekatkan kamera ke Indonesia, seluruh 28 kota langsung tersedia dengan detail penuh.

### Negatif / Trade-offs
- Kota-kota besar non-pilar di Indonesia (seperti Surabaya atau Medan) tidak terlihat dari orbit luar angkasa yang jauh, namun segera muncul begitu pengguna melakukan zoom-in ke Indonesia.
