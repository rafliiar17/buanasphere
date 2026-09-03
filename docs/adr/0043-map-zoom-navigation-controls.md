# ADR 0043: Floating Map Zoom In and Zoom Out Navigation Controls

## Status
Accepted

## Context
Pada platform Kurs World, visualisasi peta bola dunia 3D (Globe.gl / Three.js) dan peta datar 2D (Plotly) mengandalkan interaksi mouse wheel atau gesture cubit (pinch-to-zoom) pada layar sentuh. Namun, pengguna laptop dengan trackpad standar atau mouse tanpa smooth scroll sering mengalami kesulitan memperbesar (*zoom in*) atau memperkecil (*zoom out*) tampilan bumi secara presisi.

Pengguna memerlukan tombol eksplisit di antarmuka pengguna:
1. **Zoom In (`+`)**: Memperbesar tampilan dengan mendekatkan kamera ke permukaan bumi.
2. **Zoom Out (`−`)**: Memperkecil tampilan untuk melihat perspektif global bumi.
3. **Reset View (`⟲`)**: Mengembalikan kamera ke posisi acuan awal (Indonesia/Asia-Pasifik pada altitude `2.2`).

## Decision
1. **Fungsi Interpolasi Ketinggian Kamera (Camera Altitude Interpolation)**:
   - Pada `Globe3DView.svelte`, implementasikan:
     - `zoomIn(factor = 0.7, durationMs = 300)`: Mengambil POV kamera saat ini via `globeInstance.pointOfView()`, menghitung altitude baru dengan batas minimum aman `0.15` (mencegah kamera menembus mesh bumi), dan menganimasikannya secara mulus.
     - `zoomOut(factor = 1.4, durationMs = 300)`: Menghitung altitude baru dengan batas maksimum `6.0` (mencegah bola dunia mengecil hingga hilang dari viewport), dan menganimasikannya secara mulus.
     - `resetView(durationMs = 600)`: Mereset kamera ke koordinat acuan `{ lat: 10, lng: 110, altitude: 2.2 }`.
2. **Floating Navigation Control Widget**:
   - Menempatkan widget mengambang di sisi kanan bawah viewport peta (`absolute bottom-8 right-6 z-30`):
     - Desain pill vertikal glassmorphism (`bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1.5`).
     - Tombol Zoom In: Icon `Plus` (`w-4 h-4`) dengan aria-label "Perbesar Tampilan (Zoom In)".
     - Tombol Zoom Out: Icon `Minus` (`w-4 h-4`) dengan aria-label "Perkecil Tampilan (Zoom Out)".
     - Pemisah tipis (`h-px bg-slate-800`).
     - Tombol Reset View: Icon `RotateCcw` (`w-3.5 h-3.5`) dengan aria-label "Reset Sudut Pandang".
3. **Keyboard Accessibility**:
   - Mendukung penekanan tombol keyboard `+` / `=` untuk memperbesar dan `-` / `_` untuk memperkecil saat viewport peta aktif.

## Consequences
- Navigasi peta menjadi jauh lebih mudah diakses di segala jenis perangkat tanpa tergantung pada mouse wheel.
- Animasi transisi Three.js yang mulus menjaga kenyamanan visual tanpa sentakan mendadak.
