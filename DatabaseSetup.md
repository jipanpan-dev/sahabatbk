# Panduan Setup Database MySQL untuk SahabatBK

Dokumen ini menjelaskan cara menyiapkan database MySQL yang diperlukan agar aplikasi SahabatBK dapat berjalan dengan baik.

## Prasyarat

- Server MySQL sudah terinstall dan berjalan.
- Akses ke alat manajemen database seperti PHPMyAdmin, MySQL Workbench, atau command-line client.

Instruksi di bawah ini menggunakan **PHPMyAdmin** sebagai contoh.

---

### Langkah 1: Buat Database Baru

1.  Buka PHPMyAdmin di browser Anda.
2.  Di panel sebelah kiri, klik **"New"**.
3.  Di bawah "Create database", masukkan nama database: `sahabatbk`.
4.  Pilih `utf8mb4_unicode_ci` sebagai Collation untuk dukungan karakter yang luas.
5.  Klik tombol **"Create"**.

Anda sekarang memiliki database kosong bernama `sahabatbk`.

### Langkah 2: Jalankan Script SQL

Selanjutnya, kita akan membuat tabel yang diperlukan (`users`, `counseling_sessions`) dan mengisi data awal dengan menjalankan script SQL yang telah disediakan.

1.  Pilih database `sahabatbk` yang baru saja Anda buat dari panel sebelah kiri.
2.  Klik tab **"SQL"** di menu atas.
3.  Buka file `DatabaseScript.md` yang ada di root direktori proyek Anda.
4.  Salin (copy) seluruh blok kode SQL dari file tersebut.
5.  Tempelkan (paste) script yang sudah disalin ke dalam area teks query di PHPMyAdmin.
6.  Klik tombol **"Go"** di pojok kanan bawah untuk menjalankan script.

Proses ini akan menjalankan semua query dalam script, yang akan:
- Membuat tabel `users`.
- Membuat tabel `counseling_sessions`.
- Memasukkan data awal untuk admin, konselor, dan siswa.
- Memasukkan data awal untuk beberapa sesi konseling.

### Langkah 3: Verifikasi

Setelah proses eksekusi selesai, Anda akan melihat pesan sukses. Di panel sebelah kiri, di bawah database `sahabatbk`, Anda sekarang akan melihat dua tabel: `users` and `counseling_sessions`. Klik pada masing-masing tabel untuk memastikan data awal telah berhasil dimasukkan.

---

### (Opsional) Setup Pengguna Database

Untuk keamanan yang lebih baik, disarankan untuk membuat pengguna MySQL khusus untuk aplikasi ini daripada menggunakan pengguna `root`.

1.  Dari halaman utama PHPMyAdmin, klik tab **"User accounts"**.
2.  Klik **"Add user account"**.
3.  **Login Information**:
    - **User name**: `sahabatbk_user` (atau nama pilihan Anda)
    - **Host name**: `localhost`
    - **Password**: Buat password yang kuat dan aman.
4.  **Database for user account**:
    - Centang **"Grant all privileges on database `sahabatbk`"**.
5.  Gulir ke bawah dan klik **"Go"**.

Setelah membuat pengguna ini, jangan lupa untuk memperbarui file `.env` di direktori `server` dengan kredensial pengguna baru ini.

```ini
DB_USER=sahabatbk_user
DB_PASSWORD=password_yang_baru_saja_dibuat
```

Database Anda sekarang sudah siap! Anda dapat melanjutkan untuk menjalankan server backend.