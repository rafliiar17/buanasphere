# ADR 0031: Two-Way Reactive Filtering Integration for 3D Micro-Apps

## Status
**Accepted**

## Context & Problem Statement
Setelah memisahkan antarmuka kontrol ke dalam modul-modul independen (`TimeControls`, `FlightControls`, `PassportControls`, `KursControls`), state filter masih tersimpan secara lokal di dalam masing-masing komponen toolbar. Akibatnya:
- Ketika pengguna mengklik filter *Sedang Jam Kantor* atau *Siang Hari* di TimeWorld, Globe 3D belum merefleksikan filter tersebut (belum meredupkan negara yang tutup/malam).
- Ketika pengguna mengklik filter *Timur Tengah* di Flow Corridors, garis busur 3D masih menampilkan semua koridor dan kamera belum meluncur ke kawasan tersebut.
- Ketika pengguna mengklik filter *Bebas Visa WNI* di Passport World, peta belum menyorot negara-negara bebas visa secara eksklusif.

Diperlukan arsitektur sinkronisasi dua arah (*2-way reactive synchronization*) antara state filter di `geoStore.svelte.ts` dengan rendering shader, ketinggian poligon, dan 3D Arcs di `Globe3DView.svelte` & `FlatMap2DView.svelte`.

## Architecture Decisions

### 1. Centralized Reactive Filter State in `geoStore.svelte.ts`
Menambahkan properti filter reaktif dan helper predicate `isCountryMatched(iso3: string): boolean`:
- **`timeFilter`**: `'all' | 'working' | 'daylight' | 'night'`
  - `'working'`: Menghitung jam lokal saat ini (`localHour >= 9 && localHour < 17`).
  - `'daylight'`: Menghitung status siang surya (`isDaylight(localHour)`).
  - `'night'`: Menghitung status malam surya (`!isDaylight(localHour)`).
- **`flightCorridorFilter`**: `'all' | 'mideast' | 'asean' | 'eastasia' | 'west'`
  - Menyaring daftar 3D Arcs dan negara hub yang aktif.
  - Memicu kamera WebGL untuk meluncur (*pointOfView*) ke centroid kawasan koridor yang dipilih.
- **`passportVisaFilter`**: `'all' | 'free' | 'voa' | 'required'`
  - Menyaring negara berdasarkan syarat masuk bagi pemegang paspor Indonesia.

### 2. Globe 3D Visual Shader & Altitude Adaptation
- **Matching Countries**:
  - Warna penuh (*full vibrant chroma/amber/emerald*).
  - Ketinggian poligon terangkat (`altitude: 0.012`) untuk efek visual 3D timbul (*elevated focus*).
  - Pin label 3D tetap aktif.
- **Non-Matching Countries**:
  - Warna diredupkan menjadi transparan redup (`rgba(30, 41, 59, 0.20)` pada dark theme atau `rgba(226, 232, 240, 0.30)` pada light theme).
  - Ketinggian poligon diturunkan (`altitude: 0.001`).
  - Pin label 3D disembunyikan untuk mengurangi kepadatan visual.

## Consequences
- **Positif**:
  - Interaktivitas visual seketika (*instant zero-latency response*) saat user mengklik filter apapun di toolbar.
  - Memberikan pemahaman spasial yang mendalam (misal melihat zona jam kerja aktif di seluruh dunia secara visual).
- **Negatif**:
  - Memerlukan komputasi ringan di `$effect` WebGL Three.js saat filter berubah.
