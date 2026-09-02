# ADR 0001: Open ER API Ingestion & Cloudflare Serverless Edge Architecture

> **Status:** Accepted  
> **Tanggal:** 2 September 2026  
> **Deciders:** Core Engineering Team  
> **Konteks:** Pemilihan sumber data kurs baseline & arsitektur serverless edge gratis

---

## 1. Konteks & Masalah

Untuk menyediakan informasi nilai tukar (kurs) mata uang yang akurat, cepat, dan 100% gratis bagi pengguna di Indonesia tanpa biaya infrastruktur tinggi, project `kurs-world` memerlukan:
1. Sumber data kurs global baseline yang andal, tanpa API key berbayar yang membatasi request awal.
2. Arsitektur backend dan frontend yang mampu mengeksekusi komparasi, konversi, dan caching secara global dengan latensi sub-50ms dan biaya $0 / bulan.

---

## 2. Keputusan Arsitektur

### 2.1 Sumber Data Kurs Baseline: `open.er-api.com`
- Menggunakan endpoint publik `https://open.er-api.com/v6/latest/USD` dari ExchangeRate-API sebagai baseline kurs spot valuta asing global terhadap IDR dan 160+ mata uang lainnya.
- Data di-cache pada layer **Cloudflare KV** dengan pola *Stale-While-Revalidate (SWR)* selama 15 menit.
- Dipadukan dengan provider adapter lokal Indonesia (Bank Indonesia, BCA, Bank Mandiri) untuk perbandingan kurs transaksi bank komersial riil.

### 2.2 Backend & Runtime: Elysia.js on Cloudflare Workers
- Menggunakan **Elysia.js** (TypeScript) berjalan di **Cloudflare Workers**.
- Menjamin *type-safety* ujung-ke-ujung (Eden Treaty), response time ultra-cepat, dan otomatisasi dokumentasi OpenAPI Swagger UI di `/swagger`.
- Database relational terdistribusi menggunakan **Cloudflare D1** dengan **Drizzle ORM** untuk time-series snapshot histori kurs.

### 2.3 Frontend: Svelte 5 (Runes) on Cloudflare Pages
- Menggunakan **Svelte 5 (Runes)** dengan Vite dan **Tailwind CSS v4**.
- Komponen UI wajib menggunakan **shadcn-svelte (Bits UI)** dan **Lucide Svelte**.
- Mengharuskan implementasi shimmer skeleton (`animate-shimmer`) pada setiap state loading asinkron untuk zero Cumulative Layout Shift (CLS < 0.1).

### 2.4 Model Akses: 100% Free & Pure Informational Non-Fintech
- Platform 100% bebas biaya (tanpa paywall, tanpa registrasi wajib, tanpa iklan invasif).
- Murni platform informasi publik (bukan fintech/payment gateway), dilengkapi *Informational Disclaimer*.

---

## 3. Konsekuensi

### Positif:
- **Zero Cost Hosting**: Masuk dalam free tier Cloudflare Workers (100k req/hari), Cloudflare D1, dan Cloudflare Pages.
- **Performa Global**: Distribusi ke 300+ edge location Cloudflare di seluruh dunia dengan latensi < 50ms.
- **Developer Experience**: Type-safe schema dari database hingga frontend via TypeScript & Elysia Eden.

### Negatif / Mitigasi:
- `open.er-api.com` memiliki siklus refresh harian untuk free tier -> Diatasi dengan multi-provider fallback & scraping provider bank lokal (BCA/Mandiri/BI) tiap 15 menit.
- Cloudflare Workers memiliki batas memori 128MB -> Kode dioptimasi untuk bundle kecil dan stream-efficient.
