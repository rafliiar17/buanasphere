# ADR 0036: Dynamic Multi-Currency Comparison Converter & Base Unit Calibration

**Status**: Accepted  
**Date**: 2026-09-02  
**Deciders**: Antigravity, Lead Engineer  
**Consulted**: AGENTS.md, CONTEXT.md, ARCHITECTURE.md, ADR-0017, ADR-0034  

---

## 1. Context & Problem Statement

Pada komponen *Kalkulator Valas Kilat* di toolbar 3D Globe dan panel konversi:
1. **Default Amount 100**: Nilai awal input sebelumnya di-hardcode ke `100` (contoh: `100 PLN = Rp 446.000,00`), alih-alih nilai dasar unit internasional `1` (seperti `1 USD = Rp 15.850,00` atau `1 PLN = Rp 4.460,00`).
2. **Keterbatasan Konversi Tunggal**: Kalkulator hanya menampilkan ekuivalen 1 pasang mata uang (Valas ➔ IDR) secara statis tanpa kemampuan membandingkan nilai tukar tersebut terhadap mata uang acuan global lainnya (USD, EUR, SGD, JPY, MYR, AUD, GBP, CNY) secara simultan.

---

## 2. Decision & Architecture Design

Kami menetapkan arsitektur baru untuk modul kalkulator dan konversi:

### 1. Default Unit Amount & Smart Toggle Calibration
- Default `convertAmount` pada `mapState.svelte.ts` dan `mapState.ts`:
  - Mode `foreign_to_idr`: Default bernilai **`1`** (misal `1 USD`, `1 EUR`, `1 PLN`).
  - Mode `idr_to_foreign`: Default bernilai **`100000`** (`Rp 100.000`).
- Saat `toggleConvertDirection()` dipanggil:
  - Jika beralih ke `idr_to_foreign` dan nilai sebelumnya <= 1000: otomatis sesuaikan ke `100000`.
  - Jika beralih ke `foreign_to_idr` dan nilai sebelumnya >= 10000: otomatis sesuaikan ke `1`.

### 2. Multi-Currency Cross-Rate Matrix Calculation
Kalkulasi nilai lintas valas (*cross-currency*) dihitung secara instan menggunakan kurs tengah (*middleRate*) terhadap IDR:
$$\text{IDR Equivalent} = \text{Amount}_{\text{Source}} \times \text{MiddleRate}_{\text{Source}}$$
$$\text{Target Equivalent} = \frac{\text{IDR Equivalent}}{\text{MiddleRate}_{\text{Target}}}$$

Daftar valas komparasi benchmark yang ditampilkan secara simultan:
- 🇮🇩 **IDR** (Rupiah Indonesia)
- 🇺🇸 **USD** (Dolar Amerika Serikat)
- 🇪🇺 **EUR** (Euro)
- 🇸🇬 **SGD** (Dolar Singapura)
- 🇯🇵 **JPY** (Yen Jepang)
- 🇲🇾 **MYR** (Ringgit Malaysia)
- 🇦🇺 **AUD** (Dolar Australia)
- 🇬🇧 **GBP** (Poundsterling Inggris)
- 🇨🇳 **CNY** (Yuan Tiongkok)
- 🇸🇦 **SAR** (Riyal Arab Saudi)

### 3. UI/UX Enhancements pada Toolbar & Inspector
- **Quick Preset Chips**: Menyediakan tombol instan `[ 1 ]`, `[ 10 ]`, `[ 100 ]`, `[ 1.000 ]` (atau `[ 10rb ]`, `[ 100rb ]`, `[ 1jt ]` saat IDR).
- **Multi-Valas Comparison Grid**: Mini-grid horizontal/collapsible yang menyajikan nilai setara di 4–6 valas terpopuler secara simultan.
- **Dynamic 3D Globe Sync**: Klik negara mana pun di globe atau search bar langsung merefleksikan valas negara tersebut sebagai basis perbandingan.

---

## 3. Consequences

### Positive:
- **Intuitif & Standar**: Nilai tukar langsung menunjukkan nilai per 1 unit valas (`1 USD = Rp 15.850`).
- **Komparasi Luas**: Pengguna dapat melihat daya beli suatu nominal terhadap Rupiah, Dolar, Euro, Yen, dan Ringgit sekaligus dalam satu layar.
- **Zero Latency**: Perhitungan komparasi multi-valas 100% in-memory reactive derivation tanpa request API tambahan.
