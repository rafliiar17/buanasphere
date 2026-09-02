# ADR 0023: Cloudflare Workers Analytics Engine Telemetry & Edge Observability

## Status
**Accepted**

## Context & Problem Statement
Kurs World bertindak sebagai agregator nilai tukar mata uang real-time yang mengambil data dari berbagai bank sentral & komersial (Bank Indonesia, BCA, Mandiri, OpenERApi) serta melayani ribuan request konversi dan perbandingan kurs di edge.

Saat ini:
1. Log observabilitas masih mengandalkan log teks runtime console (Pino). Log ini tidak dapat diagregasi atau dianalisis dengan kueri time-series multi-dimensi (seperti persentil latensi $p_{95}$ per bank provider atau tren kegagalan scrape).
2. Database relasional Cloudflare D1 memiliki kuota operasi penulisan (*write rows limit*). Menulis setiap log request/telemetri ke D1 akan membebani database dan menghabiskan kuota.
3. Tidak ada visibilitas otomatis mengenai rasio efisiensi cache (Cloudflare KV vs D1 vs Live Ingestion) dan popularitas pasangan mata uang yang dicari pengguna.

## Decision Drivers
- **Zero Overhead**: Telemetri tidak boleh menambah latensi respons pengguna ($<0.1\text{ms}$).
- **Non-blocking Resilience**: Jika pengiriman telemetri gagal atau Analytics Engine tidak terikat (misal: di environment development lokal), aplikasi tidak boleh crash atau gagal merespons.
- **SQL-Queryable**: Data time-series dapat di-query menggunakan sintaks SQL standar melalui Cloudflare GraphQL/REST API.
- **Structured Schema**: Schema datapoint terstruktur rapi ke dalam `blobs` (string labels), `doubles` (metrik numerik), dan `indexes` (partisi sampling/filter).

## Architecture Decisions

### 1. Cloudflare Workers Analytics Engine Binding
Menambahkan dataset binding pada [`backend/wrangler.jsonc`](file:///home/archy/Projects/kurs-world/backend/wrangler.jsonc):
```json
"analytics_engine_datasets": [
  {
    "binding": "ANALYTICS",
    "dataset": "kurs_world_telemetry"
  }
]
```

### 2. Telemetry Module (`backend/src/telemetry/index.ts`)
Menyediakan interface terisolasi yang aman dari exception:
- **`recordProviderFetch`**: Merekam performa pemanggilan provider luar (durasi ms, jumlah kurs yang di-parse, status `success`/`error`, dan pesan anomali).
  - `blobs`: `['provider_fetch', providerId, status, errorReason ?? '']`
  - `doubles`: `[durationMs, rateCount]`
  - `indexes`: `[providerId]`
- **`recordApiRequest`**: Merekam akses endpoint publik.
  - `blobs`: `['api_request', endpoint, method, cacheStatus, currencyPair ?? '']`
  - `doubles`: `[statusCode, durationMs]`
  - `indexes`: `[endpoint]`
- **`recordConversion`**: Merekam konversi mata uang dan opsi bank terbaik yang dipilih pengguna.
  - `blobs`: `['conversion', fromCurrency, toCurrency, rateType, bestProvider]`
  - `doubles`: `[amount, durationMs]`
  - `indexes`: [`${fromCurrency}/${toCurrency}`]`

### 3. Integrasi pada Core Services
- [`AggregatorService`](file:///home/archy/Projects/kurs-world/backend/src/service/aggregator.ts): Merekam hasil scraping setiap provider secara instan.
- [`ConverterService`](file:///home/archy/Projects/kurs-world/backend/src/service/converter.ts): Merekam insight konversi mata uang.
- [`Elysia API Lifecycle`](file:///home/archy/Projects/kurs-world/backend/src/index.ts): Merekam HTTP status & latensi pada `onAfterResponse`.

## Consequences
- **Positif**:
  - Visibilitas mendalam atas performa setiap bank provider tanpa latensi tambahan.
  - Beban database D1 tetap nol untuk keperluan telemetri dan log observabilitas.
  - Data analitik dapat dihubungkan ke Grafana, dashboard custom, atau query SQL otomatis.
  - Penanganan aman (*graceful fallback*): Tetap berjalan mulus di local development tanpa binding.
- **Negatif**:
  - Membutuhkan dataset binding `kurs_world_telemetry` yang terdaftar pada akun Cloudflare.
