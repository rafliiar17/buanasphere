# ADR 0049: Interactive Travel & Auto Zoom-in Camera Animation on 3D Globe

## Status
Accepted

## Context
Pada platform Buanasphere (`kurs-world`), pengguna dapat menjelajahi informasi global melalui aneka aplikasi mikro (*micro-apps*) seperti *Ibukota & Kemerdekaan* (`/ibukota`), *Pusat Kurs Valas* (`/`), *Zona Waktu Global* (`/time`), *Koridor Penerbangan & Remitansi* (`/flight`), *Kekuatan Paspor* (`/passport`), *Flora & Fauna* (`/flora`), dan *Pelacak Gempa Bumi* (`/quake`).

Namun, interaksi antara panel kontrol/filter micro-app dengan kanvas bola dunia 3D WebGL (Three.js / Globe.gl) belum terintegrasi secara visual:
1. Saat pengguna memfilter atau mencari suatu negara (misal mengetik atau memilih **"Malaysia"** pada panel pencarian), sudut pandang kamera bola dunia 3D tetap statis tanpa respons pergerakan kamera.
2. Pengguna mengharapkan pengalaman interaktif yang imersif menyerupai Google Earth atau simulator penerbangan (*flight/travel animation*): kamera secara otomatis terbang dan melakukan *zoom-in* langsung ke negara yang dipilih dengan animasi *zoom-out/zoom-in* (parabolic travel arc).
3. Penekanan tombol `Enter` pada kolom pencarian belum memicu auto-selection pada hasil pencarian teratas.

## Decision
1. **Sinyal Reaktif Universal pada `geoStore` dan `mapState`**:
   - Menambahkan sinyal reaktif `cameraTravelSignal` bertipe `{ iso3: string; timestamp: number } | null` pada `geoStore` dan `mapState`.
   - Setiap pemanggilan `selectCountry(iso3)` atau `travelToCountry(iso3)` secara otomatis memicu pembaruan sinyal ini dengan timestamp baru.
   - Menyediakan fungsi pembantu `travelToCountry(iso3: string)` yang dapat dipanggil langsung secara programatik.

2. **Mesin Animasi Perjalanan Sinematik (*Parabolic Travel Arc*) di `Globe3DView.svelte`**:
   - Menghitung jarak busur lingkaran besar (*great-circle angular distance* in degrees) antara posisi kamera saat ini (`curLat, curLng`) dan koordinat geografis negara target (`targetLat, targetLng`).
   - **Lintasan Dua Tahap untuk Jarak Sedang & Jauh (`d >= 12°`)**:
     - **Tahap 1 (Lift-off & Rotation)**: Kamera mengangkat ketinggian ke luar angkasa (`liftAltitude = Math.min(2.6, Math.max(curAlt, 1.8) + (d / 180) * 0.9)`) sambil memutar bola dunia menuju negara tujuan (durasi ~450ms).
     - **Tahap 2 (Descent & Zoom-in)**: Kamera meluncur turun (*swoop down*) tepat di atas negara target dengan ketinggian fokus proporsional (durasi ~750ms). Total durasi ~1200ms.
   - **Lintasan Satu Tahap untuk Jarak Dekat (`d < 12°`)**:
     - Melakukan *direct smooth swoop* (durasi ~700ms) tanpa zoom-out berlebih untuk mencegah disorientasi visual.
   - Proteksi pembatalan timeout dan tween (`clearTimeout`) untuk menangani klik beruntun (*rapid consecutive clicks*).

3. **Ketinggian Fokus Adaptif (*Adaptive Focus Altitude*)**:
   - Menyesuaikan target `altitude` kamera berdasarkan ukuran dan luas negara:
     - Negara Benua / Raksasa (RUS, CAN, USA, CHN, BRA, AUS): `1.15`
     - Negara Besar (IDN, IND, SAU, MEX, ARG, KAZ): `0.85`
     - Negara Menengah (MYS, THA, VNM, JPN, GBR, DEU, FRA, ESP, ITA, PHL): `0.55`
     - Negara Kepulauan / Kota Kecil (SGP, BHR, MLT, LUX, BRN, QAT): `0.30`
     - Default: `0.60`

4. **Integrasi Keyboard & Interaksi di Semua Micro-App**:
   - Menambahkan event listener `keydown` (`Enter`) pada kolom input pencarian di `UniversalAppControls.svelte`, `KursControls.svelte`, `FlightControls.svelte`, dll., yang otomatis memilih hasil pertama dan memicu travel camera.
   - Mengaitkan klik poligon (`onPolygonClick`) dan klik label 3D (`onLabelClick`) di `Globe3DView.svelte` agar interaksi langsung pada globe juga memicu travel zoom-in yang mulus.
   - Menangani fallback di `WorldRateMap.svelte` agar negara non-kurs tetap memicu `selectCountry` dan travel camera ke koordinat spatial negara tersebut.

## Consequences
- Tampilan bola dunia 3D terasa jauh lebih dinamis, hidup, dan interaktif di seluruh 7+ micro-app.
- Pengguna mendapatkan umpan balik spasial instan saat mencari negara dari belahan bumi mana pun.
- Animasi dua tahap yang terkalkulasi mencegah patah/gerakan kaku dan memberikan sensasi terbang sinematik.
