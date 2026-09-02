# PROMPT.md — kurs-world

> **Ringkasan Visi & Panduan Cepat Project kurs-world**  
> Platform Peta Kurs Valuta Asing Dunia Interaktif — jelajahi nilai tukar seluruh negara dalam satu peta visual global, dengan komparasi kurs bank lokal Indonesia dan pergerakan harian.

---

## 1. Visi & Filosofi Produk

- **Visi**: Menjadi referensi kurs mata uang paling ringkas, visual, dan mudah diakses di Indonesia: **Satu Peta Dunia Interaktif, Komparasi Lintas Bank, Zero Friction**.
- **Deskripsi**: Platform Peta Kurs Valuta Asing Dunia Interaktif — jelajahi nilai tukar seluruh negara dalam satu peta visual global, dengan komparasi kurs bank lokal Indonesia dan pergerakan harian.
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
| **Ingestion Worker** | **Cloudflare Cron Triggers** | Scraping & fetching terjadwal tiap 15 menit |
| **Frontend Framework** | **Svelte 5 (Runes)** | Reaktivitas modern (`$state`, `$derived`), bundle ultra-ringan |
| **Peta & Visualisasi FX** | **TopoJSON / SVG / LayerChart** | Peta choropleth dunia interaktif ultra-ringan & responsive |
| **UI & Styling** | **Tailwind CSS v4 + shadcn-svelte (Bits UI)** | Wajib komponen resmi shadcn-svelte & shimmer skeleton |
| **Package Manager** | **Bun (v1.4+)** | Package management, test runner, dan script execution |
| **Deployment Tooling** | **Wrangler v3+** | Cloudflare Workers & Pages deployment CLI |

---

## 3. Fitur Utama MVP

1. **🗺️ Interactive World FX Choropleth Map (Hero)**: Peta choropleth dunia interaktif untuk visualisasi kurs mata uang global terhadap IDR, status pergerakan 24 jam (menguat/melemah), hover tooltip cepat, dan filter klik negara ke detail perbandingan.
2. **📊 Side-by-Side Bank Comparison**: Tabel komparasi kurs jual, beli, dan spread antar bank lokal (BCA, Mandiri, BRI, BNI, CIMB Niaga, BI) dengan sorotan otomatis *Best Buy*, *Best Sell*, dan *Lowest Spread*.
3. **💱 Quick Country Converter**: Konverter instan berbasis pencarian negara / mata uang yang menampilkan hasil perolehan rupiah dari berbagai bank secara simultan.
4. **🔥 Global Currency Ticker & Heatmap**: Ticker bar pergerakan mata uang dunia real-time dan heatmap penguatan/pelemahan valuta asing global terhadap Rupiah.
5. **📈 Historical Trend Charts**: Visualisasi tren kurs interaktif (7d, 30d, 90d, 365d) berbasis lightweight charts.
6. **🔔 Rate Alert & Public REST API**: Notifikasi ambang batas kurs via Web Push API/Cloudflare Email dan Public REST API OpenAPI (`/swagger`) dengan edge caching.

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
