# ADR 0002: Bun Monorepo Workspace Separation & Pino Structured JSON Logging

> **Status:** Accepted  
> **Tanggal:** 2 September 2026  
> **Deciders:** Core Engineering Team, SDLC & Architecture Lead  
> **Konteks:** Pemisahan folder Backend dan Frontend ke dalam Bun Workspaces terpisah serta standarisasi Structured JSON Logging dengan Pino

---

## 1. Konteks & Masalah

Pada fase inisiasi MVP (ADR 0001), kode backend bertempat langsung di root repository (`src/`, `tests/`, `wrangler.jsonc`, `drizzle.config.ts`) sementara frontend berada di subdirektori `frontend/`. Struktur ini menimbulkan beberapa tantangan:
1. **Dependency & Build Collision**: Dependensi backend (Elysia, Drizzle, Wrangler, Cloudflare Workers types) bercampur dengan dependensi root, mempersulit script monorepo dan CI/CD matrix.
2. **Observability & Logging Ambiguity**: Penggunaan `console.log` mentah tanpa format baku menyulitkan *log aggregation*, analisis performa latensi per provider kurs, dan pelacakan *anomaly quarantine* di Cloudflare Observability / Logpush.
3. **SDLC Scalability**: Pengujian backend dan frontend memerlukan perintah terpisah tanpa standar orkestrasi di level root workspace.

---

## 2. Keputusan Arsitektur

### 2.1 Bun Monorepo Workspaces (`backend/` & `frontend/`)
- Membagi repository ke dalam dua workspace independen yang dikelola oleh Bun (`workspaces: ["backend", "frontend"]`):
  - **`@kurs-world/backend`** (`backend/`): Berisi seluruh serverless runtime Elysia.js, adapter rate provider (BI, BCA, Mandiri, OpenERApi), Drizzle D1 ORM, KV cache helper, dan Cloudflare Workers entrypoint (`wrangler.jsonc`).
  - **`@kurs-world/frontend`** (`frontend/`): Berisi web SPA Svelte 5 (Runes), Tailwind CSS v4, komponen shadcn-svelte (Bits UI), shimmer skeletons, dan API client.
- Menyediakan root orchestration scripts di `package.json`:
  - `dev:be`: Menjalankan backend dev server (`cd backend && bun run dev`).
  - `dev:fe`: Menjalankan frontend dev server (`cd frontend && bun run dev`).
  - `test`: Menjalankan seluruh test suite backend dan frontend (`bun test --filter backend && bun test --filter frontend`).
  - `build`: Menjalankan build bundle backend dan frontend.
  - `check`: Menjalankan diagnostic type-check pada kedua workspace.

### 2.2 Pino Structured JSON Logging Standard
- Mengadopsi **Pino** sebagai logger standar berkinerja tinggi (overhead < 1ms) di `@kurs-world/backend`.
- **JSON Log Schema Baku**:
  Setiap baris log wajib memuat atribut standar sesuai batasan AGENTS.md Bagian 8:
  ```json
  {
    "time": 1725264000000,
    "level": "info",
    "msg": "Fetched latest rates from provider",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "provider": "open_er_api",
    "currency_pair": "USD/IDR",
    "duration_ms": 142
  }
  ```
- **Environment Adaptability**:
  - Di *Local Development* (`NODE_ENV !== 'production'`), Pino menggunakan `pino-pretty` untuk kemudahan pembacaan terminal.
  - Di *Production / Cloudflare Edge / Test*, Pino menghasilkan raw JSON stream satu baris per event untuk efisiensi parsing mesin dan integrasi Cloudflare Logpush.
- **Contextual Request Middleware**:
  - Middleware Elysia menyematkan `requestId` (UUIDv4) ke setiap request HTTP yang masuk dan mencatat `duration_ms` serta status HTTP saat request selesai.
- **Provider & Service Child Loggers**:
  - Setiap instance rate provider dan background cron aggregator menggunakan child logger (`logger.child({ provider: '...' })`) untuk melacak latensi eksternal, cache hit/miss, dan peringatan deteksi anomali.

---

## 3. Konsekuensi

### Positif:
- **Isolasi Modul Bersih**: Backend dan frontend memiliki `package.json`, `tsconfig.json`, dan dependency tree masing-masing tanpa konflik tipe runtime (DOM vs Cloudflare Worker globals).
- **Zero-Config Tracing**: Setiap panggilan endpoint dan fetching kurs memiliki `requestId` dan `duration_ms` yang memudahkan profiling performa sub-50ms.
- **Kepatuhan Invarian SDLC**: Memenuhi seluruh aturan observability, SSRF timeout, dan rate quarantine yang ditetapkan di `AGENTS.md`.

### Negatif / Mitigasi:
- **Struktur Folder Berubah**: Developer harus menjalankan perintah di root atau berpindah direktori ke `backend/` atau `frontend/` -> Dimitigasi dengan root npm/bun scripts (`bun run dev:be`, `bun run dev:fe`, `bun test`).
