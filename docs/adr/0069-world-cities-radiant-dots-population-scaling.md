# ADR 0069: World Cities Radiant Dots & Population-Scaled Visualization for /capitals and /time

## Status
Accepted

## Context
1. **Pola Visualisasi Demo Resmi globe.gl**:
   Contoh resmi [`globe.gl/example/world-cities`](https://globe.gl/example/world-cities/) menampilkan ribuan kota dunia di atas bola dunia gelap (*earth-night*) dengan:
   - Titik pendar bercahaya (*radiant dots*) yang ukurannya diproyeksikan proporsional terhadap populasi kota menggunakan akar kuadrat: `Math.sqrt(pop) * factor`.
   - Warna kontras tinggi yang menciptakan efek konstelasi lampu kota (*urban constellation*) yang estetik dan informatif.
2. **Kebutuhan Visual di BuanaSphere**:
   - Di microapp **World Capitals (`/capitals`)**: Peta saat ini memetakan 195+ ibukota negara berdaulat. Menambahkan dot bercahaya emas amber (`rgba(245, 158, 11, 0.90)`) dengan ukuran proporsional populasi ibukota akan memberikan pemahaman visual instan terhadap skala pusat pemerintahan dunia (misal Tokyo ~37M, Jakarta ~11M, Beijing ~21M vs Canberra ~450k).
   - Di microapp **Time World (`/time`)**: 120+ kota dunia memerlukan diferensiasi visual yang memperlihatkan skala metropolitan serta status diurnal surya (siang vs malam).

## Decision
1. **Dukungan `dotRadius` Kustom pada `LabelItem` di `labelLayer.ts`**:
   - Memperluas interface `LabelItem` dengan properti `dotRadius?: number`.
   - Di `configureLabelLayer`, gunakan `.labelDotRadius((d: any) => d.dotRadius ?? (d.iso3 === selectedIso3 ? 0.24 : 0.06))`.
2. **Implementasi Konstelasi 195+ Ibukota di `worldCapitalsApp.ts`**:
   - Menyediakan `getCustomLabels`:
     - Memetakan 195+ ibukota dengan `lat` & `lng` dari `capitalCoordinates`.
     - Rumus radius: `dotRadius = Math.max(0.08, Math.min(0.48, Math.sqrt(pop) * 6e-5))`.
     - Rumus ukuran font: `size = Math.max(0.55, Math.min(1.10, Math.sqrt(pop) * 1.2e-4))`.
     - Warna: Emas amber bercahaya (`rgba(245, 158, 11, 0.90)`).
     - Filtering Level-of-Detail (LOD) berbasis ketinggian kamera untuk kinerja rendering yang mulus.
3. **Penyempurnaan Kota Dunia di `worldTimeApp.ts`**:
   - Menghitung `dotRadius` proporsional dari populasi kota (`city.population`).
   - Warna dot reaktif surya: siang hari (emas matahari `rgba(251, 191, 36, 0.90)`), senja/fajar (oranye `rgba(249, 115, 22, 0.90)`), dan malam hari (cyan lembut `rgba(56, 189, 248, 0.85)`).

## Consequences
### Positif
- Tampilan 3D Globe pada `/capitals` dan `/time` memiliki estetika modern kelas dunia setara dengan demo resmi `globe.gl`.
- Ukuran kota dan ibukota memberikan informasi demografi intuitif tanpa harus membaca angka mentah.
- Tipografi tetap 100% bersih tanpa glitch karakter `??` karena mematuhi ADR 0067.

### Negatif / Trade-offs
- Sedikit kalkulasi tambahan `Math.sqrt` saat memetakan dataset kota/ibukota, namun berjalan dalam sub-milidetik (<1ms).
