# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Warga Indonesia yang akan atau sedang melakukan transaksi valas — mengirim uang ke luar negeri, menukar valuta asing di money changer, menerima pengiriman dari luar, atau memonitor eksposur mata uang portofolio. Juga dipakai oleh pelancong, mahasiswa di luar negeri, dan importir UKM yang ingin tahu kurs terbaik sebelum bertransaksi. Pengguna mengakses di browser mobile atau desktop, seringkali saat sedang di dalam kantor bank atau money changer. Literasi keuangan menengah ke atas.

## Product Purpose

Memberikan akses transparansi harga kurs valas dari semua sumber terpercaya Indonesia dalam satu tempat — tanpa registrasi, tanpa iklan invasif, tanpa markup tersembunyi. Pengguna bisa membandingkan harga beli dan jual antar bank sebelum memutuskan di mana menukar. Sukses = pengguna menemukan provider terbaik dalam < 60 detik tanpa perlu keliling situs masing-masing bank.

## Positioning

Satu-satunya agregator valas Indonesia yang menyajikan data side-by-side dari BI (JISDOR), bank komersial besar (BCA, Mandiri, BRI, BNI, CIMB), dan money changer dalam format yang bisa langsung dibandingkan — bukan kalkulator konversi biasa, bukan situs bank individual, bukan blog kurs harian.

## Operating Context

- Pengguna check kurs saat hendak transfer atau penukaran — sesi pendek (< 2 menit)
- Diakses di mobile maupun desktop; banyak dari mobile 4G dengan waktu muat terbatas
- Data kurs berubah sepanjang hari kerja; staleness > 30 menit sudah tidak berguna
- Pengguna sering membandingkan dua atau tiga bank sekaligus sebelum memutuskan

## Capabilities and Constraints

Dikonfirmasi tersedia:
- Kurs real-time dari Bank Indonesia (JISDOR), BCA, Mandiri, BRI, BNI, CIMB Niaga, open.er-api.com (fallback)
- Rate Matrix: perbandingan kurs beli/jual side-by-side per mata uang
- Currency Converter: kalkulator konversi multi-source
- Peta Kurs Dunia: visualisasi geografis interaktif
- Grafik Tren Historis: pergerakan kurs 7d/30d/90d
- Shareable Rate Cards: bagikan snapshot kurs ke media sosial
- Rate Alert: notifikasi email gratis saat kurs mencapai target
- Public Developer REST API: endpoint kurs dengan rate limiting
- Edge cache SWR 15 menit (Cloudflare Workers + KV)

Batasan:
- Bukan produk fintech — tidak memfasilitasi transaksi
- Tidak ada login/akun wajib
- Data dari sumber terbuka; akurasi bergantung pada ketersediaan dan parsing provider

## Brand Commitments

- Nama: **Kurs.World** — titik adalah bagian dari nama, bukan dekorasi
- Warna brand: `.World` dalam merah IDX (C41E3A) — sudah live di navbar
- Tagline: *"Informasi Dulu, Transaksi Belakangan"*
- Non-fintech secara hukum: wajib disclaimer di setiap halaman

## Evidence on Hand

- Backend berjalan di Cloudflare Workers via Elysia.js (Bun), port 8787
- Frontend Svelte 5 live di localhost:5173
- 67 tests passing (23 backend + 44 frontend)
- Data live dari open.er-api.com + mock providers (bank scraping belum production)

## Product Principles

1. **Transparansi Sumber** — setiap kurs harus mencantumkan provider dan timestamp
2. **Tanpa Hambatan** — tidak ada modal registrasi, paywall, atau dark pattern sebelum data terlihat
3. **Density over Decoration** — pengguna datang untuk angka, bukan untuk eye candy
4. **Edge-First** — sub-50ms response time dari titik edge terdekat adalah invariant, bukan nice-to-have
5. **Indonesia-First** — IDR sebagai base currency default, format Rupiah baku, bahasa Indonesia primer

## Accessibility & Inclusion

- Semua tabel data wajib dapat diakses via keyboard
- Contrast ratio minimum 4.5:1 untuk teks body (WCAG AA)
- Tidak ada animasi yang tidak bisa di-pause (respect prefers-reduced-motion)
