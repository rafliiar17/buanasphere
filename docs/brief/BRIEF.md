# Project Brief — kurs-world

> **Versi:** 0.1-draft  
> **Tanggal:** 2 September 2026  
> **Status:** Draft untuk review internal

---

## Executive Summary

**kurs-world** adalah platform informasi kurs mata uang berbasis web yang memungkinkan siapa pun—tanpa perlu akun atau keahlian finansial—untuk melihat kurs terkini, membandingkan nilai tukar antar mata uang, dan melakukan konversi secara instan. Platform ini hadir untuk menjadi referensi kurs yang *jujur*, cepat, dan bebas noise bagi pengguna Indonesia yang selama ini terpaksa berpindah-pindah antara aplikasi bank, Google, dan situs OJK.

Tidak seperti kompetitor global (xe.com, Wise) yang fokus pada transfer uang, atau bank yang hanya menampilkan kurs mereka sendiri, kurs-world mengagregasi kurs dari berbagai sumber (bank sentral, bank komersial, money changer) dan menyajikannya secara transparan dalam satu tampilan. Pengguna bisa langsung melihat *siapa yang memberikan kurs terbaik untuk kebutuhannya*.

Pada fase awal, kurs-world tersedia sebagai aplikasi web responsif dan Public API. Produk ini dibangun dengan filosofi **"informasi dulu, transaksi belakangan"** — tidak memaksa pengguna untuk mendaftar, tidak menyembunyikan data di balik paywall, dan tidak merekomendasikan produk finansial secara agresif.

---

## Problem Statement

### Konteks & Data

Lebih dari **270 juta penduduk Indonesia** berinteraksi dengan valuta asing setiap hari—mulai dari importir UMKM, freelancer yang menerima pembayaran USD, mahasiswa yang membayar biaya kuliah luar negeri, hingga wisatawan yang akan menukar rupiah sebelum terbang. Namun akses ke informasi kurs yang akurat, terkini, dan komparatif masih sangat terfragmentasi:

- **Bank Indonesia** menyediakan kurs tengah resmi, namun tampilannya kaku, tidak ada konversi, dan tidak ada perbandingan antar bank.
- **Google** menampilkan kurs real-time tapi hanya dari satu sumber (Morningstar/Refinitiv) dan tidak merepresentasikan kurs yang *benar-benar bisa dipakai* di bank atau money changer lokal.
- **Aplikasi bank** hanya menampilkan kurs bank itu sendiri — dan setiap bank bisa memiliki selisih (spread) yang sangat berbeda.
- **xe.com dan Wise** fokus pada pasar global dan transfer uang; antarmuka mereka tidak dioptimasi untuk konteks Indonesia (IDR sebagai mata uang dasar, perbandingan antar bank lokal, dll).

Akibatnya, pengguna yang ingin mendapatkan kurs terbaik harus membuka 3–5 tab berbeda, melakukan kalkulasi manual, dan tetap tidak yakin apakah keputusannya optimal. Ini **masalah informasi asimetris** yang nyata dan terjadi setiap hari.

### Pain Points Utama

| Pain Point | Dampak |
|---|---|
| Kurs tersebar di banyak sumber, tidak bisa dibandingkan | Pengguna kehilangan nilai tukar yang lebih baik |
| Tidak ada konteks "kurs mana yang berlaku di mana" | Ekspektasi yang tidak sesuai saat transaksi nyata |
| Konversi manual dan error-prone | Kesalahan kalkulasi, terutama untuk jumlah besar |
| Tidak ada histori kurs untuk analisis sederhana | Tidak bisa memutuskan kapan waktu terbaik menukar |

---

## Solution Overview

kurs-world menyediakan:

1. **Dashboard kurs terpusat** — agregasi kurs dari Bank Indonesia, bank-bank komersial besar (BCA, Mandiri, BRI, BNI, CIMB Niaga), dan referensi pasar global (ECB, FRED).
2. **Konverter instan** — input jumlah, pilih mata uang asal dan tujuan, langsung dapat hasil dari berbagai sumber sekaligus.
3. **Perbandingan kurs** — side-by-side comparison antar bank/sumber untuk pasangan mata uang tertentu.
4. **Histori kurs** — grafik tren 30/90/365 hari terakhir.
5. **Public API** — untuk developer atau bisnis yang membutuhkan data kurs secara programatik.

---

## Target Users & Personas

### Persona 1 — Raka, Freelancer Digital (28 tahun, Jakarta)

**Latar belakang:** Raka adalah UI designer yang bekerja untuk klien AS dan Eropa. Setiap bulan ia menerima pembayaran dalam USD dan EUR melalui Payoneer/Wise, lalu mencairkannya ke rekening rupiah.

**Goals:**
- Tahu kapan kurs USD/IDR sedang tinggi supaya bisa menunda pencairan
- Hitung dengan cepat berapa rupiah yang akan ia terima sebelum memutuskan mencairkan

**Frustrasi saat ini:**
- Harus cek Google + aplikasi Wise + aplikasi BCA secara manual setiap hari
- Tidak yakin apakah kurs yang ditampilkan Google sama dengan yang ia dapatkan di Wise saat transfer

**Cara ia menggunakan kurs-world:**
- Buka setiap pagi dari HP (mobile-first)
- Set alert saat USD/IDR menyentuh angka tertentu
- Cek histori 30 hari untuk memutuskan kapan mencairkan

---

### Persona 2 — Ibu Sari, Pemilik Toko Online (42 tahun, Surabaya)

**Latar belakang:** Sari mengelola toko online yang mengimpor produk fashion dari China. Setiap bulan ia perlu mentransfer CNY ke supplier melalui money changer lokal. Budget bulanannya sekitar USD 5.000–10.000 setara.

**Goals:**
- Cari money changer dengan kurs CNY/IDR terbaik di kota
- Kalkulasi cepat berapa rupiah yang harus ia siapkan untuk transfer sejumlah tertentu

**Frustrasi saat ini:**
- Telepon satu per satu ke money changer untuk tanya kurs — memakan waktu
- Kurs berubah sepanjang hari, sulit memutuskan kapan timing terbaik

**Cara ia menggunakan kurs-world:**
- Buka saat akan melakukan transfer (sekali seminggu atau dua minggu sekali)
- Butuh tampilan yang mudah dibaca, bukan yang penuh grafik rumit
- Perlu bisa share screenshot kurs ke WhatsApp (untuk negosiasi dengan supplier)

---

## Unique Value Proposition

> **"Satu tempat untuk semua kurs yang benar-benar berlaku — bukan hanya kurs di atas kertas."**

kurs-world membedakan diri dengan:
- **Transparansi sumber** — setiap kurs dilabeli jelas dari mana datanya
- **Komparasi lintas bank** — bukan hanya satu sumber, tapi banyak sekaligus
- **Konteks Indonesia** — IDR sebagai mata uang "rumah", interface berbahasa Indonesia, referensi ke bank lokal
- **Zero-friction** — tidak perlu daftar, tidak ada iklan pop-up, langsung dapat informasi
- **API terbuka** — developer bisa pakai data ini untuk produk mereka sendiri

---

## Key Features

- **🔄 Real-time Rate Feed** — kurs diperbarui setiap 15 menit dari multiple sources (Bank Indonesia, ECB, bank komersial via scraping/API)
- **💱 Multi-source Converter** — konversi dengan menampilkan hasil dari 3–5 sumber berbeda secara simultan
- **📊 Rate Comparison Table** — tabel perbandingan kurs beli/jual antar bank untuk pasangan mata uang tertentu
- **📈 Historical Chart** — grafik tren kurs 7/30/90/365 hari dengan pilihan mata uang
- **🔔 Rate Alert** — notifikasi (email atau browser push) saat kurs menyentuh threshold yang ditetapkan pengguna (perlu simpan preferensi, opsional login)
- **🌐 Public REST API** — endpoint untuk mendapatkan kurs terkini, histori, dan konversi; rate-limited, API key via self-service
- **📱 Mobile-first Responsive** — dioptimasi untuk penggunaan mobile tanpa aplikasi native
- **🔗 Shareable Rate Card** — generate link atau gambar berisi snapshot kurs untuk dibagikan via WhatsApp/sosmed

---

## Success Metrics (KPIs)

### Traction Metrics

| Metrik | Target Phase 1 (3 bulan) | Target Phase 2 (6 bulan) |
|---|---|---|
| Monthly Active Users (MAU) | 5.000 | 25.000 |
| Daily Active Users (DAU) | 500 | 3.000 |
| Session Duration (median) | ≥ 90 detik | ≥ 2 menit |
| Bounce Rate | < 55% | < 45% |
| API Registered Developers | 50 | 200 |

### Quality Metrics

| Metrik | Target |
|---|---|
| Page Load Time (LCP) | < 2.5 detik |
| Data Freshness | Kurs tidak lebih dari 20 menit |
| Uptime | ≥ 99.5% |
| Error Rate (API) | < 0.5% |

### Business Metrics *(100% Free Public Good Model)*

| Metrik | Target |
|---|---|
| Organic Search Traffic | 60% dari total traffic |
| Return User Rate | ≥ 30% dalam 7 hari |
| NPS (Net Promoter Score) | ≥ 40 (target "Good") |
| Infrastructure Cost Efficiency | < $5 / bulan (Cloudflare Workers Free/Standard tier) |

---

## Timeline & Phases

### Phase 1 — MVP (0–3 Bulan)

**Fokus:** Validasi produk, agregasi rate, & traction awal

- Arsitektur backend: Elysia.js (Bun) pada Cloudflare Workers + D1 + KV
- Frontend: Svelte 5 (Runes) + Tailwind CSS v4 + shadcn-svelte
- Real-time rate feed (USD, EUR, SGD, JPY, GBP, AUD, CNY vs IDR)
- Konverter multi-sumber simultan
- Historical chart (30 hari)
- Halaman perbandingan kurs bank (*side-by-side*)
- Public REST API v1 (kurs terkini + konversi, 100% free with edge cache)
- Landing page + Swagger UI / OpenAPI docs
- SEO on-page untuk keyword kurs Indonesia

**Deliverable:** Website live di Cloudflare Pages, edge cache sub-50ms, 50 API developer aktif terdaftar.

---

### Phase 2 — Growth & Engagement (3–6 Bulan)

**Fokus:** Retensi & fitur yang mendorong pemantauan berkala

- Rate Alert (notifikasi browser Web Push + Cloudflare Email Service)
- Historical chart diperluas (90/365 hari)
- Halaman dedicated per-mata uang (SEO: "kurs dollar hari ini", "kurs euro hari ini")
- API v2 dengan endpoint histori time-series
- Shareable Rate Card (OpenGraph / SVG card generator untuk WhatsApp)
- Penambahan provider bank komersial & money changer terverifikasi

**Deliverable:** 25.000 MAU, return user rate ≥ 30%, zero infrastructure debt.

---

### Phase 3 — Ecosystem Expansion & Open Data (6–12 Bulan)

**Fokus:** Skalabilitas ekosistem open data & jangkauan regional

- Pemeliharaan komitmen 100% Free Public Good tanpa paywall
- Public API self-service dengan edge rate limiting berbasis Cloudflare KV
- Kemungkinan ekspansi ke mata uang regional Asia Tenggara (PHP, THB, MYR, VND, SGD)
- Progressive Web App (PWA) untuk akses offline / installable di mobile
- Widget embed kurs yang dapat dipasang developer / blogger di web mereka

**Deliverable:** 50.000+ MAU, referensi kurs terbuka terdepan di Indonesia.

---

## Risks & Assumptions

### Risiko

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Sumber data kurs tidak stabil / scraping diblokir | Tinggi | Tinggi | Multi-source redundancy; fallback ke Bank Indonesia & ECB API; request timeout 5s |
| Google (dan kompetitor) selalu muncul lebih atas di SEO | Tinggi | Sedang | Target long-tail keyword komparasi bank ("kurs bca vs mandiri"), rich snippets JSON-LD |
| Salah paham publik menganggap platform adalah fintech/money changer | Sedang | Sedang | Disclaimer tegas di header & footer: *"Platform informasi kurs publik, bukan layanan keuangan atau transaksi valas"* |
| User tidak mau balik setelah kunjungan pertama | Sedang | Tinggi | Investasi di Rate Alert (push/email) dan shareable rate cards |
| Data kurs anomali dari provider | Rendah | Sangat Tinggi | Sistem validasi anomali: buy/sell validation & tabel karantina |

### Asumsi

- Pengguna Indonesia membutuhkan data komparasi kurs riil bank, bukan hanya satu angka kurs tengah.
- Sumber data publik (Bank Indonesia, ECB) tetap dapat diakses secara terbuka.
- Sebagai penyedia **informasi publik murni (non-transaksional)**, platform tidak memerlukan perizinan fintech/PJP/PBFX dari OJK atau Bank Indonesia.
- Stack serverless Cloudflare Workers + Elysia.js + Svelte 5 mampu melayani jutaan request dengan biaya operasional yang mendekati nol ($0 - $5/bulan).
