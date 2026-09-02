# PROMPT.md — kurs-world

> **Ringkasan Visi & Panduan Cepat Project kurs-world**  
> Platform informasi nilai tukar (kurs) mata uang real-time yang cepat, transparan, dan 100% gratis untuk pengguna Indonesia.

---

## 1. Visi & Filosofi Produk

- **Visi**: Menjadi referensi kurs mata uang paling ringkas, akurat, dan mudah diakses di Indonesia: **Satu Halaman, Banyak Sumber, Zero Friction**.
- **Filosofi**: *"Informasi Dulu, Transaksi Belakangan"* — Menyajikan data objektif tanpa bias komersial, tanpa paywall, tanpa registrasi wajib untuk fitur esensial, dan tanpa iklan invasif.
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
| **UI & Styling** | **Tailwind CSS v4 + shadcn-svelte (Bits UI)** | Wajib komponen resmi shadcn-svelte & shimmer skeleton |
| **Package Manager** | **Bun (v1.4+)** | Package management, test runner, dan script execution |
| **Deployment Tooling** | **Wrangler v3+** | Cloudflare Workers & Pages deployment CLI |

---

## 3. Fitur Utama MVP

1. **🔄 Real-time Multi-Source Feed**: Agregasi kurs berkala dari Bank Indonesia (BI), ECB, dan bank komersial (BCA, Mandiri, BRI, BNI, CIMB Niaga).
2. **💱 Multi-Source Converter**: Konversi instan dengan kalkulasi perbandingan rupiah yang diperoleh dari berbagai bank secara simultan.
3. **📊 Side-by-Side Bank Comparison**: Tabel komparasi kurs jual, beli, dan spread dengan highlight *Best Buy*, *Best Sell*, dan *Lowest Spread*.
4. **📈 Historical Trend Charts**: Visualisasi tren kurs interaktif (7d, 30d, 90d, 365d) berbasis lightweight charts.
5. **🔔 Rate Alert**: Notifikasi threshold kurs via Web Push API browser & Cloudflare Email Service.
6. **🌐 Public REST API**: Endpoint publik OpenAPI/Swagger (`/swagger`) dengan type-safety Eden Treaty dan edge caching.

---

## 4. Pointer Dokumentasi

| Dokumen | Deskripsi | Path |
|---|---|---|
| **BRIEF.md** | Executive summary, persona, UVP, KPI, timeline & risiko | [docs/brief/BRIEF.md](file:///home/archy/Projects/kurs-world/docs/brief/BRIEF.md) |
| **PRD.md** | Product requirements, user stories, NFR, API spec & acceptance criteria | [docs/specs/PRD.md](file:///home/archy/Projects/kurs-world/docs/specs/PRD.md) |
| **BRD.md** | Analisis bisnis, model 100% Free, lanskap kompetitor, kepatuhan non-fintech | [docs/specs/BRD.md](file:///home/archy/Projects/kurs-world/docs/specs/BRD.md) |
| **AGENTS.md** | Panduan utama standar engineering, SDLC, Git safety, dan UI/UX | [AGENTS.md](file:///home/archy/Projects/kurs-world/AGENTS.md) |
| **CONTEXT.md** | Ubiquitous domain language & kamus istilah kurs | [CONTEXT.md](file:///home/archy/Projects/kurs-world/CONTEXT.md) |
| **ARCHITECTURE.md**| Desain sistem edge Cloudflare + Elysia + Svelte 5 | [ARCHITECTURE.md](file:///home/archy/Projects/kurs-world/ARCHITECTURE.md) |
