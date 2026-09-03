# ADR 0067: Clean Globe Typography and Complete Glyph/Emoji Elimination on 3D Pin Labels

## Status
Accepted

## Context
1. **Masalah Artefak `??` dan `?`**:
   Pada tampilan 3D Globe WebGL, teks pin label sering mengalami degradasi visual menjadi tanda tanya ganda (`??`) atau tanda tanya tunggal (`?`), seperti contoh nyata pada pelacak gempa: `? Tiongkok (M5.2)`.
2. **Akar Masalah**:
   - **Karakter Emoji & Simbol Arbitrer**: Berbagai plugin microapp menambahkan emoji secara langsung ke string label 3D:
     - `earthquakeApp.ts`: awalan `⚡` (`⚡ Tiongkok (M5.2)`) atau icon resiko `🌋`, `⚠️`, `🛡️`.
     - `worldCapitalsApp.ts`: awalan bendera `flagEmoji` (seperti `🇨🇳 Beijing`).
     - `Globe3DView.svelte`: awalan bendera default `spatial.flagEmoji`.
     - `worldTimeApp.ts`: akhiran fase diurnal surya `phase.emoji` (☀️, 🌙).
     - `flowCorridorsApp.ts`: awalan `✈️`.
     - `floraFaunaApp.ts`: awalan `animal.emoji`.
   - **Limitasi Konteks Canvas 2D WebGL (`three-globe`)**:
     Mesin label `globe.gl` (`three-globe`) merender string teks ke bitmap 2D Canvas HTML5 sebelum diproyeksikan sebagai sprite tekstur WebGL 3D. Di banyak sistem operasi desktop & mobile (khususnya Linux dan lingkungan peramban standar), konteks Canvas 2D tidak memiliki fallback font emoji warna maupun parser Unicode *Regional Indicator Symbol*, sehingga karakter multi-byte emoji langsung dikonversi oleh browser menjadi replacement glyph `?` atau `??`.
3. **Standar Desain Produk**:
   Pengguna menginstruksikan secara tegas: *"pastikan tidak ada label ?? dan jangan asal beri icon"*. Label 3D Globe harus menggunakan tipografi Latin murni, bersih, profesional, dan bebas dari icon arbitrer yang rentan rusak.

## Decision
1. **Pemurnian Tipografi Pin Label di Seluruh Plugin & Komponen**:
   - **`earthquakeApp.ts`**:
     - Jika ada gempa: `${country.countryName} (M${latest.magnitude.toFixed(1)})` (hapus `⚡`).
     - Jika tidak ada gempa: `${country.countryName}` (hapus icon `🌋`, `⚠️`, `🛡️`).
   - **`worldCapitalsApp.ts`**:
     - Label: `${cap} • ${country.countryName}` (hapus `flagEmoji` / `🏛️`).
     - `shortText`: `${cap}`.
   - **`worldTimeApp.ts`**:
     - Label: `${country.countryName} ${local.formatted}` (hapus `phase.emoji`).
     - `shortText`: `${local.formatted}`.
   - **`flowCorridorsApp.ts`**:
     - Label: `${country.countryName}` (hapus `✈️`).
   - **`floraFaunaApp.ts`**:
     - Label: `${country.countryName} (${bio.animal.commonName})` (hapus `bio.animal.emoji`).
     - `shortText`: `${bio.animal.commonName}`.
   - **`Globe3DView.svelte`**:
     - Label default: `${rawName} (${curr})` atau `${rawName}` murni (hapus penambahan `flagEmoji`).
2. **Sanitizer Bertingkat di `labelLayer.ts`**:
   - Menambahkan fungsi helper `sanitizeLabelText(text: string): string` yang:
     - Membersihkan regex emoji, piktogram, dan surrogate pairs (`\p{Extended_Pictographic}`, `[\uD800-\uDBFF][\uDC00-\uDFFF]`).
     - Menghapus karakter pengganti awal/akhir `?`, `??`.
     - Melakukan normalisasi spasi ganda.
   - Memasang `sanitizeLabelText` pada konfigurasi layer `.labelText((d: any) => sanitizeLabelText(d.text))` di `configureLabelLayer`.
3. **Preservasi Icon di Panel HTML DOM**:
   - Icon dan emoji pada Drawer/Inspector HTML DOM tetap diizinkan karena elemen DOM HTML modern memiliki dukungan render font emoji warna penuh melalui CSS/system fonts, berbeda dengan canvas WebGL 2D.

## Consequences
### Positif
- 100% bebas dari glitch tanda tanya `?` atau `??` di seluruh permukaan 3D Globe.
- Tampilan 3D Globe menjadi jauh lebih elegan, bersih (*editorial typography*), mudah dibaca (*high legibility*), dan konsisten di semua platform/OS (Linux, macOS, Windows, Android, iOS).
- Pertahanan bertingkat melalui `sanitizeLabelText` menjamin plugin baru yang lupa menghapus emoji tidak akan merusak tampilan canvas.

### Negatif / Trade-offs
- Tidak ada icon visual langsung pada pin 3D di bola dunia (detail simbolik tetap tersedia saat pengguna mengklik dan membuka inspector drawer negara).
