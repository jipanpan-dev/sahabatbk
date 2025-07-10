# Dokumentasi Lengkap Aplikasi SahabatBK

Dokumen ini memberikan penjelasan rinci mengenai seluruh fitur dan alur kerja aplikasi SahatabBK, mulai dari halaman publik hingga fungsionalitas spesifik di dalam dasbor untuk setiap jenis pengguna.

---

## Daftar Isi
1.  [Halaman Utama (Landing Page)](#1-halaman-utama-landing-page)
2.  [Halaman Otentikasi (Masuk & Daftar)](#2-halaman-otentikasi-masuk--daftar)
3.  [Dasbor Pengguna (Dashboard)](#3-dasbor-pengguna-dashboard)
    - [Struktur Umum Dasbor](#struktur-umum-dasbor)
    - [Dasbor Siswa](#dasbor-siswa)
    - [Dasbor Konselor](#dasbor-konselor)
    - [Dasbor Admin](#dasbor-admin)
4.  [Fitur Umum & Teknologi](#4-fitur-umum--teknologi)

---

## 1. Halaman Utama (Landing Page)

Halaman utama adalah wajah aplikasi yang dapat diakses oleh siapa saja. Tujuannya adalah untuk memperkenalkan SahabatBK, menjelaskan manfaatnya, dan mengajak pengguna untuk mendaftar atau masuk.

### Komponen Halaman Utama

-   **Header**: Berisi logo aplikasi "SahabatBK" dan tombol navigasi "Masuk" dan "Daftar". Header ini bersifat *sticky* (tetap terlihat di atas saat halaman digulir).
-   **Seksi Hero**: Bagian pembuka yang paling menonjol. Menampilkan slogan utama ("Ruang Amanmu untuk Bercerita dan Tumbuh."), deskripsi singkat, dan tombol *Call-to-Action* (CTA) utama "Mulai Konseling Sekarang".
-   **Kenapa Memilih SahabatBK?**: Menyoroti tiga keunggulan utama aplikasi:
    1.  **Aman & Terpercaya**: Menekankan privasi dan enkripsi.
    2.  **Mudah Digunakan**: Menekankan antarmuka yang ramah pengguna.
    3.  **Konselor Profesional**: Menekankan kualitas dan verifikasi konselor.
-   **Cara Kerja**: Menjelaskan proses penggunaan aplikasi dalam tiga langkah sederhana dengan visualisasi yang menarik:
    1.  Daftar Akun
    2.  Pilih Jadwal
    3.  Mulai Konseling
-   **Testimoni**: Menampilkan kutipan dari pengguna fiktif (siswa dan guru BK) untuk membangun kepercayaan dan menunjukkan dampak positif aplikasi.
-   **FAQ (Ada Pertanyaan?)**: Berisi daftar pertanyaan yang sering diajukan (seperti biaya, keamanan, dll.) dalam format *accordion*, di mana jawaban akan muncul saat pertanyaan diklik.
-   **CTA Akhir**: Seksi ajakan terakhir yang lebih spesifik, dengan dua tombol: "Daftar Sebagai Siswa" dan "Masuk Sebagai Konselor".
-   **Footer**: Bagian paling bawah halaman yang berisi hak cipta dan tautan ke kebijakan privasi atau kontak.

## 2. Halaman Otentikasi (Masuk & Daftar)

Ini adalah gerbang masuk ke dalam fungsionalitas aplikasi. Halaman ini memiliki dua tampilan yang dapat diganti: "Masuk" dan "Daftar".

### Tampilan Masuk (Login)
-   **Form**: Meminta `email` dan `password` pengguna.
-   **Lupa Password?**: Tautan untuk proses pemulihan password (fitur masa depan).
-   **Tombol Masuk**: Memvalidasi kredensial pengguna ke backend. Menampilkan pesan error jika login gagal.
-   **Beralih Tampilan**: Tautan di bagian bawah untuk beralih ke formulir pendaftaran jika pengguna belum memiliki akun.

### Tampilan Daftar (Sign Up)
-   **Pilihan Peran**: Pengguna harus memilih perannya terlebih dahulu, "Siswa" atau "Konselor". Pilihan ini akan mengubah formulir yang ditampilkan.
-   **Form Dinamis**:
    -   **Untuk Siswa**: Meminta Nama Lengkap, Kelas & Sekolah.
    -   **Untuk Konselor**: Meminta Nama Lengkap & Gelar, ID/NIP Konselor, dan Bidang Spesialisasi.
-   **Form Umum**: Meminta `Email`, `Password`, dan `Konfirmasi Password`.
-   **Tombol Daftar**: Mengirimkan data pendaftaran ke server. Saat ini, fitur ini menampilkan pesan bahwa fungsionalitas belum diimplementasikan dan perlu dikembangkan di sisi backend.
-   **Beralih Tampilan**: Tautan di bagian bawah untuk beralih ke formulir masuk jika pengguna sudah memiliki akun.

## 3. Dasbor Pengguna (Dashboard)

Setelah berhasil login, pengguna akan diarahkan ke dasbor yang dirancang khusus sesuai dengan perannya (Siswa, Konselor, atau Admin).

### Struktur Umum Dasbor

-   **Sidebar (Bilah Sisi)**: Terletak di sebelah kiri, berisi navigasi utama aplikasi. Tautan yang ditampilkan berbeda untuk setiap peran. Terdapat logo, daftar menu, dan tombol "Logout". Di perangkat mobile, sidebar ini tersembunyi dan dapat dimunculkan dengan tombol menu.
-   **Header**: Terletak di atas, berisi tombol menu (untuk mobile), ikon notifikasi, dan informasi profil pengguna singkat (foto, nama, peran).
-   **Area Konten Utama**: Ruang di mana konten dari setiap halaman yang dipilih di sidebar ditampilkan.

### Dasbor Siswa

Dirancang untuk memfasilitasi proses konseling dari sudut pandang siswa.

-   **Beranda**:
    -   Ucapan selamat datang.
    -   Menampilkan hingga 3 sesi konseling terdekat yang akan datang (status "Menunggu" atau "Dikonfirmasi").
    -   Menampilkan daftar *Live Chat* yang sedang aktif.
    -   Tombol pintasan untuk "Buat Jadwal Baru".
-   **Jadwal Konseling**:
    -   Siswa memilih konselor dari daftar yang tersedia.
    -   Kalender dinamis menampilkan jadwal ketersediaan konselor yang dipilih. Slot yang sudah dipesan akan berwarna abu-abu (tidak dapat dipilih).
    -   Dengan mengklik slot waktu yang tersedia, sebuah modal akan muncul untuk mengonfirmasi jadwal. Siswa harus mengisi **topik konseling** sebelum mengirim permintaan.
-   **Chat Konselor**:
    -   Halaman ini menampilkan daftar sesi chat yang tersedia.
    -   Mengklik sebuah sesi akan membuka antarmuka chat, menampilkan riwayat percakapan.
    -   Siswa dapat mengirim pesan baru. Jika chat sebelumnya sudah ditutup, mengirim pesan baru akan membukanya kembali.
    -   Terdapat tombol "Selesai Chat" untuk menandai percakapan sebagai selesai (status `closed`).
-   **Riwayat Sesi**:
    -   Menampilkan daftar lengkap semua sesi konseling (menunggu, dikonfirmasi, selesai, dibatalkan).
    -   Setiap entri menampilkan detail seperti nama konselor, topik, tanggal, dan status.
    -   Jika sesi dibatalkan, alasan pembatalan akan ditampilkan.
    -   Untuk sesi yang berstatus "Dikonfirmasi", siswa memiliki tombol untuk **mengajukan pembatalan**, yang akan mengirimkan permintaan ke konselor.
-   **Catatan Pribadi**:
    -   Area pribadi bagi siswa untuk menulis, melihat, mengedit, dan menghapus (CRUD) catatan.
    -   Catatan ini bersifat rahasia dan hanya dapat diakses oleh siswa itu sendiri.
-   **Profil Saya**:
    -   Siswa dapat melihat dan mengedit data pribadi (nama, telepon, alamat, tanggal lahir, jenis kelamin).
    -   Siswa dapat mengedit informasi spesifik seperti kelas dan sekolah.
    -   Terdapat fitur untuk mengganti password.
    -   Fitur untuk mengunggah dan menghapus foto profil.

### Dasbor Konselor

Dirancang untuk membantu konselor mengelola sesi, jadwal, dan komunikasi dengan siswa.

-   **Beranda**:
    -   Ucapan selamat datang.
    -   Menampilkan sesi konseling terdekat yang akan datang.
    -   Kartu statistik yang menunjukkan jumlah **Permintaan Baru** dan **Chat Aktif**.
    -   Daftar *Live Chat* aktif untuk akses cepat.
-   **Kelola Jadwal**:
    -   Kalender interaktif untuk mengatur ketersediaan. Konselor dapat mengklik tanggal untuk mengedit slot waktu yang tersedia (misal: 09:00, 10:00, dst.).
    -   Slot yang sudah dipesan oleh siswa akan ditandai dengan warna oranye dan tidak dapat diubah dari sini.
    -   Fitur untuk mengatur **Slot Default** per hari (Senin-Minggu), yang akan otomatis diterapkan pada minggu berjalan jika belum ada jadwal manual.
-   **Permintaan Sesi**:
    -   **Permintaan Sesi Baru**: Menampilkan daftar permintaan jadwal dari siswa. Konselor dapat **Menerima**, **Menolak**, atau **Mengubah Jadwal** permintaan tersebut.
    -   **Permintaan Pembatalan**: Menampilkan daftar permintaan pembatalan dari siswa. Konselor dapat **Menyetujui** permintaan ini.
-   **Live Chat**: Sama seperti siswa, konselor dapat berkomunikasi dengan semua siswa yang memiliki sesi dengannya.
-   **Riwayat Sesi**: Menampilkan riwayat sesi dengan semua siswa yang pernah ditangani.
-   **Catatan Pribadi**: Ruang privat bagi konselor untuk membuat catatan terkait pekerjaan mereka. Terpisah dan tidak dapat diakses oleh siswa.
-   **Profil Saya**:
    -   Mengedit informasi pribadi dan profesional (spesialisasi, tempat mengajar, status konseling aktif/tidak aktif).
    -   Mengganti password dan mengelola foto profil.

### Dasbor Admin

Dirancang untuk pengelolaan menyeluruh terhadap data pengguna dan aktivitas dalam aplikasi.

-   **Beranda**:
    -   Ucapan selamat datang.
    -   Kartu statistik utama: **Total Siswa**, **Total Konselor**, dan jumlah **Sesi Terjadwal**.
-   **Manajemen Pengguna**:
    -   Menampilkan tabel berisi semua pengguna (Siswa dan Konselor).
    -   Tabel dilengkapi fitur **filter** (berdasarkan nama, email, dll.) dan **sortir** (berdasarkan kolom).
    -   Admin dapat **Menambah**, **Mengedit**, dan **Menghapus** pengguna.
    -   Form untuk menambah/mengedit pengguna muncul dalam sebuah modal, termasuk opsi untuk mengunggah foto profil pengguna.
-   **Manajemen Jadwal**:
    -   Menampilkan tabel berisi semua sesi konseling yang ada di sistem.
    -   Tabel dilengkapi filter canggih: filter berdasarkan nama, topik, **status** (dropdown), dan **rentang tanggal** (dropdown: Hari Ini, 7 Hari Kedepan, dll.).
-   **Profil Saya**: Admin dapat mengelola profil pribadinya, termasuk mengganti password dan foto profil.

## 4. Fitur Umum & Teknologi

-   **Notifikasi**: Siswa dan Konselor menerima notifikasi untuk aktivitas penting (permintaan sesi, pembaruan status, pesan baru). Ikon lonceng di header akan menunjukkan jumlah notifikasi yang belum dibaca. Notifikasi ini diperbarui secara berkala (polling).
-   **Otentikasi**: Menggunakan JSON Web Tokens (JWT) untuk menjaga sesi pengguna tetap aman.
-   **Responsivitas**: Aplikasi dirancang agar dapat diakses dengan nyaman di berbagai ukuran layar, dari desktop hingga perangkat mobile.
-   **Teknologi**:
    -   **Frontend**: React, Vite, TypeScript, Tailwind CSS.
    -   **Backend**: Node.js, Express.js.
    -   **Database**: MySQL.
    -   **API**: RESTful API untuk komunikasi antara frontend dan backend.

---
