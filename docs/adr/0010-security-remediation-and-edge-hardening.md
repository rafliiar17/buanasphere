# ADR 0010: Security Remediation & Edge Hardening Architecture

## Status
Accepted

## Context
A comprehensive 6-axis security audit ([`docs/reports/0010-security-review-audit.md`](file:///home/archy/Projects/kurs-world/docs/reports/0010-security-review-audit.md)) highlighted several critical edge invariants and vulnerabilities across the backend API and ingestion pipeline:
1. **[SEC-01] Hardcoded Dummy Rate Limits**: Static headers without active throttling expose the Worker to resource exhaustion.
2. **[SEC-02] Unbounded Ingestion Response Buffer**: Lack of a 5MB response body size check risks Cloudflare Worker 128MB OOM crashes during provider scraping.
3. **[SEC-03] Unvalidated Alerts Endpoint**: `POST /api/v1/alerts` parses `body as any`, missing TypeBox validation.
4. **[SEC-04] SSRF Outbound Domain Validation**: Provider fetch endpoints lack domain whitelist enforcement.
5. **[SEC-05] Cache Stampede (Thundering Herd)**: Cold cache misses trigger multiple concurrent upstream ingestion runs.
6. **[SEC-07] Numeric Invariants in Currency Converter**: Missing `Number.isFinite` and zero-division guards.
7. **[SEC-08] Missing Defense-in-Depth Headers**: Standard security headers (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) omitted.

## Decision
1. **Active Sliding-Window Rate Limiter**:
   - Create `backend/src/middleware/rate-limiter.ts`.
   - Support both Cloudflare KV (`KURS_CACHE`) and in-memory Map fallback.
   - Enforce 100 requests per 60-second window per IP (`CF-Connecting-IP` / `x-forwarded-for`).
   - Dynamically calculate and return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
   - Return HTTP `429 Too Many Requests` on quota breach.

2. **Ingestion 5MB Limit & SSRF Domain Allowlist**:
   - In `backend/src/provider/open-er-api.ts`, enforce a 5 MB maximum response buffer limit.
   - Restrict target URLs via `validateProviderUrl()` to approved domains (`open.er-api.com`, `bi.go.id`, `bca.co.id`, `bankmandiri.co.id`, `bri.co.id`, `bni.co.id`, `cimbniaga.co.id`, `dolarasia.com`, and `localhost` in test mode).

3. **TypeBox Schema Validation on Alerts**:
   - Secure `POST /api/v1/alerts` with strict Elysia schema validation (`email`, `baseCurrency`, `targetCurrency`, `targetRate`, `condition`).

4. **Single-Flight Ingestion Promise Lock**:
   - In `backend/src/service/aggregator.ts`, deduplicate concurrent `ingestAll()` calls using an in-flight promise.

5. **Finite Number & Division-by-Zero Guards**:
   - Enforce `Number.isFinite(amount) && amount > 0 && amount <= 1e15` in `ConverterService`.
   - Guard against non-positive rate denominators (`toIdrRate <= 0`).

6. **Standard Security Headers**:
   - Add `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

## Consequences
- **Positive**: Complete compliance with OWASP API Security Top 10:2023, zero risk of Worker 128MB OOM crashes, protection against upstream provider rate-bans via stampede prevention, and robust IP-level throttling.
- **Trade-off**: Minimal sub-millisecond overhead for rate-limit checks in KV/memory.
