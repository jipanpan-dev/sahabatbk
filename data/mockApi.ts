
import { User, UserRole, CounselingSession, Counselor } from '../types';

// The password for all mock accounts.
const MOCK_PASSWORD = 'password123';

const users: User[] = [
    {
        id: 'admin-001', name: 'Admin SahabatBK', email: 'admin@sahabatbk.id', role: UserRole.ADMIN,
        profilePicture: 'https://i.pravatar.cc/150?u=admin-001', specialization: 'Sistem Administrator'
    },
    {
        id: 'counselor-001', name: 'Anisa Fitriani, S.Psi.', email: 'anisa@konselor.id', role: UserRole.COUNSELOR,
        profilePicture: 'https://i.pravatar.cc/150?u=counselor-001', phone: '081234567890', counselorId: 'NIP199001012015032001', specialization: 'Karir dan Kecemasan'
    },
    {
        id: 'student-001', name: 'Budi Santoso', email: 'budi@siswa.id', role: UserRole.STUDENT,
        profilePicture: 'https://i.pravatar.cc/150?u=student-001', class: 'IX A', school: 'SMP Harapan Bangsa'
    }
];

const sessions: CounselingSession[] = [
    { id: 'session-001', studentId: 'student-001', counselorId: 'counselor-001', studentName: 'Budi Santoso', counselorName: 'Anisa Fitriani, S.Psi.', dateTime: new Date(new Date().setDate(new Date().getDate() + 3)), status: 'confirmed', chatStatus: 'open', topic: 'Bingung memilih SMA' },
    { id: 'session-002', studentId: 'student-001', counselorId: 'counselor-001', studentName: 'Budi Santoso', counselorName: 'Anisa Fitriani, S.Psi.', dateTime: new Date(new Date().setDate(new Date().getDate() + 10)), status: 'pending', chatStatus: 'closed', topic: 'Masalah dengan teman sekelas' },
    { id: 'session-003', studentId: 'student-001', counselorId: 'counselor-001', studentName: 'Budi Santoso', counselorName: 'Anisa Fitriani, S.Psi.', dateTime: new Date(new Date().setDate(new Date().getDate() - 5)), status: 'completed', chatStatus: 'closed', topic: 'Kesulitan fokus belajar' },
    { id: 'session-004', studentId: 'student-001', counselorId: 'counselor-001', studentName: 'Budi Santoso', counselorName: 'Anisa Fitriani, S.Psi.', dateTime: new Date(new Date().setDate(new Date().getDate() - 10)), status: 'canceled', chatStatus: 'closed', topic: 'Tidak bisa hadir' }
];

const counselors: Counselor[] = users
    .filter(u => u.role === UserRole.COUNSELOR)
    .map((c, index) => ({
        ...c,
        availability: {
            available: [
                { id: (index * 10) + 1, counselorId: c.id, availableDate: "2024-07-29", startTime: "09:00:00" },
                { id: (index * 10) + 2, counselorId: c.id, availableDate: "2024-07-29", startTime: "10:00:00" },
                { id: (index * 10) + 3, counselorId: c.id, availableDate: "2024-07-29", startTime: "11:00:00" },
                { id: (index * 10) + 4, counselorId: c.id, availableDate: "2024-07-30", startTime: "13:00:00" },
                { id: (index * 10) + 5, counselorId: c.id, availableDate: "2024-07-30", startTime: "14:00:00" },
                { id: (index * 10) + 6, counselorId: c.id, availableDate: "2024-07-30", startTime: "15:00:00" },
            ],
            booked: []
        }
    }));

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const mockLogin = async (email: string, password: string): Promise<{ token: string, user: User } | null> => {
    await delay(500); // Simulate network delay
    const user = users.find(u => u.email === email);
    if (user && password === MOCK_PASSWORD) {
        // In our mock setup, the "token" is just the stringified user object.
        // This is NOT secure and should only be done for mocking.
        const token = JSON.stringify(user);
        return { token, user };
    }
    return null;
};

export const mockValidateToken = async (token: string): Promise<User | null> => {
    await delay(200);
    try {
        const user = JSON.parse(token);
        // A simple check to see if it's a valid user object from our mock list
        if (user && user.id && users.some(u => u.id === user.id)) {
            return user;
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const mockGetDashboardData = async (token: string): Promise<any> => {
    await delay(800);
    const user = await mockValidateToken(token);

    if (!user) {
        throw new Error("Invalid token");
    }

    const { id, role } = user;

    switch(role) {
        case UserRole.STUDENT: {
            const studentSessions = sessions.filter(s => s.studentId === id);
            return { sessions: studentSessions, counselors };
        }
        case UserRole.COUNSELOR: {
            const counselorSessions = sessions.filter(s => s.counselorId === id);
            return { sessions: counselorSessions };
        }
        case UserRole.ADMIN: {
            const allStudents = users.filter(u => u.role === UserRole.STUDENT);
            const allCounselors = users.filter(u => u.role === UserRole.COUNSELOR);
            return { students: allStudents, counselors: allCounselors, sessions };
        }
        default:
            throw new Error("Forbidden");
    }
};