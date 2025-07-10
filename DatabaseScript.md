# Script SQL untuk Setup Database SahabatBK

Gunakan script di bawah ini untuk membuat dan mengisi database Anda.

## Cara Menggunakan

1.  Buka alat manajemen database Anda (misalnya, PHPMyAdmin).
2.  Pilih database `sahabatbk` yang telah Anda buat.
3.  Buka tab **"SQL"**.
4.  Salin (copy) seluruh konten dari blok kode di bawah ini.
5.  Tempel (paste) ke dalam area teks query SQL.
6.  Klik tombol **"Go"** atau **"Execute"** untuk menjalankan script.

Database Anda sekarang akan memiliki tabel dan data awal yang diperlukan. Password untuk semua akun contoh adalah `password123`.

---

```sql
-- SahabatBK Database Setup Script
-- Version 3.5.0

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `student_notes`;
DROP TABLE IF EXISTS `counselor_notes`;
DROP TABLE IF EXISTS `counselor_settings`;
DROP TABLE IF EXISTS `counselor_availability`;
DROP TABLE IF EXISTS `counseling_sessions`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS=1;

--
-- Struktur tabel untuk `users`
--
CREATE TABLE `users` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','counselor','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `profilePicture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthDate` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  -- Student specific
  `class` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  -- Counselor specific
  `counselorId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NIP Pegawai',
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teachingPlace` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teachingSubject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counselingStatus` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'inactive',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `profilePicture`, `phone`, `address`, `birthDate`, `gender`, `class`, `school`, `counselorId`, `specialization`, `teachingPlace`, `teachingSubject`, `counselingStatus`) VALUES
('admin-001', 'Admin SahabatBK', 'admin@sahabatbk.id', '$2a$10$E.mveN/G0Di/9Y22Po9fyeSgvoBvL/lTsy.PUN4oRjJcXtGgNIpEa', 'admin', 'https://i.pravatar.cc/150?u=admin-001', '081200000001', 'Kantor Pusat SahabatBK', '1990-01-01', 'other', NULL, NULL, NULL, 'System Administrator', NULL, NULL, NULL),
('counselor-001', 'Anisa Fitriani, S.Psi.', 'anisa@konselor.id', '$2a$10$E.mveN/G0Di/9Y22Po9fyeSgvoBvL/lTsy.PUN4oRjJcXtGgNIpEa', 'counselor', 'https://i.pravatar.cc/150?u=counselor-001', '081234567890', 'Jl. Merdeka No. 10, Jakarta', '1990-05-15', 'female', NULL, NULL, 'NIP199001012015032001', 'Karir dan Kecemasan', 'SMP Harapan Bangsa', 'Bimbingan Konseling', 'active'),
('student-001', 'Budi Santoso', 'budi@siswa.id', '$2a$10$E.mveN/G0Di/9Y22Po9fyeSgvoBvL/lTsy.PUN4oRjJcXtGgNIpEa', 'student', 'https://i.pravatar.cc/150?u=student-001', '085611112222', 'Jl. Pelajar No. 5, Jakarta', '2008-08-17', 'male', 'IX A', 'SMP Harapan Bangsa', NULL, NULL, NULL, NULL, NULL);

--
-- Struktur tabel untuk `counseling_sessions`
--
CREATE TABLE `counseling_sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `counselorId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateTime` datetime NOT NULL,
  `status` enum('pending','confirmed','completed','canceled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `chatStatus` enum('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `topic` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_status` enum('pending_student','pending_counselor','approved') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Dumping data untuk `counseling_sessions`
--
INSERT INTO `counseling_sessions` (`id`, `studentId`, `counselorId`, `dateTime`, `status`, `chatStatus`, `topic`) VALUES
('session-001', 'student-001', 'counselor-001', DATE_ADD(NOW(), INTERVAL 3 DAY), 'confirmed', 'open', 'Bingung memilih SMA'),
('session-002', 'student-001', 'counselor-001', DATE_ADD(NOW(), INTERVAL 10 DAY), 'pending', 'open', 'Masalah dengan teman sekelas'),
('session-003', 'student-001', 'counselor-001', DATE_SUB(NOW(), INTERVAL 5 DAY), 'completed', 'closed', 'Kesulitan fokus belajar');

--
-- Struktur tabel untuk `counselor_availability`
--
CREATE TABLE `counselor_availability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `counselorId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `availableDate` date NOT NULL,
  `startTime` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `counselor_slot` (`counselorId`,`availableDate`,`startTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk `counselor_availability`
--
INSERT INTO `counselor_availability` (`counselorId`, `availableDate`, `startTime`) VALUES
('counselor-001', CURDATE(), '09:00:00'),
('counselor-001', CURDATE(), '10:00:00'),
('counselor-001', CURDATE(), '11:00:00'),
('counselor-001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00'),
('counselor-001', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00');

--
-- Struktur tabel untuk `counselor_settings`
--
CREATE TABLE `counselor_settings` (
  `counselorId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settingKey` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settingValue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`counselorId`, `settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk `counselor_settings`
--
INSERT INTO `counselor_settings` (`counselorId`, `settingKey`, `settingValue`) VALUES
('counselor-001', 'defaultSlots', '[0, 3, 3, 3, 3, 3, 0]');


--
-- Struktur tabel untuk `student_notes`
--
CREATE TABLE `student_notes` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk `student_notes`
--
INSERT INTO `student_notes` (`id`, `studentId`, `title`, `content`) VALUES
('note-001', 'student-001', 'Pikiran Hari Ini', 'Merasa sedikit cemas tentang ujian matematika besok. Perlu belajar lebih giat lagi.');


--
-- Struktur tabel untuk `counselor_notes`
--
CREATE TABLE `counselor_notes` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `counselorId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Struktur tabel untuk `chat_messages`
--
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senderId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk `chat_messages`
--
INSERT INTO `chat_messages` (`sessionId`, `senderId`, `message`) VALUES
('session-001', 'student-001', 'Halo Bu, saya sudah tidak sabar untuk sesi konseling kita.'),
('session-001', 'counselor-001', 'Halo Budi, saya juga. Sampai jumpa nanti ya.');

--
-- Struktur tabel untuk `notifications`
--
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Indexes
--
ALTER TABLE `users` ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `email` (`email`);
ALTER TABLE `counseling_sessions` ADD PRIMARY KEY (`id`), ADD KEY `studentId` (`studentId`), ADD KEY `counselorId` (`counselorId`);
ALTER TABLE `student_notes` ADD PRIMARY KEY (`id`), ADD KEY `studentId` (`studentId`);
ALTER TABLE `counselor_notes` ADD KEY `counselorId` (`counselorId`);
ALTER TABLE `chat_messages` ADD KEY `sessionId` (`sessionId`), ADD KEY `senderId` (`senderId`);
ALTER TABLE `notifications` ADD KEY `userId` (`userId`);

--
-- Constraints
--
ALTER TABLE `counseling_sessions`
  ADD CONSTRAINT `fk_session_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_session_counselor` FOREIGN KEY (`counselorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `counselor_availability`
  ADD CONSTRAINT `fk_avail_counselor` FOREIGN KEY (`counselorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `counselor_settings`
  ADD CONSTRAINT `fk_settings_counselor` FOREIGN KEY (`counselorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_notes`
  ADD CONSTRAINT `fk_notes_student` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE `counselor_notes`
  ADD CONSTRAINT `fk_notes_counselor` FOREIGN KEY (`counselorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_session` FOREIGN KEY (`sessionId`) REFERENCES `counseling_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
```