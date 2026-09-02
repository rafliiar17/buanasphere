# Business Requirements Document — kurs-world

> **Versi:** 0.2-draft  
> **Tanggal:** 2 September 2026  
> **Pemilik Dokumen:** Founder / Business Lead  
> **Status:** Siap untuk Review Bisnis & SDLC  
> **Diferensiasi Utama:** *Visual Storytelling, Interactive World FX Map & Agregasi Multi-Bank Independen*

---

## 1. Business Context & Background

### Latar Belakang

Pasar informasi kurs mata uang di Indonesia adalah pasar yang sangat besar, terfragmentasi, dan selama ini didominasi oleh antarmuka teks/tabel kaku yang membosankan. Di satu sisi, Bank Indonesia (BI) menyediakan kurs resmi acuan regulasi yang disajikan dalam bentuk tabel statis tanpa visualisasi atau konversi. Di sisi lain, raksasa global seperti Google Finance dan xe.com memiliki kekuatan SEO tinggi namun tidak memberikan visualisasi geografis interaktif maupun perbandingan kurs beli/jual riil di perbankan lokal Indonesia (BCA, Mandiri, BRI, BNI, CIMB Niaga).

Celah besar ini menciptakan peluang pasar: **Pengguna membutuhkan visual storytelling yang intuitif untuk memahami posisi Rupiah terhadap mata uang dunia, sekaligus membutuhkan data komparasi konkret untuk transaksi penukaran riil.**

kurs-world hadir sebagai platform **Peta Kurs Valuta Asing Dunia Interaktif & Agregator FX Multi-Bank**. Platform ini menyajikan:
1. **Interactive World FX Choropleth Map & Global Heatmap**: Visualisasi interaktif kekuatan valas seluruh dunia terhadap IDR dalam satu peta global.
2. **Komparasi Bank Side-by-Side**: Transparansi kurs beli, jual, dan spread antar bank nasional dengan rekomendasi *Best Buy* dan *Best Sell*.
3. **100% Free Public Good**: Zero paywall, zero registrasi wajib, dan edge performance sub-50ms berbasis ekosistem serverless Cloudflare Workers + Elysia.js + Svelte 5.

### Konteks Makro

- **Volume transaksi valas Indonesia:** Bank Indonesia mencatat volume transaksi valas spot domestik rata-rata USD 6–8 miliar per hari (Statistik Pasar Valas BI, 2025).
- **Remittance inbound:** Indonesia menerima sekitar USD 14,5 miliar remitansi per tahun (World Bank, 2025).
- **Penetrasi internet & visual content consumption:** 212 juta pengguna internet aktif (We Are Social, 2026) dengan preferensi kuat terhadap konten visual interaktif dan mobile-friendly.
- **UMKM & Komunitas Digital:** Lebih dari 15 juta UMKM dan jutaan pekerja remote/freelancer yang secara aktif memantau pergerakan valas untuk keputusan bisnis.

---

## 2. Business Objectives (SMART Format)

| # | Objective | Specific | Measurable | Achievable | Relevant | Time-bound |
|---|---|---|---|---|---|---|
| **BO-1** | **Dominasi Traffic Organik & Visual FX** | Menjadi destinasi #1 visualisasi peta kurs valas dan komparasi bank di Indonesia | Top 3 Google Search untuk target keyword kurs utama & >65% map engagement | Ya — via SEO terstruktur + UX peta choropleth interaktif | Mengurangi biaya akuisisi berbayar | Dalam 6 bulan sejak launch |
| **BO-2** | **Validasi Product-Market Fit & Viralitas** | Membuktikan daya tarik visual map & komparasi bank | 30% return user rate dalam 30 hari; 1.000 shareable map cards dibagikan | Ya — hook visual peta + Rate Alert | Membuktikan keunggulan visual dibanding tabel kompetitor | Dalam 3 bulan sejak launch |
| **BO-3** | **Ekosistem Developer & Open Data** | Menjadi data layer kurs publik pilihan developer | 200 API developer aktif terdaftar | Ya — Public REST API OpenAPI gratis dengan KV edge rate limiter | Memperluas jangkauan brand secara organik | Dalam 6 bulan sejak launch |
| **BO-4** | **Efisiensi Biaya Ekstrem ($0 Marginal Cost)** | Menjalankan seluruh platform dengan biaya serverless mendekati nol | Biaya infra Cloudflare < Rp 100.000 / bulan | Ya — Cloudflare Workers, D1, KV, dan Pages free/standard tier | Keberlanjutan jangka panjang model 100% Free | Sejak hari pertama rilis |
| **BO-5** | **Reputasi Netralitas & Otoritas Informasi** | Menjadi rujukan data independen yang objektif | Diakui dan dikutip oleh media digital / komunitas bisnis | Ya — Tanpa bias komersial/afiliasi bank | Membangun reputasi brand yang tak tergantikan | Dalam 12 bulan sejak launch |

---

## 3. Stakeholder Analysis

### Internal Stakeholders

| Stakeholder | Peran | Interest | Influence | Engagement Strategy |
|---|---|---|---|---|
| **Founder / Product Lead** | Pemilik visi produk & arah strategis | Sangat Tinggi | Sangat Tinggi | Pengambil keputusan di setiap milestone |
| **Tech Lead / Engineering** | Arsitektur edge, Elysia API, & Svelte Map | Sangat Tinggi | Tinggi | Sprint TDD, review arsitektur & benchmark |
| **UI/UX & Content Specialist** | Visual mapping, estetika choropleth, SEO | Tinggi | Sedang | Kurasi visual peta, design tokens shadcn-svelte |

### External Stakeholders

| Stakeholder | Hubungan | Interest | Concern | Pendekatan |
|---|---|---|---|---|
| **Pengguna Umum (Konsumen)** | Pengguna akhir website | Peta interaktif cepat, komparasi bank akurat | Akurasi data, zero iklan pop-up | Visual UX instan, zero-friction |
| **Developer / Startup** | Konsumen Public API | Uptime API, dokumentasi OpenAPI | Breaking changes, limitasi kuota | Swagger UI, rate limiting transparan |
| **Bank Indonesia & Bank Komersial** | Sumber data publik | Penggunaan data sesuai kepatuhan | Integritas data & atribusi | Atribusi resmi, rate limiting scraper, disclaimer tegas |
| **Regulator (OJK / BI)** | Otoritas keuangan | Kepatuhan batasan non-fintech | Menghindari aktivitas perbankan tanpa izin | Disclaimer publik: murni platform informasi |

---

## 4. Current State vs Future State

### Current State (As-Is) — Eksplorasi Konvensional yang Membosankan

```
Pengguna yang butuh informasi kurs & pergerakan valas global:

→ Buka Google Search
  Hanya dapat 1 angka statis (mid-rate grosir)
  Tidak ada gambaran visual peta dunia
  Tidak tahu bank mana yang memberikan rate terbaik

→ Buka Website Bank Indonesia
  Tabel teks statis yang kaku dan rumit
  Tidak ada alat konversi interaktif atau peta visual

→ Buka 4-5 Aplikasi Bank Berbeda (BCA, Mandiri, BRI, BNI)
  Membuang waktu 10-15 menit untuk mencatat kurs satu per satu
  Rentan salah kalkulasi spread

→ Buka xe.com / Wise
  Fokus jualan transfer uang berbayar, dipenuhi iklan
  Tidak ada integrasi data perbankan lokal Indonesia
```

### Future State (To-Be) — Visual Exploration dengan kurs-world

```
Pengguna membuka kurs-world.com:

→ HERO: INTERACTIVE WORLD FX MAP (< 2 detik)
  • Langsung melihat visual peta dunia berwarna (Heatmap 24h vs IDR)
  • Hover negara (misal Jepang/JPY) → Muncul kurs terbaik & trend harian
  • Klik negara → Peta langsung memfilter tabel komparasi bank & konverter

→ SIDE-BY-SIDE BANK COMPARISON MATRIX
  • Tabel transparan kurs Beli/Jual/Spread BCA, Mandiri, BRI, BNI, CIMB Niaga, BI
  • Otomatis tersorot [Best Buy: Rp 105,20] dan [Best Sell: Rp 106,90]

→ QUICK COUNTRY CONVERTER & CHARTS
  • Nominal dihitung simultan ke seluruh bank
  • Grafik histori tren 30/90/365 hari

→ RATE ALERT & SHAREABLE CARD
  • Pasang notifikasi push browser atau bagikan kartu peta ke WhatsApp
```

### Matriks Perubahan Nilai Bisnis

| Aspek | Status Saat Ini (As-Is) | Solusi kurs-world (To-Be) |
|---|---|---|
| **Cara Eksplorasi** | Teks pencarian & tabel angka kaku | **Peta Dunia Interaktif & Heatmap Visual (Choropleth Map)** |
| **Jumlah Touchpoint** | 3–5 situs/aplikasi berbeda | **1 Halaman Terintegrasi (Single Page Overview)** |
| **Komparasi Antar Bank** | Manual & membingungkan | **Otomatis Side-by-Side dengan Best Buy/Sell Highlight** |
| **Konteks Indonesia** | Terabaikan di platform global | **Native IDR-First dengan Format Baku Rupiah** |
| **Model Akses** | Dibatasi paywall / iklan agresif | **100% Free Public Good tanpa Iklan Invasif** |
| **Kecepatan Akses** | Lambat & penuh script pihak ketiga | **Edge Cache Sub-50ms (Cloudflare Workers + Elysia)** |

---

## 5. Market Analysis & Competitive Differentiation

### Landscape Kompetitor & Diferensiasi Strategis

| Platform | Kekuatan | Kelemahan Utama | Keunggulan Komparatif kurs-world |
|---|---|---|---|
| **Google Search / Finance** | Dominasi search traffic, instan | Hanya 1 angka kurs tengah, tidak ada peta interaktif global, tidak ada perbandingan bank lokal | **Menang di Visual Storytelling Peta Dunia & Komparasi Bank Lokal Riil** |
| **Bank Indonesia (bi.go.id)** | Sumber data resmi pemerintah | Tampilan tabel PDF/HTML statis, tidak responsif, tanpa fitur konversi atau peta | **Menang di Modern UX, Interaktivitas Peta, & Konversi Multi-Bank** |
| **xe.com** | Brand global, database mata uang luas | UI dipenuhi iklan display agresif, berfokus jualan transfer valas, tidak ada data bank Indonesia | **Menang di Clean UI (Zero Ad Noise), IDR-First, & Visual FX Heatmap** |
| **Wise (wise.com)** | UX modern, kalkulator transparan | Wajib registrasi/login, hanya menampilkan kurs platform Wise sendiri | **Menang di Zero Friction (Bebas Login) & Komparasi Agregasi Multi-Bank** |
| **Aplikasi Mobile Bank (BCA, Mandiri, dll.)** | Transaksi langsung dalam rekening nasabah | Tertutup untuk non-nasabah, hanya menampilkan kurs sendiri, tidak komparatif | **Menang di Aksesibilitas Publik & Komparasi Antar Lembaga Finansial** |

### Peta Posisi Persaingan (Competitive Matrix)

```
                    Visual / UX Tinggi
                            |
             [Wise]         |       ★ [kurs-world]
                            |   (Interactive Map + Multi-Bank)
                            |
Fokus Transaksi ------------+------------ Fokus Informasi Publik
                            |
       [Bank Apps]          |    [xe.com]     [Google Search]
                            |    [BI Website] [kursdolar.net]
                            |
                    Visual / UX Rendah
```

### Strategic Moat (Parit Pertahanan Bisnis)

1. **The Visual & Geographic Moat (Peta Dunia Interaktif)**:
   - Visualisasi spasial mata uang global memberikan *engagement hook* yang kuat. Pengguna tidak hanya mencari angka, tetapi juga menikmati pengalaman visual menjelajahi dunia melalui pergerakan kurs valas.
2. **The Virality & Shareability Hook**:
   - Peta visual dan kartu snapshot pergerakan kurs jauh lebih menarik untuk dibagikan ke media sosial (X, Instagram, LinkedIn) dan WhatsApp dibanding tangkapan layar tabel angka biasa.
3. **The Zero-Cost Serverless Advantage**:
   - Beroperasi di atas runtime Cloudflare Workers dan D1 dengan biaya marjinal mendekati nol membuat kurs-world kebal terhadap tekanan monetisasi jangka pendek. Platform dapat tetap 100% gratis selamanya tanpa perlu memasang iklan yang merusak UX.
4. **The Developer Network Effect**:
   - Public REST API yang cepat, gratis, dan terdokumentasi OpenAPI Swagger menjadi standar integrasi bagi ekosistem aplikasi di Indonesia.

---

## 6. Product Model: 100% Free & Open Public Utility

kurs-world secara tegas memposisikan diri sebagai **100% Free Public Good Data Layer**.

### Rationale:
1. **Zero Infrastructure Burden**: Arsitektur serverless edge Cloudflare mengeliminasi kebutuhan server fisik yang mahal.
2. **Maximizing Top-of-Funnel Growth**: Tanpa paywall dan tanpa registrasi wajib, konversi pengunjung menjadi pengguna setia mencapai efisiensi tertinggi.
3. **Uncompromising Neutrality**: Menolak komisi sponsor perbankan menjaga integritas rekomendasi *Best Buy* dan *Best Sell* tetap 100% objektif dan dipercaya publik.

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
| **BR-1** | Scraping situs perbankan diblokir | Sedang | Sedang | Redundansi multi-sumber; fallback otomatis ke Bank Indonesia & ECB API; request timeout 5s |
| **BR-2** | Rendering peta lambat pada perangkat low-end | Sedang | Sedang | Gunakan TopoJSON terkompresi (<80KB) dengan SVG rendering berbasis hardware acceleration di Svelte 5 |
| **BR-3** | Salah paham publik menganggap platform adalah fintech | Rendah | Rendah | Penegasan status informasi publik di header, footer, dan dokumentasi API |
| **BR-4** | Fluktuasi anomali data perbankan | Tinggi | Rendah | Sistem validasi spread logis & tabel karantina data anomali sebelum dipublikasikan |
| **BR-5** | Lonjakan request liar ke API | Rendah | Sedang | Sliding window rate limiting otomatis via Cloudflare KV |
