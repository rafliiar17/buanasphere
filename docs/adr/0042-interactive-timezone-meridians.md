# ADR 0042: Interactive Timezone Meridian Lines (Toggle Visibility & GMT Detail Inspector)

## Status
Accepted

## Context
Pada mikro-aplikasi TimeWorld (`world-time`), visualisasi 24 garis meridian bujur zona waktu telah ditambahkan (ADR 0041). Namun, pengguna memerlukan kontrol lebih lanjut:
1. **Dapat disembunyikan/ditampilkan (*Toggle Show/Hide*)**: Pengguna ingin opsi untuk menyembunyikan garis bujur ketika ingin fokus murni pada warna diurnal atau batas negara tanpa distraksi visual.
2. **Interaktivitas Klik & Hover (*GMT/UTC Inspector*)**: Pengguna ingin dapat mengklik garis meridian bujur tertentu untuk mengetahui secara spesifik berapa nilai GMT/UTC-nya, jam lokal saat ini di sepanjang meridian tersebut, selisihnya terhadap WIB Jakarta, serta negara/kota yang dilintasi.

Globe.gl menyediakan API interaksi paths layer yang kaya:
- `.pathLabel(fn)`: Menampilkan tooltip HTML mengambang saat kursor melintas di atas garis.
- `.onPathClick(fn)`: Menangkap event klik kiri pada garis bujur.

## Decision
1. **State Management**:
   - Menambahkan `showTimezoneLines: boolean` (default: `true`) pada `MapState` (`mapState.svelte.ts` & `mapState.ts`).
   - Menambahkan method `toggleTimezoneLines()` pada `MapState`.
   - Menambahkan `selectedMeridian: TimezoneMeridianInfo | null` pada `MapState` untuk menyimpan data meridian yang sedang aktif diinspeksi.
2. **Metadata Meridian Komprehensif di Plugin**:
   - Memperluas objek `GeoPath` di `types.ts` dengan properti metadata:
     - `utcOffset?: number;`
     - `gmtLabel?: string;`
     - `localTime?: string;`
     - `diffWib?: string;`
     - `keyRegions?: string[];`
     - `tooltipHtml?: string;`
   - Pada `worldTimeApp.getPaths`:
     - Menghitung waktu lokal saat ini untuk setiap meridian berdasarkan `utcOffset`.
     - Menyusun `tooltipHtml` modern berisi bendera/ikon, badge GMT/UTC, waktu lokal, dan ringkasan wilayah.
     - Menyusun daftar kota & negara utama yang dilalui bujur tersebut.
3. **Penyambungan Interaksi pada Globe 3D**:
   - Pada `Globe3DView.svelte`:
     - Jika `!mapState.showTimezoneLines`, maka `globePaths` bernilai `[]`.
     - Mengikat `.pathLabel((d: any) => d.tooltipHtml || d.label)`.
     - Mengikat `.onPathClick((path: any) => { mapState.setSelectedMeridian(path); })`.
     - Merender komponen `MeridianDetailCard.svelte` saat `mapState.selectedMeridian` aktif.
4. **Tombol Kontrol di UI**:
   - Menambahkan tombol kontrol di `UniversalAppControls.svelte` dan `TimeControls.svelte`:
     `🌐 Garis: ON / OFF` berdampingan dengan tombol `Label: ON / OFF`.

## Consequences
- Pengguna memiliki kontrol penuh atas visualisasi meridian bujur.
- Mempermudah edukasi waktu global dan konversi zona waktu secara intuitif hanya dengan mengklik garis di bola bumi 3D.
