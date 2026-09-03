# ADR 0048: Project & Repository Rebranding to Buanasphere

## Status
Accepted

## Context
Project ini awalnya diinisiasi dengan nama **Kurs World** (`kurs-world`), yang bertujuan untuk menyediakan agregator nilai tukar mata uang real-time yang transparan, jujur, dan berorientasi pada Rupiah (IDR).

Seiring berjalannya pengembangan, platform ini telah bertransformasi secara signifikan menjadi **Platform Geospatial 3D Multi-Aplikasi Planet Bumi** berbasis webgl (Three.js & Globe.gl) yang di-host pada domain produksi `globe.arafz.id`. Saat ini, platform mengintegrasikan 7 micro-apps utama:
1. **Kurs World (`/kurs`)**: Nilai tukar valas, transparansi bank komersial & sentral.
2. **TimeWorld (`/time`)**: Jam matahari diurnal 8-fase global & referensi WIB.
3. **Flow Corridors (`/flight`)**: Koridor penerbangan & arus remitansi diaspora ke Indonesia.
4. **Passport World (`/passport`)**: Indeks mobilitas paspor & matriks visa.
5. **Nature World (`/nature`)**: Distribusi flora & fauna endemik di berbagai bioma bumi.
6. **World Capitals (`/capitals`)**: 195+ ibukota berdaulat, hari kemerdekaan, & lagu kebangsaan.
7. **Earthquake Tracker (`/quake`)**: Pemantauan seismik global real-time (M4.5+) & gelombang episentrum 3D.
8. **Operator Console (`/nimda`)**: Konsol operasional edge untuk cache purge, karantina, & API keys.

Nama lama `kurs-world` sudah tidak lagi merefleksikan cakupan dan visi platform yang kini berskala planet bumi. Diperlukan nama baru yang:
1. **Orisinal & Terverifikasi**: Bebas dari benturan merek/software lain (terverifikasi 0 hasil software di Google & GitHub).
2. **Kaya Makna**: Memadukan kata *Buana* (Bahasa Sanskerta/Indonesia: Jagad Raya / Benua / Alam Semesta) dengan *Sphere* (Lingkup Bola 3D Planet Bumi).
3. **Selaras dengan Domain**: Sesuai dengan domain produksi `globe.arafz.id`.

## Decision
1. Mengubah nama repository GitHub dari `rafliiar17/kurs-world` menjadi **`rafliiar17/buanasphere`**.
2. Memperbarui metadata proyek:
   - Root `package.json`: `"name": "buanasphere"`
   - Frontend `package.json`: `"name": "@buanasphere/frontend"`
   - Backend `package.json`: `"name": "@buanasphere/backend"`
3. Memperbarui dokumentasi utama (`README.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `AGENTS.md`) untuk mencerminkan identitas **Buanasphere**.
4. Memperbarui judul aplikasi di HTML frontend menjadi **Buanasphere — Platform Informasi Dunia Real-Time**.

## Consequences
- URL repository resmi kini beralih ke: `https://github.com/rafliiar17/buanasphere`.
- GitHub secara otomatis mengalihkan tautan repo lama (`kurs-world`) ke repo baru (`buanasphere`).
- Identitas brand menjadi lebih representatif, berkelas global, dan tetap membanggakan akar bahasa Indonesia (*Buana*).
