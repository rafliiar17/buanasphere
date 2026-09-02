# ADR 0022: Strict Bun Runtime (v1.4+) Enforcement & Node.js Ban

> **Status:** Accepted  
> **Tanggal:** 2 September 2026  
> **Deciders:** Core Engineering Team  
> **Konteks:** Standarisasi runtime tunggal Bun v1.4+ dan larangan penggunaan Node.js/npm/yarn/pnpm di seluruh codebase

---

## 1. Konteks & Masalah

Proyek `kurs-world` dibangun di atas arsitektur serverless edge (Cloudflare Workers & Pages) dengan performa tinggi. Untuk menjaga konsistensi eksekusi, kecepatan instalasi, interoperabilitas module TypeScript native, serta mencegah *dependency drift* atau bug yang dipicu oleh perbedaan runtime antar kontributor:
1. Proyek mewajibkan runtime dan package manager tunggal: **Bun (v1.4+)**.
2. Penggunaan Node.js, npm, yarn, dan pnpm berpotensi menghasilkan *lockfile mismatch*, kegagalan type resolution pada Elysia.js/Svelte 5, serta inefisiensi memori.
3. Diperlukan penegakan otomatis (*automated guardrail*) di tingkat `package.json`, preinstall script, konfigurasi `bunfig.toml`, dan CI pipeline.

---

## 2. Keputusan Arsitektur

### 2.1 Runtime Guard Script (`scripts/ensure-bun.ts`)
- Memvalidasi secara programatik bahwa environment yang mengeksekusi script adalah **Bun** (`typeof Bun !== 'undefined'` dan `process.versions.bun`).
- Memvalidasi semver minimum: **`Bun.version >= 1.4.0`**.
- Memblokir eksekusi yang dipicu oleh `npm`, `yarn`, atau `pnpm` melalui inspeksi `npm_config_user_agent`.
- Melempar pesan error eksplisit dan keluar dengan status error (`process.exit(1)`) jika ketentuan tidak terpenuhi.

### 2.2 Workspace Package Configuration
- Pada `package.json` (Root, Backend, Frontend):
  - Menetapkan `"packageManager": "bun@1.4.0"`.
  - Menetapkan `"engines": { "bun": ">=1.4.0", "node": "DO_NOT_USE_NODE" }`.
  - Mengaitkan `"preinstall": "bun ./scripts/ensure-bun.ts"` pada root `package.json`.

### 2.3 Konfigurasi Runtime (`bunfig.toml`)
- Mengonfigurasi `bunfig.toml` di root workspace untuk menegakkan opsi install dan runtime Bun.

### 2.4 CI/CD Verification Gate
- Memperbarui GitHub Actions workflow (`ci.yml`, `deploy.yml`) untuk menjalankan step `🔍 Verify Strict Bun Runtime (v1.4+)` menggunakan `bun ./scripts/ensure-bun.ts`.

---

## 3. Konsekuensi

### Positif:
- **Konsistensi Runtime 100%**: Tidak ada lagi risiko kontributor menjalankan `npm install` atau `node` yang menghasilkan `package-lock.json` tak diinginkan.
- **Kecepatan CI/CD & Build**: Memanfaatkan kecepatan eksekusi native Bun untuk testing, linting, dan build.
- **Integrasi Elysia & Svelte 5 Lebih Stabil**: Elysia.js dan Svelte 5 berjalan pada runtime native yang teruji.

### Mitigasi:
- Kontributor yang belum memiliki Bun v1.4+ akan menerima pesan panduan instalasi Bun saat mencoba menjalankan perintah di proyek ini.
