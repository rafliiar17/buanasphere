# ARCHITECTURE.md — Kurs World Architecture

Sistem arsitektur, diagram komponen, aliran data, dan standar desain teknis untuk platform **kurs-world** berbasis **Cloudflare Workers**, **Elysia.js**, dan **Svelte 5**.

---

## 1. High-Level Architecture Overview

Platform **kurs-world** dirancang dengan arsitektur serverless edge modern di atas infrastruktur **Cloudflare Workers**. Mengutamakan latensi global rendah (<50ms untuk response ter-cache di edge), skalabilitas otomatis (*zero cold-start*), bundle JavaScript minimal melalui **Svelte 5 (Runes)**, serta integritas data finansial yang tinggi.

```mermaid
flowchart TB
    subgraph ExternalSources [External Data Sources]
        BI[Bank Indonesia Portal/API]
        BCA[BCA Rate Portal]
        MANDIRI[Mandiri Rate Portal]
        BRI[BRI Rate Portal]
        BNI[BNI Rate Portal]
        CIMB[CIMB Niaga Portal]
        ECB[European Central Bank]
        FRED[FRED St. Louis Fed]
    end

    subgraph CloudflarePlatform [Cloudflare Workers Serverless Platform]
        subgraph IngestionCron [Cron Ingestion Worker - Every 15m]
            CronTrigger[Cloudflare Cron Trigger]
            AdapterManager[Provider Ingest Adapters]
            SanityFilter[Anomaly & Sanity Filter]
        end

        subgraph EdgeStorage [Edge Storage & Caching Layer]
            D1[(Cloudflare D1 / Hyperdrive\nTime-Series & Relational)]
            KV[(Cloudflare KV / Edge Cache\nTTL 15m SWR)]
            Quarantine[(D1 Quarantine Store)]
        end

        subgraph ElysiaAPI [Elysia.js Web & API Server]
            Router[Elysia Router / Eden Treaty]
            RateLimiter[Edge Rate Limiter Middleware]
            RateService[Exchange Rate Service]
            ConvertService[Multi-Source Converter Engine]
            CompareService[Bank Comparison Matrix Engine]
            AlertService[Rate Alert Trigger Engine]
        end

        subgraph NotificationPipeline [Notification Dispatcher]
            WebPushWorker[Web Push API Dispatcher]
            EmailWorker[Cloudflare Email Service]
        end
    end

    subgraph Clients [Clients & Consumers]
        WebClient[Svelte 5 App on Cloudflare Pages]
        PublicDevelopers[Third-Party Developers & Apps]
        EndUsers[End-User Alerts & WhatsApp Cards]
    end

    %% Ingestion Flows
    CronTrigger -->|Trigger 15m| AdapterManager
    ExternalSources -->|Fetch via Whitelisted URLs| AdapterManager
    AdapterManager --> SanityFilter
    SanityFilter -->|Anomalous Rates| Quarantine
    SanityFilter -->|Valid Rates Insert| D1
    SanityFilter -->|Invalidate & Write SWR| KV

    %% API Read Flows
    Clients -->|HTTP Requests| Router
    Router --> RateLimiter
    RateLimiter --> RateService
    RateLimiter --> ConvertService
    RateLimiter --> CompareService
    RateLimiter --> AlertService

    RateService -->|Sub-50ms Fast Cache Hit| KV
    RateService -->|Historical Fallback Query| D1

    %% Delivery to Clients
    ElysiaAPI -->|JSON Response| PublicDevelopers
    ElysiaAPI -->|Eden Treaty / JSON| WebClient
    AlertService --> NotificationPipeline
    NotificationPipeline --> EndUsers
```

---

## 2. Ingestion Pipeline & Anomaly Quarantine

Proses pengambilan kurs berjalan setiap 15 menit melalui Cloudflare Worker `scheduled` event:

1. **Provider Adapter Interface (TypeScript)**:
   ```typescript
   export interface RateProvider {
     id: string;
     name: string;
     fetchRates(): Promise<ExchangeRate[]>;
   }
   ```
2. **SSRF Protection & Timeout Guard**:
   * Outbound `fetch()` hanya diizinkan ke domain resmi yang terdaftar di allowlist (`bi.go.id`, `bca.co.id`, `bankmandiri.co.id`, dll.).
   * Menggunakan `AbortSignal.timeout(5000)` (hard limit 5 detik per request).
   * Batasan response body 5 MB untuk efisiensi memori Worker.
3. **Data Sanity & Anomaly Quarantine**:
   * Memastikan `buy_rate > 0`, `sell_rate > 0`, dan `sell_rate >= buy_rate`.
   * Jika nilai kurs melonjak >50% dari snapshot sebelumnya atau terjadi inversi spread, data dialihkan ke tabel `quarantine_rates` di D1 dan mencatat log warning.
4. **Cache Invalidation (SWR)**:
   * Hasil normalisasi disimpan ke Cloudflare D1.
   * Kunci Cloudflare KV di-refresh: `rates:latest:{pair}` dan `rates:matrix:{base}` dengan TTL 15 menit.

---

## 3. Database Schema (Drizzle ORM & Cloudflare D1)

```mermaid
erDiagram
    PROVIDERS ||--o{ EXCHANGE_RATES : publishes
    CURRENCY_PAIRS ||--o{ EXCHANGE_RATES : categorizes
    CURRENCY_PAIRS ||--o{ HISTORICAL_DAILY_RATES : aggregates
    PROVIDERS ||--o{ HISTORICAL_DAILY_RATES : aggregates
    USERS ||--o{ RATE_ALERTS : creates
    CURRENCY_PAIRS ||--o{ RATE_ALERTS : monitors
    DEVELOPERS ||--o{ API_KEYS : owns
    API_KEYS ||--o{ API_USAGE_LOGS : generates

    PROVIDERS {
        text id PK
        text name
        text category
        text website_url
        integer is_active
        integer created_at
    }

    CURRENCY_PAIRS {
        text code PK "e.g. USD/IDR"
        text base_currency "e.g. IDR"
        text quote_currency "e.g. USD"
        text display_name
        integer is_popular
    }

    EXCHANGE_RATES {
        text id PK
        text provider_id FK
        text pair_code FK
        real buy_rate
        real sell_rate
        real mid_rate
        real spread
        integer provider_timestamp
        integer retrieved_at
    }

    HISTORICAL_DAILY_RATES {
        text id PK
        text provider_id FK
        text pair_code FK
        text rate_date
        real open_rate
        real high_rate
        real low_rate
        real close_rate
        real avg_rate
    }

    RATE_ALERTS {
        text id PK
        text user_email
        text web_push_subscription
        text pair_code FK
        text condition "ABOVE / BELOW"
        real target_rate
        integer is_triggered
        integer triggered_at
        integer created_at
    }

    API_KEYS {
        text id PK
        text developer_id FK
        text key_hash
        text key_prefix
        text tier "free / pro / enterprise"
        integer rate_limit_per_minute
        integer is_active
        integer created_at
    }
```

---

## 4. Frontend Architecture (Svelte 5 & shadcn-svelte)

* **Svelte 5 Runes**: Memanfaatkan state management reaktif modern `$state` dan `$derived` untuk instant calculation pada konverter multi-sumber tanpa re-render berlebihan.
* **Component System**: Menggunakan **shadcn-svelte (Bits UI)** untuk komponen UI konsisten, aksesibel, dan elegan.
* **Eden Treaty Client**: Menghubungkan Svelte frontend dengan Elysia backend dengan type-safety penuh secara *compile-time*.
* **Zero CLS Skeletons**: Seluruh komponen asinkron dilengkapi komponen skeleton shimmer presisi.

---

## 5. Edge Caching & Stale-While-Revalidate (SWR)

* **Cloudflare KV**:
  * `rates:latest`: Cache seluruh pasangan mata uang aktif (TTL 15m).
  * `rates:compare:{pair}`: Cache tabel perbandingan per mata uang (TTL 15m).
  * `rates:history:{pair}:{range}`: Cache data histori time-series (TTL 1 jam).
* **Pattern**: Data dikembalikan langsung dari Edge KV (<50ms). Ingestion worker background memperbarui KV secara periodik.

---

## 6. Public Developer API & Edge Rate Limiting

* Framework: **Elysia.js** dengan OpenAPI Swagger otomatis di `/swagger`.
* Client SDK Type-Safety: didukung via **Eden Treaty** untuk integrasi langsung ke frontend TypeScript.
* Autentikasi: Header `X-API-Key: kw_live_...`.
* Rate Limiter: Cloudflare KV sliding-window counter atau Cloudflare Rate Limiting binding:
  * **Free**: 100 req/menit.
  * **Pro**: 1.000 req/menit.
  * **Enterprise**: Custom limit & webhooks.
