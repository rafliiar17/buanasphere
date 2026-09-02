# ADR 0030: Cloudflare Edge Dev Proxy & Svelte 5 Unidirectional Input Bindings

## Status
**Accepted**

## Context & Problem Statement
1. Di lingkungan frontend dev (`localhost:5173`), Vite dikonfigurasi untuk mem-proxy `/api` ke `http://localhost:8787`. Jika backend lokal tidak dijalankan bersamaan, browser menampilkan kegagalan jaringan `net::ERR_CONNECTION_REFUSED` pada DevTools Console.
2. Di `MapControlsToolbar.svelte`, input field menggunakan `bind:value={mapState.searchQuery}` dan `bind:value={mapState.convertAmount}` padahal properti objek dilewatkan via props, memicu warning konsol `[svelte] binding_property_non_reactive`.

## Decision Drivers
- **Zero Configuration DX**: Developer yang menjalankan `bun run dev` di frontend otomatis terhubung ke live Edge API tanpa perlu memelihara worker lokal jika tidak sedang memodifikasi backend.
- **Clean Svelte 5 Data Flow**: Menggunakan *unidirectional binding* (`value={...}` + `oninput={...}`) untuk mencegah warning non-reactive binding dan menjaga alur data yang eksplisit dan prediktif.

## Architecture Decisions

### 1. Edge-First Dev Proxy di `vite.config.ts`
- Mengarahkan default target proxy `/api` ke endpoint Cloudflare Workers produksi: `https://kurs-world-api.rafztesting.workers.dev`.
- Tetap mendukung backend lokal dengan membaca environment variable `VITE_API_URL` jika didefinisikan (`VITE_API_URL=http://localhost:8787`).

### 2. Unidirectional Input Bindings di `MapControlsToolbar.svelte`
- Mengubah:
  ```svelte
  <!-- Search Input -->
  <input
    value={mapState.searchQuery}
    oninput={(e) => {
      mapState.searchQuery = (e.target as HTMLInputElement).value;
      mapState.isSearchDropdownOpen = true;
      mapState.highlightedIndex = 0;
    }}
  />

  <!-- Convert Amount Input -->
  <input
    type="number"
    value={mapState.convertAmount}
    oninput={(e) => {
      mapState.convertAmount = Number((e.target as HTMLInputElement).value) || 0;
    }}
  />
  ```

## Consequences
- **Positif**:
  - `ERR_CONNECTION_REFUSED` di konsol browser hilang total saat frontend dev server dijalankan.
  - Svelte 5 warning `binding_property_non_reactive` 100% tereliminasi.
  - Data kurs real-time tetap mengalir mulus dengan status `200 OK`.
