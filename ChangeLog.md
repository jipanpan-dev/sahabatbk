# Changelog SahabatBK

Dokumen ini mencatat semua perubahan penting pada aplikasi SahabatBK untuk setiap versi.

---

## [3.5.0] - 2024-08-04

Rilis ini menambahkan alur kerja pembatalan sesi yang canggih, meningkatkan dasbor beranda secara signifikan, dan menambahkan fitur-fitur penting untuk konselor.

### ✨ Added
- **Logika Pembatalan Sesi**: Sesi yang berstatus "Dikonfirmasi" sekarang bisa dibatalkan oleh Siswa atau Konselor dengan menyertakan alasan. Pembatalan oleh siswa memerlukan persetujuan dari konselor.
- **Catatan Pribadi Konselor**: Menambahkan fitur "Catatan Pribadi" khusus untuk Konselor, terpisah dari catatan siswa.
- **Penerapan Slot Default Otomatis**: Saat konselor menyimpan pengaturan slot default, jadwal akan otomatis diterapkan pada sisa hari dalam minggu berjalan (untuk hari yang belum memiliki jadwal manual).

### 🔄 Changed
- **Dasbor Beranda (Siswa & Konselor)**:
    - Sekarang menampilkan 3 sesi konseling terdekat yang akan datang (status "Menunggu" atau "Dikonfirmasi").
    - Menampilkan daftar *Live Chat* yang sedang aktif untuk akses cepat.
- **Kalender Konselor**: Slot yang sudah dipesan kini ditandai dengan warna oranye. Mengklik slot ini akan mengarahkan konselor ke halaman riwayat sesi.
- **Perbaikan Stabilitas**: Menghapus `importmap` yang konflik dari `index.html` untuk memperbaiki error `VITE_API_URL` secara permanen.

### 🐛 Fixed
- **Dasbor Konselor**: Memperbaiki bug di mana jumlah "Live Chat Aktif" tidak terdeteksi dengan benar di dasbor beranda.

---

## [3.4.0] - 2024-08-03

Rilis ini berfokus pada peningkatan pengalaman pengguna dengan notifikasi real-time dan perbaikan bug penting untuk stabilitas.

### ✨ Added
- **Notifikasi Real-time**: Ikon notifikasi sekarang secara otomatis memeriksa pembaruan setiap 15 detik (polling), memastikan pengguna melihat notifikasi baru tanpa perlu me-refresh halaman.

### 🐛 Fixed
- **Core Stability**: Memperbaiki error `VITE_API_URL is not defined` yang terjadi secara berulang dengan menghapus `importmap` yang konflik dari `index.html`, memastikan pemuatan environment variable yang stabil.
- **Admin Dashboard**: Memperbaiki error `TypeError: Cannot read properties of null (reading 'direction')` yang terjadi saat pertama kali memuat tabel "Manajemen Pengguna", mencegah crash pada komponen.

---

## [3.3.0] - 2024-08-02

Versi ini memperkenalkan sistem notifikasi real-time yang sangat dinantikan dan meningkatkan fungsionalitas kalender konselor, serta memperbaiki bug kritis di dashboard admin.

### ✨ Added
- **Sistem Notifikasi**: Menambahkan sistem notifikasi lengkap untuk Siswa dan Konselor.
    - Ikon lonceng di header menampilkan jumlah notifikasi yang belum dibaca.
    - Pengguna menerima notifikasi untuk permintaan sesi baru, pembaruan status, dan pesan chat baru.
    - Notifikasi dapat diklik untuk navigasi langsung ke halaman yang relevan.
    - Menambahkan fungsi "Tandai semua dibaca".

### 🔄 Changed
- **Kalender Konselor**: Kalender di dashboard "Kelola Jadwal" Konselor sekarang menampilkan sesi yang sudah dipesan (`confirmed`), menunggu (`pending`), dan selesai (`completed`) dengan kode warna, memberikan gambaran jadwal yang lebih lengkap.

### 🐛 Fixed
- **Admin Dashboard**: Memperbaiki error `TypeError` yang terjadi di tabel "Manajemen Pengguna" saat data masih dimuat, memastikan halaman dapat diakses dengan stabil.

---

## [3.2.0] - 2024-08-01

Versi ini berfokus pada perbaikan bug kritis dan peningkatan fungsionalitas pada dashboard Admin untuk manajemen yang lebih efisien.

### 🐛 Fixed
- **Admin Dashboard**: Memperbaiki error `TypeError` yang terjadi saat mencoba mengurutkan (sort) kolom di tabel "Manajemen Pengguna".
- **Counselor Dashboard**: Memperbaiki error `TypeError` pada halaman "Kelola Jadwal" yang muncul saat data ketersediaan (availability) belum sepenuhnya dimuat.
- **Root Cause**: Memperbaiki error `VITE_API_URL is not defined` yang terjadi secara berkala dengan menghapus `importmap` dari `index.html` untuk memastikan Vite dapat meng-inject environment variables dengan benar.

### ✨ Added
- **Admin - Filter Jadwal**: Mengubah filter "Jadwal" di "Manajemen Jadwal" menjadi dropdown dengan pilihan rentang tanggal (Hari Ini, 7 Hari Kedepan, 7 Hari Kebelakang, dst.) untuk mempermudah pencarian.
- **Admin - Filter Status**: Mengubah filter "Status" di "Manajemen Jadwal" menjadi dropdown list (`pending`, `confirmed`, `completed`, `canceled`) untuk penyaringan yang lebih akurat.

### 🔄 Changed
- **Login Redirect**: Memastikan Admin dan Konselor secara konsisten diarahkan ke halaman "Beranda" setelah login.

---

## [3.1.0] - 2024-07-31

Pembaruan ini menambahkan fungsionalitas penting pada fitur-fitur yang sudah ada, meningkatkan pengalaman pengguna dan kemampuan manajemen.

### ✨ Added
- **Validasi Ukuran File**: Menambahkan validasi sisi klien untuk upload foto profil, membatasi ukuran file hingga 2MB untuk mencegah upload file yang terlalu besar.
- **Status Chat**: Menambahkan status "Chat Aktif" di dashboard beranda untuk Siswa dan Konselor, menampilkan jumlah chat yang belum ditutup.
- **Selesai Chat**: Menambahkan tombol "Selesai Chat" yang mengubah status chat menjadi "Ditutup". Chat akan otomatis kembali "Terbuka" jika salah satu pihak mengirim pesan baru.

### 🔄 Changed
- **Jadwal Konseling**: Mengaktifkan kembali fitur jadwal konseling yang sebelumnya dalam pengembangan. Kalender dinamis sekarang berfungsi penuh dan terhubung ke database.
- **Manajemen Jadwal Konselor**: Konselor kini bisa mengatur slot ketersediaan harian, dengan nilai default 3 slot untuk hari kerja dan 0 untuk akhir pekan.
- **Upload Foto Profil**: Metode upload diubah. Server kini menyimpan file gambar di folder `public/img` dan menyimpan path-nya di database, bukan sebagai data base64.

---

## [3.0.0] - 2024-07-30

Rilis besar yang memperkenalkan fungsionalitas CRUD penuh di seluruh aplikasi dan mengaktifkan banyak fitur yang sebelumnya hanya berupa placeholder.

### ✨ Added
- **CRUD Pengguna**: Admin sekarang dapat membuat, membaca, mengupdate, dan menghapus (CRUD) pengguna (Siswa & Konselor) dari dashboard.
- **Manajemen Sesi**: Siswa dapat meminta sesi, Konselor dapat menyetujui/menolak, dan Admin dapat melihat semua jadwal.
- **Catatan Pribadi Siswa**: Siswa dapat membuat, mengedit, dan menghapus catatan pribadi yang disimpan di database.
- **Profil Lengkap**: Pengguna dapat menambahkan dan memperbarui informasi pribadi seperti tanggal lahir, alamat, dan nomor telepon.
- **Upload & Hapus Foto Profil**: Semua pengguna dapat mengunggah dan menghapus foto profil mereka.
- **Live Chat**: Fitur chat diaktifkan dengan kemampuan melanjutkan percakapan sebelumnya.

---

## [2.0.0] - 2024-07-29

Transformasi besar dari aplikasi frontend murni menjadi aplikasi full-stack.

### ✨ Added
- **Backend Server**: Memperkenalkan server backend menggunakan Node.js dan Express.
- **Database MySQL**: Mengintegrasikan database MySQL untuk persistensi data.
- **API Endpoints**: Membuat API untuk otentikasi (login) dan pengambilan data dashboard.
- **Otentikasi JWT**: Menerapkan sistem otentikasi aman menggunakan JSON Web Tokens.

### 🔄 Changed
- **Arsitektur Aplikasi**: Beralih dari penggunaan data *mock* di frontend menjadi pengambilan data *real-time* dari API backend.
- **Setup Proyek**: Memperkenalkan instruksi setup terpisah untuk frontend dan backend.

---

## [1.0.0] - 2024-07-28

Rilis awal aplikasi SahabatBK sebagai proyek frontend.

### ✨ Added
- **Desain UI/UX**: Membuat antarmuka pengguna untuk halaman utama, otentikasi, dan dashboard untuk peran Siswa, Konselor, dan Admin.
- **Navigasi**: Mengimplementasikan routing sisi klien menggunakan React Router.
- **Komponen UI**: Membangun komponen antarmuka yang dapat digunakan kembali menggunakan React dan Tailwind CSS.
- **Data Mock**: Aplikasi berjalan sepenuhnya di frontend menggunakan data *mock* (palsu) untuk simulasi fungsionalitas.