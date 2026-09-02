# PROMPT.md — kurs-world

> **Ringkasan Visi & Panduan Cepat Project kurs-world**  
> Platform Peta Kurs Valuta Asing Dunia Interaktif — jelajahi nilai tukar 195+ negara dalam satu peta visual global, dengan Komparasi Nilai Tukar Valas Global & Grafik Kurs Interaktif ala Google Finance.

---

## 1. Visi & Filosofi Produk

- **Visi**: Menjadi referensi kurs mata uang paling ringkas, visual, dan mudah diakses di Indonesia: **Satu Peta Dunia Interaktif, Komparasi Nilai Tukar Valas Global, Grafik Tren Finansial, Zero Friction**.
- **Deskripsi**: Platform Peta Kurs Valuta Asing Dunia Interaktif — jelajahi nilai tukar seluruh negara dalam satu peta visual global, dengan Komparasi Nilai Tukar Valas Global (Currency-to-Currency) dan Grafik Kurs Interaktif ala Google Finance.
- **Filosofi**: *"Informasi Dulu, Transaksi Belakangan"* — Menyajikan visual storytelling dan data objektif tanpa bias komersial, tanpa paywall, tanpa registrasi wajib untuk fitur esensial, dan tanpa iklan invasif.
- **Model Akses**: **100% FREE (Gratis & Terbuka)** — Dikelola sebagai public information utility dengan biaya operasional minimal berbasis serverless edge.
- **Batasan Ruang Lingkup (Non-Fintech)**: **Murni Agregasi & Visualisasi Informasi Publik**. Platform ini **bukan fintech**, bukan payment gateway, bukan money changer digital, dan tidak memfasilitasi transaksi jual-beli valas langsung, sehingga tidak memerlukan izin PJP/PBFX dari Bank Indonesia atau OJK.

---

## 2. Tech Stack (Wajib & Terstandarisasi)

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Backend Framework** | **Elysia.js (TypeScript on Bun)** | Type-safe, ultra-fast routing dengan TypeBox / Eden Treaty |
| **Serverless Runtime** | **Cloudflare Workers** | Global edge execution, latency sub-50ms, zero cold-start |
| **Database & ORM** | **Cloudflare D1 + Drizzle ORM** | Serverless relational database terdistribusi di edge |
| **Edge Cache & Rate Limit** | **Cloudflare KV** | Stale-While-Revalidate (SWR) cache & sliding window limiter |
| **Ingestion Worker** | **Cloudflare Cron Triggers** | Scraping & fetching terjadwal tiap 15 menit dari OpenERAPI, BI JISDOR, ECB |
| **Frontend Framework** | **Svelte 5 (Runes)** | Reaktivitas modern (`$state`, `$derived`), bundle ultra-ringan |
| **Peta & Visualisasi FX** | **Plotly.js / TopoJSON / LayerChart** | Peta choropleth 195+ negara dunia & grafik tren multi-timeframe |
| **UI & Styling** | **Tailwind CSS v4 + shadcn-svelte (Bits UI)** | Wajib komponen resmi shadcn-svelte & shimmer skeleton |
| **Package Manager** | **Bun (v1.4+)** | Package management, test runner, dan script execution |
| **Deployment Tooling** | **Wrangler v3+** | Cloudflare Workers & Pages deployment CLI |

---

## 3. Fitur Utama MVP

1. **🗺️ Interactive World FX Choropleth Map (Hero)**: Peta choropleth 195+ negara dunia interaktif untuk visualisasi kurs mata uang global terhadap IDR, status pergerakan 24 jam (menguat/melemah), hover tooltip cepat, dan modal inspeksi negara on-demand.
2. **📊 Pure Currency-to-Currency Comparison Matrix**: Matriks komparasi nilai tukar antar valuta asing global murni terhadap IDR dan cross-rates dengan spread pasar interbank, pergerakan 24h, dan rentang harian.
3. **📈 Google Finance-Style Interactive Charts**: Visualisasi grafik interaktif tren valas multi-timeframe (1D, 5D, 1M, 6M, 1Y, 5Y, MAX) dengan tracking crosshair hover, dynamic tooltip, dan baseline open indicator.
4. **💱 Quick Universal Currency Converter**: Konverter instan dua arah valuta asing dunia dengan auto-formatting ribuan rupiah dan preset nominal cepat.
5. **🔥 Global Movers Ticker Ribbon**: Ticker pita berjalan yang menampilkan Top Gainers dan Top Losers mata uang dunia terhadap Rupiah secara real-time.
6. **🔔 Rate Alert & Public REST API**: Notifikasi ambang batas kurs via Web Push API/Cloudflare Email dan Public REST API OpenAPI (`/api/v1/docs`) dengan edge caching.

---

## 4. Pointer Dokumentasi

| Dokumen | Deskripsi | Path |
|---|---|---|
| **BRIEF.md** | Executive summary, persona, UVP, KPI, roadmap & positioning peta FX | [docs/brief/BRIEF.md](file:///home/archy/Projects/kurs-world/docs/brief/BRIEF.md) |
| **PRD.md** | Product requirements, World Map FR-1, user stories, NFR & API spec | [docs/specs/PRD.md](file:///home/archy/Projects/kurs-world/docs/specs/PRD.md) |
| **BRD.md** | Analisis bisnis, diferensiasi pasar visual storytelling, model 100% Free | [docs/specs/BRD.md](file:///home/archy/Projects/kurs-world/docs/specs/BRD.md) |
| **AGENTS.md** | Panduan utama standar engineering, SDLC, Git safety, dan UI/UX | [AGENTS.md](file:///home/archy/Projects/kurs-world/AGENTS.md) |
| **CONTEXT.md** | Ubiquitous domain language & kamus istilah kurs | [CONTEXT.md](file:///home/archy/Projects/kurs-world/CONTEXT.md) |
| **ARCHITECTURE.md**| Desain sistem edge Cloudflare + Elysia + Svelte 5 | [ARCHITECTURE.md](file:///home/archy/Projects/kurs-world/ARCHITECTURE.md) |
