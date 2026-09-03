# ADR 0045: Lightweight Edge Operator Console (/nimda)

## Status
Accepted

## Context
Platform Kurs World telah berkembang menjadi sistem multi-app dengan 7 micro-app terintegrasi, ingestion otomatis data kurs valas, tabel karantina anomali harga (`quarantine_rates`), dan basis data pengembang pihak ketiga (`api_keys`).

Meskipun demikian, operator sistem belum memiliki antarmuka terpusat untuk tugas-tugas kritis operasional harian:
1. Memicu penarikan kurs manual (*force ingest*) secara langsung tanpa menunggu Cron Trigger 15 menit.
2. Melakukan *invalidation/purge* cache global Cloudflare KV saat terjadi koreksi data harga.
3. Memeriksa (*inspect*) dan membersihkan (*dismiss*) data harga yang tertahan di tabel karantina anomali.
4. Menerbitkan dan mengelola API Key pengembang (Free, Pro, Enterprise) berbasis enkripsi hash kriptografis SHA-256.

Pengguna secara spesifik menetapkan bahwa rute antarmuka admin diletakkan di `/nimda` (bentuk obfuskasi dari `admin`) guna meningkatkan keamanan dari pemindaian bot otomatis (*security through obscurity as defense-in-depth layer*).

## Decision
1. **Rute & Jalur Akses (/nimda)**:
   - Frontend console dipasang pada path `/nimda`.
   - Backend API operasional dipasang pada rute `/nimda/*` (dengan alias `/api/nimda/*`).
2. **Autentikasi Header (X-Admin-Key & sessionStorage)**:
   - Proteksi endpoint backend menggunakan middleware `nimdaAuthGuard` yang memvalidasi header `X-Admin-Key` atau `Authorization: Bearer <key>` terhadap `c.env.ADMIN_SECRET_KEY`.
   - Di frontend, pengguna harus memasukkan secret key pada tampilan *Key Gate*. Kunci disimpan secara aman di `sessionStorage` (`kw_nimda_key`) sehingga otomatis musnah saat tab browser ditutup, dan tidak pernah disimpan di `localStorage` ataupun cookies permanen.
3. **Endpoint Operasional Backend**:
   - `GET /nimda/health`: Mengembalikan status database D1, jumlah baris tabel (`rates`, `quarantine`, `api_keys`), status KV, dan timestamp cache memori.
   - `POST /nimda/ingest/trigger`: Menjalankan `AggregatorService.ingestAll()` dan mengembalikan jumlah kurs yang diperbarui serta anomali yang ditemukan.
   - `POST /nimda/cache/purge`: Membersihkan kunci cache `kurs:latest:rates` dari Cloudflare KV.
   - `GET /nimda/quarantine`: Mengambil daftar rekaman karantina dari tabel `quarantine_rates`.
   - `DELETE /nimda/quarantine/:id`: Menghapus rekaman anomali yang telah ditinjau.
   - `GET /nimda/api-keys`: Mengambil daftar API Key pengembang (dengan hash terpotong/tersamarkan).
   - `POST /nimda/api-keys`: Menerbitkan API Key baru bertoken `kw_live_<hex32>` dengan hash SHA-256 yang disimpan di D1.
   - `PATCH /nimda/api-keys/:id/toggle`: Mengubah status aktif/nonaktif (*suspend/activate*).
   - `DELETE /nimda/api-keys/:id`: Menghapus/mencabut API Key.
4. **Antarmuka Pengguna Frontend (shadcn-svelte)**:
   - Dibangun menggunakan komponen resmi `shadcn-svelte`: `Tabs`, `Card`, `Badge`, `Button`, `Input`, `Dialog`.
   - Tampilan 4 Tab:
     - `⚡ Ingestion & Cache`: Indikator koneksi & tombol 1-klik Sync Rates & Purge KV.
     - `🛡️ Quarantine Room`: Tabel anomali kurs dengan alasan penolakan.
     - `🔑 API Keys`: Form pembuat API key baru dan tabel pengelolaan kunci aktif.
     - `🌐 Micro-Apps`: Status pemantauan ke-7 micro-app.

## Consequences
- Operator sistem mendapatkan kendali penuh atas ingest data, cache, karantina anomali, dan API keys langsung dari browser tanpa perlu membuka Cloudflare Dashboard atau terminal CLI.
- Pemilihan rute `/nimda` dan isolasi kunci di `sessionStorage` menjaga keamanan antarmuka dari akses tidak berizin dan pemindaian bot web otomatis.
