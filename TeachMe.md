# Tutorial: Mengubah SahabatBK Menjadi Aplikasi Produksi (Full-Stack)

Halo! Dokumen ini akan memandu Anda secara langkah-demi-langkah untuk mengubah aplikasi demo SahabatBK yang saat ini berjalan di *frontend* saja dengan data *mock* (palsu), menjadi sebuah aplikasi *full-stack* yang siap untuk produksi.

Tujuan kita adalah:
1.  **Backend:** Menjalankan server Node.js (Express) yang terhubung ke database MySQL sungguhan.
2.  **Frontend:** Menggunakan `npm` dan *build tool* (Vite) untuk mengelola *dependency* dan mengoptimalkan aplikasi React.
3.  **Integrasi:** Menghubungkan Frontend dan Backend agar bisa berkomunikasi melalui API.

---

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut:

1.  **Node.js dan npm:** Kunjungi [nodejs.org](https://nodejs.org/) untuk mengunduh dan menginstalnya.
2.  **Server MySQL:** Anda bisa menggunakan XAMPP, WAMP, MAMP, atau instalasi MySQL langsung.
3.  **Code Editor:** Visual Studio Code (sangat direkomendasikan).
4.  **Terminal/Command Prompt:** Bawaan dari sistem operasi Anda.

---

## Langkah 1: Menyiapkan Backend (Server & Database)

Bagian ini fokus pada direktori `server/`. Kita akan membuatnya berfungsi penuh.

### 1.1. Setup Database

1.  Buka `DatabaseSetup.md` dan ikuti instruksi di dalamnya untuk membuat database `sahabatbk`.
2.  Setelah itu, jalankan skrip SQL dari file `DatabaseScript.md` untuk membuat tabel dan data awal.

### 1.2. Instalasi Dependensi Server

1.  Buka terminal baru dan masuk ke direktori `server`:
    ```bash
    cd server
    ```
2.  Instal semua dependensi yang dibutuhkan oleh server:
    ```bash
    npm install
    ```

### 1.3. Konfigurasi Environment Server

1.  Di dalam direktori `server/`, buat file baru bernama `.env`.
2.  Isi file `.env` dengan format berikut, sesuaikan nilainya dengan konfigurasi database Anda:

    ```ini
    # Konfigurasi Database
    DB_HOST=localhost
    DB_USER=root # atau user yang Anda buat
    DB_PASSWORD= # isi password database Anda
    DB_NAME=sahabatbk

    # Konfigurasi Aplikasi & Keamanan
    PORT=3001
    JWT_SECRET=ganti-dengan-string-acak-yang-sangat-panjang-dan-aman
    ```
    > **PENTING:** Ganti nilai `JWT_SECRET` dengan string acak yang sangat panjang dan sulit ditebak.

### 1.4. Menjalankan Server Backend

1.  Pastikan Anda masih berada di direktori `server/` di terminal Anda.
2.  Jalankan server dengan perintah:
    ```bash
    npm start
    ```
3.  Jika berhasil, Anda akan melihat pesan: `Server running on port 3001`. Biarkan terminal ini tetap berjalan.

**Selamat! Backend Anda sekarang aktif.**

---

## Langkah 2: Menyiapkan Frontend (Aplikasi React)

Sekarang kita akan beralih ke lingkungan `npm` profesional menggunakan **Vite**.

### 2.1. Hapus File Lama

Untuk menghindari konflik, **hapus file-file berikut** dari proyek Anda:
- `data/mockApi.ts`

### 2.2. Instalasi Dependensi Frontend

1.  Buka terminal **kedua** (biarkan terminal server tetap berjalan).
2.  Pastikan Anda berada di direktori **root** proyek (bukan di dalam `server/`).
3.  Jika Anda belum punya `package.json` di root, buat satu. Kemudian, instal dependensi frontend:
    ```bash
    npm install
    ```
    *(Perintah ini akan menginstal semua package yang ada di file `package.json` yang telah saya sediakan).*

### 2.3. Konfigurasi Environment Frontend

1.  Di direktori **root**, buat file baru `.env`.
2.  Isi dengan URL server backend Anda:
    ```ini
    VITE_API_URL=http://localhost:3001
    ```
    > **PENTING:** Variabel environment di Vite harus diawali dengan `VITE_`.

---

## Langkah 3: Menjalankan Aplikasi Full-Stack

Sekarang kedua bagian (frontend dan backend) sudah siap.

1.  **Terminal 1 (Backend):** Pastikan server masih berjalan di direktori `server/`.
    ```bash
    # di dalam direktori server/
    npm start
    ```
2.  **Terminal 2 (Frontend):** Jalankan *development server* Vite dari direktori **root**:
    ```bash
    # di dalam direktori root
    npm run dev
    ```
3.  Vite akan memberikan URL, biasanya `http://localhost:5173`. Buka URL ini di browser Anda.

Aplikasi SahabatBK sekarang harusnya berjalan, tetapi kali ini ia mengambil dan mengirim data ke server backend Anda, yang terhubung ke database MySQL. Coba login menggunakan akun yang ada di `DatabaseScript.md` (password: `password123`).

---

## Langkah 4: Tambahan - Reset Password Manual (via Command Line)

Jika Anda perlu mereset password seorang pengguna secara manual (misalnya, jika pengguna lupa password dan fitur pemulihan otomatis belum ada), Anda dapat membuat *hash* password baru dan menyimpannya langsung ke database.

`server/PassGen.js` adalah script utilitas yang dibuat untuk tujuan ini.

### 4.1. Generate Hash Password Baru

1.  Buka terminal dan masuk ke direktori `server`:
    ```bash
    cd server
    ```
2.  Jalankan script `PassGen.js`. Untuk membuat hash dari password standar `password123`, jalankan:
    ```bash
    node PassGen.js
    ```
3.  Jika Anda ingin menggunakan password lain, tambahkan sebagai argumen:
    ```bash
    node PassGen.js password_baru_yang_aman
    ```
4.  Terminal akan menampilkan output berupa hash yang panjang, contohnya:
    ```
    ✅ Generated Bcrypt Hash:
    $2a$10$E.mveN/G0Di/9Y22Po9fyeSgvoBvL/lTsy.PUN4oRjJcXtGgNIpEa
    ```
5.  **Salin (copy)** hash yang dihasilkan tersebut.

### 4.2. Update Password di Database

1.  Buka alat manajemen database Anda (misalnya PHPMyAdmin).
2.  Pilih database `sahabatbk` dan buka tabel `users`.
3.  Cari pengguna yang passwordnya ingin Anda reset, lalu klik **"Edit"**.
4.  Cari kolom `password_hash`.
5.  **Tempel (paste)** hash yang sudah Anda salin tadi ke dalam kolom ini, menimpa hash yang lama.
6.  Klik **"Go"** atau **"Save"** untuk menyimpan perubahan.

Pengguna tersebut sekarang dapat login menggunakan password baru yang Anda setel (`password123` atau password custom Anda).

---

## Kesimpulan

Anda telah berhasil mengubah aplikasi demo menjadi aplikasi full-stack yang siap produksi. Anda sekarang memiliki:
-   Backend Express.js yang melayani API.
-   Database MySQL yang menyimpan data.
-   Frontend React yang dibangun dengan Vite.
-   Sistem otentikasi berbasis JWT.

Dari sini, Anda bisa terus mengembangkan fitur-fitur lain. Selamat bereksplorasi!