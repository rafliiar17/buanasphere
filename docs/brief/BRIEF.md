# Project Brief — kurs-world

> **Versi:** 0.3-draft  
> **Tanggal:** 2 September 2026  
> **Status:** Siap untuk Review Teknis & SDLC  
> **UVP Utama:** *Peta Kurs Valuta Asing Dunia Interaktif, Komparasi Nilai Tukar Valas Global & Grafik Kurs ala Google Finance*

---

## Executive Summary

**kurs-world** adalah platform **Peta Kurs Valuta Asing Dunia Interaktif & Agregator FX Global** berbasis web yang memungkinkan siapa pun—tanpa perlu akun, tanpa paywall, dan tanpa keahlian finansial rumit—untuk menjelajahi nilai tukar 195+ negara di dunia dalam satu peta visual global interaktif (*Interactive World FX Choropleth Map*), membandingkan nilai tukar valas global (*Pure Currency-to-Currency Comparison*), menganalisis tren pergerakan dengan grafik interaktif ala Google Finance (1D, 5D, 1M, 6M, 1Y, 5Y, MAX), dan melakukan konversi multi-mata uang secara instan.

Tidak seperti kompetitor global (xe.com, Wise) yang berfokus pada transaksi transfer uang dan dipenuhi iklan invasif, kurs-world mengusung pendekatan **Visual Storytelling & Geographic FX Exploration**:
1. **Eksplorasi Peta Dunia 195+ Negara**: Visualisasi interaktif kekuatan mata uang global terhadap Rupiah (IDR) dan mata uang utama dunia melalui choropleth map 100% full-width dinamis serta ticker penggerak pasar harian (*Global Movers*).
2. **Grafik Finansial Interaktif ala Google Finance**: Visualisasi tren waktu nyata multi-timeframe (1D, 5D, 1M, 6M, 1Y, 5Y, MAX) dengan tracking crosshair hover, dynamic delta tooltip, dan level baseline open.
3. **Komparasi Nilai Tukar Valas Global Murni (*Pure Currency-to-Currency*)**: Agregasi kurs pasar interbank objektif dari feed global resmi (OpenERAPI, Bank Indonesia JISDOR, European Central Bank/ECB, FRED) tanpa bias markup perbankan ritel.
4. **Aksesibilitas Ekstrem**: 100% Free, zero-login untuk fitur utama, dan latensi sub-50ms di seluruh dunia berkat arsitektur serverless edge (**Elysia.js on Cloudflare Workers** + **Svelte 5**).

Produk ini dibangun dengan filosofi **"Informasi Dulu, Transaksi Belakangan"** — menyajikan data jujur, objektif, dan transparan bagi masyarakat Indonesia dan pengguna global.

---

## Problem Statement

### Konteks & Data

Lebih dari **270 juta penduduk Indonesia** dan komunitas global berinteraksi dengan valuta asing—mulai dari importir/eksportir UMKM, freelancer digital yang menerima pembayaran valas (USD/EUR/SGD), mahasiswa luar negeri, pekerja migran, investor, hingga wisatawan. Namun, cara masyarakat mengakses informasi kurs saat ini mengalami masalah fundamental:

- **Ketiadaan Visualisasi Geografis & Makro**: Tidak ada platform yang menyajikan peta visual interaktif untuk memahami peta kekuatan mata uang dunia terhadap Rupiah secara spasial dan intuitif. Pengguna disodori deretan tabel angka yang membosankan dan membingungkan.
- **Ketiadaan Grafik Tren yang Bersih & Cepat**: Platform konvensional menyajikan grafik statis atau grafik trading yang terlalu rumit (*over-engineered* dengan puluhan indikator teknikal) dan lambat dimuat di perangkat seluler. Pengguna membutuhkan grafik tren yang ringkas, interaktif, dan mudah dibaca layaknya antarmuka Google Finance.
- **Asimetri & Bias Informasi**: Berbagai platform menjejalkan penawaran transfer uang atau produk pinjaman berbayar, mengaburkan informasi kurs tengah pasar yang sebenarnya.
- **Kompetitor Global Tidak Berorientasi IDR**: xe.com dan Wise berfokus pada pasar barat, transfer remitansi berbayar, dan tidak memprioritaskan format angka baku Rupiah Indonesia.

Akibatnya, pengguna mengalami **information overload** namun tetap kekurangan konteks praktis: *"Bagaimana tren nilai tukar mata uang ini dalam 1 bulan hingga 5 tahun terakhir, dan bagaimana perbandingannya dengan mata uang negara lain secara global?"*

### Pain Points Utama

| Pain Point | Dampak |
|---|---|
| **Tidak ada visualisasi peta kurs global** | Sulit memahami pergerakan valas global vs IDR secara holistik |
| **Grafik tren lambat dan membingungkan** | Pengguna kesulitan melihat histori pergerakan multi-timeframe yang jelas |
| **Ketiadaan perbandingan valas global murni** | Informasi terdistorsi oleh markup komersial pihak ketiga |
| **Konversi manual memakan waktu** | Kesalahan kalkulasi anggaran perjalanan/pembayaran internasional |
| **Tampilan data kaku dan penuh noise/iklan** | Pengalaman pengguna lambat dan melelahkan (*high friction*) |

---

## Solution Overview

kurs-world menghadirkan solusi terintegrasi:

1. **🗺️ Interactive World FX Choropleth Map (Flagship Hero Feature)**:
   - Peta dunia interaktif 100% full-width (Plotly/SVG) yang mewarnai 195+ negara berdasarkan pergerakan nilai tukar 24 jam terhadap IDR atau skala kurs relatif.
   - Hover interaktif menampilkan tooltip cepat: Nama negara, kode mata uang, bendera, kurs tengah terkini, dan pergerakan harian.
   - Klik negara membuka *On-Demand Country Inspector Modal/Drawer* dengan ringkasan valas, kalkulator konversi kilat dua arah, dan deep-link.
2. **📈 Google Finance-Style Interactive Trend Charts**:
   - Grafik garis dan area interaktif dengan multi-timeframe granular (**1D, 5D, 1M, 6M, 1Y, 5Y, MAX**).
   - Dilengkapi crosshair hover tracking, dynamic delta tooltip (`+Rp 120,00 (+0.74%)`), garis referensi *Period Open Baseline*, dan pewarnaan semantik otomatis (Hijau Gain vs Merah Loss).
3. **📊 Pure Currency-to-Currency Global Comparison Matrix**:
   - Matriks perbandingan kurs pasar interbank antar valuta asing dunia (USD, EUR, SGD, JPY, GBP, AUD, CNY, SAR, MYR, THB) dengan indikator spread pasar, persentase perubahan 24 jam, dan rentang high/low.
4. **💱 Quick Universal Currency Converter**:
   - Kalkulator konversi cerdas dua arah valas dunia dengan auto-formatting Rupiah (`Rp`), preset nominal cepat (`1`, `10`, `50`, `100`, `1.000`), dan kalkulasi spread pasar transparan.
5. **🔥 Global Movers Ticker Ribbon**:
   - Running ticker pita atas yang menampilkan tren Top Gainers dan Top Losers mata uang dunia terhadap IDR secara real-time.
6. **🔔 Rate Alert & Public REST API**:
   - Notifikasi threshold via Web Push API browser serta Cloudflare Email, dipadukan dengan Public REST API OpenAPI (`/api/v1/docs`) dengan edge caching sub-50ms.

---

## Target Users & Personas

### Persona 1 — Raka, Freelancer Digital (28 tahun, Jakarta)
- **Latar belakang**: Bekerja remote untuk klien AS & Eropa, menerima pembayaran USD/EUR bulanan.
- **Goals**: Memantau kapan kurs USD/IDR menguat melalui grafik tren ala Google Finance (1M & 6M) dan menyetel alert kurs target.
- **Cara ia menggunakan kurs-world**: Membuka dashboard pagi hari, melihat running ticker dan grafik tren USD/IDR, menyetel Rate Alert saat USD menyentuh target, dan melakukan kalkulasi via konverter universal.

### Persona 2 — Ibu Sari, Pemilik Toko Online & Importir (42 tahun, Surabaya)
- **Latar belakang**: Mengimpor bahan baku dari China (CNY) dan Jepang (JPY).
- **Goals**: Menganalisis tren semesteran (6M/1Y) nilai tukar JPY/CNY terhadap IDR untuk merencanakan waktu pembelian valas dalam jumlah besar.
- **Cara ia menggunakan kurs-world**: Mengeklik negara China/Jepang langsung di Peta Dunia, melihat grafik historis Google Finance style, menghitung total belanja via konverter, dan membagikan Shareable Rate Card ke tim keuangan via WhatsApp.

### Persona 3 — Dimas, Software Engineer & Startup Integrator (30 tahun, Bandung)
- **Latar belakang**: Mengembangkan platform e-commerce / SaaS multi-currency yang butuh data kurs harian dan time-series.
- **Goals**: Integrasi API kurs terpercaya dengan response time sub-50ms dan dokumentasi type-safe.
- **Cara ia menggunakan kurs-world**: Memanfaatkan Public REST API Elysia.js via Eden Treaty tanpa biaya langganan.

---

## Unique Value Proposition (UVP)

> **"Jelajahi Nilai Tukar Seluruh Dunia dalam Satu Peta Visual Interaktif & Grafik Kurs ala Google Finance — Transparan, Murni, dan 100% Bebas Hambatan."**

kurs-world membedakan diri secara radikal melalui:
- **Visual Storytelling & Map-Centric Exploration**: Platform pertama di Indonesia yang menggabungkan peta choropleth 195+ negara dunia interaktif dengan visualisasi geografis menyeluruh.
- **Grafik Finansial Kelas Dunia (Google Finance Style)**: Grafik multi-timeframe interaktif dengan crosshair scrubber dan dynamic delta yang bersih tanpa distorsi iklan.
- **Komparasi Valas Global Murni (*Pure Currency-to-Currency*)**: Memberikan nilai tukar pasar interbank objektif tanpa bias komersial institusi ritel.
- **Konteks Indonesia (IDR-First)**: Didesain khusus dengan mata uang dasar Rupiah dan format standar baku Indonesia (`Rp 15.850,00`).
- **Zero Friction & High Performance**: Tanpa login wajib, tanpa iklan banner/pop-up, edge execution <50ms dengan Cloudflare Workers.
- **Open Data Ecosystem**: Public REST API gratis dengan Swagger/Scalar UI interaktif.

---

## Key Features

1. **🗺️ Interactive World FX Choropleth Map (Flagship Hero)** — Visualisasi geografis 195+ negara dengan pewarnaan tren 24 jam vs IDR, zoom/pan halus, dan on-demand modal inspector.
2. **📈 Google Finance-Style Interactive Charts** — Grafik tren nilai tukar multi-timeframe (1D, 5D, 1M, 6M, 1Y, 5Y, MAX) dengan tracking crosshair hover dan indikator gain/loss.
3. **📊 Pure Currency-to-Currency Global Comparison Matrix** — Matriks perbandingan nilai tukar valuta asing global murni terhadap IDR dengan spread pasar dan fluktuasi harian.
4. **💱 Quick Universal Currency Converter** — Konversi instan dua arah valas dunia dengan auto-formatting Rupiah.
5. **🔥 Global Movers Ticker Ribbon** — Bar ticker bergerak yang menampilkan Top Gainers & Top Losers valuta asing dunia.
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
| **Map & Chart Interaction Rate** | ≥ 70% sesi pengguna berinteraksi dengan peta / grafik | ≥ 80% sesi |
| **Session Duration (median)** | ≥ 90 detik | ≥ 2.5 menit |
| **Bounce Rate** | < 45% | < 35% |
| **API Registered Developers** | 50 | 250 |

### Quality & Performance Metrics

| Metrik | Target |
|---|---|
| **Page Load Time (LCP)** | < 2.0 detik (termasuk rendering peta & chart) |
| **Map & Chart Render Time** | < 150ms setelah data termuat |
| **Data Freshness** | Kurs diperbarui tiap 15 menit via edge cron |
| **Edge Cache Response (p95)** | < 50ms |
| **Uptime SLA** | ≥ 99.9% |

---

## Timeline & Phases

### Phase 1 — MVP: Interactive Map, Google-Style Charts & Global Valas Core (0–3 Bulan)
- Setup arsitektur backend Elysia.js pada Cloudflare Workers + D1 + KV.
- Frontend Svelte 5 (Runes) + Tailwind CSS v4 + shadcn-svelte.
- **Pengembangan Interactive World FX Choropleth Map (195+ Negara)** terintegrasi di hero section.
- **Pengembangan Grafik Interaktif Tren Valas ala Google Finance (1D, 5D, 1M, 6M, 1Y, 5Y, MAX)** dengan crosshair hover.
- Ingestion feed berkala untuk mata uang dunia dari OpenERAPI, Bank Indonesia JISDOR, ECB, FRED.
- Pure currency-to-currency comparison matrix & quick universal converter.
- Public REST API v1 (`/api/v1/rates/latest`, `/api/v1/rates/history`, `/api/v1/docs`).

### Phase 2 — Growth, Heatmap & Alert (3–6 Bulan)
- Global Currency Heatmap Grid & Enhanced Ticker Bar.
- Rate Alert Subsystem (Web Push API & Cloudflare Email Service).
- Shareable Rate & Map Card generator (OpenGraph / SVG untuk WhatsApp).
- Halaman dedicated per-negara & per-pasangan valas untuk dominasi SEO.

### Phase 3 — Ecosystem Expansion & Open Data (6–12 Bulan)
- Progressive Web App (PWA) dengan dukungan offline caching peta & chart.
- Embeddable Map & Chart Widget untuk portal berita, blog travel, dan media bisnis.

---

## Risks & Assumptions

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Gangguan koneksi API eksternal | Rendah | Tinggi | Multi-source fallback (OpenERAPI, BI JISDOR, ECB), Cloudflare KV edge caching 15m |
| Ukuran file aset visual memperlambat LCP | Sedang | Sedang | Dynamic import modul Plotly, optimasi bundle, dan shimmer skeleton placeholder |
| Persepsi publik salah mengira platform adalah fintech/broker | Rendah | Sedang | Disclaimer transparan di header/footer: *"Platform Informasi Kurs Publik Murni — Bukan Layanan Finansial/Transaksi"* |
| Anomali data dari feed eksternal | Rendah | Sangat Tinggi | Filter validasi otomatis (non-zero, spike >50% karantina) |
