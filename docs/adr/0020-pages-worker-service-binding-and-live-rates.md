# ADR 0020: Cloudflare Pages Worker Service Binding & Realtime Spot Rates Alignment

## Status
**Accepted**

## Context & Problem Statement
1. Pengguna menemukan inkonsistensi nilai tukar (USD menunjukkan Rp 16.250 di kalkulator frontend, sedangkan kurs pasar aktual dari Google Finance dan `open.er-api.com` berada di kisaran Rp 17.752 – Rp 17.765).
2. Inkonsistensi terjadi karena:
   - Frontend yang di-host di Cloudflare Pages sebelumnya memanggil relative URL `/api/v1/...` yang tidak memiliki handler backend terpasang di origin Pages, sehingga frontend jatuh ke *offline static fallback dictionary* (yang masih mencatat baseline lama USD Rp 16.250).
   - Terjadi latensi dan kegagalan CORS jika frontend memanggil domain eksternal secara terpisah.
3. Pengguna menginstruksikan untuk menggunakan **Worker Binding (Service Bindings / Pages Functions Binding)** agar:
   - Request API dari frontend diproses langsung oleh Worker backend dalam satu edge isolate (0ms network hop, zero internet roundtrip).
   - Data kurs yang disajikan 100% akurat dan sinkron dengan live market spot rate (`open.er-api.com` -> D1 DB & KV Cache).

## Architecture Decisions

### 1. Cloudflare Pages Function Service Binding (`frontend/functions/api/[[path]].ts`)
- Menempatkan Pages Function di `frontend/functions/api/[[path]].ts` yang mengikat `kurs-world-api` Worker melalui Service Binding (`env.API`).
- Ketika browser memanggil `/api/v1/rates/latest` atau `/api/v1/...`, Cloudflare Pages langsung meneruskannya ke Cloudflare Worker tanpa meninggalkan jaringan internal Cloudflare (sub-10ms edge response).

### 2. Live Rates Market Calibration & Fallback Updates
- Memperbarui dataset baseline bawaan (`BASE_RATES_IDR` & `GLOBAL_BASE_RATES`) ke nilai spot market terkini (USD: ~17.765, EUR: ~18.650, SGD: ~13.350, dsb.).
- Memastikan auto-ingestion berjalan saat backend pertama kali menerima request atau via scheduled cron trigger.

## Consequences
- **Positif**:
  - Angka kurs yang ditampilkan sinkron dengan nilai pasar global (USD ~Rp 17.750+).
  - Latensi ultra-rendah (0ms inter-service hop via Cloudflare Service Binding).
  - Arsitektur single-domain tanpa issue CORS atau DNS mismatch.
- **Negatif**:
  - Membutuhkan konfigurasi Pages Function binding pada Cloudflare Pages deployment.
