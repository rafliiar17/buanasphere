# 🚀 Portfolio Showcase & Social Media Strategy: Buanasphere

Dokumen ini berisi panduan dan draf materi siap pakai untuk mempublikasikan **Buanasphere** sebagai karya portofolio unggulan di LinkedIn, X (Twitter), GitHub Profile, dan CV/Resume, sekaligus mengajak developer lain untuk berkontribusi.

---

## 1. Draf Postingan LinkedIn (Bahasa Indonesia — Santai, Profesional & Mengundang)

> 💡 **Tips Posting**: Sertakan video demo rekaman layar singkat (15-30 detik) saat memutar bola bumi 3D, beralih antar micro-app (`/kurs` ➔ `/time` ➔ `/quake`), dan membuka drawer inspektur.

```markdown
Memperkenalkan 🌐 Buanasphere — Observatorium Geospatial 3D Planet Bumi Berbasis Edge Computing! 🌍✨

Berawal dari keresahan sulitnya memantau kurs valas dunia secara jujur dan transparan tanpa iklan yang mengganggu, saya membangun Buanasphere dengan filosofi: "Informasi Dulu, Transaksi Belakangan".

Namun, bumi bukan hanya soal valuta asing. Bumi adalah sistem dinamis yang saling terhubung. Dari sana, proyek ini berkembang menjadi observatorium 3D multi-aplikasi dengan 7 micro-apps interaktif:

💱 Kurs World (/kurs) — Nilai tukar 195+ valas vs Rupiah & perbandingan multi-bank real-time.
☀️ TimeWorld (/time) — Rotasi matahari 8-fase diurnal & komparasi jam kantor global vs WIB.
✈️ Flow Corridors (/flight) — Rute 3D arus remitansi devisa pekerja migran ke Indonesia.
🛂 Passport World (/passport) — Indeks mobilitas paspor & syarat visa bagi WNI.
🌿 Nature World (/nature) — Satwa ikonik, flora nasional, & status IUCN di 17 negara megadiverse.
🏛️ World Capitals (/capitals) — Sejarah kemerdekaan 195+ negara & lagu kebangsaan.
🌋 Earthquake Tracker (/quake) — Pemantauan seismik global M4.5+ & cincin episentrum 3D.

🛠️ Arsitektur & Tech Stack:
• Frontend: Svelte 5 (Modern Runes: $state, $derived) + Tailwind CSS v4 + Three.js / Globe.gl dengan custom shader LUT picking.
• Backend: Elysia.js on Cloudflare Workers (latensi <50ms dari ratusan edge locations global).
• Database & Cache: Cloudflare D1 (Edge SQLite) + Cloudflare KV (Stale-While-Revalidate).
• Engineering Rigor: 100% Test-Driven Development (382 automated tests, 0 warnings).

🚀 Coba langsung live demo: https://globe.arafz.id
💻 Repositori Open-Source: https://github.com/rafliiar17/buanasphere

🤝 Ingin Berkolaborasi?
Buanasphere 100% open-source di bawah lisensi MIT! Arsitekturnya dibuat modular (plug-and-play). Teman-teman bisa menambahkan micro-app baru (seperti live tracking satelit ISS, cuaca global, atau jalur kabel internet bawah laut) hanya dalam beberapa baris kode.

Panduan kontribusi sudah lengkap di CONTRIBUTING.md. Feedback, ide, dan Pull Request sangat dinantikan! 🙌

#OpenSource #WebDevelopment #Svelte5 #ThreeJS #CloudflareWorkers #TypeScript #Portfolio #Geospatial
```

---

## 2. Draf Postingan X (Twitter Thread)

```markdown
🧵 1/5 🌍 Akhirnya rilis juga: Buanasphere (globe.arafz.id) — Platform observatorium geospatial 3D planet bumi real-time dengan latensi sub-50ms!

Dari nilai tukar valas vs IDR, rotasi waktu surya, koridor remitansi, hingga pemantauan gempa bumi M4.5+ dalam satu bola bumi 3D interaktif. 👇

2/5 ⚡ Mengapa performanya bisa sangat kencang?
Dibangun di atas:
- Svelte 5 Runes ($state, $derived) untuk zero layout shift
- Three.js + Globe.gl WebGL dengan custom shader color rendering
- Elysia.js di atas Cloudflare Workers & KV SWR caching
- 382 unit tests (TDD) dengan Bun v1.4

3/5 🧩 Fitur 7 Micro-Apps:
• /kurs: Kurs 195+ valas vs Rupiah (BI, BCA, Mandiri, dll)
• /time: 8-fase waktu surya & selisih jam vs WIB
• /flight: Rute 3D remitansi TKI/PMI
• /passport: Akses bebas visa WNI
• /nature: Biodiversitas 17 negara megadiverse
• /capitals: Ibukota & lagu kebangsaan
• /quake: Denyut seismik 3D

4/5 🤝 Proyek ini 100% open-source (MIT License).
Arsitekturnya plug-and-play: kamu bisa membuat observatorium data baru (misal: live orbit satelit ISS, cuaca global, kabel internet bawah laut) dengan mudah!

5/5 🔗 Link:
- Live Demo: https://globe.arafz.id
- GitHub Repo: https://github.com/rafliiar17/buanasphere
- Panduan Kontribusi: https://github.com/rafliiar17/buanasphere/blob/main/CONTRIBUTING.md

Let me know your thoughts & feel free to star / contribute! ⭐
```

---

## 3. Poin Portofolio untuk CV / Resume / LinkedIn Featured

### **Buanasphere — Full-Stack Geospatial 3D Web Application & Edge API**
*(Tech Stack: Svelte 5, TypeScript, Three.js/WebGL, Elysia.js, Cloudflare Workers, Cloudflare D1, Cloudflare KV, Bun)*
- Merancang dan membangun platform visualisasi data bumi 3D interaktif yang menyajikan 7 micro-apps data spasial (keuangan, waktu diurnal, migrasi devisa, biodiversitas, kegempaan).
- Mengimplementasikan arsitektur *Edge-First* dengan Cloudflare Workers dan Elysia.js yang menghasilkan respons API sub-50ms secara global melalui Stale-While-Revalidate (SWR) cache di Cloudflare KV.
- Mengembangkan arsitektur *plug-and-play plugin framework* di atas Svelte 5 Runes dan Three.js dengan custom WebGL GPU shader picking, mengurangi bundle JavaScript awal hingga 40%.
- Menegakkan standar rekayasa perangkat lunak ketat (Test-Driven Development) dengan **382 unit/integration tests**, validasi zero-warning `svelte-check`, dan pipeline CI/CD GitHub Actions.
- Mengelola proyek secara open-source dengan dokumentasi lengkap, 48 Architecture Decision Records (ADR), dan panduan kontribusi komunitas.

---

## 4. Rekomendasi Setup Repositori GitHub

Agar repositori menarik perhatian recruiter dan developer lain:

1. **About / Description di GitHub Repo**:
   > 🌐 Real-time 3D geospatial planetary observatory & intelligence platform built with Svelte 5, Three.js, Elysia.js, and Cloudflare Workers (<50ms Edge Response).
2. **Website URL**: `https://globe.arafz.id`
3. **Repository Topics**:
   `svelte5`, `threejs`, `webgl`, `globe-gl`, `elysiajs`, `cloudflare-workers`, `edge-computing`, `typescript`, `geospatial`, `currencies`, `earthquake-tracker`, `open-source`, `portfolio`
4. **Pin Repository**: Jadikan Buanasphere salah satu dari 6 pinned repositories teratas di profil GitHub Anda.
