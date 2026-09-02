# ADR 0021: On-Demand (Lazy) Ingestion Architecture & Background Cron Elimination

## Status
**Accepted**

## Context & Problem Statement
Sebelumnya, sistem menggunakan Cloudflare Cron Trigger `*/15 * * * *` untuk melakukan polling otomatis ke API eksternal setiap 15 menit tanpa memandang apakah ada pengguna yang aktif mengakses platform atau tidak.

Meskipun memastikan data selalu tersegarkan, scheduled polling ini memiliki kelemahan:
1. **Pemborosan Kuota API Eksternal**: Memanggil provider eksternal 96 kali per hari bahkan di jam-jam tanpa traffic (tengah malam/dini hari).
2. **Pemborosan Cloudflare Worker Invocations**: Menjalankan execution worker setiap 15 menit secara terus-menerus.
3. **Biaya & Resource Inefisiensi**: Menyimpan data baru saat tidak ada satupun user yang membaca data tersebut.

Pengguna menginstruksikan untuk **menghapus cron background** dan menerapkan model **On-Demand (Lazy) Ingestion**.

## Architecture Decisions

### 1. Penghapusan Cloudflare Scheduled Triggers
- Menghapus blok `"triggers": { "crons": ["*/15 * * * *"] }` dari `backend/wrangler.jsonc`.
- Backend Cloudflare Worker murni bertindak sebagai HTTP Request Handler. Saat tidak ada traffic, sistem berada dalam kondisi **0 invocation / 0 outbound network request / 0 cost**.

### 2. Pure On-Demand (Lazy) Ingestion Lifecycle
- **Cache-First Ingestion**:
  1. Saat request pengguna masuk (misal `GET /api/v1/rates/latest`), backend memeriksa Cloudflare KV (`rates:live:latest`) dan Cloudflare D1 (`ratesTable`).
  2. **Cache Hit (< 15 menit)**: Data langsung dikembalikan ke pengguna dalam <15ms.
  3. **Cache Miss / Stale (> 15 menit)**:
     - Single-flight in-flight promise lock mencegah *cache stampede*.
     - Backend memicu 1x fetch ke `https://open.er-api.com/v6/latest/USD`.
     - Menyimpan snapshot 160+ kurs ke Cloudflare D1 dan KV Cache (TTL 15 menit).
     - Menyajikan data ke pengguna pertama dan seluruh pengguna berikutnya selama 15 menit ke depan.

### 3. Dedicated Admin On-Demand Endpoint
- Menyediakan endpoint `POST /api/v1/rates/refresh` untuk pembaruan paksa (force refresh) jika dibutuhkan oleh webhook atau admin dashboard.

## Consequences
- **Positif**:
  - 100% efisien: Zero external hits dan zero worker executions saat platform idle / tidak ada traffic.
  - Pengguna aktif selalu mendapatkan data aktual dengan latensi cache ultra-rendah (<15ms) selama periode aktif.
  - Menghemat kuota API eksternal secara drastis (>80% pengurangan panggilan harian pada traffic wajar).
- **Negatif**:
  - Pengguna pertama setelah periode idle >15 menit akan mengalami latensi awal sedikit lebih tinggi (~200-500ms) untuk siklus on-demand fetch pertama.
