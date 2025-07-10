# SahabatBK: Aplikasi Konseling Siswa (Full-Stack)

SahabatBK adalah aplikasi web yang dirancang untuk menghubungkan siswa SMP dengan konselor sekolah dalam lingkungan yang aman dan ramah pengguna. Proyek ini berisi arsitektur **full-stack** lengkap:

-   **Frontend:** Aplikasi React yang dibangun dengan Vite.
-   **Backend:** Server Express.js yang menyediakan API.
-   **Database:** MySQL untuk menyimpan data pengguna dan sesi.

## Struktur Proyek

```
/
├── server/               # Backend (Node.js/Express)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── src/                  # Frontend (React/Vite)
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── ...
├── index.html
├── vite.config.ts
├── package.json
└── Readme.md
```
*(File-file mock data seperti `data/mockApi.ts` dan `config.ts` sudah tidak digunakan dan dapat dihapus.)*

## Instruksi Setup dan Menjalankan Aplikasi

Anda perlu menjalankan Backend dan Frontend secara bersamaan di dua terminal terpisah.

---

### Bagian 1: Menjalankan Backend

1.  **Buka Terminal 1** dan masuk ke direktori server.
    ```bash
    cd server
    ```
2.  Instal dependensi backend.
    ```bash
    npm install
    ```
3.  Buat file environment. Salin `server/.env.example` menjadi `server/.env` dan isi dengan kredensial database MySQL Anda.
    ```bash
    cp .env.example .env
    # Buka .env dan edit nilainya
    ```
4.  Pastikan Anda sudah menjalankan setup database sesuai `DatabaseSetup.md`.

5.  Jalankan server backend.
    ```bash
    npm start
    ```
    Server akan berjalan di `http://localhost:3001`. Biarkan terminal ini tetap berjalan.

---

### Bagian 2: Menjalankan Frontend

1.  **Buka Terminal 2** dan pastikan Anda berada di direktori **root** proyek.
2.  Instal dependensi frontend.
    ```bash
    npm install
    ```
3.  Buat file environment untuk frontend di direktori **root**.
    ```bash
    # Buat file baru bernama .env
    ```
    Isi file `.env` tersebut dengan baris berikut:
    ```ini
    VITE_API_URL=http://localhost:3001
    ```
4.  Jalankan server development frontend.
    ```bash
    npm run dev
    ```
    Aplikasi akan tersedia di `http://localhost:5173` (atau port lain yang ditampilkan di terminal). Buka URL ini di browser Anda.

---

### Akun untuk Testing

Anda dapat menggunakan akun berikut untuk login. Password untuk semua akun adalah `password123`.

-   **Siswa:** `budi@siswa.id`
-   **Konselor:** `anisa@konselor.id`
-   **Admin:** `admin@sahabatbk.id`
