# ADR 0040: True Plug-and-Play GeoGlobe Micro-App Architecture

## Status
Accepted

## Context
Framework GeoGlobe saat ini mendukung micro-app berbasis `GeoAppPlugin<TData>` dan `GeoAppRegistry`. Namun, penambahan plugin baru masih memerlukan "Shotgun Surgery" di 7 hingga 9 file inti di luar plugin itu sendiri:
1. Registrasi manual dan import eksplisit di `geoStore.svelte.ts`.
2. Penambahan kamus rute statis di `router.ts` (`APP_PATH_MAP`, `CANONICAL_APP_PATHS`).
3. Percabangan `if (appId === '...')` di `filterEngine.ts` untuk memanggil fungsi filter spesifik.
4. Percabangan `switch (activeApp.id)` di `Navbar.svelte` untuk nama brand dan subtitle.
5. Percabangan `switch (activeApp.id)` di `GlobalAppSplashScreen.svelte` untuk teks loading dan gradien.
6. Percabangan `{:else if geoStore.activeAppId === '...'}` di `WorldRateMap.svelte` untuk merender toolbar kontrol.
7. Percabangan `{:else if geoStore.activeAppId === '...'}` di `App.svelte` untuk merender dock bawah.
8. Kamus statis icon string-ke-komponen di `GeoAppLauncherModal.svelte`.
9. Pengecekan string `activeAppId === 'remittance-flow'` di `Globe3DView.svelte` untuk mengaktifkan arc animasi.

Kondisi ini membatasi skalabilitas modular GeoGlobe dan menyulitkan pengembang untuk membuat atau mencolokkan micro-app baru (seperti Cuaca/Iklim, Gempa Bumi, Situs UNESCO, atau Kedutaan Diplomatik) secara mandiri.

## Decision
Kami merombak arsitektur plugin GeoGlobe menjadi sistem **True Plug-and-Play (Zero-Touch Core)** dengan 5 pilar utama:

1. **Auto-Discovery via Vite `import.meta.glob`**:
   `GeoAppRegistry` secara otomatis memindai dan meregistrasi semua modul plugin yang ada di folder `plugins/*App.ts` saat inisialisasi runtime. Pendaftaran manual di `geoStore.svelte.ts` dihapus.
2. **Autonomous Self-Describing Metadata**:
   Interface `GeoAppPlugin` diperluas dengan field deklaratif:
   - `branding: { main: string; sub: string; accentColor?: string }` (untuk logo navbar otomatis).
   - `splash: { stepText: string; gradientFrom?: string; gradientTo?: string }` (untuk splash screen otomatis).
   - `icon: any` (dapat berupa komponen Svelte Lucide langsung, menghilangkan kamus icon statis).
   - `filterOptions: FilterOption[]` (daftar filter yang didukung oleh plugin untuk ditampilkan di UI).
3. **Pure Delegate Filter Engine**:
   `filterEngine.ts` menghilangkan seluruh switch/if berbasis `appId`. Penentuan apakah suatu negara cocok dengan filter didelegasikan murni ke `plugin.filterPredicate(iso3, activeFilter, data, spatial)`.
4. **Universal Controls Component (`UniversalAppControls.svelte`)**:
   Menyediakan komponen kontrol universal berbasis metadata yang otomatis merender:
   - Filter pills/select dari `plugin.filterOptions`.
   - Metric switcher dari `plugin.metrics`.
   - Camera preset buttons dari `plugin.cameraPresets`.
   - Search box negara spasial.
   `WorldRateMap.svelte` hanya memanggil `plugin.ControlsComponent ?? UniversalAppControls`.
5. **Feature-Detection 3D Globe Hooks**:
   `Globe3DView.svelte` mengganti pengecekan ID string aplikasi dengan *feature detection* langsung pada hook plugin (`getArcs`, `getRings`, `getPinLabel`, `getPolygonColor`).

## Consequences

### Positif:
- **Zero-Touch Core**: Menambah plugin baru HANYA membutuhkan pembuatan 1 file di `plugins/` tanpa mengubah satu baris pun di core framework atau UI shell.
- **Konsistensi UI/UX**: Seluruh plugin otomatis mendapatkan branding logo, splash screen, launcher icon, dan toolbar filter yang seragam.
- **Maintainability Tinggi**: Mengeliminasi duplikasi kode dan switch statements yang rentan regresi.

### Negatif / Trade-offs:
- Plugin lama (`fx-rates`, `world-time`, `remittance-flow`, `passport-power`, `flora-fauna`, `world-capitals`) perlu dimutakhirkan agar mendeklarasikan metadata `branding`, `splash`, dan `filterOptions` secara lengkap.
