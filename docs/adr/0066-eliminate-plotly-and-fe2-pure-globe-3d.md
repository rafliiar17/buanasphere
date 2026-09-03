# ADR 0066: Elimination of Plotly and Frontend-2 for Pure 3D Globe Focus in FE-1

## Status
Accepted

## Context
1. **Plotly Overhead**: Di frontend utama (`fe-1` di `frontend/`), dukungan untuk mode proyeksi alternatif *Peta Datar 2D* ([`FlatMap2DView.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/features/map/components/FlatMap2DView.svelte)) mengharuskan instalasi pustaka `plotly.js-dist-min` yang menyumbang ukuran bundle vendor sebesar ~4.27 MB (~1.32 MB gzip).
2. **Evaluasi Frontend-2**: `frontend-2` (ADR 0060) sebelumnya dibuat sebagai workspace eksperimental pembuktian arsitektur kanonikal `globe.gl`. Seluruh pola terbaik dari `frontend-2` (komponen deklaratif `GlobeScene.svelte`, pemisahan modular layers `arcLayer`, `pathLayer`, `ringLayer`, `polygonLayer`, `labelLayer`, serta tekstur fotorealistik bumi NASA Blue Marble) telah sukses diintegrasikan 100% ke dalam `fe-1` pada ADR 0061 dan ADR 0062.
3. **Keputusan Produk**: Pengguna menginstruksikan secara tegas untuk menghapus Plotly dan menghapus `frontend-2`, agar seluruh fokus pengembangan berada pada **Globe 3D WebGL** di `fe-1`.

## Decision
1. **Eliminasi Total Plotly**:
   - Menghapus dependensi `plotly.js-dist-min` dan `@types/plotly.js-dist-min` dari `frontend/package.json`.
   - Menghapus konfigurasi chunk vendor `plotly-vendor` dari `frontend/vite.config.ts`.
   - Menghapus file komponen [`FlatMap2DView.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/features/map/components/FlatMap2DView.svelte) secara permanen.
2. **Penghapusan Workspace Frontend-2**:
   - Menghapus direktori `frontend-2/` beserta seluruh file dan test di dalamnya.
   - Memperbarui `package.json` root: menghapus `"frontend-2"` dari `workspaces` dan menghapus script pembantu (`dev:fe2`, `test:fe2`, `build:fe2`, `check:fe2`).
3. **Pembersihan Viewport & Kontrol Micro-App**:
   - [`WorldRateMap.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/features/map/WorldRateMap.svelte): Menghapus impor `FlatMap2DView`, langsung merender `<Globe3DView />` tanpa percabangan flat map, dan merapikan live status pill.
   - Menghapus tombol toggle proyeksi ("🌍 Globe 3D" / "🗺️ Peta Datar") dari seluruh kontrol microapp:
     - [`KursControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/apps/kurs/KursControls.svelte)
     - [`TimeControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/apps/time/TimeControls.svelte)
     - [`FlightControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/apps/flight/FlightControls.svelte)
     - [`FloraControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/apps/flora/FloraControls.svelte)
     - [`PassportControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/apps/passport/PassportControls.svelte)
     - [`UniversalAppControls.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/framework/geoglobe/ui/UniversalAppControls.svelte)
     - [`MapControlsToolbar.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/features/map/components/MapControlsToolbar.svelte)
4. **Penguncian State Management**:
   - Pada `mapState.svelte.ts`, `mapState.ts`, dan `geoStore.svelte.ts`, properti `projectionMode` dikunci secara konsisten ke `'globe'`.

## Consequences
### Positif
- Pengurangan ukuran bundle vendor JavaScript secara masif (~4.27 MB unminified / ~1.32 MB gzip tereliminasi).
- Struktur monorepo menjadi bersih: hanya terdiri dari `backend` dan `frontend`.
- Pengalaman pengguna (UX) menjadi lebih padu, tajam, dan fokus pada keindahan dan kedalaman 3D Globe WebGL.
- Maintenance overhead berkurang drastis karena tidak ada lagi dual maintenance workspace atau dual projection mode.

### Negatif / Trade-offs
- Pengguna tidak lagi dapat beralih ke proyeksi 2D flat map (sesuai arahan eksplisit bahwa produk memfokuskan visualisasi pada bumi bulat 3D).
