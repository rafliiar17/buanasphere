# ADR 0034: Nature World (/nature) Pluggable Micro-App Architecture

## Status
**Accepted**

## Context & Problem Statement
Setelah suksesnya 4 micro-app awal (`/kurs`, `/time`, `/flight`, `/passport`), pengguna membutuhkan kemampuan untuk mengeksplorasi persebaran **keanekaragaman hayati (biodiversitas)**, **satwa ikonik/nasional**, **tumbuhan/bunga khas**, dan **status konservasi IUCN** di seluruh dunia (195+ negara berdaulat) secara interaktif pada bola dunia 3D GeoGlobe.

## Architecture Decisions

### 1. Canonical Route & Path Aliases (`router.ts`)
- **Canonical Path**: `/nature`
- **Aliases**: `/flora-fauna`, `/flora`, `/fauna`, `/wildlife`, `/biodiversity`
- **App ID**: `flora-fauna`
- **Wordmark Branding**: `Nature` + `.World` (dengan badge Beta)

### 2. Comprehensive 195+ Sovereign States Biodiversity Dataset (`floraFaunaData.ts`)
Setiap entri negara memiliki struktur:
```typescript
export interface FloraFaunaData {
  animal: {
    commonName: string;
    scientificName: string;
    emoji: string;
    iucnStatus: 'Critically Endangered' | 'Endangered' | 'Vulnerable' | 'Near Threatened' | 'Least Concern';
    category: 'Mammal' | 'Reptile' | 'Bird' | 'Amphibian' | 'Marine';
  };
  plant: {
    commonName: string;
    scientificName: string;
    emoji: string;
    type: 'Flower' | 'Tree' | 'Medicinal' | 'Carnivorous';
    conservationStatus: string;
  };
  biodiversityScore: number; // 0 - 100
  globalBiodiversityRank: number; // #1 Brazil, #2 Colombia, #3 Indonesia, dll.
  primaryBiome: 'Tropical Rainforest' | 'Savanna' | 'Temperate Forest' | 'Boreal / Taiga' | 'Desert' | 'Mediterranean' | 'Tundra' | 'Marine & Coral';
  isMegadiverse: boolean;
  endemicSpeciesHighlights: string[];
  conservationHotspot: boolean;
}
```

### 3. Pluggable GeoGlobe Plugin Architecture (`floraFaunaApp.ts`)
- **Default Metric**: `biodiversity` (Skor Indeks Keanekaragaman Hayati / Peringkat Megadiverse).
- **Secondary Metrics**:
  - `iucn_risk`: Tingkat Risiko Kepunahan Satwa/Flora (Merah: Kritis/Terancam, Amber: Rentan, Hijau: Aman).
  - `biome`: Klasifikasi Bioma Dominan (Hutan Hujan Tropis, Savana, Taiga, Gurun, Terumbu Karang).
- **Universal Inspector Widget**:
  - Menampilkan Hero Card dengan nama satwa/tumbuhan, emoji, nama ilmiah, status IUCN, ranking megabiodiversitas, dan bioma dominan.

### 4. 2-Way Reactive Filter Engine (`filterEngine.ts` & `geoStore.svelte.ts`)
Menambahkan `natureFilter`: `'all' | 'megadiverse' | 'endangered' | 'rainforest' | 'endemic'`
- `'all'`: Semua 195+ negara.
- `'megadiverse'`: 17 negara megabiodiversitas dunia (Brazil, Indonesia, Kolombia, China, Peru, Meksiko, Australia, India, dll.).
- `'endangered'`: Negara dengan satwa berstatus *Critically Endangered* atau *Endangered*.
- `'rainforest'`: Negara dengan bioma Hutan Hujan Tropis.
- `'endemic'`: Negara dengan persentase spesies endemik tinggi.

### 5. Dedicated UI Controls & Docks
- `FloraControls.svelte`: Floating top-right toolbar dengan pencarian instan satwa/flora, toggle proyeksi, toggle label satwa, filter pill selektor, dan ringkasan satwa aktif.
- `FloraBottomDock.svelte`: Quick species ticker & hotspot highlights.
- `GlobeLandingPage.svelte`: Showcase card Nature World dengan rute `/nature`.
- `Navbar.svelte`: Wordmark dinamis `Nature.World` saat aktif di rute `/nature`.

## Consequences
- **Positif**:
  - Menambah wawasan ekologis global yang kaya tanpa menambah latensi awal (dataset dikemas efisien <40KB).
  - Mengikuti pola arsitektur *pluggable micro-apps* (ADR-0023, ADR-0028, ADR-0030) secara konsisten.
  - Type safety penuh di seluruh layer framework dan Svelte 5 runes.
- **Negatif**:
  - Diperlukan pembaruan test suite routing dan micro-app untuk mencakup 5 aplikasi aktif.
