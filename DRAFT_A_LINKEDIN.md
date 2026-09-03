# 🌐 Draf A: Postingan LinkedIn & Portfolio Showcase (Buanasphere)

> 💡 **Panduan Penggunaan**:
> 1. Jalankan script capture untuk membuat video demo MP4 & screenshot:
>    ```bash
>    bun scripts/capture-showcase.ts
>    ```
> 2. File video akan tersedia di `captures/videos/showcase-demo.mp4` (durasi ~15 detik).
> 3. Salin teks di bawah ini ke postingan LinkedIn Anda, sertakan video `showcase-demo.mp4` sebagai lampiran media utama!

---

## 📝 Teks Postingan LinkedIn (Salin & Tempel):

Memperkenalkan 🌐 Buanasphere — Observatorium Geospatial 3D Planet Bumi Berbasis Edge Computing! 🌍✨

Berawal dari keresahan sulitnya memantau kurs valas dunia secara jujur dan transparan tanpa iklan yang mengganggu, saya membangun Buanasphere dengan filosofi: "Informasi Dulu, Transaksi Belakangan".

Namun, bumi bukan hanya soal valuta asing. Bumi adalah sistem dinamis yang saling terhubung. Dari sana, proyek ini berkembang menjadi observatorium 3D multi-aplikasi dengan 7 micro-apps interaktif:

💱 Kurs World (/kurs) — Nilai tukar 195+ valas vs Rupiah & perbandingan multi-bank real-time (BI, BCA, Mandiri, dll).
☀️ TimeWorld (/time) — Rotasi matahari 8-fase diurnal & komparasi jam kantor global vs WIB.
✈️ Flow Corridors (/flight) — Rute 3D arus remitansi devisa pekerja migran ke Indonesia.
🛂 Passport World (/passport) — Indeks mobilitas paspor & syarat visa bagi WNI.
🌿 Nature World (/nature) — Satwa ikonik, flora nasional, & status IUCN di 17 negara megadiverse.
🏛️ World Capitals (/capitals) — Sejarah kemerdekaan 195+ negara & lagu kebangsaan.
🌋 Earthquake Tracker (/quake) — Pemantauan seismik global M4.5+ & cincin episentrum 3D.

🛠️ Arsitektur & Tech Stack:
• Frontend: Svelte 5 (Modern Runes: $state, $derived) + Tailwind CSS v4 + Three.js / Globe.gl dengan custom GPU shader LUT picking.
• Backend: Elysia.js on Cloudflare Workers (latensi <50ms dari ratusan edge locations global).
• Database & Cache: Cloudflare D1 (Edge SQLite) + Cloudflare KV (Stale-While-Revalidate).
• Engineering Rigor: 100% Test-Driven Development (380+ automated tests, 0 warnings).

🚀 Coba langsung live demo: https://globe.arafz.id
💻 Repositori Open-Source: https://github.com/rafliiar17/buanasphere

🤝 Ingin Berkolaborasi?
Buanasphere 100% open-source di bawah lisensi MIT! Arsitekturnya dibuat modular (plug-and-play). Teman-teman bisa menambahkan micro-app baru (seperti live tracking satelit ISS, cuaca global, atau jalur kabel internet bawah laut) hanya dalam beberapa baris kode.

Panduan kontribusi sudah lengkap di CONTRIBUTING.md. Feedback, ide, dan Pull Request sangat dinantikan! 🙌

#OpenSource #WebDevelopment #Svelte5 #ThreeJS #CloudflareWorkers #TypeScript #Portfolio #Geospatial

---

## 🎬 Tips Tambahan untuk Engagement Tinggi di LinkedIn:
1. **Lampirkan Video MP4**: Postingan dengan video demo native di LinkedIn mendapatkan impresi **3x hingga 5x lebih tinggi** daripada screenshot statis atau link tautan murni.
2. **Komentar Pertama**: Tulis komentar pertama Anda sendiri dengan link ke `https://globe.arafz.id` dan link GitHub issue: *"Untuk teman-teman yang ingin contribute, bisa cek Good First Issues di GitHub ya! Link repo ada di atas 👆"*.
3. **Waktu Terbaik Posting**: Selasa atau Kamis, pukul 08:30–10:00 pagi WIB atau 17:00–19:00 sore WIB.
