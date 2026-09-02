# ADR 0018: Countries Database Schema (Cloudflare D1), KV Caching Layer & Cloudflare Auto-Deploy (`kurs.arafz.id`)

## Status
**Accepted**

## Context & Problem Statement
Aplikasi Kurs World memerlukan persistensi metadata untuk seluruh 195+ negara berdaulat (nama, kode valas, nama valas, emoji bendera, kawasan regional, koordinat lat/lon, status aktif) pada database relasional edge (Cloudflare D1) dan layer caching edge berkecepatan tinggi (Cloudflare KV) agar query rate provider dan visualisasi peta mendapatkan latensi sub-15ms. Selain itu, diperlukan pipeline CI/CD GitHub Actions otomatis untuk melakukan pengujian unit, type-check, bundling, dan auto-deploy ke platform Cloudflare Pages (Frontend SPA dengan custom domain `kurs.arafz.id`) dan Cloudflare Workers (Backend API).

## Architecture Decisions

### 1. Drizzle ORM Schema: `countriesTable` (Cloudflare D1)
Menambahkan tabel `countriesTable` di `backend/src/db/schema.ts`:
- `iso3`: Primary Key (e.g. `'IDN'`, `'USA'`, `'JPN'`)
- `name`: Nama resmi negara dalam Bahasa Indonesia (e.g. `'Indonesia'`)
- `currencyCode`: Kode ISO 4217 mata uang (e.g. `'IDR'`)
- `currencyName`: Nama resmi mata uang (e.g. `'Rupiah'`)
- `flagEmoji`: Unicode flag emoji (e.g. `'🇮🇩'`)
- `region`: Kawasan geografis (e.g. `'asean'`, `'europe'`, `'americas'`)
- `capital`: Nama ibu kota
- `lat` / `lon`: Koordinat geografis tengah negara
- `isActive`: Boolean status keaktifan
- `createdAt` / `updatedAt`: ISO timestamps
- Index pada `region` dan `currencyCode`.

### 2. Dual-Layer Storage & Stale-While-Revalidate (SWR) Caching
- **Layer 1 (Edge Cache)**: Cloudflare KV `countries:all` dengan TTL 24 jam untuk latensi sub-15ms global.
- **Layer 2 (Relational DB)**: Cloudflare D1 `countriesTable` untuk query terstruktur, filter regional, dan manajemen relasional.
- **Layer 3 (In-Memory Fallback)**: Dataset statis domain `COUNTRY_MAP` untuk menjamin ketersediaan 100% offline.

### 3. CI/CD GitHub Actions Pipeline (`.github/workflows/deploy.yml`)
- Trigger otomatis saat push ke branch `main`.
- Quality Gates: `bun install`, `bun test`, `bun run check`, `bun run build`.
- Deployment otomatis via:
  - `cloudflare/pages-action@v1` untuk frontend Svelte 5 di domain `kurs.arafz.id`.
  - `cloudflare/wrangler-action@v3` untuk backend Elysia API Worker & D1 migrations.

## Consequences
- **Positif**:
  - Seluruh metadata negara dan nilai tukar terorganisir di D1 dan ter-cache di KV.
  - Deployment zero-touch dan terautomasi ke domain produksi `kurs.arafz.id`.
  - Type-safe penuh dengan Drizzle ORM & Elysia.js.
- **Negatif**:
  - Membutuhkan setup secret GitHub Repository (`CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID`) untuk deployment remote.
