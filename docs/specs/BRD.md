# Business Requirements Document — kurs-world

> **Versi:** 0.3-draft  
> **Tanggal:** 2 September 2026  
> **Pemilik Dokumen:** Founder / Business Lead  
> **Status:** Siap untuk Review Bisnis & SDLC  
> **Diferensiasi Utama:** *Visual Storytelling, Interactive World FX Map, Komparasi Nilai Tukar Valas Global & Grafik Kurs ala Google Finance*

---

## 1. Business Context & Background

### Latar Belakang

Pasar informasi kurs mata uang di Indonesia dan kawasan regional adalah pasar yang sangat besar, terfragmentasi, dan selama ini didominasi oleh antarmuka teks/tabel kaku yang membosankan. Di satu sisi, Bank Indonesia (BI) menyediakan kurs acuan regulasi yang disajikan dalam bentuk tabel statis tanpa visualisasi interaktif atau konversi multi-timeframe. Di sisi lain, raksasa global seperti Google Finance dan xe.com memiliki kekuatan SEO tinggi namun dipenuhi iklan komersial atau tidak menyediakan visualisasi geografis interaktif yang terintegrasi langsung dengan konteks mata uang Rupiah (IDR).

Celah besar ini menciptakan peluang pasar: **Pengguna membutuhkan visual storytelling yang intuitif untuk memahami posisi Rupiah terhadap mata uang dunia (195+ negara), sekaligus membutuhkan grafik interaktif kelas dunia ala Google Finance untuk menganalisis tren multi-timeframe tanpa distraksi iklan.**

kurs-world hadir sebagai platform **Peta Kurs Valuta Asing Dunia Interaktif, Komparasi Nilai Tukar Valas Global & Grafik Kurs ala Google Finance**. Platform ini menyajikan:
1. **Interactive World FX Choropleth Map (195+ Negara)**: Visualisasi geografis interaktif kekuatan valas seluruh dunia terhadap IDR dalam satu kanvas peta global 100% full-width.
2. **Grafik Finansial Interaktif ala Google Finance**: Visualisasi tren waktu nyata multi-timeframe (1D, 5D, 1M, 6M, 1Y, 5Y, MAX) dengan tracking crosshair hover, dynamic delta tooltip, dan indikator gain/loss semantik.
3. **Komparasi Nilai Tukar Valas Global Murni (*Pure Currency-to-Currency*)**: Agregasi kurs pasar interbank objektif dari feed global resmi (OpenERAPI, Bank Indonesia JISDOR, ECB, FRED) tanpa distorsi komersial.
4. **100% Free Public Good**: Zero paywall, zero registrasi wajib, dan edge performance sub-50ms berbasis ekosistem serverless Cloudflare Workers + Elysia.js + Svelte 5.

### Konteks Makro

- **Volume transaksi valas Indonesia:** Bank Indonesia mencatat volume transaksi valas spot domestik rata-rata USD 6–8 miliar per hari (Statistik Pasar Valas BI, 2025).
- **Remittance inbound:** Indonesia menerima sekitar USD 14,5 miliar remitansi per tahun (World Bank, 2025).
- **Penetrasi internet & visual content consumption:** 212 juta pengguna internet aktif (We Are Social, 2026) dengan preferensi kuat terhadap konten visual interaktif, grafik responsif, dan mobile-friendly.
- **UMKM, Freelancer & Komunitas Digital:** Lebih dari 15 juta UMKM dan jutaan pekerja remote yang secara aktif memantau pergerakan valas global untuk keputusan finansial.

---

## 2. Business Objectives (SMART Format)

| # | Objective | Specific | Measurable | Achievable | Relevant | Time-bound |
|---|---|---|---|---|---|---|
| **BO-1** | **Dominasi Traffic Organik & Visual FX** | Menjadi destinasi #1 visualisasi peta kurs valas dan grafik tren interaktif di Indonesia | Top 3 Google Search untuk target keyword kurs utama & >75% map/chart engagement | Ya — via SEO terstruktur + UX peta choropleth & Google-style chart | Mengurangi biaya akuisisi berbayar | Dalam 6 bulan sejak launch |
| **BO-2** | **Validasi Product-Market Fit & Retensi** | Membuktikan daya tarik visual map & grafik interaktif | 35% return user rate dalam 30 hari; 1.500 shareable cards dibagikan | Ya — hook visual peta + chart multi-timeframe + Rate Alert | Membuktikan keunggulan visual dibanding tabel kompetitor | Dalam 3 bulan sejak launch |
| **BO-3** | **Ekosistem Developer & Open Data** | Menjadi data layer kurs publik pilihan developer | 200 API developer aktif terdaftar | Ya — Public REST API OpenAPI gratis dengan KV edge rate limiter | Memperluas jangkauan brand secara organik | Dalam 6 bulan sejak launch |
| **BO-4** | **Efisiensi Biaya Ekstrem ($0 Marginal Cost)** | Menjalankan seluruh platform dengan biaya serverless mendekati nol | Biaya infra Cloudflare < Rp 100.000 / bulan | Ya — Cloudflare Workers, D1, KV, dan Pages standard tier | Keberlanjutan jangka panjang model 100% Free | Sejak hari pertama rilis |
| **BO-5** | **Reputasi Netralitas & Otoritas Informasi** | Menjadi rujukan data independen yang objektif | Diakui dan dikutip oleh media digital / komunitas bisnis | Ya — Tanpa bias komersial / afiliasi institusi tertentu | Membangun reputasi brand yang terpercaya | Dalam 12 bulan sejak launch |

---

## 3. Stakeholder Analysis

### Internal Stakeholders

| Stakeholder | Peran | Interest | Influence | Engagement Strategy |
|---|---|---|---|---|
| **Founder / Product Lead** | Pemilik visi produk & arah strategis | Sangat Tinggi | Sangat Tinggi | Pengambil keputusan di setiap milestone |
| **Tech Lead / Engineering** | Arsitektur edge, Elysia API, & Svelte 5 Charts | Sangat Tinggi | Tinggi | Sprint TDD, review arsitektur & benchmark |
| **UI/UX & Content Specialist** | Visual mapping, estetika choropleth, design tokens | Tinggi | Sedang | Kurasi visual peta, chart UX ala Google Finance |

### External Stakeholders

| Stakeholder | Hubungan | Interest | Concern | Pendekatan |
|---|---|---|---|---|
| **Pengguna Umum (Konsumen)** | Pengguna akhir website | Peta interaktif cepat, grafik tren jelas | Akurasi data, zero iklan pop-up | Visual UX instan, zero-friction |
| **Developer / Startup** | Konsumen Public API | Uptime API, dokumentasi OpenAPI | Breaking changes, limitasi kuota | Scalar / Swagger UI, rate limiting transparan |
| **Penyedia Data Publik** | Sumber data publik resmi | Penggunaan data sesuai kepatuhan | Integritas data & atribusi | Atribusi resmi, rate limiting fetcher, disclaimer tegas |
| **Regulator (OJK / BI)** | Otoritas keuangan | Kepatuhan batasan non-fintech | Menghindari aktivitas perbankan tanpa izin | Disclaimer publik: murni platform informasi |

---

## 4. Current State vs Future State

### Current State (As-Is) — Eksplorasi Konvensional yang Membosankan

```
Pengguna yang butuh informasi kurs & pergerakan valas global:

→ Buka Google Search
  Hanya dapat 1 angka statis
  Tidak ada gambaran visual peta dunia
  Grafik default sering terpotong atau tertutup widget sponsor

→ Buka Website Bank Indonesia / Portal Berita
  Tabel teks statis yang kaku dan rumit
  Tidak ada alat konversi interaktif atau peta visual spasial

→ Buka xe.com / Wise
  Fokus jualan transfer uang berbayar, dipenuhi iklan display
  Tidak ada visualisasi peta geografis menyeluruh
```

### Future State (To-Be) — Visual Exploration dengan kurs-world

```
Pengguna membuka kurs-world:

→ HERO: FULL-WIDTH INTERACTIVE WORLD FX MAP (< 2 detik)
  • Langsung melihat visual peta dunia 195+ negara berwarna (Heatmap 24h vs IDR)
  • Hover negara (misal Jepang/JPY) → Muncul kurs pasar & tren harian
  • Klik negara → Membuka on-demand modal inspector dengan quick 2-way converter

→ GOOGLE FINANCE-STYLE INTERACTIVE TREND CHARTS
  • Multi-timeframe: 1D, 5D, 1M, 6M, 1Y, 5Y, MAX
  • Crosshair hover tracker interaktif & dynamic tooltip selisih harga (Rp & %)
  • Garis referensi harga pembukaan periode (baseline) & warna semantik Hijau/Merah

→ PURE GLOBAL CURRENCY COMPARISON MATRIX & CONVERTER
  • Matriks perbandingan nilai tukar valas global murni (USD, EUR, GBP, JPY, dll.)
  • Konverter kilat dua arah dengan preset nominal instan

→ RATE ALERT & SHAREABLE CARD
  • Pasang notifikasi push browser / email gratis
  • Bagikan kartu snapshot visual ke media sosial / WhatsApp
```

### Matriks Perubahan Nilai Bisnis

| Aspek | Status Saat Ini (As-Is) | Solusi kurs-world (To-Be) |
|---|---|---|
| **Cara Eksplorasi** | Teks pencarian & tabel angka kaku | **Peta Dunia Interaktif 195+ Negara & Heatmap Visual** |
| **Analisis Tren** | Grafik statis atau terlalu rumit | **Grafik Interaktif ala Google Finance (1D–MAX + Crosshair)** |
| **Jumlah Touchpoint** | 3–5 situs/aplikasi berbeda | **1 Halaman Terintegrasi (Single Page Overview)** |
| **Komparasi Valas** | Terfragmentasi dan bias komersial | **Murni Komparasi Nilai Tukar Valas Global (Pure Currency-to-Currency)** |
| **Konteks Indonesia** | Terabaikan di platform global | **Native IDR-First dengan Format Baku Rupiah** |
| **Model Akses** | Dibatasi paywall / iklan agresif | **100% Free Public Good tanpa Iklan Invasif** |
| **Kecepatan Akses** | Lambat & penuh script pelacak pihak ketiga | **Edge Cache Sub-50ms (Cloudflare Workers + Elysia)** |

---

## 5. Market Analysis & Competitive Differentiation

### Landscape Kompetitor & Diferensiasi Strategis

| Platform | Kekuatan | Kelemahan Utama | Keunggulan Komparatif kurs-world |
|---|---|---|---|
| **Google Finance** | Dominasi search traffic, chart interaktif | Tidak ada peta visual geografis 195+ negara, tidak fokus pada konteks Rupiah Indonesia | **Menang di Visual Storytelling Peta Dunia & Spesialisasi IDR-First** |
| **Bank Indonesia (bi.go.id)** | Sumber data resmi pemerintah | Tampilan tabel PDF/HTML statis, tidak responsif, tanpa fitur konversi atau peta | **Menang di Modern UX, Interaktivitas Peta, & Grafik Multi-Timeframe** |
| **xe.com** | Brand global, database mata uang luas | UI dipenuhi iklan display agresif, berfokus jualan transfer valas | **Menang di Clean UI (Zero Ad Noise), IDR-First, & Peta Imersif** |
| **Wise (wise.com)** | UX modern, kalkulator transparan | Wajib registrasi/login, hanya menampilkan kurs platform sendiri | **Menang di Zero Friction (Bebas Login) & Eksplorasi Geografis Terbuka** |

### Peta Posisi Persaingan (Competitive Matrix)

```
                    Visual / UX Tinggi
                             |
              [Wise]         |       ★ [kurs-world]
                             |   (Interactive Map + Google-Style Charts)
                             |
Fokus Transaksi ------------+------------ Fokus Informasi Publik
                             |
        [Trading Apps]       |    [xe.com]     [Google Finance]
                             |    [BI Website] [kursdolar.net]
                             |
                    Visual / UX Rendah
```

### Strategic Moat (Parit Pertahanan Bisnis)

1. **The Visual & Geographic Moat (Peta Dunia Interaktif 195+ Negara)**:
   - Visualisasi spasial mata uang global memberikan *engagement hook* yang kuat. Pengguna tidak hanya mencari angka, tetapi juga menikmati pengalaman visual menjelajahi dunia melalui pergerakan kurs valas.
2. **The World-Class Financial Chart UX**:
   - Grafik interaktif responsif ala Google Finance dengan crosshair hover dan kalkulasi delta periode real-time memberikan kepuasan analisis yang tinggi bagi pengguna.
3. **The Zero-Cost Serverless Advantage**:
   - Beroperasi di atas runtime Cloudflare Workers dan D1 dengan biaya marjinal mendekati nol membuat kurs-world kebal terhadap tekanan monetisasi jangka pendek. Platform dapat tetap 100% gratis selamanya tanpa perlu memasang iklan yang merusak UX.
4. **The Developer Network Effect**:
   - Public REST API yang cepat, gratis, dan terdokumentasi OpenAPI / Scalar menjadi standar integrasi bagi ekosistem aplikasi di Indonesia dan internasional.

---

## 6. Product Model: 100% Free & Open Public Utility

kurs-world secara tegas memposisikan diri sebagai **100% Free Public Good Data Layer**.

### Rationale:
1. **Zero Infrastructure Burden**: Arsitektur serverless edge Cloudflare mengeliminasi kebutuhan server fisik yang mahal.
2. **Maximizing Top-of-Funnel Growth**: Tanpa paywall dan tanpa registrasi wajib, konversi pengunjung menjadi pengguna setia mencapai efisiensi tertinggi.
3. **Uncompromising Neutrality**: Menolak komisi komersial menjaga integritas data tetap 100% objektif dan dipercaya publik.

---

## 7. Regulatory & Compliance Considerations

### 7.1 Kepatuhan Status Non-Fintech (Media Informasi Publik)
- **Bukan Penyelenggara Jasa Pembayaran (PJP) & Bukan Pedagang Valas (PBFX)**: Platform murni mengagregasi data publik dan tidak memproses dana pengguna.
- **Kewajiban Penafian (Disclaimer) Hukum**: Menampilkan penafian tegas di antarmuka web dan API:
  > *"Data nilai tukar yang disajikan di kurs-world bersumber dari data publik untuk tujuan informasi dan referensi umum. Data ini bukan penawaran mengikat atau nasihat finansial. kurs-world tidak memfasilitasi transaksi valas."*

### 7.2 Kepatuhan Privasi Data (UU PDP No. 27/2022)
- Zero data tracking untuk penggunaan publik tanpa login.
- Izin eksplisit (*opt-in consent*) untuk fitur Rate Alert push/email dengan mekanisme *one-click unsubscribe*.

---

## 8. Business Risks & Mitigation

| # | Risiko Bisnis | Dampak | Probabilitas | Rencana Mitigasi |
|---|---|---|---|---|
| **BR-1** | Gangguan koneksi API pihak ketiga | Sedang | Rendah | Redundansi multi-sumber (OpenERAPI, BI JISDOR, ECB, FRED); Cloudflare KV caching 15m; request timeout 5s |
| **BR-2** | Rendering peta lambat pada perangkat low-end | Sedang | Sedang | Optimasi WebGL/SVG choropleth, dynamic import modul Plotly, shimmer skeleton placeholder |
| **BR-3** | Salah paham publik menganggap platform adalah fintech | Rendah | Rendah | Penegasan status informasi publik di header, footer, dan dokumentasi API |
| **BR-4** | Fluktuasi anomali data pasar | Tinggi | Rendah | Sistem validasi spread logis & tabel karantina data anomali sebelum dipublikasikan |
| **BR-5** | Lonjakan request liar ke API | Rendah | Sedang | Sliding window rate limiting otomatis via Cloudflare KV |
