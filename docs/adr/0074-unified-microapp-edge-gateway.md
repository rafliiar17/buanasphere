# ADR 0074: Unified Edge API Gateway (/api/v1/gateway) untuk Ingestion dan BFF Seluruh Microapps BuanaSphere

## Status
Accepted

## Context
Seiring berkembangnya platform observatorium planet BuanaSphere menjadi wadah multi-microapp (`/kurs`, `/quake`, `/population`, `/flight`, `/time`, `/passport`, `/nature`, `/capitals`, `/nimda`), terdapat disparitas dalam cara frontend mengambil data:
1. **Direct Client-side Fetch ke Pihak Ketiga**: Microapp `/quake` (USGS & BMKG) dan `/population` (World Bank) memanggil API pihak ketiga langsung dari browser pengguna. Hal ini memicu potensi masalah CORS (terutama BMKG), ketiadaan server-side edge caching, ketergantungan jaringan client, serta ketiadaan proteksi SSRF.
2. **Skalabilitas Penambahan Microapp di Backend**: Jika setiap microapp baru mengharuskan penambahan route HTTP baru di Elysia (`/api/v1/quake`, `/api/v1/population`, `/api/v1/flight`, dll.), routing Elysia akan membengkak (*route bloat*) dan membutuhkan pemeliharaan route berulang kali setiap ada penambahan fitur/microapp.
3. **Kebutuhan Single Dispatcher**: Pengguna menghendaki satu pintu gerbang terpadu (*Unified API Gateway*) di mana penambahan microapp baru di masa depan tidak memerlukan penambahan endpoint HTTP baru.

## Decision
1. **Membangun Unified Edge API Gateway (`/api/v1/gateway`)**:
   - Di Backend Elysia.js (`backend/src/routes/gateway.ts`), sediakan endpoint tunggal:
     - `GET /api/v1/gateway`: Katalog discovery seluruh microapp yang terdaftar beserta dokumentasi parameternya.
     - `GET /api/v1/gateway/:app`: Dispatcher dinamis berbasis path parameter dan query string. Memungkinkan browser & Cloudflare CDN me-cache respons secara otomatis menggunakan Cloudflare KV (`gateway:<app>:<param_hash>`).
     - `POST /api/v1/gateway`: Dispatcher untuk permintaan batch (`{ batch: [...] }`) atau query dinamis payload besar.
2. **Pola Modular `MicroappRegistry` di Backend (`backend/src/gateway/`)**:
   - Menerapkan arsitektur plugin handler (`MicroappHandler`) yang independen dari layer routing:
     ```ts
     export interface MicroappHandler {
       id: string;
       name: string;
       description: string;
       cacheTtlSeconds?: number;
       handle: (params: Record<string, any>, env?: Env) => Promise<any>;
     }
     ```
   - Setiap microapp memiliki handler terisolasi:
     - `quakeHandler`: Mengambil & menggabungkan data USGS FDSN dan BMKG Autogempa/Dirasakan (TTL 3 menit).
     - `populationHandler`: Mengambil data indikator demografi World Bank (TTL 1 jam).
     - `flightHandler`, `timeHandler`, `passportHandler`, `natureHandler`, `capitalsHandler`: Menyajikan data spasial terstruktur on-demand (TTL 24 jam) untuk mereduksi ukuran bundle frontend.
   - Pendaftaran handler baru cukup memanggil `microappRegistry.register(handler)` tanpa mengubah routes Elysia.
3. **Frontend Gateway Client (`ApiClient.gateway`)**:
   - Memperbarui `ApiClient` di `frontend/src/lib/api/client.ts` dengan metode universal:
     `apiClient.gateway<T>(app: string, params?: Record<string, any>): Promise<T>`
   - Memutakhirkan `liveEarthquakeService.ts` dan `livePopulationService.ts` untuk menggunakan gateway backend, dengan mempertahankan fallback ke data lokal jika koneksi backend offline.

## Consequences
### Positif
- **Zero Route Maintenance**: Penambahan microapp baru di masa depan cukup membuat 1 file handler baru tanpa mengubah kode routing Elysia.
- **100% Bebas CORS & Terlindungi**: Seluruh traffic ke pihak ketiga diarahkan via Cloudflare Workers dengan kontrol timeout ketat (5 detik) dan domain allowlist.
- **Edge Caching Maksimal**: Respon di-cache pada Cloudflare KV di edge data center seluruh dunia (<50ms latensi) sehingga meminimalkan beban ke server USGS, BMKG, dan World Bank.
- **Frontend Bundle Ringan**: Dataset statis besar tidak perlu dibundle seluruhnya ke dalam file JavaScript browser; data dapat dimuat secara on-demand via gateway.
- **Batch Support**: Mendukung pemanggilan data beberapa microapp sekaligus dalam 1 roundtrip network call via `POST /api/v1/gateway`.

### Negatif / Trade-offs
- Sedikit abstraksi tambahan pada layer dispatcher gateway di backend, diimbangi dengan struktur modular dan pengujian unit terpisah untuk setiap handler.
