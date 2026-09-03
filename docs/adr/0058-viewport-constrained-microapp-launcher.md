# ADR 0058: Viewport-Constrained Responsive Microapp Launcher Modal

## Status
Accepted

## Konteks & Problem Statement
Micro-app switcher modal ([`GeoAppLauncherModal.svelte`](file:///home/archy/Projects/kurs-world/frontend/src/lib/framework/geoglobe/ui/GeoAppLauncherModal.svelte)) menyajikan seluruh aplikasi mikro yang terdaftar di Buanasphere/GeoGlobe suite (saat ini 7 aplikasi: Earthquake, Kurs, TimeWorld, Flow Corridors, Passport World, Nature World, Ibukota & Kemerdekaan).

Namun, kontainer modal sebelumnya tidak memiliki batasan ketinggian relatif terhadap viewport (`max-height` dalam `vh`), melainkan membiarkan tinggi kartu mengakumulasi secara vertikal hingga >950px. Akibatnya:
- Pada layar laptop standar (1366x768 atau 1920x1080 dengan browser window non-fullscreen), modal meluber melebihi tinggi layar (*overflow viewport* / "keluar layar").
- Elemen header atas (judul, subtitle, dan tombol close `X`) terdorong keluar batas atas layar.
- Kartu paling bawah ("Ibukota & Kemerdekaan") serta footer terpotong di tepi bawah layar.
- Pengguna tidak dapat melihat tombol close atau menggulir konten secara mandiri.

## Keputusan Arsitektur

### 1. Viewport-Safe Flexbox Layout Structure
Modal direfaktor menggunakan pembagian tiga zona berbasis Flexbox:
```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
  <div class="relative w-full max-w-4xl max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
    
    <!-- 1. Fixed Header (shrink-0) -->
    <header class="shrink-0 ...">
      <!-- Title, App Count Badge, Subtitle & Close Button [Esc] -->
    </header>

    <!-- 2. Independent Scrollable Content Area (flex-1 min-h-0 overflow-y-auto) -->
    <main class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 overscroll-contain custom-scrollbar">
      <!-- Quick Search Filter & Responsive Grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) -->
    </main>

    <!-- 3. Fixed Footer (shrink-0) -->
    <footer class="shrink-0 ...">
      <!-- Routing latency info + ESC key hint -->
    </footer>
  </div>
</div>
```

### 2. Peningkatan Fitur UI/UX
1. **Viewport Bound (`max-h-[88vh] sm:max-h-[85vh]`)**:
   - Menjamin bahwa modal tidak akan pernah meluber keluar dari layar, apapun resolusi layarnya.
2. **Fixed Header & Footer (`shrink-0`)**:
   - Header (dengan judul, badge aplikasi, dan tombol close `X`) dan Footer (dengan info routing dan petunjuk shortcut `Esc`) selalu tampak dan tidak tergeser saat konten digulir.
3. **Quick Search Filter**:
   - Menambahkan kolom pencarian instan berbasis nama, tagline, atau path (`/kurs`, `/time`, dll.) yang menyaring aplikasi secara reaktif.
4. **Responsive Grid Layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)**:
   - Menata kartu dalam 2 kolom pada tablet dan 3 kolom pada desktop lebar (`max-w-4xl`), mengurangi kebutuhan tinggi vertikal secara drastis.
5. **Card Visual Polish**:
   - Desain kartu yang lebih ergonomis (`p-4`), ringkasan metrik visual, badge status `Aktif`, dan efek hover glowing yang elegan.
6. **Aksesibilitas & Keyboard Navigation**:
   - Menekan tombol `Esc` atau mengklik backdrop langsung menutup modal.

## Konsekuensi & Keuntungan
- Pengguna di semua perangkat (laptop, tablet, desktop) dapat melihat seluruh elemen modal secara utuh tanpa terpotong.
- Tombol tutup (`X`) dan tombol navigasi selalu dapat diakses seketika.
- Fitur pencarian mempercepat perpindahan antar aplikasi mikro.
