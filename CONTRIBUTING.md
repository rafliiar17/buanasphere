# 🤝 Panduan Berkontribusi pada Buanasphere

Terima kasih telah tertarik untuk berkontribusi pada **Buanasphere**! 🌐  
Buanasphere adalah proyek open-source yang dibangun dengan semangat **"Informasi Dulu, Transaksi Belakangan"** — menyediakan observatorium data bumi 3D real-time yang transparan, bebas paywall, berkinerja tinggi (<50ms edge latency), dan mengutamakan konteks Indonesia berwawasan global.

Kami menyambut segala bentuk kontribusi:
- 💡 Ide dan pembuatan **Micro-App Plugin 3D baru** (misal: cuaca global, rute kabel bawah laut, satelit ISS).
- 🐛 Laporan bug dan perbaikan issue.
- 🎨 Penyempurnaan UI/UX (Svelte 5 Runes, Tailwind CSS v4, Three.js shaders).
- ⚡ Optimasi performa WebGL / Edge Worker.
- 📚 Dokumentasi, tutorial, dan translasi.

---

## 📋 Daftar Isi
1. [Standar & Nilai Komunitas](#-standar--nilai-komunitas)
2. [Prasyarat & Setup Lingkungan Lokal](#-prasyarat--setup-lingkungan-lokal)
3. [Alur Pengembangan (Git Workflow)](#-alur-pengembangan-git-workflow)
4. [Cara Membuat Micro-App Plugin Baru](#-cara-membuat-micro-app-plugin-baru)
5. [Ide Kontribusi (Good First Issues & Feature Requests)](#-ide-kontribusi-good-first-issues)
6. [Standar Kualitas & Quality Gates](#-standar-kualitas--quality-gates)
7. [Format Pesan Commit](#-format-pesan-commit)

---

## 🌟 Standar & Nilai Komunitas

Proyek ini menjunjung tinggi inklusivitas dan saling menghargai. Harap baca dan patuhi [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) kami.

---

## ⚡ Prasyarat & Setup Lingkungan Lokal

### Prasyarat:
- **[Bun](https://bun.sh) (v1.4+) — Wajib**: Semua runner, package manager, dan testing menggunakan Bun.
- **Git**

### 1. Fork & Clone Repositori
```bash
git clone https://github.com/<username-kamu>/buanasphere.git
cd buanasphere
```

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Jalankan Dev Server
```bash
bun run dev
```
- **Frontend Svelte 5**: `http://localhost:5173`
- **Backend Elysia (Edge Worker)**: `http://localhost:8787`
- **Swagger API Docs**: `http://localhost:8787/swagger`

---

## 🌿 Alur Pengembangan (Git Workflow)

1. Buat branch baru dari `main` dengan format:
   - `feat/<scope>-<deskripsi>` (contoh: `feat/satellite-tracker-app`)
   - `fix/<scope>-<deskripsi>` (contoh: `fix/search-dropdown-scroll`)
   - `docs/<scope>-<deskripsi>` (contoh: `docs/contributing-guide`)
2. Lakukan perubahan kode.
3. Jalankan test lokal:
   ```bash
   bun test
   bun run check
   ```
4. Commit dengan format **Conventional Commits**.
5. Push ke fork kamu dan buka **Pull Request (PR)** ke repositori utama!

---

## 🧩 Cara Membuat Micro-App Plugin Baru

Arsitektur Buanasphere dirancang **modular dan plug-and-play** (ADR 0040 & ADR 0047). Anda bisa menambahkan observatorium data 3D baru hanya dalam beberapa langkah:

### Langkah 1: Siapkan Dataset JSON
Buat file dataset berformat `<nama-plugin>_dataset.json` di:
- `frontend/src/lib/framework/geoglobe/data/<plugin>_dataset.json`
- `frontend/public/data/<plugin>_dataset.json` (mirror)

### Langkah 2: Buat Plugin TypeScript
Buat file di `frontend/src/lib/framework/geoglobe/plugins/<namaApp>.ts`:

```ts
import type { GeoAppPlugin, CountrySpatialMetadata, InspectorWidget } from '../types';
import rawData from '../data/<plugin>_dataset.json';

export const myNewApp: GeoAppPlugin = {
  id: 'my-new-app',
  name: 'My New World',
  tagline: 'Deskripsi singkat data yang ditampilkan',
  icon: 'Globe', // Nama icon dari Lucide
  category: 'science', // 'finance' | 'time' | 'nature' | 'history' | 'disaster' | 'travel' | 'science'
  defaultMetricId: 'my_metric',
  canonicalPath: '/my-app',
  aliasPaths: [],
  branding: {
    main: 'My',
    sub: '.World',
    accentColor: '#38bdf8',
  },
  splash: {
    stepText: 'Memuat data sains dunia...',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
  },
  metrics: [
    {
      id: 'my_metric',
      label: 'Metrik Utama',
      unit: 'pts',
      formatValue: (val) => `${val} Poin`,
      colorScale: (norm) => '#10b981',
    }
  ],
  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    return rawData;
  },
  getPolygonColor: (country, data, activeMetric, theme) => {
    return 'rgba(56, 189, 248, 0.85)';
  },
  getTooltipHtml: (country, data) => {
    return `<div>${country.countryName}</div>`;
  },
  renderInspector: (country, data): InspectorWidget => {
    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'stats',
      primaryValue: '100 Poin',
      statsGrid: [
        { label: 'Kawasan', value: country.region },
        { label: 'Ibukota', value: country.capital },
      ]
    };
  }
};
```

### Langkah 3: Daftarkan Plugin
Daftarkan plugin baru Anda di `frontend/src/lib/framework/geoglobe/geoStore.svelte.ts`:
```ts
geoRegistry.register(myNewApp);
```

---

## 🚀 Ide Kontribusi (Good First Issues)

Berikut adalah beberapa fitur yang sangat diharapkan dan siap dikerjakan oleh kontributor:

| Kategori | Ide Fitur / Micro-App | Tingkat Kesulitan | Deskripsi |
|---|---|---|---|
| **Sains & Luar Angkasa** | 🛰️ **Satellite Tracker (`/satellite`)** | Menengah | Lacak posisi real-time Stasiun Luar Angkasa Internasional (ISS) & satelit komunikasi berputar mengelilingi globe 3D. |
| **Iklim & Cuaca** | 🌦️ **Global Weather (`/weather`)** | Menengah | Visualisasi partikel angin global, suhu permukaan laut, atau kualitas udara (AQI). |
| **Infrastruktur Internet** | 🌐 **Submarine Cables (`/cables`)** | Menengah | Visualisasi jalur kabel fiber optik bawah laut global yang menghubungkan Indonesia dengan dunia. |
| **Demografi** | 👥 **World Demographics (`/population`)** | Mudah | Peta kepadatan penduduk, harapan hidup, dan piramida usia global. |
| **Energi Terbarukan** | ⚡ **Renewable Energy (`/energy`)** | Mudah | Porsi energi hijau (surya, angin, hidro, panas bumi) per negara. |
| **Aksesibilitas** | ⌨️ **Keyboard Shortcuts & Sound Effects** | Mudah | Audio subtle click/hover WebGL dan shortcut keyboard global. |

---

## 🧪 Standar Kualitas & Quality Gates

Sebelum mengirim Pull Request, pastikan seluruh quality gates berikut lulus:

```bash
# 1. Jalankan unit test (wajib 100% pass)
bun test

# 2. Periksa tipe TypeScript & Svelte (wajib 0 errors, 0 warnings)
bun run check

# 3. Pastikan production build berhasil
bun run build
```

---

## 📝 Format Pesan Commit

Gunakan standar [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): add satellite tracking orbit path`
- `fix(scope): resolve tooltip z-index clipping on mobile`
- `docs(scope): improve contributing guidelines`
- `refactor(scope): decouple spatial dataset`

---

### Ada Pertanyaan atau Butuh Bantuan?
Jangan ragu untuk membuka [Discussion](https://github.com/rafliiar17/buanasphere/discussions) atau mengajukan pertanyaan via [GitHub Issues](https://github.com/rafliiar17/buanasphere/issues).

Selamat berkontribusi di **Buanasphere**! 🌍✨
