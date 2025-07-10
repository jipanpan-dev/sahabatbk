
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' })); // Keep a reasonable limit

// --- FILE UPLOAD SETUP ---
const UPLOAD_DIR = 'public/img';
// Ensure upload directory exists
fs.mkdirSync(path.join(__dirname, UPLOAD_DIR), { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, UPLOAD_DIR));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|tiff|webp|bmp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`File upload only supports the following filetypes: ${allowedTypes}`));
    }
});


// Serve profile pictures statically
app.use('/img', express.static(path.join(__dirname, UPLOAD_DIR)));


// --- DATABASE CONNECTION POOL ---
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // Keep dates as strings
});

// --- MIDDLEWARE & HELPERS ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

const isCounselor = (req, res, next) => {
    if (req.user.role !== 'counselor') {
        return res.status(403).json({ message: 'Forbidden: Counselor access required.' });
    }
    next();
};

const createNotification = async (userId, message, link) => {
    try {
        await db.execute(
            'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
            [userId, message, link]
        );
    } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
    }
};

// --- API ROUTES ---

// [POST] /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role, ...otherFields } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Nama, email, password, dan peran wajib diisi.' });
    }

    if (role === 'student' && (!otherFields.class || !otherFields.school)) {
        return res.status(400).json({ message: 'Kelas dan sekolah wajib diisi untuk siswa.' });
    }

    if (role === 'counselor' && (!otherFields.counselorId || !otherFields.specialization)) {
        return res.status(400).json({ message: 'ID Konselor dan spesialisasi wajib diisi untuk konselor.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newId = `${role.substring(0,3)}-${Date.now()}`;
        const profilePicture = `https://i.pravatar.cc/150?u=${newId}`;
        
        const query = 'INSERT INTO users (id, name, email, password_hash, role, class, school, counselorId, specialization, profilePicture, counselingStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        // New counselors are inactive by default for security, requiring admin activation.
        const counselingStatus = role === 'counselor' ? 'inactive' : null;

        await db.execute(query, [
            newId, 
            name, 
            email, 
            password_hash, 
            role, 
            otherFields.class || null, 
            otherFields.school || null, 
            otherFields.counselorId || null,
            otherFields.specialization || null, 
            profilePicture, 
            counselingStatus
        ]);

        res.status(201).json({ message: 'Pendaftaran berhasil! Anda sekarang dapat masuk.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Akun dengan email ini sudah ada.' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan internal saat pendaftaran.' });
    }
});


// [POST] /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.role === 'counselor' && user.counselingStatus === 'inactive') {
            return res.status(403).json({ message: 'Akun konselor Anda belum aktif. Hubungi administrator.' });
        }

        const { password_hash, ...userPayload } = user;
        const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token: accessToken, user: userPayload });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// [GET] /api/auth/me - Get current user from token
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const { password_hash, ...user } = rows[0];
        res.json(user);
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// [GET] /api/dashboard/data - Get all data based on user role
app.get('/api/dashboard/data', authenticateToken, async (req, res) => {
    const { id, role } = req.user;

    try {
        let activeChatCount, notifications, unreadCount, counselorNotes;
        if (role === 'student' || role === 'counselor') {
            [notifications] = await db.execute('SELECT * FROM notifications WHERE userId = ? ORDER BY created_at DESC LIMIT 15', [id]);
            [[{ unreadCount }]] = await db.execute('SELECT COUNT(*) as unreadCount FROM notifications WHERE userId = ? AND is_read = 0', [id]);
        }

        if (role === 'student') {
            const [sessions] = await db.execute('SELECT s.*, c.name as counselorName FROM counseling_sessions s JOIN users c ON s.counselorId = c.id WHERE s.studentId = ? ORDER BY s.dateTime DESC', [id]);
            const [counselors] = await db.execute("SELECT id, name, specialization, profilePicture, counselingStatus FROM users WHERE role = 'counselor' AND counselingStatus = 'active'");
            const [notes] = await db.execute('SELECT * FROM student_notes WHERE studentId = ? ORDER BY updated_at DESC', [id]);
            [[{ activeChatCount }]] = await db.execute('SELECT COUNT(*) as count FROM counseling_sessions WHERE studentId = ? AND chatStatus = "open"', [id]);
            return res.json({ sessions, counselors, notes, activeChatCount, notifications, unreadCount });
        }
        
        if (role === 'counselor') {
            const [sessions] = await db.execute('SELECT s.*, u.name as studentName FROM counseling_sessions s JOIN users u ON s.studentId = u.id WHERE s.counselorId = ? ORDER BY s.dateTime DESC', [id]);
            const [availabilityRows] = await db.execute('SELECT * FROM counselor_availability WHERE counselorId = ?', [id]);
            const [bookedSessions] = await db.execute("SELECT id, dateTime, status, studentId FROM counseling_sessions WHERE counselorId = ? AND status != 'canceled'", [id]);
            const availability = { available: availabilityRows, booked: bookedSessions };
            
            const [settingsRows] = await db.execute('SELECT * FROM counselor_settings WHERE counselorId = ?', [id]);
            const settings = settingsRows.reduce((acc, row) => ({...acc, [row.settingKey]: JSON.parse(row.settingValue) }), {});
            [[{ activeChatCount }]] = await db.execute('SELECT COUNT(*) as count FROM counseling_sessions WHERE counselorId = ? AND chatStatus = "open"', [id]);
            [counselorNotes] = await db.execute('SELECT * FROM counselor_notes WHERE counselorId = ? ORDER BY updated_at DESC', [id]);

            return res.json({ sessions, availability, settings, activeChatCount, notifications, unreadCount, counselorNotes });
        }

        if (role === 'admin') {
            const studentQuery = `
                SELECT u.*, COUNT(s.id) AS sessionCount 
                FROM users u 
                LEFT JOIN counseling_sessions s ON u.id = s.studentId 
                WHERE u.role = 'student' 
                GROUP BY u.id`;
            const counselorQuery = `
                SELECT u.*, COUNT(s.id) AS sessionCount 
                FROM users u 
                LEFT JOIN counseling_sessions s ON u.id = s.counselorId 
                WHERE u.role = 'counselor' 
                GROUP BY u.id`;

            const [students] = await db.execute(studentQuery);
            const [counselors] = await db.execute(counselorQuery);
            const [sessions] = await db.execute('SELECT s.*, u.name as studentName, c.name as counselorName FROM counseling_sessions s JOIN users u ON s.studentId = u.id JOIN users c ON s.counselorId = c.id ORDER BY s.dateTime DESC');
            return res.json({ students, counselors, sessions });
        }
        
        res.status(403).json({ message: 'Forbidden' });

    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// [PUT] /api/profile - Update own user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { id, role } = req.user;
    const { password, ...fieldsToUpdate } = req.body;

    const allowedFieldsStudent = ['name', 'phone', 'address', 'birthDate', 'gender', 'class', 'school'];
    const allowedFieldsCounselor = ['name', 'phone', 'address', 'teachingPlace', 'teachingSubject', 'counselingStatus', 'specialization', 'birthDate', 'gender'];
    const allowedFieldsAdmin = ['name', 'phone'];

    let allowedFields = [];
    if (role === 'student') allowedFields = allowedFieldsStudent;
    else if (role === 'counselor') allowedFields = allowedFieldsCounselor;
    else if (role === 'admin') allowedFields = allowedFieldsAdmin;

    const updates = [];
    const params = [];
    for (const key of Object.keys(fieldsToUpdate)) {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = ?`);
            params.push(fieldsToUpdate[key]);
        }
    }

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        updates.push('password_hash = ?');
        params.push(password_hash);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ message: "No valid fields to update."});
    }

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    try {
        await db.execute(query, params);
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


const handlePictureUpload = (req, res) => {
    const userId = req.params.id || req.user.id;
    
    upload.single('profilePicture')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
             if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Ukuran file terlalu besar. Maksimal 2MB.' });
            }
            return res.status(400).json({ message: `Multer error: ${err.message}`});
        } else if (err) {
            return res.status(400).json({ message: `File type error: ${err.message}`});
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        
        const filename = req.file.filename;

        try {
            // Delete old picture if it's not a pravatar link
            const [[user]] = await db.execute('SELECT profilePicture FROM users WHERE id = ?', [userId]);
            if (user && user.profilePicture && !user.profilePicture.startsWith('https://')) {
                const oldPath = path.join(__dirname, UPLOAD_DIR, user.profilePicture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            await db.execute('UPDATE users SET profilePicture = ? WHERE id = ?', [filename, userId]);
            res.status(200).json({ message: 'Profile picture updated successfully', profilePicture: filename });
        } catch(error) {
            console.error("Update picture error:", error);
            // Clean up uploaded file on DB error
            fs.unlinkSync(req.file.path);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
};

// [POST] /api/profile/picture - Upload own profile picture
app.post('/api/profile/picture', authenticateToken, handlePictureUpload);

// [POST] /api/users/:id/picture - Admin uploads a user's picture
app.post('/api/users/:id/picture', authenticateToken, isAdmin, handlePictureUpload);


// [DELETE] /api/profile/picture - Delete profile picture
app.delete('/api/profile/picture', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // Delete old picture
         const [[user]] = await db.execute('SELECT profilePicture FROM users WHERE id = ?', [userId]);
         if (user && user.profilePicture && !user.profilePicture.startsWith('https://')) {
            const oldPath = path.join(__dirname, UPLOAD_DIR, user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        const defaultPic = `https://i.pravatar.cc/150?u=${userId}`;
        await db.execute('UPDATE users SET profilePicture = ? WHERE id = ?', [defaultPic, userId]);
        res.status(200).json({ message: 'Profile picture removed', profilePicture: defaultPic });
    } catch(error) {
        console.error("Delete picture error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// --- SESSION MANAGEMENT ---
app.post('/api/sessions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can request sessions' });
    
    const { counselorId, dateTime, topic } = req.body;
    if (!counselorId || !dateTime || !topic) {
        return res.status(400).json({ message: 'Counselor, date, and topic are required.' });
    }

    try {
        const newSessionId = `session-${Date.now()}`;
        const query = 'INSERT INTO counseling_sessions (id, studentId, counselorId, dateTime, status, topic) VALUES (?, ?, ?, ?, ?, ?)';
        await db.execute(query, [newSessionId, req.user.id, counselorId, new Date(dateTime), 'pending', topic]);
        await createNotification(counselorId, `Permintaan sesi baru dari ${req.user.name}`, '/dashboard/requests');
        res.status(201).json({ message: 'Session requested successfully.' });
    } catch (error) {
        console.error('Session request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/sessions/:id/status', authenticateToken, isCounselor, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'canceled', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM counseling_sessions WHERE id = ? AND counselorId = ?', [id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Session not found or permission denied.' });
        
        await db.execute('UPDATE counseling_sessions SET status = ? WHERE id = ?', [status, id]);
        await createNotification(rows[0].studentId, `Status sesi "${rows[0].topic}" diperbarui menjadi ${status}`, '/dashboard/history');
        res.status(200).json({ message: `Session status updated.` });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/sessions/:id/reschedule', authenticateToken, isCounselor, async (req, res) => {
    const { id } = req.params;
    const { dateTime } = req.body;
    if (!dateTime) return res.status(400).json({ message: "New date and time are required."});

    try {
        const [rows] = await db.execute('SELECT * FROM counseling_sessions WHERE id = ? AND counselorId = ?', [id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Session not found or permission denied.' });

        await db.execute("UPDATE counseling_sessions SET dateTime = ? WHERE id = ?", [new Date(dateTime), id]);
        await createNotification(rows[0].studentId, `Sesi "${rows[0].topic}" dijadwalkan ulang oleh konselor`, '/dashboard/history');
        res.status(200).json({ message: "Session rescheduled successfully." });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- SESSION CANCELLATION LOGIC ---

// Student or Counselor requests cancellation
app.post('/api/sessions/:id/request-cancellation', authenticateToken, async (req, res) => {
    const { id: sessionId } = req.params;
    const { id: userId, role, name } = req.user;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: "Alasan pembatalan harus diisi." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT * FROM counseling_sessions WHERE id = ?', [sessionId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Sesi tidak ditemukan.' });
        }
        const session = rows[0];

        // Authorization check
        if (session.studentId !== userId && session.counselorId !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Akses ditolak.' });
        }

        if (session.status !== 'confirmed') {
             await connection.rollback();
             return res.status(400).json({ message: 'Hanya sesi yang sudah dikonfirmasi yang bisa dibatalkan.' });
        }

        if (role === 'student') {
            await connection.execute(
                'UPDATE counseling_sessions SET cancellation_status = ?, cancellation_reason = ? WHERE id = ?',
                ['pending_student', reason, sessionId]
            );
            await createNotification(session.counselorId, `${name} meminta pembatalan sesi.`, `/dashboard/requests`);
            await connection.commit();
            return res.status(200).json({ message: 'Permintaan pembatalan telah dikirim ke konselor.' });
        }

        if (role === 'counselor') {
            await connection.execute(
                'UPDATE counseling_sessions SET status = ?, cancellation_status = ?, cancellation_reason = ? WHERE id = ?',
                ['canceled', 'approved', reason, sessionId]
            );
            await createNotification(session.studentId, `Konselor telah membatalkan sesi.`, `/dashboard/history`);
            await connection.commit();
            return res.status(200).json({ message: 'Sesi berhasil dibatalkan.' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Cancellation request error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    } finally {
        connection.release();
    }
});

// Counselor approves a student's cancellation request
app.post('/api/sessions/:id/approve-cancellation', authenticateToken, isCounselor, async (req, res) => {
    const { id: sessionId } = req.params;
    
    try {
        const [rows] = await db.execute('SELECT * FROM counseling_sessions WHERE id = ? AND counselorId = ?', [sessionId, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Sesi tidak ditemukan.' });

        const session = rows[0];
        if (session.cancellation_status !== 'pending_student') {
            return res.status(400).json({ message: 'Tidak ada permintaan pembatalan dari siswa untuk sesi ini.' });
        }

        await db.execute(
            "UPDATE counseling_sessions SET status = 'canceled', cancellation_status = 'approved' WHERE id = ?",
            [sessionId]
        );
        
        await createNotification(session.studentId, `Permintaan pembatalan sesi Anda telah disetujui.`, `/dashboard/history`);
        res.status(200).json({ message: 'Pembatalan telah disetujui.' });

    } catch (error) {
        console.error('Approve cancellation error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// --- COUNSELOR AVAILABILITY ---
app.get('/api/counselors/:id/availability', authenticateToken, async(req, res) => {
    try {
        const [slots] = await db.execute('SELECT * FROM counselor_availability WHERE counselorId = ?', [req.params.id]);
        const [sessions] = await db.execute("SELECT id, dateTime, status, studentId FROM counseling_sessions WHERE counselorId = ? AND status != 'canceled'", [req.params.id]);
        res.json({ available: slots, booked: sessions });
    } catch(error) {
        console.error("Get availability error:", error)
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/counselor/availability', authenticateToken, isCounselor, async (req, res) => {
    const { availableDate, slots } = req.body; // slots is an array of times ["09:00", "10:00"]
    if (!availableDate || !Array.isArray(slots)) return res.status(400).json({ message: 'Date and slots array are required.' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // Clear existing slots for that day and add new ones
        await connection.execute('DELETE FROM counselor_availability WHERE counselorId = ? AND availableDate = ?', [req.user.id, availableDate]);
        
        if (slots.length > 0) {
            const query = 'INSERT INTO counselor_availability (counselorId, availableDate, startTime) VALUES ?';
            const values = slots.map(time => [req.user.id, availableDate, `${time}:00`]);
            await connection.query(query, [values]);
        }
        
        await connection.commit();
        res.status(201).json({ message: "Availability updated." });
    } catch(error) {
        await connection.rollback();
        if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This slot already exists.' });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

app.put('/api/counselor/settings', authenticateToken, isCounselor, async (req, res) => {
    const { key, value } = req.body;
    if (key !== 'defaultSlots' || !Array.isArray(value) || value.length !== 7) {
        return res.status(400).json({ message: 'Setting key and value are required and must be in the correct format.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Save the setting
        const settingQuery = 'INSERT INTO counselor_settings (counselorId, settingKey, settingValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE settingValue = ?';
        await connection.execute(settingQuery, [req.user.id, key, JSON.stringify(value), JSON.stringify(value)]);

        // Apply to the rest of the current week
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // Sunday = 0
        const daysToApply = [];

        for (let i = 0; i < 7; i++) {
            const dayOfWeek = (currentDayOfWeek + i) % 7;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);

            const numSlots = value[dayOfWeek];
            if (numSlots > 0) {
                 daysToApply.push({
                    date: targetDate.toISOString().split('T')[0],
                    slots: Array.from({ length: numSlots }, (_, j) => `${String(9 + j).padStart(2, '0')}:00:00`)
                });
            }
        }
        
        for (const day of daysToApply) {
            // Check if manual availability is already set for this date
            const [[existing]] = await connection.execute('SELECT COUNT(*) as count FROM counselor_availability WHERE counselorId = ? AND availableDate = ?', [req.user.id, day.date]);

            if (existing.count === 0) {
                // Clear any potential old defaults and insert new ones
                await connection.execute('DELETE FROM counselor_availability WHERE counselorId = ? AND availableDate = ?', [req.user.id, day.date]);
                
                if(day.slots.length > 0) {
                    const slotInsertQuery = 'INSERT INTO counselor_availability (counselorId, availableDate, startTime) VALUES ?';
                    const slotValues = day.slots.map(time => [req.user.id, day.date, time]);
                    await connection.query(slotInsertQuery, [slotValues]);
                }
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Settings updated and applied to current week.' });

    } catch (error) {
        await connection.rollback();
        console.error("Update settings error:", error)
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// --- STUDENT/COUNSELOR NOTES ---
app.get('/api/notes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const [notes] = await db.execute('SELECT * FROM student_notes WHERE studentId = ? ORDER BY updated_at DESC', [req.user.id]);
    res.json(notes);
});

app.post('/api/notes', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const { title, content } = req.body;
    const newId = `note-${Date.now()}`;
    await db.execute('INSERT INTO student_notes (id, studentId, title, content) VALUES (?, ?, ?, ?)', [newId, req.user.id, title, content]);
    res.status(201).json({ message: "Note created."});
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const { title, content } = req.body;
    const [result] = await db.execute('UPDATE student_notes SET title = ?, content = ? WHERE id = ? AND studentId = ?', [title, content, req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found.'});
    res.json({ message: "Note updated."});
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const [result] = await db.execute('DELETE FROM student_notes WHERE id = ? AND studentId = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found.'});
    res.json({ message: "Note deleted."});
});

app.get('/api/counselor/notes', authenticateToken, isCounselor, async (req, res) => {
    const [notes] = await db.execute('SELECT * FROM counselor_notes WHERE counselorId = ? ORDER BY updated_at DESC', [req.user.id]);
    res.json(notes);
});

app.post('/api/counselor/notes', authenticateToken, isCounselor, async (req, res) => {
    const { title, content } = req.body;
    const newId = `cnote-${Date.now()}`;
    await db.execute('INSERT INTO counselor_notes (id, counselorId, title, content) VALUES (?, ?, ?, ?)', [newId, req.user.id, title, content]);
    res.status(201).json({ message: "Note created."});
});

app.put('/api/counselor/notes/:id', authenticateToken, isCounselor, async (req, res) => {
    const { title, content } = req.body;
    const [result] = await db.execute('UPDATE counselor_notes SET title = ?, content = ? WHERE id = ? AND counselorId = ?', [title, content, req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found.'});
    res.json({ message: "Note updated."});
});

app.delete('/api/counselor/notes/:id', authenticateToken, isCounselor, async (req, res) => {
    const [result] = await db.execute('DELETE FROM counselor_notes WHERE id = ? AND counselorId = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Note not found.'});
    res.json({ message: "Note deleted."});
});


// --- CHAT ---
app.get('/api/chats/:sessionId/messages', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const [messages] = await db.execute(
        `SELECT c.*, u.name as senderName 
         FROM chat_messages c JOIN users u ON c.senderId = u.id 
         WHERE c.sessionId = ? ORDER BY c.timestamp ASC`,
        [sessionId]
    );
    res.json(messages);
});

app.post('/api/chats/:sessionId/messages', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [sessionRows] = await connection.execute('SELECT studentId, counselorId FROM counseling_sessions WHERE id = ?', [sessionId]);
        if (sessionRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Session not found." });
        }
        
        const session = sessionRows[0];
        if (req.user.id !== session.studentId && req.user.id !== session.counselorId) {
            await connection.rollback();
            return res.status(403).json({ message: "You are not part of this chat session." });
        }

        await connection.execute('INSERT INTO chat_messages (sessionId, senderId, message) VALUES (?, ?, ?)', [sessionId, req.user.id, message]);
        // Re-open chat on new message
        await connection.execute("UPDATE counseling_sessions SET chatStatus = 'open' WHERE id = ?", [sessionId]);
        
        // Notify recipient
        const recipientId = req.user.id === session.studentId ? session.counselorId : session.studentId;
        await createNotification(recipientId, `Pesan baru dari ${req.user.name}`, `/dashboard/chat`);


        await connection.commit();
        res.status(201).json({ message: "Message sent." });
    } catch(error) {
        await connection.rollback();
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

app.put('/api/chats/:sessionId/status', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { chatStatus } = req.body; // 'open' or 'closed'

    if (!['open', 'closed'].includes(chatStatus)) {
        return res.status(400).json({ message: 'Invalid chat status.' });
    }

    try {
        // Authorization check
        const [sessionRows] = await db.execute('SELECT studentId, counselorId FROM counseling_sessions WHERE id = ?', [sessionId]);
        if (sessionRows.length === 0) return res.status(404).json({ message: "Session not found." });
        const session = sessionRows[0];
        if (req.user.id !== session.studentId && req.user.id !== session.counselorId) {
            return res.status(403).json({ message: "You are not part of this chat session." });
        }

        await db.execute("UPDATE counseling_sessions SET chatStatus = ? WHERE id = ?", [chatStatus, sessionId]);
        res.status(200).json({ message: `Chat status updated to ${chatStatus}` });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- NOTIFICATIONS ---
app.post('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
    try {
        await db.execute('UPDATE notifications SET is_read = 1 WHERE userId = ?', [req.user.id]);
        res.status(204).send();
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// --- ADMIN USER MANAGEMENT ---
app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    const { name, email, password, role, ...otherFields } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newId = `${role.substring(0,3)}-${Date.now()}`;
        const profilePicture = `https://i.pravatar.cc/150?u=${newId}`;
        
        const query = 'INSERT INTO users (id, name, email, password_hash, role, class, school, specialization, profilePicture, counselingStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await db.execute(query, [newId, name, email, password_hash, role, otherFields.class || null, otherFields.school || null, otherFields.specialization || null, profilePicture, otherFields.counselingStatus || 'active']);

        res.status(201).json({ message: 'User created successfully', id: newId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists.' });
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, ...otherFields } = req.body;
     if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required.' });
    }

    try {
        let query, params;
        const baseQuery = 'UPDATE users SET name=?, email=?, role=?, class=?, school=?, specialization=?, counselingStatus=?';
        const baseParams = [name, email, role, otherFields.class || null, otherFields.school || null, otherFields.specialization || null, otherFields.counselingStatus || 'active'];
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query = `${baseQuery}, password_hash=? WHERE id=?`;
            params = [...baseParams, password_hash, id];
        } else {
            query = `${baseQuery} WHERE id=?`;
            params = [...baseParams, id];
        }

        await db.execute(query, params);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
         if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists.' });
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete picture file
        const [[user]] = await connection.execute('SELECT profilePicture FROM users WHERE id = ?', [id]);
        if (user && user.profilePicture && !user.profilePicture.startsWith('https://')) {
            const oldPath = path.join(__dirname, UPLOAD_DIR, user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        // Must delete related records first due to foreign key constraints
        await connection.execute('DELETE FROM notifications WHERE userId = ?', [id]);
        await connection.execute('DELETE FROM counselor_notes WHERE counselorId = ?', [id]);
        await connection.execute('DELETE FROM counselor_settings WHERE counselorId = ?', [id]);
        await connection.execute('DELETE FROM counselor_availability WHERE counselorId = ?', [id]);
        const [sessions] = await connection.execute('SELECT id FROM counseling_sessions WHERE studentId = ? OR counselorId = ?', [id, id]);
        if (sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            await connection.query('DELETE FROM chat_messages WHERE sessionId IN (?)', [sessionIds]);
        }
        await connection.execute('DELETE FROM counseling_sessions WHERE studentId = ? OR counselorId = ?', [id, id]);
        await connection.execute('DELETE FROM student_notes WHERE studentId = ?', [id]);
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        
        await connection.commit();
        res.status(200).json({ message: 'User and all related data deleted successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});


// --- SERVER ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});