# ADR 0037: 8-Phase Diurnal Solar Time Gradient & Indonesia Default for TimeWorld

**Status**: Accepted  
**Date**: 2026-09-02  
**Deciders**: Antigravity, Lead Engineer  
**Consulted**: AGENTS.md, CONTEXT.md, ARCHITECTURE.md, ADR-0017, ADR-0028, ADR-0035, ADR-0036  

---

## 1. Context & Problem Statement

Pada aplikasi World Time (`/time`):
1. **Pewarnaan Biner Monoton**: Visualisasi poligon negara pada 3D Globe sebelumnya hanya membagi waktu menjadi 2 status biner kaku (*Daylight* kuning vs *Night* biru tua), tanpa gradien waktu alami yang merefleksikan dinamika tata surya (*dawn/fajar*, *morning/pagi*, *solar noon/siang terik*, *golden hour/senja*, *dusk/petang*, *midnight/malam pekat*).
2. **Default Country Bukan Indonesia**: Ketika pengguna membuka `/time`, negara yang terpilih secara default adalah `USA` alih-alih **Indonesia (`IDN` / WIB UTC+7)** sebagai basis waktu acuan nasional platform Kurs World.

---

## 2. Decision & Architecture Design

Kami menetapkan arsitektur baru untuk modul TimeWorld:

### 1. 8-Phase Diurnal Solar Time Model & Smooth Color Interpolation
Pada `geoMath.ts` dan `worldTimeApp.ts`, diperkenalkan model matematis perhitungan fase waktu dan interpolasi warna kontinu:

| Fase Diurnal | Rentang Jam Lokal | Spektrum Warna Heksadesimal | Karakter Visual |
|---|---|---|---|
| **🌌 Dini Hari (Deep Night)** | 00:00 – 04:30 | `#090d16` ➔ `#1e1b4b` | Deep Obsidian Void & Midnight Indigo |
| **🌅 Fajar / Subuh (Dawn)** | 04:30 – 06:30 | `#f43f5e` ➔ `#fb923c` | Rose Coral Sunrise & Amber Horizon |
| **☀️ Pagi (Morning)** | 06:30 – 11:00 | `#0284c7` ➔ `#facc15` | Crisp Sky Blue & Golden Daylight |
| **🌞 Siang Terik (Solar Noon)** | 11:00 – 15:00 | `#f59e0b` ➔ `#eab308` | Radiant Sun Zenith & Gold |
| **🌤️ Sore (Afternoon)** | 15:00 – 17:30 | `#ea580c` ➔ `#f97316` | Warm Honey Amber & Sun Precursor |
| **🌇 Senja / Golden Hour** | 17:30 – 19:00 | `#ec4899` ➔ `#9333ea` | Magenta Sunset & Violet Twilight |
| **🌆 Petang / Twilight** | 19:00 – 21:30 | `#6366f1` ➔ `#3730a3` | Deep Indigo Glow & Maghrib/Isya |
| **🌙 Malam (Night)** | 21:30 – 24:00 | `#1e1b4b` ➔ `#1e293b` | Deep Blue Midnight |

Fungsi `getDiurnalPhase(localHours, localMinutes)` menghasilkan:
- `phaseId`: `'deep_night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'dusk' | 'night'`
- `label`: Label bahasa Indonesia yang baku
- `emoji`: Ikon fase waktu
- `colorHex` & `colorRgba`: Warna terinterpolasi kontinu
- `isDaylight`, `isGoldenHour`, `isWorkingHours`

### 2. Default Country & Kamera: Indonesia (IDN / WIB UTC+7)
- Default `selectedIso3` pada `geoStore.svelte.ts` dan `mapState.svelte.ts` diubah menjadi **`IDN`**.
- Saat membuka `/time`:
  - Kamera 3D Globe otomatis memusatkan pandangan ke koordinat Indonesia (`lat: 10, lng: 110, altitude: 2.2`).
  - Active Country Card langsung menampilkan:
    - 🇮🇩 **Indonesia (WIB UTC+7)**
    - Jam Lokal Real-time (contoh: `21:42 WIB`)
    - Badge Fase Waktu (contoh: `🌙 Malam Pekat`)
    - Status Selisih: `0 Jam (Waktu Acuan Lokal)`

### 3. Extended Diurnal Time Filters
Opsi filter pada `TimeControls.svelte` dan `filterEngine.ts` diperluas:
- `🌐 Semua Zona Waktu`
- `☀️ Siang Hari (06:00 – 18:00)`
- `🌙 Malam Hari (18:00 – 06:00)`
- `🌅 Golden Hour / Fajar & Senja`
- `🏢 Jam Kantor Aktif (09:00 – 17:00)`

---

## 3. Consequences

### Positive:
- **Visual Realistis & Memukau**: Globe 3D menampilkan gradasi bola bumi alami dari belahan fajar, siang terik, senja keemasan, hingga malam pekat.
- **Konteks Indonesia Kuat**: Pengguna langsung disuguhkan waktu lokal Nusantara (WIB/WITA/WIT) sebagai patokan komparasi waktu global.
- **Konsistensi UI/UX**: Seluruh tooltip, pin labels, dock pasar finansial, dan drawer inspector menampilkan badge fase surya yang selaras.
