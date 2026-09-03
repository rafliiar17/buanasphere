# ADR 0039: World Capitals & Independence History Micro-App Plugin

**Status**: Accepted  
**Date**: 2026-09-03  
**Deciders**: Antigravity, Lead Engineer  
**Consulted**: AGENTS.md, CONTEXT.md, ARCHITECTURE.md, ADR-0017, ADR-0030, ADR-0034, ADR-0038  

---

## 1. Context & Problem Statement

Platform **Kurs World** melalui subsistem spasial **GeoGlobe (`.globe`)** telah membuktikan fleksibilitasnya dengan mendukung visualisasi valuta asing (`fx-rates`), jam surya global (`world-time`), koridor remitansi (`remittance-flow`), kekuatan paspor (`passport-power`), dan keanekaragaman hayati (`flora-fauna`).

Kini, terdapat kebutuhan untuk menambahkan dimensi edukasi geopolitik dan sejarah dunia:
1. **Peta Ibukota Global (195+ Negara)**: Pengguna membutuhkan informasi instan mengenai nama resmi ibukota tiap negara di dunia, koordinat kota, dan peran administratifnya.
2. **Konteks Sejarah Kemerdekaan & Berdirinya Negara**:
   - Menampilkan tanggal/tahun berdirinya negara (*foundation date*).
   - Menampilkan hari kemerdekaan resmi / hari nasional (*independence day / national day*).
   - Menampilkan entitas/kekaisaran dari mana kedaulatan diperoleh (*sovereignty from* / *colonial heritage*).
   - Klasifikasi era historis (Negara Kuno/Pra-1800, Abad 19, Pasca-PD II 1945–1959, Era Dekolonisasi 1960–1989, Pasca-Soviet 1990+).
3. **Penerapan Penuh Framework ADR 0038**:
   - Seluruh fitur harus diwujudkan sebagai plugin modular (`GeoAppPlugin`) tanpa mengubah satu baris pun kode pada mesin render WebGL Three.js (`Globe3DView.svelte`) maupun router inti.

---

## 2. Decision & Architectural Design

Kami memutuskan untuk mengimplementasikan **`worldCapitalsApp`** sebagai plugin mandiri berbasis arsitektur **ADR 0038**:

### 1. Model Data (`worldCapitalsData.ts`)
Setiap negara dari 195+ negara anggota PBB dan negara berdaulat di `EXTENDED_COUNTRIES_DATA` dipetakan ke interface `WorldCapitalData`:
```typescript
export interface WorldCapitalData {
  iso3: string;
  countryName: string;
  capital: string;
  capitalType: 'Administrative' | 'Planned Capital' | 'Historic & Cultural' | 'Dual/Triple Capital';
  foundationDate: string;           // e.g. "17 Agustus 1945", "4 Juli 1776", "660 SM"
  independenceDay: string;          // e.g. "17 Agustus", "4 Juli", "14 Juli"
  independenceYear: number;         // e.g. 1945, 1776, -660 (SM)
  sovereigntyFrom: string;          // e.g. "Belanda & Jepang", "Kerajaan Britania Raya", "Kuno / Tanpa Penjajahan"
  historicalEra: 'ancient' | '19th_century' | 'post_ww1' | 'post_ww2' | 'decolonization' | 'modern_post_soviet';
  eraLabel: string;                 // e.g. "Pasca-PD II (1945–1959)", "Negara Kuno Bersejarah"
  trivia: string;                   // Fakta singkat sejarah ibukota/kemerdekaan
}
```

### 2. Spesifikasi Plugin `worldCapitalsApp`
Mengimplementasikan interface `GeoAppPlugin<WorldCapitalData>`:
- **Identitas**:
  - `id`: `world-capitals`
  - `name`: `Ibukota & Kemerdekaan`
  - `tagline`: `Peta 195+ Ibukota Negara Global, Tanggal Berdiri & Hari Kemerdekaan`
  - `icon`: `Landmark`
  - `category`: `history`
- **Auto-Routing**:
  - `canonicalPath`: `/capitals`
  - `aliasPaths`: `['/ibukota', '/capital', '/independence', '/kemerdekaan']`
- **Metrik Visual**:
  - `era`: Klasifikasi era historis kemerdekaan/berdirinya negara.
  - `national_month`: Bulan kalender hari kemerdekaan (Januari – Desember).
- **WebGL Visual Delegation**:
  - `getPolygonColor`: Skema warna tematik era (Emas untuk Kuno, Ungu untuk Abad 19, Zamrud untuk Pasca-PD II, Amber untuk Dekolonisasi 1960-an, Cyan untuk Pasca-1990).
  - `getTooltipHtml`: Kartu tooltip elegan menampilkan Bendera, Negara, Ibukota, Hari Kemerdekaan, Tanggal Berdiri, dan Asal Kedaulatan.
  - `getPinLabel`: Menampilkan pin label 3D `🏛️ {Capital} • {Country}`.
  - `filterPredicate`: Menyaring negara berdasarkan era kemerdekaan (`all`, `ancient`, `19th_century`, `post_ww2`, `decolonization`, `post_1990`).
  - `cameraPresets`: Preset kamera sinematik untuk kawasan ASEAN, Asia, Eropa, Amerika, Afrika, dan Oseania.
  - `renderInspector`: Widget detail sejarah ibukota & kemerdekaan saat negara diklik.

### 3. Pendaftaran Plugin
Plugin didaftarkan secara deklaratif di `geoStore.svelte.ts`:
```typescript
import { worldCapitalsApp } from './plugins/worldCapitalsApp';

geoRegistry.register(worldCapitalsApp);
```

---

## 3. Invariants & Data Integrity

1. **Kelengkapan 195+ Negara**: Tidak boleh ada negara berdaulat di `EXTENDED_COUNTRIES_DATA` yang memiliki nilai ibukota `undefined` atau tanggal kemerdekaan kosong.
2. **Konteks Indonesia**: Indonesia (`IDN`) memiliki data baku: Ibukota: `Jakarta`, Hari Kemerdekaan: `17 Agustus`, Tanggal Berdiri: `17 Agustus 1945`, Asal Kedaulatan: `Proklamasi Kemerdekaan (Belanda & Jepang)`.
3. **Penanganan Negara Kuno**: Negara yang tidak pernah dijajah secara konvensional (e.g. Jepang, Thailand, Iran, San Marino, Etiopia, Britania Raya) diklasifikasikan sebagai `ancient` dengan keterangan "Negara Berdaulat Kuno / Tanpa Penjajahan Kolonial".
4. **Zero Layout Shift (CLS)**: Tooltip dan Drawer terikat pada konstanta min-width yang stabil.

---

## 4. Consequences & Verification

- **Positif**: Memperkaya fitur GeoGlobe dengan konten geopolitik berbobot tanpa menambah beban latensi atau memory spike pada kanvas WebGL Three.js.
- **Verifikasi**:
  - Unit test `frontend/tests/world-capitals-plugin.test.ts` memvalidasi seluruh 195+ negara.
  - Diagnostics `rtk bun run check` wajib 0 error, 0 warning.
  - Build produksi Vite wajib sukses.
