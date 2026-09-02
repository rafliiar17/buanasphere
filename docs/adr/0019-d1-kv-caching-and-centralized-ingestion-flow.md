# ADR 0019: Centralized Cloudflare D1 Database & KV Caching Architecture (Zero-Leak External Ingestion)

## Status
**Accepted**

## Context & Problem Statement
Sebelumnya, sistem memiliki fallback langsung dari browser frontend ke endpoint eksternal `https://open.er-api.com/v6/latest/USD`. Hal ini berpotensi membebani kuota API pihak ketiga jika banyak pengguna membuka aplikasi secara bersamaan dan mengurangi kontrol server atas konsistensi data.

Pengguna menetapkan standar arsitektur bahwa:
1. **Server-Side Ingestion Only**: Seluruh data nilai tukar mata uang yang disajikan kepada pengguna **wajib berasal dari infrastruktur internal Cloudflare (Cloudflare D1 Database & Cloudflare KV Cache)**.
2. **Minimal External API Hits**:
   - Pengguna pertama (atau saat cache dingin/kedaluwarsa) memicu backend Cloudflare Worker untuk melakukan 1x HTTP request ke provider `open.er-api.com`.
   - Data 160+ mata uang di-upsert ke tabel relasional **`rates`** dan **`rate_history`** di Cloudflare D1, serta di-cache sebagai snapshot di **Cloudflare KV (`rates:live:latest`)** dengan TTL 15 menit.
   - Pengguna kedua dan seterusnya dalam rentang TTL langsung dilayani dari Cloudflare KV (<15ms latency) atau D1 Database tanpa menyentuh API eksternal sama sekali.
3. **Scheduled Ingestion Proaktif**:
   - Cloudflare Cron Trigger `*/15 * * * *` secara otomatis memperbarui D1 & KV di latar belakang sehingga pengguna hampir selalu menikmati *Cache Hit*.
4. **Client Isolation**:
   - Frontend Svelte 5 hanya berkomunikasi dengan backend API (`/api/v1/...`).

## Architecture Decisions

### 1. Dual-Layer Server Cache & Ingestion Flow
- **Layer 1 (Edge KV Cache `KURS_CACHE`)**:
  - Key: `rates:live:latest`
  - TTL: 900 detik (15 menit)
  - Latensi: Sub-15ms edge global.
- **Layer 2 (Cloudflare D1 Relational DB `DB`)**:
  - Tabel `rates`: Snapshot kurs terkini per pasangan mata uang.
  - Tabel `rate_history`: Time-series histori untuk analisis grafik Google Finance.
- **Layer 3 (External Provider Ingestion `open.er-api.com`)**:
  - Hanya dipanggil oleh backend saat KV cache miss dan D1 database kosong/expired (> 15 menit), atau via Cron Trigger.

### 2. Frontend Decoupling
- Menghapus direct outbound fetch ke `open.er-api.com` pada runtime browser client.
- Frontend murni memanggil backend Elysia Worker `/api/v1/rates/latest?base=IDR`.

## Consequences
- **Positif**:
  - Pengurangan drastis jumlah request ke API publik `open.er-api.com` (>99% token & request savings).
  - Kecepatan respon ultra-cepat (<15ms) di edge network Cloudflare global.
  - Konsistensi data 100% identik di seluruh pengguna.
  - Skema time-series tersimpan rapi di D1 untuk analisis historis.
- **Negatif**:
  - Data memiliki latensi pembaruan maksimal 15 menit sesuai siklus pasar valas standar.
