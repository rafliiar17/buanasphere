# Project Brief — kurs-world

> **Versi:** 0.2-draft  
> **Tanggal:** 2 September 2026  
> **Status:** Siap untuk Review Teknis & SDLC  
> **UVP Utama:** *Peta Kurs Valuta Asing Dunia Interaktif & Agregator Komparasi Multi-Bank*

---

## Executive Summary

**kurs-world** adalah platform **Peta Kurs Valuta Asing Dunia Interaktif & Agregator FX** berbasis web yang memungkinkan siapa pun—tanpa perlu akun, tanpa paywall, dan tanpa keahlian finansial rumit—untuk menjelajahi nilai tukar seluruh negara di dunia dalam satu peta visual global interaktif (*Interactive World FX Choropleth Map & Global Heatmap*), membandingkan kurs bank lokal Indonesia (*side-by-side*), dan melakukan konversi multi-sumber secara instan.

Tidak seperti kompetitor global (xe.com, Wise) yang berfokus pada transaksi transfer uang dan dipenuhi iklan invasif, atau perbankan lokal yang hanya menampilkan angka tabel kaku dari institusi mereka sendiri, kurs-world mengusung pendekatan **Visual Storytelling & Geographic FX Exploration**:
1. **Eksplorasi Peta Dunia**: Visualisasi interaktif kekuatan mata uang global terhadap Rupiah (IDR) melalui choropleth map dinamis dan heatmap pergerakan 24 jam.
2. **Transparansi Komparasi Bank**: Agregasi kurs beli/jual riil dari Bank Indonesia (BI), bank komersial nasional (BCA, Mandiri, BRI, BNI, CIMB Niaga), dan bank sentral global (ECB, FRED).
3. **Aksesibilitas Ekstrem**: 100% Free, zero-login untuk fitur utama, dan latensi sub-50ms di seluruh dunia berkat arsitektur serverless edge (**Elysia.js on Cloudflare Workers** + **Svelte 5**).

Produk ini dibangun dengan filosofi **"Informasi Dulu, Transaksi Belakangan"** — menyajikan data jujur, objektif, dan transparan bagi masyarakat Indonesia.

---

## Problem Statement

### Konteks & Data

Lebih dari **270 juta penduduk Indonesia** berinteraksi dengan valuta asing—mulai dari importir/eksportir UMKM, freelancer digital yang menerima pembayaran USD/EUR, mahasiswa luar negeri, pekerja migran, hingga wisatawan. Namun, cara masyarakat mengakses informasi kurs saat ini mengalami masalah fundamental:

- **Ketiadaan Visualisasi Geografis & Makro**: Tidak ada platform yang menyajikan peta visual interaktif untuk memahami peta kekuatan mata uang dunia terhadap Rupiah secara spasial dan intuitif. Pengguna disodori deretan tabel angka yang membosankan dan membingungkan.
- **Fragmentasi Data Perbankan Lokal**: Setiap bank (BCA, Mandiri, BRI, BNI, CIMB Niaga) memiliki selisih (*spread*) kurs beli/jual yang berbeda-beda. Pengguna harus membuka 3–5 aplikasi atau tab berbeda untuk mengetahui bank mana yang memberi kurs terbaik.
- **Asimetri Informasi Search Engine**: Google menampilkan satu angka kurs tengah grosir interbank (Morningstar/Refinitiv) yang *tidak bisa dipakai transaksi langsung* di kantor cabang bank atau e-banking lokal.
- **Kompetitor Global Tidak Berorientasi IDR**: xe.com dan Wise berfokus pada pasar barat, transfer remitansi berbayar, dan tidak mengintegrasikan data kurs spesifik perbankan Indonesia.

Akibatnya, pengguna mengalami **information overload** namun tetap kekurangan konteks praktis: *"Berapa rupiah yang sebenarnya saya terima di bank lokal jika saya menukar hari ini, dan bagaimana perbandingannya dengan negara lain?"*

### Pain Points Utama

| Pain Point | Dampak |
|---|---|
| **Tidak ada visualisasi peta kurs global** | Sulit memahami pergerakan valas global vs IDR secara holistik |
| **Kurs bank tersebar & sulit dibandingkan** | Pengguna kehilangan potensi keuntungan kurs yang lebih baik |
| **Ketiadaan konteks kurs beli vs jual riil** | Ekspektasi keliru saat melakukan transaksi penukaran di bank |
| **Konversi manual antar bank memakan waktu** | Kesalahan kalkulasi anggaran impor/pembayaran luar negeri |
| **Tampilan data kaku dan penuh noise/iklan** | Pengalaman pengguna lambat dan melelahkan (*high friction*) |

---

## Solution Overview

kurs-world menghadirkan solusi terintegrasi:

1. **🗺️ Interactive World FX Choropleth Map (Flagship Hero Feature)**:
   - Peta dunia interaktif berbasis vektor (TopoJSON/SVG ringan) yang mewarnai setiap negara berdasarkan pergerakan nilai tukar 24 jam terhadap IDR atau skala kurs relatif.
   - Hover interaktif menampilkan tooltip cepat: Nama negara, kode mata uang, bendera, kurs terbaik saat ini, dan pergerakan harian.
   - Klik negara membuka *Country Quick Drawer* dengan opsi konversi instan dan komparasi bank lokal.
2. **📊 Side-by-Side Bank Comparison Matrix**:
   - Tabel komparasi lengkap kurs Beli (*Buy*), Jual (*Sell*), dan *Spread* dari Bank Indonesia, BCA, Mandiri, BRI, BNI, CIMB Niaga.
   - Sorotan otomatis: *Best Buy Rate*, *Best Sell Rate*, dan *Lowest Spread*.
3. **💱 Quick Country & Multi-Source Converter**:
   - Kalkulator konversi cerdas yang menghitung nilai rupiah di semua bank secara simultan hanya dengan memilih negara di peta atau mengetik nominal.
4. **🔥 Global Currency Ticker & Heatmap**:
   - Running ticker pita atas yang menampilkan tren mata uang utama dunia dan matriks heatmap penguatan/pelemahan harian.
5. **📈 Historical Trend Charts & Rate Alert**:
   - Grafik tren interaktif (7d, 30d, 90d, 365d) dan notifikasi threshold via Web Push API browser serta Cloudflare Email.
6. **🌐 100% Free Public REST API**:
   - Data layer publik berbasis Elysia.js dengan dokumentasi OpenAPI Swagger (`/swagger`) untuk komunitas developer dan startup.

---

## Target Users & Personas

### Persona 1 — Raka, Freelancer Digital (28 tahun, Jakarta)
- **Latar belakang**: Bekerja remote untuk klien AS & Eropa, menerima pembayaran USD/EUR bulanan.
- **Goals**: Memantau kapan kurs USD/IDR menguat melalui visual heatmap dan memilih bank lokal dengan kurs beli tertinggi.
- **Cara ia menggunakan kurs-world**: Membuka dashboard pagi hari, melihat running ticker dan peta dunia, menyetel Rate Alert saat USD menyentuh target, dan mencairkan ke bank dengan *Best Buy Rate*.

### Persona 2 — Ibu Sari, Pemilik Toko Online & Importir (42 tahun, Surabaya)
- **Latar belakang**: Mengimpor bahan baku dan produk jadi dari China (CNY) dan Jepang (JPY).
- **Goals**: Mengetahui bank lokal dengan kurs jual (transfer out) terendah agar modal belanja lebih hemat.
- **Cara ia menggunakan kurs-world**: Mengeklik negara China/Jepang langsung di Peta Dunia, melihat tabel komparasi bank, mengonversi nominal belanja, dan membagikan Shareable Rate Card ke tim keuangan via WhatsApp.

### Persona 3 — Dimas, Software Engineer & Startup Integrator (30 tahun, Bandung)
- **Latar belakang**: Mengembangkan platform e-commerce / SaaS multi-currency yang butuh data kurs harian.
- **Goals**: Integrasi API kurs terpercaya dengan response time sub-50ms dan dokumentasi type-safe.
- **Cara ia menggunakan kurs-world**: Memanfaatkan Public REST API Elysia.js via Eden Treaty tanpa biaya langganan.

---

## Unique Value Proposition (UVP)

> **"Jelajahi Nilai Tukar Seluruh Dunia dalam Satu Peta Visual Interaktif — Transparan, Komparatif, dan 100% Bebas Hambatan."**

kurs-world membedakan diri secara radikal melalui:
- **Visual Storytelling & Map-Centric Exploration**: Platform pertama di Indonesia yang menggabungkan peta choropleth dunia interaktif dengan data kurs perbankan lokal riil.
- **Komparasi Multi-Bank Terbuka**: Memberikan rekomendasi objektif *Best Buy* dan *Best Sell* tanpa afiliasi perbankan tersembunyi.
- **Konteks Indonesia (IDR-First)**: Didesain khusus dengan mata uang dasar Rupiah dan format standar baku Indonesia (`Rp 15.850,00`).
- **Zero Friction & High Performance**: Tanpa login wajib, tanpa iklan banner/pop-up, edge execution <50ms dengan Cloudflare Workers.
- **Open Data Ecosystem**: Public REST API gratis dengan Swagger UI interaktif.

---

## Key Features

1. **🗺️ Interactive World FX Choropleth Map (Flagship Hero)** — Visualisasi geografis seluruh negara dengan pewarnaan tren 24 jam vs IDR, zoom/pan halus, dan interaksi hover/klik negara.
2. **📊 Side-by-Side Bank Comparison Table** — Matriks perbandingan kurs beli/jual antar bank nasional (BI, BCA, Mandiri, BRI, BNI, CIMB Niaga) dengan indikator spread.
3. **💱 Quick Country & Multi-Source Converter** — Konversi instan dengan kalkulasi simultan hasil rupiah di berbagai bank.
4. **🔥 Global Currency Ticker & Heatmap** — Bar ticker bergerak dan heatmap pergerakan mata uang dunia.
5. **📈 Historical Trend Charts** — Grafik interaktif tren kurs 7/30/90/365 hari.
6. **🔔 Rate Alert Subsystem** — Notifikasi threshold kurs via Web Push API dan Cloudflare Email Service.
7. **🌐 100% Free Public REST API** — Endpoint developer publik (OpenAPI/Swagger) teroptimasi edge cache.
8. **🔗 Shareable Rate & Map Card** — Generator gambar snapshot kurs & peta untuk media sosial dan WhatsApp.

---

## Success Metrics (KPIs)

### Traction Metrics

| Metrik | Target Phase 1 (3 bulan) | Target Phase 2 (6 bulan) |
|---|---|---|
| **Monthly Active Users (MAU)** | 10.000 | 50.000 |
| **Daily Active Users (DAU)** | 1.000 | 6.000 |
| **Map Interaction Rate** | ≥ 65% sesi pengguna mengeklik/menjelajah peta | ≥ 75% sesi |
| **Session Duration (median)** | ≥ 90 detik | ≥ 2.5 menit |
| **Bounce Rate** | < 45% | < 35% |
| **API Registered Developers** | 50 | 250 |

### Quality & Performance Metrics

| Metrik | Target |
|---|---|
| **Page Load Time (LCP)** | < 2.0 detik (termasuk rendering peta TopoJSON) |
| **Map Render Time** | < 150ms setelah aset GeoJSON termuat |
| **Data Freshness** | Kurs diperbarui tiap 15 menit |
| **Edge Cache Response (p95)** | < 50ms |
| **Uptime SLA** | ≥ 99.5% |

---

## Timeline & Phases

### Phase 1 — MVP: Interactive Map & Multi-Bank Core (0–3 Bulan)
- Setup arsitektur backend Elysia.js pada Cloudflare Workers + D1 + KV.
- Frontend Svelte 5 (Runes) + Tailwind CSS v4 + shadcn-svelte.
- **Pengembangan Interactive World FX Choropleth Map (TopoJSON/SVG)** terintegrasi di hero section.
- Ingestion feed berkala untuk mata uang utama (USD, EUR, SGD, JPY, GBP, AUD, CNY, SAR, MYR, THB vs IDR) dari BI, BCA, Mandiri, BRI, BNI, CIMB Niaga, ECB.
- Side-by-side bank comparison matrix & quick country converter.
- Public REST API v1 (`/api/v1/rates/latest`, `/api/v1/rates/compare`, `/swagger`).

### Phase 2 — Growth, Heatmap & Alert (3–6 Bulan)
- Global Currency Heatmap Grid & Enhanced Ticker Bar.
- Rate Alert Subsystem (Web Push API & Cloudflare Email Service).
- Historical Trend Charts interaktif (30/90/365 hari).
- Shareable Rate & Map Card generator (OpenGraph / SVG untuk WhatsApp).
- Halaman dedicated per-negara & per-mata uang untuk dominasi SEO.

### Phase 3 — Ecosystem Expansion & Open Data (6–12 Bulan)
- Integrasi data seluruh mata uang dunia (>150 negara) di World FX Map via ECB/FRED/IMF.
- Progressive Web App (PWA) dengan dukungan offline caching peta.
- Embeddable Map Widget untuk portal berita, blog travel, dan media bisnis.

---

## Risks & Assumptions

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Scraping situs bank diblokir / perubahan struktur DOM | Tinggi | Tinggi | Multi-source redundancy, fallback ke Bank Indonesia & ECB API, timeout strict 5s |
| Ukuran file peta memperlambat LCP pada koneksi lambat | Sedang | Sedang | Gunakan TopoJSON terkompresi (<80KB), dynamic import, dan shimmer skeleton placeholder |
| Persepsi publik salah mengira platform adalah fintech/broker | Rendah | Sedang | Disclaimer transparan di header/footer: *"Platform Informasi Kurs Publik Murni — Bukan Layanan Finansial/Transaksi"* |
| Anomali data dari provider | Rendah | Sangat Tinggi | Filter validasi otomatis (buy <= sell, spike >50% karantina) |
