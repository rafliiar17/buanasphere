# ADR 0064: Migrasi Fitur Pasar Finansial ke `/kurs` dan Pemurnian Domain `/time`

## Status
Accepted

## Context
Di dalam arsitektur microapps Kurs World, terdapat pemisahan tanggung jawab (*separation of concerns*) antar plugin:
- `/kurs` (`fx-rates`): Mendedikasikan diri pada informasi nilai tukar valas, pasar valas global, perbandingan kurs bank, dan konversi.
- `/time` (`world-time`): Mendedikasikan diri pada jam digital global, zona waktu meridian UTC, spektrum waktu diurnal matahari, dan selisih waktu ke WIB/WITA/WIT.

Namun, sebelumnya komponen `TimeBottomDock.svelte` di `/time` menampilkan widget bertuliskan `Pasar Finansial Dunia:` yang memuat hub keuangan global. Hal ini merupakan anomali *domain boundary leak*: konsep pasar valas dan bursa keuangan seharusnya berada di `/kurs`, sedangkan `/time` seharusnya berfokus murni pada kota-kota utama dunia dan zona waktu.

## Decision
1. **Membuat Engine Sesi Pasar Valas Global (`marketSessions.ts`)**:
   - Mendefinisikan 5 sesi pasar valas utama dunia:
     * Jakarta / BEI & Domestik IDR (08:00 - 16:00 WIB / 01:00 - 09:00 UTC)
     * Sydney / Pasifik AUD (22:00 - 07:00 UTC)
     * Tokyo / Asia JPY (00:00 - 09:00 UTC)
     * London / Eropa GBP-EUR (08:00 - 17:00 UTC) — Pusat Likuiditas Terbesar Dunia
     * New York / Amerika USD (13:00 - 22:00 UTC)
   - Menyediakan fungsi `calculateMarketSessions(date)` yang mengembalikan status live: `isOpen`, jam lokal sesi, jam buka/tutup, dan deteksi `isLondonNewYorkOverlap` (pukul 13:00 - 17:00 UTC saat likuiditas transaksi valas berada di puncaknya).
2. **Memindahkan Ticker Pasar Finansial ke `KursBottomDock.svelte` (`/kurs`)**:
   - Menambahkan strip interaktif `Pasar Valas Global` di BottomDock `/kurs` dengan status `OPEN 🟢` / `CLOSED 🔴`.
   - Mengklik sesi pasar akan memicu fokus kamera globe ke hub finansial terkait.
3. **Memurnikan `TimeBottomDock.svelte` (`/time`)**:
   - Mengubah judul menjadi `Kota Utama Dunia:` (Jam Digital & Zona Waktu Global).
   - Menampilkan kota-kota representatif global: Jakarta 🇮🇩, Tokyo 🇯🇵, London 🇬🇧, New York 🇺🇸, Paris 🇫🇷, Dubai 🇦🇪, Sydney 🇦🇺, Kairo 🇪🇬.
   - Menampilkan waktu lokal, selisih jam ke WIB, dan emoji fase diurnal matahari tanpa terminologi pasar finansial.

## Consequences
### Positif
- Batasan domain (*domain boundary*) antara `/kurs` dan `/time` menjadi bersih dan koheren.
- Pengguna di `/kurs` mendapatkan informasi krusial mengenai sesi pasar valas yang sedang aktif.
- Pengguna di `/time` mendapatkan pengalaman jam dunia yang murni tanpa distorsi konsep finansial.

### Negatif / Trade-offs
- Tidak ada. Seluruh fungsionalitas waktu tetap terjaga penuh di `/time`.
