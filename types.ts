
export enum UserRole {
  STUDENT = 'student',
  COUNSELOR = 'counselor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  phone?: string;
  address?: string;
  birthDate?: string; // ISO string format YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  sessionCount?: number;

  // Student specific
  class?: string;
  school?: string;
  
  // Counselor specific
  counselorId?: string; // NIP
  specialization?: string;
  teachingPlace?: string;
  teachingSubject?: string;
  counselingStatus?: 'active' | 'inactive';
}

export interface AvailabilitySlot {
  id: number;
  counselorId: string;
  availableDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
}

export interface CounselingSession {
  id: string;
  studentId: string;
  studentName: string;
  counselorId: string;
  counselorName: string;
  dateTime: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  chatStatus: 'open' | 'closed';
  topic: string;
  studentNotes?: string;
  counselorNotes?: string;
  cancellation_reason?: string | null;
  cancellation_status?: 'pending_student' | 'pending_counselor' | 'approved' | null;
}

export interface StudentNote {
  id: string;
  studentId: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface CounselorNote {
  id: string;
  counselorId: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  userId: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface Testimonial {
  quote: string;
  author: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CounselorSettings {
    defaultSlots: number[]; // Array of 7 numbers, for Sun-Sat
}

export interface Counselor extends User {
    availability?: {
        available: AvailabilitySlot[],
        booked: Pick<CounselingSession, 'id' | 'dateTime' | 'status' | 'studentId'>[]
    };
    settings?: CounselorSettings;
}