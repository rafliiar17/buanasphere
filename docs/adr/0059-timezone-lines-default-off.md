# ADR 0059: Default State OFF untuk Garis Batas Zona Waktu 3D

## Status
Accepted

## Konteks & Problem Statement
Sebelumnya, garis batas zona waktu 3D pada aplikasi Jam Global (**TimeWorld `/time`**) diatur ke `showTimezoneLines = true` secara default saat halaman dimuat. 

Dengan hadirnya dataset batas geopolitik riil yang detail (562 segmen garis berliku di seluruh benua dan samudra), menampilkan seluruh garis secara otomatis sejak awal pemuatan membuat kanvas bola dunia terlihat padat dan mengurangi fokus visual terhadap daratan dan pin kota. Pengguna menginginkan tampilan awal yang bersih, lega, dan minimalis dengan opsi mengaktifkan garis batas zona waktu secara manual melalui tombol toggle.

## Keputusan Arsitektur
1. **Default Value State**:
   - Mengubah nilai inisialisasi `showTimezoneLines` dari `true` menjadi `false` pada:
     - `geoStore.svelte.ts`
     - `mapState.ts`
     - `mapState.svelte.ts`
2. **Label Klarifikasi**:
   - Memperbarui label di `UniversalAppControls.svelte` dari `"Garis Bujur Zona Waktu 3D"` menjadi `"Garis Batas Zona Waktu 3D"` agar merefleksikan batas geopolitik riil non-linear (ADR-0057).
3. **User Flow**:
   - Saat pengguna membuka `/time`, bola dunia tampil bersih hanya dengan pin kota dan visual diurnal (siang/malam).
   - Pengguna dapat mengklik tombol `🌐 Garis: OFF` di panel bawah atau toggle `Garis Batas Zona Waktu 3D [ OFF ]` di panel samping untuk menyalakan garis kapan saja.

## Konsekuensi & Keuntungan
- Bola dunia tampil jauh lebih bersih, jernih, dan tidak padat saat pertama kali dibuka.
- Draw calls Three.js berkurang saat pemuatan awal karena tidak perlu merender 562 segmen garis sebelum diminta.
- Pengalaman pengguna (*user experience*) menjadi lebih fokus dan intuitif.
