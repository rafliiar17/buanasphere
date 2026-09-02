# Business Requirements Document — kurs-world

> **Versi:** 0.1-draft  
> **Tanggal:** 2 September 2026  
> **Pemilik Dokumen:** Founder / Business Lead  
> **Status:** Draft untuk review

---

## 1. Business Context & Background

### Latar Belakang

Pasar informasi kurs mata uang di Indonesia adalah pasar yang besar, terfragmentasi, dan belum dilayani dengan baik oleh produk digital yang benar-benar berpusat pada pengguna. Di satu sisi, Bank Indonesia (BI) menyediakan kurs resmi yang menjadi acuan regulasi — namun tampilan dan aksesibilitasnya masih jauh dari user-friendly. Di sisi lain, raksasa global seperti Google dan xe.com hadir dengan kekuatan brand dan SEO yang sangat kuat, namun tidak memberikan konteks lokal yang relevan untuk pengguna Indonesia: tidak ada perbandingan antar bank lokal, tidak ada nuansa kurs beli/jual yang benar-benar berlaku di lapangan.

Celah ini menghasilkan situasi di mana **jutaan orang Indonesia setiap hari membuat keputusan finansial berdasarkan informasi yang tidak lengkap** — karena mendapatkan informasi yang lengkap terlalu mahal dalam hal waktu dan usaha.

kurs-world didirikan dengan premis sederhana: informasi kurs yang akurat, komparatif, dan mudah diakses seharusnya gratis dan tersedia untuk semua orang. Dari premis ini lahir platform yang mengagregasi, memformat, dan menyajikan data kurs dari berbagai sumber resmi dan semi-resmi dalam satu antarmuka yang bersih.

### Konteks Makro

- **Volume transaksi valas Indonesia:** Bank Indonesia mencatat volume transaksi valuta asing di pasar spot domestik rata-rata USD 6–8 miliar per hari (sumber: Statistik Pasar Valas BI, 2025).
- **Remittance inbound:** Indonesia menerima sekitar USD 14,5 miliar remitansi per tahun — salah satu yang terbesar di Asia Tenggara (World Bank, 2025).
- **Penetrasi internet:** 212 juta pengguna internet aktif (We Are Social, 2026) dengan mayoritas mengakses via mobile.
- **UMKM importir/eksportir:** Lebih dari 15 juta UMKM, di mana sebagian bersentuhan langsung dengan transaksi valas meski dalam skala kecil.

---

## 2. Business Objectives (SMART Format)

| # | Objective | Specific | Measurable | Achievable | Relevant | Time-bound |
|---|---|---|---|---|---|---|
| BO-1 | Membangun aset traffic organik yang sustainable | Mendominasi keyword informasional seputar kurs IDR di Google Indonesia | Top 3 untuk 10 target keyword utama (e.g., "kurs dollar hari ini") | Ya — melalui SEO teknis + content strategy | Mengurangi ketergantungan pada paid acquisition | Dalam 6 bulan sejak launch |
| BO-2 | Memvalidasi product-market fit | Mencapai pengguna aktif yang berulang datang tanpa diajak | 30% dari pengguna bulan pertama kembali dalam 30 hari | Ya — dengan fitur Rate Alert sebagai hook | Membuktikan nilai produk sebelum investasi lebih besar | Dalam 3 bulan sejak launch |
| BO-3 | Membangun ekosistem developer | Menjadi data layer pilihan untuk aplikasi kurs di Indonesia | 200 API developer aktif | Ya — lewat API self-service + free tier yang generous | Developer ecosystem memperluas jangkauan tanpa biaya akuisisi | Dalam 6 bulan sejak launch |
| BO-4 | Mencapai unit economics positif | Menghasilkan pendapatan yang menutup biaya operasional | Break-even pada biaya infrastruktur + 1 orang (sekitar Rp 15 juta/bulan) | Ya — dengan opsi monetisasi yang sudah diidentifikasi | Fondasi untuk pertumbuhan yang berkelanjutan | Dalam 12 bulan sejak launch |
| BO-5 | Memposisikan diri untuk partnership strategis | Menjadi mitra data terpercaya bagi bank atau fintech | Minimal 1 LOI (Letter of Intent) dari partner potensial | Ya — traffic dan API ecosystem menjadi leverage | Revenue diversification dan credibility | Dalam 12 bulan sejak launch |

---

## 3. Stakeholder Analysis

### Internal Stakeholders

| Stakeholder | Peran | Interest | Influence | Engagement Strategy |
|---|---|---|---|---|
| Founder/CEO | Pemilik visi, pengambil keputusan final | Tinggi | Sangat Tinggi | Decision maker di semua milestone |
| Tech Lead/Engineering | Membangun dan memelihara platform | Tinggi | Tinggi | Review requirement teknis, sprint planning |
| Content/SEO | Mendorong traffic organik | Sedang | Sedang | Align pada keyword strategy dan content calendar |

### External Stakeholders

| Stakeholder | Hubungan | Interest | Concern | Pendekatan |
|---|---|---|---|---|
| **Pengguna akhir (konsumen)** | Pengguna langsung produk | Informasi kurs cepat dan akurat | Akurasi data, privacy | User research, feedback loop reguler |
| **Developer / API Users** | Pengguna API | Data yang handal dan murah | Uptime, breaking changes | Versioning API, changelog, community forum |
| **Bank Indonesia (BI)** | Sumber data regulasi | Platform menggunakan data mereka dengan benar | Misrepresentasi data BI | Tampilkan logo, link sumber, disclaimer BI |
| **Bank Komersial (BCA, dll.)** | Sumber data scraping | Tidak relevan saat ini | Scraping melanggar ToS | Inisiasi data partnership formal di Phase 2 |
| **OJK (Otoritas Jasa Keuangan)** | Regulator potensial | Platform beroperasi sesuai regulasi | Layanan keuangan tanpa izin | Konsultasi legal; pastikan posisi sebagai "platform informasi" |
| **Partner Iklan/Affiliate** | Monetisasi potensial | Akses ke audience yang relevan | Brand safety | Kurasi ketat partner di Phase 3 |

---

## 4. Current State vs Future State

### Current State (As-Is)

```
Pengguna yang butuh kurs IDR hari ini:

→ Buka Google
  Dapat 1 kurs (mid rate, sumber tidak jelas)
  Tidak bisa bandingkan dengan bank lokal

→ Buka website BI
  Kurs tengah official
  Tabel statis, tidak ada konversi, tidak ada visualisasi

→ Buka aplikasi bank masing-masing
  Kurs bank itu saja
  Tidak bisa bandingkan antar bank tanpa buka 4 app berbeda

→ Hubungi money changer
  Kurs aktual
  Time-consuming, tidak scalable
```

**Pain di current state:**
- Rata-rata 3–5 touchpoint untuk mendapat informasi yang cukup
- Tidak ada tool komparasi antar sumber
- Informasi kurs di luar jam kerja tidak diperbarui
- Developer tidak punya akses API kurs lokal yang mudah dan gratis

### Future State (To-Be) dengan kurs-world

```
Pengguna yang butuh kurs IDR hari ini:

→ Buka kurs-world.com (atau hasil Google yang mengarah ke sana)
  Dashboard: Kurs semua mata uang utama + sumber (< 3 detik)
  Konverter: Input → Hasil dari 3+ sumber simultan
  Komparasi: Tabel bank-by-bank untuk pasangan tertentu
  Alert: Set threshold → Dapat notifikasi otomatis
  API: Developer akses data yang sama secara programatik
```

**Perubahan kunci:**

| Aspek | Before | After |
|---|---|---|
| Jumlah touchpoint | 3–5 | 1 |
| Komparasi antar bank | Tidak ada | Side-by-side tabel |
| Histori kurs | Tersebar, tidak mudah | Grafik interaktif |
| Akses API kurs lokal | Tidak ada yang free dan reliable | Self-service, free tier |
| Konteks Indonesia | Minimal | Native: IDR-first, bank lokal |

---

## 5. Business Requirements

### BR Fungsional

| ID | Business Requirement | Rationale |
|---|---|---|
| BR-F1 | Platform harus menampilkan kurs dari minimal 3 sumber berbeda secara bersamaan | Nilai utama produk adalah komparasi; satu sumber tidak berbeda dari Google |
| BR-F2 | Tidak ada fitur utama yang mensyaratkan registrasi di v1 | Friction registrasi akan membunuh konversi pengguna baru; trust harus dibangun dulu |
| BR-F3 | Platform harus memiliki public API dengan self-service key | Developer ecosystem adalah asset strategis jangka panjang |
| BR-F4 | Semua sumber data harus dilabeli dengan jelas | Transparansi adalah differentiator utama vs. Google |
| BR-F5 | Platform harus menyediakan disclaimer yang jelas bahwa kurs bersifat informatif | Mitigasi risiko hukum dan perlindungan pengguna |

### BR Non-Fungsional

| ID | Business Requirement | Rationale |
|---|---|---|
| BR-NF1 | Platform harus bisa di-serve tanpa biaya infrastruktur > Rp 3 juta/bulan di Phase 1 | Bootstrapped; cashflow harus dijaga |
| BR-NF2 | Seluruh data yang dikumpulkan dari pengguna harus mematuhi UU PDP No. 27 Tahun 2022 | Kepatuhan hukum non-negotiable |
| BR-NF3 | Platform harus mudah ditemukan via pencarian organik tanpa biaya iklan | CAC harus mendekati nol di awal |
| BR-NF4 | Platform harus dapat dikembangkan oleh tim kecil (2–3 orang) | Keterbatasan sumber daya awal |

---

---

## 6. Product Model: 100% Free & Open Public Utility

kurs-world secara definitif mengadopsi model **100% FREE (Gratis & Terbuka)** sebagai layanan utilitas informasi publik (*Public Good Data Layer*). 

### 6.1 Mengapa Model 100% Free?

1. **Zero Marginal Serverless Cost (Cloudflare Ecosystem)**:
   - Arsitektur berbasis **Cloudflare Workers**, **Cloudflare D1**, **Cloudflare KV**, dan **Cloudflare Pages** memungkinkan platform melayani hingga jutaan request bulanan dengan biaya infrastruktur hampir Rp 0 (masuk dalam free/standard tier Cloudflare Workers < $5/bulan).
2. **Eliminasi Friction Pengguna & Pertumbuhan Organik Maksimal**:
   - Tidak ada paywall, tidak ada pop-up iklan invasif, dan tidak ada registrasi wajib untuk fitur esensial. Pengguna mendapatkan informasi seketika dalam <2 detik.
3. **Pemberdayaan Ekosistem Developer**:
   - Public REST API disediakan secara gratis dengan rate limiting berbasis edge KV, menciptakan adopsi masif di kalangan developer dan komunitas open-source.
4. **Netralitas & Integritas Data**:
   - Tanpa ketergantungan pada komisi affiliate fintech atau iklan perbankan, kurs-world mempertahankan posisi independen dan objektif dalam menampilkan perbandingan kurs antar bank.

---

---

## 7. Market Analysis

### Landscape Kompetitor

| Produk | Kekuatan | Kelemahan | Posisi terhadap kurs-world |
|---|---|---|---|
| **Google Finance / Google Search** | Omnipresent, UX familiar, SEO dominant | Satu sumber, tidak ada konteks lokal, tidak ada komparasi bank | Kompetitor SEO utama; kurs-world harus menang di intent yang lebih spesifik |
| **xe.com** | Brand global kuat, histori panjang, banyak mata uang | UX tidak dioptimasi untuk IDR, fokus pada transfer bukan informasi, iklan agresif | Kompetitor informasi global; kurs-world lebih lokal dan bersih |
| **Wise (wise.com)** | Kurs yang kompetitif, UX premium, trust tinggi | Fokus pada layanan transfer (butuh akun), bukan informasi kurs | Kompetitor tidak langsung; bisa jadi affiliate partner |
| **Bank Indonesia (bi.go.id)** | Sumber resmi/regulasi, gratis | UX sangat kaku, hanya kurs tengah, tidak ada konversi atau grafik | Bukan kompetitor — sumber data; kurs-world "memformat ulang" data BI |
| **Aplikasi bank (BCA, Mandiri, dll.)** | Data real dari bank tersebut, terintegrasi dengan akun | Hanya kurs bank sendiri, butuh nasabah, tidak komparatif | Bukan kompetitor langsung; sumber data potensial |
| **JISDOR (Reuters)** | Data forex profesional Indonesia | Untuk profesional pasar, bukan konsumen umum | Tidak kompetitif di segmen yang sama |
| **Kurs.io, kursdolar.co.id** | Pemain lokal, SEO sudah ada | UX outdated, tidak dikelola aktif, data terbatas | Kompetitor lokal yang bisa dilampaui dengan produk yang lebih baik |

### Peta Persaingan

```
                    UX Tinggi
                        |
         [Wise]         |         [kurs-world -- target]
                        |
Fokus Transfer ---------+-------- Fokus Informasi
                        |
   [Bank Apps]          |     [xe.com] [kursdolar.co.id]
                        |
                    UX Rendah
```

### Peluang Pasar

- **Long-tail SEO:** Keyword seperti "kurs dollar hari ini di BCA", "konversi EUR ke IDR", "histori kurs rupiah 2025" memiliki volume pencarian tinggi namun competition yang bisa dilawan dengan konten berkualitas.
- **Developer market yang underserved:** Tidak ada API kurs lokal (IDR-focused) yang gratis, handal, dan well-documented. Alternatif saat ini adalah global API (openexchangerates.org, currencylayer.com) yang tidak memiliki data kurs bank komersial Indonesia.
- **Referral dari komunitas:** Komunitas freelancer digital (Fastwork, Sribulancer, komunitas freelancer di Discord/Telegram) aktif mencari referensi kurs. Word-of-mouth sangat efektif di segmen ini.

---

## 8. Regulatory & Compliance Considerations

## 8. Regulatory & Compliance Considerations

### 8.1 Status Regulasi: Media / Platform Agregasi Informasi Publik (Non-Fintech)

kurs-world adalah platform **informasi publik dan agregasi data nilai tukar**, **BUKAN entitas fintech, bukan Penyelenggara Jasa Pembayaran (PJP), bukan pedagang valas (PBFX), dan bukan penasihat keuangan**.

- **Tidak Ada Perizinan OJK / Bank Indonesia Khusus Transaksi**: Karena platform tidak memegang dana pengguna (*no fund custody*), tidak mengeksekusi transfer uang (*no payment processing*), dan tidak memfasilitasi pertukaran valas fisik/digital secara langsung, platform ini sepenuhnya berada di luar yurisdiksi perizinan transaksi fintech OJK/BI.
- **Kewajiban Disclaimer Publik**: Menampilkan disclaimer yang jelas dan tegas di web UI dan respon API:
  > *"Data kurs yang ditampilkan di kurs-world diperoleh dari sumber publik untuk tujuan informasi dan referensi umum semata. Data ini bukan merupakan penawaran mengikat, saran investasi, atau instruksi transaksi. kurs-world tidak memfasilitasi transaksi jual-beli valuta asing."*

### 8.2 UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022)

- Platform mematuhi prinsip *data minimization* (zero-login untuk fitur utama).
- Data email untuk Rate Alert memerlukan *explicit consent* dan fitur *one-click unsubscribe*.
- Kebijakan privasi (*Privacy Policy*) yang transparan dan mudah diakses.

### 8.3 Atribusi Sumber Data Publik

- Menampilkan atribusi nama provider secara jelas (Bank Indonesia, ECB, BCA, Mandiri, dll.) pada setiap entri kurs.
- Menggunakan timeout ketat (5 detik) dan caching lokal/KV untuk menghindari request flood ke server publik provider.

---

## 9. Business Risks & Mitigation

| # | Risiko | Dampak | Probabilitas | Strategi Mitigasi |
|---|---|---|---|---|
| BR-1 | **Perubahan format / pemblokiran scraping bank** | Sedang | Sedang | Multi-source redundancy; fallback ke Bank Indonesia & ECB API publik |
| BR-2 | **Kompetisi SEO dari search engine** | Sedang | Sedang | Fokus pada komparasi bank spesifik, query lokal, dan performa Core Web Vitals tinggi |
| BR-3 | **Salah persepsi publik menganggap platform adalah fintech** | Rendah | Rendah | Disclaimer tegas di antarmuka & dokumentasi API |
| BR-4 | **Data anomali dari provider** | Tinggi | Rendah | Auto-quarantine table & validasi batas logis spread |
| BR-5 | **Lonjakan request API** | Rendah | Sedang | Edge KV rate limiting otomatis (sliding window) |

---

## 10. Cost Efficiency & Long-Term Sustainability

### 10.1 Struktur Biaya Serverless Edge (Cloudflare Stack)

| Komponen | Provider / Tier | Estimasi Biaya / Bulan |
|---|---|---|
| **Edge Compute & Routing** | Cloudflare Workers (Free / Workers Paid) | $0 – $5 (Rp 0 – Rp 80.000) |
| **Relational Database** | Cloudflare D1 (5M reads/day, 100k writes/day free) | $0 (Free Tier) |
| **Global Cache & Limiter** | Cloudflare KV (100k reads/day free) | $0 (Free Tier) |
| **Frontend Web Hosting** | Cloudflare Pages (Unlimited bandwidth) | $0 (Free Tier) |
| **Domain & DNS** | Cloudflare Registrar | ~$10 / tahun (~Rp 13.000/bulan) |
| **Total Biaya Operasional** | **Serverless Edge Stack** | **< Rp 100.000 / bulan** |

### 10.2 Nilai Strategis Non-Finansial

1. **Moat Kecepatan & Aksesibilitas**: Akses secepat kilat (<50ms) di seluruh dunia tanpa biaya server mahal.
2. **Komunitas Developer & Open Source**: Menjadi standar de-facto API kurs mata uang di Indonesia.
3. **Data Agregasi Historis**: Membangun dataset histori pergerakan kurs antar bank yang komprehensif di Indonesia.
