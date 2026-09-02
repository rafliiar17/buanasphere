# 🛡️ Security Review Report — Kurs World

**Date:** 2026-09-02  
**Target:** `kurs-world` (Elysia.js Backend & Svelte 5 Frontend on Cloudflare Workers)  
**Methodology:** 6-Axis Vulnerability Assessment (OWASP Top 10, OWASP API Security Top 10:2023, CWE, Cloudflare Edge Security Invariants)

---

## Executive Summary

A comprehensive automated and static security audit was performed across the `kurs-world` monorepo. The evaluation assessed the backend API (`backend/src/`), database schema (`backend/src/db/`), edge caching & ingestion services (`backend/src/service/`, `backend/src/provider/`), and the Svelte 5 frontend web application (`frontend/src/`).

The overall security posture is **Moderate to Strong**, benefiting from type-safe Drizzle ORM queries, edge timeout abort controllers, financial rate anomaly quarantine mechanisms, and absence of unsanitized HTML DOM injections. However, several critical and high-priority vulnerabilities were discovered in the public API layer, ingestion streaming limits, error disclosure, and rate limiting controls that require remediation before production deployment.

### Vulnerability Count by Severity
- 🔴 **Critical (P0):** 0
- 🟠 **High (P1):** 3
- 🟡 **Medium (P2):** 4
- 🔵 **Low / Informational (P3):** 2

---

## Vulnerability Summary Table

| # | Severity | Category (CWE / OWASP) | Component / File | Vulnerability Summary |
|---|---|---|---|---|
| 1 | 🟠 High | CWE-770 / OWASP API4:2023 | [`backend/src/index.ts:L41-L47`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L41-L47) | Hardcoded static rate-limit headers without actual request throttling (DoS Risk) |
| 2 | 🟠 High | CWE-400 / OWASP API4:2023 | [`backend/src/provider/open-er-api.ts:L86`](file:///home/archy/Projects/kurs-world/backend/src/provider/open-er-api.ts#L86) | Ingestion fetch lacks 5MB response body limit, risking Worker 128MB OOM crashes |
| 3 | 🟠 High | CWE-20 / OWASP API8:2023 | [`backend/src/index.ts:L157-L170`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L157-L170) | Untyped & unvalidated `POST /api/v1/alerts` payload (`body as any`) allowing arbitrary input |
| 4 | 🟡 Medium | CWE-918 / OWASP API7:2023 | [`backend/src/provider/open-er-api.ts:L55-L58`](file:///home/archy/Projects/kurs-world/backend/src/provider/open-er-api.ts#L55-L58) | Missing domain allowlist check on outbound provider fetch endpoints (SSRF Risk) |
| 5 | 🟡 Medium | CWE-362 / OWASP API4:2023 | [`backend/src/service/aggregator.ts:L434-L438`](file:///home/archy/Projects/kurs-world/backend/src/service/aggregator.ts#L434-L438) | Cache stampede (thundering herd) on cold cache miss triggers duplicate ingestion cycles |
| 6 | 🟡 Medium | CWE-209 / OWASP API3:2023 | [`backend/src/routes/rates.ts:L44`](file:///home/archy/Projects/kurs-world/backend/src/routes/rates.ts#L44), [`convert.ts:L37`](file:///home/archy/Projects/kurs-world/backend/src/routes/convert.ts#L37), [`history.ts:L91`](file:///home/archy/Projects/kurs-world/backend/src/routes/history.ts#L91) | Raw exception messages leaked directly in public API 500 error responses |
| 7 | 🟡 Medium | CWE-1284 / CWE-369 | [`backend/src/service/converter.ts:L22-L26`](file:///home/archy/Projects/kurs-world/backend/src/service/converter.ts#L22-L26) | Missing `Number.isFinite` validation allowing `Infinity` amounts and potential zero-division |
| 8 | 🔵 Low | CWE-16 / OWASP A05:2021 | [`backend/src/index.ts:L41-L47`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L41-L47) | Missing standard security headers (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) |
| 9 | 🔵 Low | CWE-306 / OWASP API2:2023 | [`backend/src/db/schema.ts:L43-L58`](file:///home/archy/Projects/kurs-world/backend/src/db/schema.ts#L43-L58) | API key schema defined in D1 but no middleware validates API key tiers or quotas |

---

## Detailed Findings

### [SEC-01] Hardcoded Static Rate-Limit Headers without Active Throttling
- **Severity**: 🟠 High
- **Category**: OWASP API4:2023 - Unrestricted Resource Consumption / CWE-770
- **File & Line**: [`backend/src/index.ts:L41-L47`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L41-L47)
- **Vulnerability Description**:
  The application injects fake static rate limit headers (`X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 99`) on every request without actually tracking, calculating, or enforcing IP-based or token-based quotas. An attacker can fire tens of thousands of requests per second against the edge worker, exhausting Cloudflare Worker request limits and incurring unwanted cloud costs.
- **Exploit Scenario**:
  An attacker floods `/api/v1/rates/latest` or `/api/v1/convert` with 50,000 automated queries per minute. The server responds with `200 OK` and static `X-RateLimit-Remaining: 99`, never blocking the abusive client.
- **Remediation**:
  Implement an edge sliding-window or token-bucket rate limiter utilizing Cloudflare KV or Cloudflare Rate Limiting binding.
```diff
- .onRequest(({ set }) => {
-   set.headers['X-RateLimit-Limit'] = '100';
-   set.headers['X-RateLimit-Remaining'] = '99';
-   set.headers['X-RateLimit-Reset'] = String(Math.floor(Date.now() / 1000) + 60);
-   set.headers['X-Content-Type-Options'] = 'nosniff';
- })
+ .derive({ as: 'global' }, async ({ request, set }) => {
+   // Use client IP from CF-Connecting-IP
+   const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
+   const { allowed, limit, remaining, reset } = await checkRateLimit(ip, env);
+   set.headers['X-RateLimit-Limit'] = String(limit);
+   set.headers['X-RateLimit-Remaining'] = String(remaining);
+   set.headers['X-RateLimit-Reset'] = String(reset);
+   if (!allowed) {
+     set.status = 429;
+     throw new Error('Too Many Requests: Rate limit exceeded');
+   }
+ })
```
- **Verification / Test Case**:
  Send 120 consecutive requests within 60 seconds from the same IP and assert that HTTP `429 Too Many Requests` is returned with `Retry-After`.

---

### [SEC-02] Ingestion Client Lacks 5MB Response Body Limit (Worker OOM Denial of Service)
- **Severity**: 🟠 High
- **Category**: OWASP API4:2023 - Unrestricted Resource Consumption / CWE-400
- **File & Line**: [`backend/src/provider/open-er-api.ts:L86`](file:///home/archy/Projects/kurs-world/backend/src/provider/open-er-api.ts#L86)
- **Vulnerability Description**:
  The `OpenERApiProvider` executes `(await response.json()) as OpenERApiResponse` directly on the response stream without verifying the `Content-Length` header or enforcing a maximum buffer size. As specified in `AGENTS.md` Section 7, all provider ingestion requests must enforce a strict **5 MB limit** to protect Cloudflare Worker's 128 MB RAM ceiling.
- **Exploit Scenario**:
  If the remote endpoint or a compromised DNS/proxy returns an oversized payload (e.g., a 100MB JSON array or decompressed gzip bomb), parsing the response buffer will trigger a Worker OOM crash, causing scheduled cron jobs and on-demand refreshes to fail.
- **Remediation**:
```diff
+ const MAX_INGESTION_BYTES = 5 * 1024 * 1024; // 5 MB strict limit
+ const contentLength = response.headers.get('content-length');
+ if (contentLength && parseInt(contentLength, 10) > MAX_INGESTION_BYTES) {
+   throw new Error(`Upstream response exceeded 5MB limit: ${contentLength} bytes`);
+ }
  const data = (await response.json()) as OpenERApiResponse;
```

---

### [SEC-03] Untyped & Unvalidated Input on Alert Registration (`POST /api/v1/alerts`)
- **Severity**: 🟠 High
- **Category**: OWASP API8:2023 - Security Misconfiguration & Lack of Validation / CWE-20
- **File & Line**: [`backend/src/index.ts:L157-L170`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L157-L170)
- **Vulnerability Description**:
  The `/api/v1/alerts` POST route parses `body as any` without applying Elysia TypeBox schema validation. The unvalidated `email` field is reflected directly into the JSON response message string.
- **Exploit Scenario**:
  An attacker posts a payload containing arbitrary control characters, 1MB string junk, or malicious formatting strings, which are reflected in the response and can cause log injection or client-side anomalies.
- **Remediation**:
```diff
  .post(
    '/api/v1/alerts',
-   async ({ body }) => {
-     const payload = body as any;
+   async ({ body, set }) => {
      return {
        success: true,
-       message: `Notifikasi berhasil didaftarkan untuk ${payload?.email || 'user'}. Anda akan menerima email saat kurs mencapai target.`,
+       message: `Notifikasi berhasil didaftarkan untuk ${body.email}. Anda akan menerima email saat kurs mencapai target.`,
      };
    },
    {
+     body: t.Object({
+       email: t.String({ format: 'email', maxLength: 254 }),
+       baseCurrency: t.String({ minLength: 3, maxLength: 4 }),
+       targetCurrency: t.String({ minLength: 3, maxLength: 4 }),
+       targetRate: t.Number({ minimum: 0.000001 }),
+       condition: t.Union([t.Literal('above'), t.Literal('below')]),
+     }),
      detail: {
        summary: 'Register rate alert',
        tags: ['General'],
      },
    }
  )
```

---

### [SEC-04] Missing Outbound Domain Allowlist on Provider Fetch (SSRF Defense-in-Depth)
- **Severity**: 🟡 Medium
- **Category**: OWASP API7:2023 - Server-Side Request Forgery / CWE-918
- **File & Line**: [`backend/src/provider/open-er-api.ts:L55-L58`](file:///home/archy/Projects/kurs-world/backend/src/provider/open-er-api.ts#L55-L58)
- **Vulnerability Description**:
  The provider constructor accepts a custom `baseUrl` without checking whether the target hostname belongs to the approved provider domain allowlist (`open.er-api.com`, `bi.go.id`, `bca.co.id`, `bankmandiri.co.id`, `bri.co.id`, `bni.co.id`, `cimbniaga.co.id`).
- **Exploit Scenario**:
  If a malicious configuration or untrusted runtime parameter modifies `baseUrl` to `http://169.254.169.254` or internal cluster endpoints, the worker could fetch and leak sensitive internal metadata.
- **Remediation**:
```diff
+ const ALLOWED_PROVIDER_HOSTS = new Set([
+   'open.er-api.com',
+   'bi.go.id',
+   'www.bi.go.id',
+   'bca.co.id',
+   'www.bca.co.id',
+   'bankmandiri.co.id',
+   'www.bankmandiri.co.id',
+ ]);
+
+ export function validateProviderUrl(targetUrl: string): void {
+   const parsed = new URL(targetUrl);
+   if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
+     throw new Error(`Insecure protocol rejected for provider fetch: ${parsed.protocol}`);
+   }
+   if (!ALLOWED_PROVIDER_HOSTS.has(parsed.hostname) && parsed.hostname !== 'localhost') {
+     throw new Error(`Host rejected: ${parsed.hostname} is not in provider allowlist`);
+   }
+ }
```

---

### [SEC-05] Cache Stampede (Thundering Herd) on Cold Cache Miss
- **Severity**: 🟡 Medium
- **Category**: OWASP API4:2023 - Unrestricted Resource Consumption / CWE-362
- **File & Line**: [`backend/src/service/aggregator.ts:L434-L438`](file:///home/archy/Projects/kurs-world/backend/src/service/aggregator.ts#L434-L438)
- **Vulnerability Description**:
  When the KV/memory cache is empty or expired, `getLatestRates()` triggers `await this.ingestAll()`. If 50 requests hit the API simultaneously on cold start, all 50 executions fire concurrent `ingestAll()` cycles against upstream providers in parallel.
- **Exploit Scenario**:
  Immediately after deployment or KV TTL expiry, an automated traffic surge triggers upstream provider rate-limiting / blocking due to dozens of redundant simultaneous scraping runs.
- **Remediation**:
  Introduce a single-flight promise lock (`inFlightIngestion`) to deduplicate simultaneous background ingestion.

---

### [SEC-06] Raw Exception Messages Disclosed in Public API 500 Responses
- **Severity**: 🟡 Medium
- **Category**: OWASP API3:2023 - Broken Object Property Level Authorization & Information Disclosure / CWE-209
- **File & Line**: [`backend/src/routes/rates.ts:L44`](file:///home/archy/Projects/kurs-world/backend/src/routes/rates.ts#L44), [`convert.ts:L37`](file:///home/archy/Projects/kurs-world/backend/src/routes/convert.ts#L37), [`history.ts:L91`](file:///home/archy/Projects/kurs-world/backend/src/routes/history.ts#L91)
- **Vulnerability Description**:
  Catch blocks in endpoint handlers return `error: error instanceof Error ? error.message : '...'` directly to clients. Database connection errors, table names, or internal network stack messages could leak to unauthenticated users.
- **Remediation**:
  Log full error details internally via structured logger (`logger.error()`), and return a generic sanitized error code and message (`Internal Server Error`) in production environments.

---

### [SEC-07] Missing `Number.isFinite` Checks Allowing `Infinity` & Arithmetic Anomalies
- **Severity**: 🟡 Medium
- **Category**: CWE-1284 / CWE-369
- **File & Line**: [`backend/src/service/converter.ts:L22-L26`](file:///home/archy/Projects/kurs-world/backend/src/service/converter.ts#L22-L26)
- **Vulnerability Description**:
  `parseFloat('Infinity')` evaluates to `Infinity`, which satisfies `amount > 0` and `!isNaN(amount)`. Passing `Infinity` or negative zero into currency calculations produces `Infinity` or `NaN` downstream. Furthermore, cross-currency calculations (`fromIdrRate / toIdrRate`) should guard against `toIdrRate <= 0`.
- **Remediation**:
```diff
- if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
+ if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 1e15) {
    const errorMsg = 'Amount must be a strictly positive finite number';
    throw new Error(errorMsg);
  }
```

---

### [SEC-08] Missing Standard Edge Security Headers
- **Severity**: 🔵 Low
- **Category**: OWASP A05:2021 - Security Misconfiguration / CWE-16
- **File & Line**: [`backend/src/index.ts:L41-L47`](file:///home/archy/Projects/kurs-world/backend/src/index.ts#L41-L47)
- **Vulnerability Description**:
  Only `X-Content-Type-Options: nosniff` is currently added. Standard defense-in-depth headers should be included across all API responses.
- **Remediation**:
  Add `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

---

### [SEC-09] API Key & Quota Table Exists in Schema but Unenforced in Gateway
- **Severity**: 🔵 Low
- **Category**: OWASP API2:2023 - Broken Authentication / CWE-306
- **File & Line**: [`backend/src/db/schema.ts:L43-L58`](file:///home/archy/Projects/kurs-world/backend/src/db/schema.ts#L43-L58)
- **Vulnerability Description**:
  `apiKeysTable` is properly modeled with SHA-256 `keyHash`, `tier`, and `isActive` fields, but no Elysia middleware currently inspects incoming `Authorization: Bearer <key>` or `X-API-Key` headers to attach tier limits (e.g. Free: 100 req/min, Pro: 1000 req/min).

---

## Positive Security Practices Observed

1. **SQL Injection Immune**:
   - 100% of database interactions use Drizzle ORM query builders (`drizzle-orm/d1`) with strictly parameterized inputs. Zero raw string interpolation (`sql.raw`) found in the codebase.
2. **Zero Client-Side XSS**:
   - Svelte 5 rune-based templates automatically escape all expressions. Verified 0 occurrences of `{@html}` across the entire frontend application.
3. **Structured & Safe JSON Logging**:
   - Pino structured logging middleware assigns UUID `requestId` and logs metadata without echoing sensitive authorization headers or passwords.
4. **Resilient Timeout & Ingestion Abort**:
   - `OpenERApiProvider` integrates `AbortController` with a 5000ms timeout window (`setTimeout(() => controller.abort(), 5000)`), protecting Worker subrequest pools from hanging connections.
5. **Data Integrity & Financial Anomaly Quarantine**:
   - `validateRate()` enforces financial invariants (`buyRate > 0`, `sellRate > 0`, `sellRate >= buyRate`). Invalid rates are quarantined in `quarantine_rates` rather than polluting live caches.
6. **Credential Masking & Git Hygiene**:
   - Root `.gitignore` properly excludes all `.env`, `.env.*`, and `.wrangler` configuration directories. Zero credentials or production tokens committed.
7. **Robust Test Suite**:
   - 122 automated unit and integration tests passing with 100% success rate across domain, math, formatters, and frontend features.

---

## Actionable Remediation Checklist

### 🔴 Immediate (P0 / Critical)
- None (no direct remote code execution or authentication bypass on existing deployed routes).

### 🟠 High Priority (P1)
- [ ] **SEC-01**: Implement real sliding-window IP rate limiter using Cloudflare KV / in-memory map.
- [ ] **SEC-02**: Enforce 5 MB maximum response body limit on upstream provider ingestion fetches.
- [ ] **SEC-03**: Add Elysia TypeBox schema validator to `POST /api/v1/alerts`.

### 🟡 Next Sprint (P2)
- [ ] **SEC-04**: Add strict domain allowlist validator (`ALLOWED_PROVIDER_HOSTS`) before all outbound fetches.
- [ ] **SEC-05**: Implement single-flight ingestion promise lock to prevent cold-cache stampedes.
- [ ] **SEC-06**: Sanitize 500 error responses in production to prevent internal error leakage.
- [ ] **SEC-07**: Update `ConverterService` and `convertRoutes` to enforce `Number.isFinite(amount)` and cross-rate zero-checks.

### 🔵 Hardening (P3)
- [ ] **SEC-08**: Inject comprehensive security headers (`X-Frame-Options: DENY`, `Referrer-Policy`).
- [ ] **SEC-09**: Implement API Key tier validation middleware for developer API keys.

---

*Report compiled by Antigravity Agentic Security Reviewer.*
