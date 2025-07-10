

import React, { useState, useMemo, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { NavLink, Route, Routes, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole, CounselingSession, Counselor, User, StudentNote, ChatMessage, AvailabilitySlot, Notification, CounselorNote } from '../types';
import { Home, Calendar, MessageSquare, History, Book, UserIcon, LogOut, Menu, X, Bell, Users, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, GraduationCap, Edit, Trash2, PlusCircle, Camera, Save } from '../components/Icons';
import { API_URL } from '../config';

// --- API HELPER ---
const authenticatedFetch = async (url: string, token: string | null, options: RequestInit = {}) => {
    if (!token) throw new Error("No token provided");
    
    const isFormData = options.body instanceof FormData;
    
    const headers = {
        ...(!isFormData && {'Content-Type': 'application/json'}),
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, { ...options, headers });
    
    // Handle empty response bodies (e.g. for 204 No Content)
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
};


// --- DASHBOARD DATA CONTEXT ---
interface DashboardDataContextType {
    sessions: CounselingSession[];
    students: User[];
    counselors: Counselor[];
    notes: StudentNote[];
    counselorNotes: CounselorNote[];
    availability: Counselor['availability'] | null;
    settings: any;
    activeChatCount: number;
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

const dashboardInitialState: Omit<DashboardDataContextType, 'isLoading' | 'error' | 'refetch'> = {
    sessions: [],
    students: [],
    counselors: [],
    notes: [],
    counselorNotes: [],
    availability: null,
    settings: {},
    activeChatCount: 0,
    notifications: [],
    unreadCount: 0,
};

const DashboardDataContext = createContext<DashboardDataContextType | null>(null);

const useDashboard = () => {
    const context = useContext(DashboardDataContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};

const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [data, setData] = useState(dashboardInitialState);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchData = useCallback(async () => {
        if (!token || !user) {
            setIsLoading(false);
            setIsInitialLoad(false);
            return;
        }

        if (isInitialLoad) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const fetchedData = await authenticatedFetch('/api/dashboard/data', token);
            
            if (fetchedData.sessions) {
               fetchedData.sessions.forEach((s: any) => { s.dateTime = new Date(s.dateTime); });
            }
            if (fetchedData.availability?.booked) {
                fetchedData.availability.booked.forEach((s: any) => { s.dateTime = new Date(s.dateTime); });
            }
            
            setData({ ...dashboardInitialState, ...fetchedData });
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
                setIsInitialLoad(false);
            }
        }
    }, [token, user, isInitialLoad]);

    useEffect(() => {
        fetchData(); // Initial fetch
        const intervalId = setInterval(fetchData, 15000); // Poll every 15 seconds
        return () => clearInterval(intervalId); // Cleanup
    }, [fetchData]);
    
    const value = useMemo(() => ({
        ...data,
        isLoading,
        error,
        refetch: fetchData,
    }), [data, isLoading, error, fetchData]);

    return (
        <DashboardDataContext.Provider value={value}>
            {children}
        </DashboardDataContext.Provider>
    );
};


// --- UTILITY FUNCTIONS & COMPONENTS ---
const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className, onClick }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className || ''}`} onClick={onClick}>
        {children}
    </div>
);

const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid Date';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    };
    return new Intl.DateTimeFormat('id-ID', options || defaultOptions).format(dateObj);
};

const getStatusBadge = (status: CounselingSession['status']) => {
    switch (status) {
        case 'confirmed': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Dikonfirmasi</span>;
        case 'pending': return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Menunggu</span>;
        case 'completed': return <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-200 rounded-full">Selesai</span>;
        case 'canceled': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Dibatalkan</span>;
    }
}

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>
);

const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose}><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <div className="p-6">
              {children}
            </div>
        </div>
    </div>
);

const getDateRange = (rangeKey: string): { start?: Date, end?: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // End of today

    switch (rangeKey) {
        case 'today':
            return { start: today, end: endOfToday };
        case 'next7': {
            const end = new Date(today);
            end.setDate(today.getDate() + 7);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }
        case 'last7': {
            const start = new Date(today);
            start.setDate(today.getDate() - 7);
            return { start, end: endOfToday };
        }
        case 'next14': {
            const end = new Date(today);
            end.setDate(today.getDate() + 14);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }
        case 'last14': {
            const start = new Date(today);
            start.setDate(today.getDate() - 14);
            return { start, end: endOfToday };
        }
        case 'next30': {
            const end = new Date(today);
            end.setDate(today.getDate() + 30);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }
        case 'last30': {
            const start = new Date(today);
            start.setDate(today.getDate() - 30);
            return { start, end: endOfToday };
        }
         case 'next90': {
            const end = new Date(today);
            end.setDate(today.getDate() + 90);
            end.setHours(23, 59, 59, 999);
            return { start: today, end };
        }
        case 'last90': {
            const start = new Date(today);
            start.setDate(today.getDate() - 90);
            return { start, end: endOfToday };
        }
        default:
            return {};
    }
};


// --- VIEWS / SUB-PAGES ---

// Shared
const ProfilePictureUploader = ({ currentPicture, onUpload, onDelete, userId }: { currentPicture?: string; onUpload: (file: File) => void; onDelete: () => void; userId: string; }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'tiff', 'webp', 'bmp'];
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
            alert(`File tidak valid. Harap unggah file dengan ekstensi: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert("Ukuran file terlalu besar. Ukuran maksimal adalah 2MB.");
            return;
        }
        
        onUpload(file);
    };

    const pictureSrc = currentPicture?.startsWith('https://') ? currentPicture : `${API_URL}/img/${currentPicture}`;

    return (
        <div className="relative group w-24 h-24">
            <img src={pictureSrc} alt="Profile" className="w-24 h-24 rounded-full bg-slate-200 object-cover" />
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <Camera className="w-8 h-8 text-white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
             <button onClick={onDelete} className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                <Trash2 className="w-4 h-4"/>
            </button>
        </div>
    );
};

const ProfileView = () => {
    const { user, token, logout, refreshUser } = useAuth();
    const [formData, setFormData] = useState(user);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => prev ? ({ ...prev, [e.target.name]: e.target.value }) : null);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!formData) return;
        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password tidak cocok.' });
            return;
        }

        try {
            const payload: any = { ...formData };
            delete payload.id;
            delete payload.role;
            if (password) payload.password = password;

            await authenticatedFetch('/api/profile', token, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
            await refreshUser();
            if(password) setTimeout(() => logout(), 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handlePictureUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        try {
            await authenticatedFetch('/api/profile/picture', token, {
                method: 'POST',
                body: formData
            });
            await refreshUser();
            setMessage({ type: 'success', text: 'Foto profil diperbarui.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handlePictureDelete = async () => {
        if (!window.confirm("Yakin ingin hapus foto profil?")) return;
        try {
            await authenticatedFetch('/api/profile/picture', token, { method: 'DELETE' });
            await refreshUser();
            setMessage({ type: 'success', text: 'Foto profil dihapus.' });
        } catch (error: any) {
             setMessage({ type: 'error', text: error.message });
        }
    };

    if (!formData) return <LoadingSpinner/>

    const renderRoleSpecificFields = () => {
        switch(user?.role) {
            case UserRole.STUDENT: return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Kelas</label>
                        <input type="text" name="class" value={formData.class || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Sekolah</label>
                        <input type="text" name="school" value={formData.school || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                </>
            )
            case UserRole.COUNSELOR: return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Tempat Mengajar</label>
                        <input type="text" name="teachingPlace" value={formData.teachingPlace || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Mata Pelajaran</label>
                        <input type="text" name="teachingSubject" value={formData.teachingSubject || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Spesialisasi</label>
                        <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Status Konseling</label>
                        <select name="counselingStatus" value={formData.counselingStatus || 'inactive'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm">
                            <option value="active">Aktif Konseling</option>
                            <option value="inactive">Tidak Aktif</option>
                        </select>
                    </div>
                </>
            )
            default: return null;
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Profil Saya</h1>
            <Card>
                <form className="space-y-6" onSubmit={handleProfileUpdate}>
                    <div className="flex items-center space-x-6">
                        <ProfilePictureUploader 
                            currentPicture={user?.profilePicture} 
                            onUpload={handlePictureUpload}
                            onDelete={handlePictureDelete}
                            userId={user?.id || ''}
                        />
                        <div>
                            <h2 className="text-2xl font-bold">{user?.name}</h2>
                            <p className="text-slate-500">{user?.email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        {/* Common Fields */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nomor Telepon</label>
                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Tanggal Lahir</label>
                            <input type="date" name="birthDate" value={formData.birthDate?.split('T')[0] || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                            <select name="gender" value={formData.gender || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm">
                                <option value="">Pilih</option>
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700">Alamat Domisili</label>
                             <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        {renderRoleSpecificFields()}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Ganti Password (opsional)</label>
                            <input type="password" placeholder="Password Baru" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                            <input type="password" placeholder="Konfirmasi Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                    </div>
                    {message && <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
                    <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"><Save className="w-5 h-5"/>Simpan Perubahan</button>
                </form>
            </Card>
        </div>
    );
};

const ChatView = () => {
    const { sessions, isLoading, refetch } = useDashboard();
    const [selectedSession, setSelectedSession] = useState<CounselingSession | null>(null);

    const chatSessions = useMemo(() => sessions.filter((s: CounselingSession) => ['confirmed', 'pending', 'completed'].includes(s.status)), [sessions]);

    if (isLoading) return <LoadingSpinner />;
    if (selectedSession) return <ChatInterface session={selectedSession} onBack={() => setSelectedSession(null)} refetchList={refetch} />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Live Chat</h1>
            <Card>
                <div className="space-y-4">
                    {chatSessions.length > 0 ? chatSessions.map((s: CounselingSession) => (
                        <div key={s.id} onClick={() => setSelectedSession(s)} className="p-4 bg-slate-50 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{s.counselorName || s.studentName}</p>
                                    <p className="text-sm text-slate-600">{s.topic}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {s.chatStatus === 'open' && <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Aktif</span>}
                                  {s.chatStatus === 'closed' && <span className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-200 rounded-full">Ditutup</span>}
                                  {getStatusBadge(s.status)}
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-center text-slate-500">Tidak ada sesi chat aktif. Buat jadwal konseling untuk memulai chat.</p>}
                </div>
            </Card>
        </div>
    );
};

const ChatInterface = ({ session, onBack, refetchList }: { session: CounselingSession, onBack: () => void, refetchList: () => void }) => {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const data = await authenticatedFetch(`/api/chats/${session.id}/messages`, token);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session.id, token]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchMessages]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await authenticatedFetch(`/api/chats/${session.id}/messages`, token, {
                method: 'POST',
                body: JSON.stringify({ message: newMessage }),
            });
            setNewMessage('');
            fetchMessages();
            refetchList(); // To update chat status on list view
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleFinishChat = async () => {
        if (!window.confirm("Anda yakin ingin menyelesaikan (menutup) chat ini? Anda dapat membukanya kembali dengan mengirim pesan baru.")) return;
        try {
            await authenticatedFetch(`/api/chats/${session.id}/status`, token, {
                method: 'PUT',
                body: JSON.stringify({ chatStatus: 'closed' })
            });
            alert("Chat ditutup.");
            refetchList();
            onBack();
        } catch (error) {
            alert("Gagal menutup chat.");
        }
    }
    
    return (
         <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-800">
                    <ChevronLeft className="w-5 h-5"/> Kembali ke Daftar Chat
                </button>
                {session.chatStatus !== 'closed' && (
                    <button onClick={handleFinishChat} className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-yellow-600">
                        Selesai Chat
                    </button>
                )}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Chat dengan {session.counselorName || session.studentName}</h1>
            <p className="text-slate-500 mb-4">Topik: {session.topic}</p>
            <Card className="h-[65vh] flex flex-col">
                <div className="flex-grow bg-slate-100 rounded-lg p-4 space-y-4 overflow-y-auto">
                    {isLoading ? <LoadingSpinner /> : messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg p-3 max-w-xs ${msg.senderId === user?.id ? 'bg-primary-500 text-white' : 'bg-white shadow-sm'}`}>
                                <p className="font-bold text-sm">{msg.senderName.split(" ")[0]}</p>
                                <p>{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{formatDate(msg.timestamp, { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="mt-4 flex gap-4">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesanmu..." className="flex-grow border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    <button type="submit" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 font-semibold">Kirim</button>
                </form>
            </Card>
        </div>
    )
};


// Student Views
const StudentHomeView = () => {
    const { user } = useAuth();
    const { sessions, isLoading } = useDashboard();
    const navigate = useNavigate();
    
    const upcomingSessions = useMemo(() => sessions.filter((s: CounselingSession) => ['confirmed', 'pending'].includes(s.status) && s.dateTime > new Date()).sort((a: CounselingSession, b: CounselingSession) => a.dateTime.getTime() - b.dateTime.getTime()).slice(0, 3), [sessions]);
    const activeChats = useMemo(() => sessions.filter((s: CounselingSession) => s.chatStatus === 'open'), [sessions]);

    if(isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Selamat Datang, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 mb-6">Semoga harimu menyenangkan. Kami di sini untukmu.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Sesi Konseling Berikutnya</h2>
                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingSessions.map(session => (
                                <div key={session.id} className="p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold">{session.counselorName}</p>
                                    <p className="text-sm text-slate-600">{session.topic}</p>
                                    <p className="text-primary-600 font-bold mt-1">{formatDate(session.dateTime)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500">Kamu belum memiliki jadwal konseling yang akan datang.</p>
                    )}
                     <button onClick={() => navigate('../schedule')} className="mt-4 bg-secondary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-secondary-600">Buat Jadwal Baru</button>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold mb-4">Live Chat Aktif</h2>
                    {activeChats.length > 0 ? (
                         <div className="space-y-3">
                            {activeChats.map(session => (
                                <div key={session.id} onClick={() => navigate('../chat')} className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100">
                                    <p className="font-semibold text-sm">{session.counselorName}</p>
                                    <p className="text-xs text-slate-600 truncate">{session.topic}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">Tidak ada percakapan aktif.</p>
                    )}
                </Card>
            </div>
        </div>
    );
}

const StudentScheduleView = () => {
    const { token } = useAuth();
    const { counselors: allCounselors, isLoading: isCounselorsLoading, refetch: refetchDashboard } = useDashboard();
    const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
    const [availability, setAvailability] = useState<Counselor['availability'] | null>(null);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [bookingSlot, setBookingSlot] = useState<{ date: Date, time: string } | null>(null);

    useEffect(() => {
        if (!selectedCounselor) return;

        const fetchAvailability = async () => {
            setIsLoadingAvailability(true);
            try {
                const data = await authenticatedFetch(`/api/counselors/${selectedCounselor.id}/availability`, token);
                setAvailability(data);
            } catch (error) {
                console.error("Failed to fetch availability", error);
                setAvailability(null);
            } finally {
                setIsLoadingAvailability(false);
            }
        };
        fetchAvailability();
    }, [selectedCounselor, token]);

    const handleSelectCounselor = (counselor: Counselor) => {
        setSelectedCounselor(counselor);
        setAvailability(null);
    }

    const handleBookSession = async (topic: string) => {
        if (!bookingSlot || !selectedCounselor) return;
        
        const { date, time } = bookingSlot;
        const dateTime = new Date(date);
        const [hours, minutes] = time.split(':');
        dateTime.setHours(parseInt(hours), parseInt(minutes));

        try {
            await authenticatedFetch('/api/sessions', token, {
                method: 'POST',
                body: JSON.stringify({
                    counselorId: selectedCounselor.id,
                    dateTime: dateTime.toISOString(),
                    topic,
                }),
            });
            alert("Sesi berhasil dijadwalkan dan menunggu konfirmasi dari konselor.");
            setBookingSlot(null);
            refetchDashboard();
        } catch (error: any) {
            alert(`Gagal membuat jadwal: ${error.message}`);
        }
    };

    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Jadwal Konseling</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Pilih Konselor</h2>
                    {isCounselorsLoading ? <LoadingSpinner/> : (
                        <div className="space-y-3">
                            {allCounselors.filter(c => c.counselingStatus === 'active').map((c: Counselor) => (
                                <div key={c.id} onClick={() => handleSelectCounselor(c)}
                                    className={`p-3 rounded-lg flex items-center gap-4 cursor-pointer transition-all ${selectedCounselor?.id === c.id ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-slate-50 hover:bg-slate-100'}`}
                                >
                                    <img src={c.profilePicture?.startsWith('https://') ? c.profilePicture : `${API_URL}/img/${c.profilePicture}`} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold">{c.name}</p>
                                        <p className="text-sm text-slate-600">{c.specialization}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
             <div className="lg:col-span-2">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Pilih Tanggal & Waktu</h2>
                    {!selectedCounselor ? <p className="text-center text-slate-500 py-10">Silakan pilih konselor terlebih dahulu.</p> :
                     isLoadingAvailability ? <LoadingSpinner/> :
                     !availability ? <p className="text-center text-red-500 py-10">Tidak dapat memuat jadwal konselor.</p> : (
                        <CalendarComponent
                            availability={availability}
                            onSelectSlot={(date, time) => setBookingSlot({ date, time })}
                        />
                     )
                    }
                </Card>
            </div>
        </div>
        {bookingSlot && selectedCounselor && (
            <BookingModal
                counselorName={selectedCounselor.name}
                slot={bookingSlot}
                onClose={() => setBookingSlot(null)}
                onBook={handleBookSession}
            />
        )}
      </div>
    );
};

const BookingModal = ({ counselorName, slot, onClose, onBook }: { counselorName: string, slot: {date: Date, time: string}, onClose: () => void, onBook: (topic: string) => Promise<void> }) => {
    const [topic, setTopic] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            alert("Topik tidak boleh kosong.");
            return;
        }
        setIsBooking(true);
        await onBook(topic);
        setIsBooking(false);
    }
    
    return (
        <Modal onClose={onClose} title="Konfirmasi Jadwal Konseling">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p>Anda akan membuat jadwal dengan <span className="font-bold">{counselorName}</span>.</p>
                <p>Pada: <span className="font-bold">{formatDate(slot.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                <p>Pukul: <span className="font-bold">{slot.time} WIB</span></p>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Topik Konseling</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Contoh: Bingung memilih SMA" className="mt-1 w-full border p-2 rounded" required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Batal</button>
                    <button type="submit" disabled={isBooking} className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:bg-primary-300">
                        {isBooking ? 'Memproses...' : 'Buat Jadwal'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

const CancellationModal = ({ session, onClose, onSave }: { session: CounselingSession, onClose: () => void, onSave: () => void }) => {
    const { token } = useAuth();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert("Alasan pembatalan harus diisi.");
            return;
        }
        setIsSubmitting(true);
        try {
            await authenticatedFetch(`/api/sessions/${session.id}/request-cancellation`, token, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            onSave();
        } catch (error: any) {
            alert(`Gagal mengajukan pembatalan: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <Modal onClose={onClose} title="Ajukan Pembatalan Sesi">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p>Anda akan membatalkan sesi dengan <span className="font-bold">{session.counselorName || session.studentName}</span> pada <span className="font-bold">{formatDate(session.dateTime)}</span>.</p>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Alasan Pembatalan</label>
                    <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} className="mt-1 w-full border p-2 rounded" required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-red-300">
                        {isSubmitting ? 'Memproses...' : 'Ajukan Pembatalan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const StudentHistoryView = () => {
    const { sessions, isLoading, refetch } = useDashboard();
    const { user } = useAuth();
    const [cancellingSession, setCancellingSession] = useState<CounselingSession | null>(null);

    const handleSaveCancellation = () => {
        alert("Permintaan pembatalan telah dikirim.");
        refetch();
    };

    if(isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Riwayat Sesi</h1>
            <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((s: CounselingSession) => (
                    <Card key={s.id}>
                        <div className="flex justify-between items-start flex-wrap">
                            <div>
                                <p className="text-lg font-bold">Topik: {s.topic}</p>
                                <p className="text-slate-500">dengan {user?.role === 'student' ? s.counselorName : s.studentName}</p>
                                <p className="text-sm text-slate-500 mt-1">{formatDate(s.dateTime)}</p>
                                {s.status === 'canceled' && s.cancellation_reason && (
                                    <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded-md">
                                        <span className="font-bold">Alasan Batal:</span> {s.cancellation_reason}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 md:mt-0">
                                {getStatusBadge(s.status)}
                                {s.status === 'confirmed' && (
                                    <button onClick={() => setCancellingSession(s)} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg hover:bg-red-200 text-sm">Batalkan</button>
                                )}
                            </div>
                        </div>
                    </Card>
                )) : <Card><p className="text-slate-500 text-center">Tidak ada riwayat sesi.</p></Card>}
            </div>
            {cancellingSession && (
                <CancellationModal 
                    session={cancellingSession}
                    onClose={() => setCancellingSession(null)}
                    onSave={handleSaveCancellation}
                />
            )}
        </div>
    );
};

const StudentNotesView = () => {
    const { token } = useAuth();
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<StudentNote | null>(null);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await authenticatedFetch('/api/notes', token);
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleOpenModal = (note: StudentNote | null) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNote(null);
    };

    const handleSave = async () => {
        await fetchNotes();
        handleCloseModal();
    };

    const handleDelete = async (noteId: string) => {
        if (!window.confirm("Yakin ingin menghapus catatan ini?")) return;
        try {
            await authenticatedFetch(`/api/notes/${noteId}`, token, { method: 'DELETE' });
            alert("Catatan dihapus.");
            fetchNotes();
        } catch (error: any) {
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Catatan Pribadi</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">
                    <PlusCircle className="w-5 h-5"/> Buat Catatan Baru
                </button>
            </div>
            <p className="text-slate-600 mb-4">Gunakan ruang ini untuk mencatat perasaan atau pikiranmu. Catatan ini pribadi dan tidak dapat dilihat oleh siapapun.</p>
            {isLoading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <Card key={note.id} className="flex flex-col">
                            <h3 className="text-lg font-bold mb-2">{note.title}</h3>
                            <p className="text-slate-600 flex-grow whitespace-pre-wrap">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
                            <div className="border-t mt-4 pt-2 flex justify-between items-center">
                                <p className="text-xs text-slate-400">Diperbarui: {formatDate(note.updated_at, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(note)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                     {notes.length === 0 && <p className="text-slate-500 col-span-full text-center">Belum ada catatan.</p>}
                </div>
            )}
            {isModalOpen && <NoteFormModal note={editingNote} onClose={handleCloseModal} onSave={handleSave} token={token} noteType="student" />}
        </div>
    );
};

const NoteFormModal = ({ note, onClose, onSave, token, noteType }: { note: StudentNote | CounselorNote | null, onClose: () => void, onSave: () => void, token: string | null, noteType: 'student' | 'counselor' }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title) {
            setError("Judul tidak boleh kosong.");
            return;
        }
        
        const apiPath = noteType === 'student' ? '/api/notes' : '/api/counselor/notes';

        try {
            const url = note ? `${apiPath}/${note.id}` : apiPath;
            const method = note ? 'PUT' : 'POST';
            await authenticatedFetch(url, token, {
                method,
                body: JSON.stringify({ title, content })
            });
            onSave();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Modal onClose={onClose} title={note ? "Edit Catatan" : "Catatan Baru"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Judul</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Isi Catatan</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="mt-1 w-full border p-2 rounded" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Batal</button>
                    <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">Simpan</button>
                </div>
            </form>
        </Modal>
    );
};


// Counselor Views
const CounselorHomeView = () => {
    const { user } = useAuth();
    const { sessions, isLoading, activeChatCount } = useDashboard();
    const navigate = useNavigate();
    
    const upcomingSessions = useMemo(() => sessions.filter((s: CounselingSession) => ['confirmed', 'pending'].includes(s.status) && s.dateTime > new Date()).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()).slice(0, 3), [sessions]);
    const activeChats = useMemo(() => sessions.filter((s) => s.chatStatus === 'open'), [sessions]);
    const pendingRequestsCount = useMemo(() => sessions.filter(s => s.status === 'pending').length, [sessions]);

    if(isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Selamat Datang, {user?.name.split(',')[0]}!</h1>
            <p className="text-slate-500 mb-6">Berikut ringkasan aktivitas konseling Anda.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Sesi Konseling Berikutnya</h2>
                    {upcomingSessions.length > 0 ? (
                         <div className="space-y-3">
                            {upcomingSessions.map(session => (
                                <div key={session.id} className="p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold">{session.studentName}</p>
                                     <p className="text-sm text-slate-600">{session.topic}</p>
                                    <p className="font-bold text-primary-600 mt-1">{formatDate(session.dateTime)}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500">Tidak ada sesi terjadwal yang akan datang.</p>}
                </Card>
                 <div className="space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold mb-2">Permintaan Baru</h2>
                        <div className="flex items-center space-x-3">
                            <Bell className="w-8 h-8 text-primary-500"/>
                            <div>
                                <p className="text-2xl font-bold">{pendingRequestsCount}</p>
                                <p className="text-slate-500">Perlu ditinjau</p>
                            </div>
                         </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-2">Chat Aktif</h2>
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="w-8 h-8 text-blue-500"/>
                            <div>
                                <p className="text-2xl font-bold">{activeChatCount}</p>
                                <p className="text-slate-500">Percakapan</p>
                            </div>
                         </div>
                    </Card>
                </div>
                 <Card className="lg:col-span-3">
                    <h2 className="text-xl font-bold mb-4">Live Chat Aktif</h2>
                     {activeChats.length > 0 ? (
                         <div className="space-y-3">
                            {activeChats.map(session => (
                                <div key={session.id} onClick={() => navigate('../chat')} className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm">{session.studentName}</p>
                                        <p className="text-xs text-slate-600 truncate">{session.topic}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400"/>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">Tidak ada percakapan aktif.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

const CounselorScheduleView = () => {
    const { token } = useAuth();
    const { availability, settings, refetch } = useDashboard();
    const [isEditingDefaults, setIsEditingDefaults] = useState(false);
    const [defaultSlots, setDefaultSlots] = useState([3, 3, 3, 3, 3, 0, 0]);

    useEffect(() => {
        if (settings?.defaultSlots) {
            setDefaultSlots(settings.defaultSlots);
        }
    }, [settings]);

    const handleUpdateAvailability = async (date: Date, slots: string[]) => {
        const dateString = date.toISOString().split('T')[0];
        try {
            await authenticatedFetch('/api/counselor/availability', token, {
                method: 'POST',
                body: JSON.stringify({ availableDate: dateString, slots })
            });
            refetch();
        } catch (error) {
            alert("Gagal menyimpan ketersediaan.");
        }
    };
    
    const handleUpdateDefaults = async () => {
        try {
            await authenticatedFetch('/api/counselor/settings', token, {
                method: 'PUT',
                body: JSON.stringify({ key: 'defaultSlots', value: defaultSlots })
            });
            alert("Pengaturan slot default berhasil disimpan dan diterapkan untuk minggu ini.");
            setIsEditingDefaults(false);
            refetch();
        } catch (error) {
            alert("Gagal menyimpan pengaturan.");
        }
    }

    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Kelola Jadwal & Ketersediaan</h1>
                 <button onClick={() => setIsEditingDefaults(!isEditingDefaults)} className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600">
                    {isEditingDefaults ? 'Tutup Pengaturan Default' : 'Atur Slot Default'}
                </button>
            </div>
            {isEditingDefaults && (
                <Card className="mb-6">
                    <h3 className="text-lg font-bold mb-4">Atur Jumlah Slot Default per Hari</h3>
                    <div className="flex items-center justify-around gap-2">
                    {dayLabels.map((day, index) => (
                        <div key={index} className="text-center">
                            <label className="font-semibold">{day}</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={defaultSlots[index]}
                                onChange={(e) => {
                                    const newDefaults = [...defaultSlots];
                                    newDefaults[index] = parseInt(e.target.value) || 0;
                                    setDefaultSlots(newDefaults);
                                }}
                                className="w-16 p-2 border rounded-md text-center mt-1"
                            />
                        </div>
                    ))}
                    </div>
                    <div className="text-right mt-4">
                        <button onClick={handleUpdateDefaults} className="bg-primary-500 text-white px-4 py-2 rounded-lg">Simpan Default</button>
                    </div>
                </Card>
            )}
            <Card>
                <CalendarComponent
                    availability={availability}
                    isCounselorView={true}
                    onSaveDay={(date, slots) => handleUpdateAvailability(date, slots)}
                    defaultSlots={defaultSlots}
                />
            </Card>
         </div>
    );
};

const CounselorRequestsView = () => {
    const { sessions, isLoading, refetch } = useDashboard();
    const { token } = useAuth();
    const [rescheduleSession, setRescheduleSession] = useState<CounselingSession | null>(null);

    const pendingSessions = useMemo(() => sessions.filter((s: CounselingSession) => s.status === 'pending'), [sessions]);
    const cancellationRequests = useMemo(() => sessions.filter(s => s.cancellation_status === 'pending_student'), [sessions]);

    const handleUpdateStatus = async (sessionId: string, status: 'confirmed' | 'canceled') => {
        const action = status === 'confirmed' ? 'menerima' : 'menolak';
        if (!window.confirm(`Anda yakin ingin ${action} permintaan ini?`)) return;

        try {
            await authenticatedFetch(`/api/sessions/${sessionId}/status`, token, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            alert(`Permintaan berhasil di${action}.`);
            refetch();
        } catch (error: any) {
            alert(`Gagal memperbarui permintaan: ${error.message}`);
        }
    }
    
    const handleRescheduleSave = async (sessionId: string, newDateTime: string) => {
        try {
            await authenticatedFetch(`/api/sessions/${sessionId}/reschedule`, token, {
                method: 'PUT',
                body: JSON.stringify({ dateTime: newDateTime })
            });
            alert("Jadwal berhasil diubah.");
            setRescheduleSession(null);
            refetch();
        } catch (error: any) {
            alert(`Gagal mengubah jadwal: ${error.message}`);
        }
    };
    
    const handleApproveCancellation = async (sessionId: string) => {
        if (!window.confirm("Yakin ingin menyetujui pembatalan dari siswa?")) return;
        try {
            await authenticatedFetch(`/api/sessions/${sessionId}/approve-cancellation`, token, { method: 'POST' });
            alert("Pembatalan disetujui.");
            refetch();
        } catch (error: any) {
            alert(`Gagal menyetujui: ${error.message}`);
        }
    };

    if(isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Permintaan Sesi</h1>
            <Card className="mb-6">
                <h2 className="text-xl font-bold mb-4">Permintaan Sesi Baru</h2>
                <div className="space-y-4">
                    {pendingSessions.length > 0 ? pendingSessions.map((s: CounselingSession) => (
                        <div key={s.id} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex flex-col md:flex-row justify-between items-start">
                                <div>
                                    <p className="text-lg font-bold">{s.studentName}</p>
                                    <p className="text-slate-500">Request untuk: <span className="font-semibold">{formatDate(s.dateTime)}</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Topik: {s.topic}</p>
                                </div>
                                <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
                                    <button onClick={() => handleUpdateStatus(s.id, 'confirmed')} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg hover:bg-green-200 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Terima</button>
                                    <button onClick={() => handleUpdateStatus(s.id, 'canceled')} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg hover:bg-red-200 flex items-center gap-1"><XCircle className="w-4 h-4" /> Tolak</button>
                                    <button onClick={() => setRescheduleSession(s)} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg hover:bg-slate-200 flex items-center gap-1"><Calendar className="w-4 h-4"/> Ubah Jadwal</button>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-slate-500 text-center">Tidak ada permintaan sesi baru saat ini.</p>}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Permintaan Pembatalan dari Siswa</h2>
                <div className="space-y-4">
                    {cancellationRequests.length > 0 ? cancellationRequests.map((s: CounselingSession) => (
                        <div key={s.id} className="p-4 bg-yellow-50 rounded-lg">
                            <div className="flex flex-col md:flex-row justify-between items-start">
                                <div>
                                    <p className="text-lg font-bold">{s.studentName}</p>
                                    <p className="text-slate-500">Membatalkan sesi: <span className="font-semibold">{formatDate(s.dateTime)}</span></p>
                                    <p className="text-sm text-slate-500 mt-1">Alasan: {s.cancellation_reason}</p>
                                </div>
                                <div className="flex gap-2 mt-4 md:mt-0">
                                    <button onClick={() => handleApproveCancellation(s.id)} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg hover:bg-green-200">Setujui Pembatalan</button>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-slate-500 text-center">Tidak ada permintaan pembatalan.</p>}
                </div>
            </Card>
            {rescheduleSession && <RescheduleModal session={rescheduleSession} onClose={() => setRescheduleSession(null)} onSave={handleRescheduleSave}/>}
        </div>
    );
};

const CounselorNotesView = () => {
    const { token } = useAuth();
    const { refetch } = useDashboard();
    const [notes, setNotes] = useState<CounselorNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<CounselorNote | null>(null);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await authenticatedFetch('/api/counselor/notes', token);
            setNotes(data);
        } catch (error) {
            console.error("Failed to fetch counselor notes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleOpenModal = (note: CounselorNote | null) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNote(null);
    };

    const handleSave = async () => {
        await fetchNotes();
        refetch();
        handleCloseModal();
    };

    const handleDelete = async (noteId: string) => {
        if (!window.confirm("Yakin ingin menghapus catatan ini?")) return;
        try {
            await authenticatedFetch(`/api/counselor/notes/${noteId}`, token, { method: 'DELETE' });
            alert("Catatan dihapus.");
            fetchNotes();
        } catch (error: any) {
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Catatan Pribadi Konselor</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">
                    <PlusCircle className="w-5 h-5"/> Buat Catatan Baru
                </button>
            </div>
            <p className="text-slate-600 mb-4">Gunakan ruang ini untuk mencatat hal-hal penting terkait pekerjaan Anda. Catatan ini pribadi.</p>
            {isLoading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <Card key={note.id} className="flex flex-col">
                            <h3 className="text-lg font-bold mb-2">{note.title}</h3>
                            <p className="text-slate-600 flex-grow whitespace-pre-wrap">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
                            <div className="border-t mt-4 pt-2 flex justify-between items-center">
                                <p className="text-xs text-slate-400">Diperbarui: {formatDate(note.updated_at, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(note)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                     {notes.length === 0 && <p className="text-slate-500 col-span-full text-center">Belum ada catatan.</p>}
                </div>
            )}
            {isModalOpen && <NoteFormModal note={editingNote} onClose={handleCloseModal} onSave={handleSave} token={token} noteType="counselor" />}
        </div>
    );
};


const RescheduleModal = ({ session, onClose, onSave }: { session: CounselingSession, onClose: () => void, onSave: (sessionId: string, newDateTime: string) => void }) => {
    const [newDateTime, setNewDateTime] = useState(session.dateTime.toISOString().slice(0, 16));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(session.id, new Date(newDateTime).toISOString());
    }

    return (
        <Modal onClose={onClose} title="Ubah Jadwal Sesi">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p>Siswa: <span className="font-semibold">{session.studentName}</span></p>
                <p>Topik: <span className="font-semibold">{session.topic}</span></p>
                <div>
                    <label className="block text-sm font-medium">Jadwal Baru</label>
                    <input type="datetime-local" value={newDateTime} onChange={e => setNewDateTime(e.target.value)} className="w-full border p-2 rounded mt-1" />
                </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Batal</button>
                    <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">Simpan Jadwal</button>
                </div>
            </form>
        </Modal>
    )
}

// Admin Views
const AdminHomeView = () => {
    const { user } = useAuth();
    const { students, counselors, sessions, isLoading } = useDashboard();
    
    if(isLoading) return <LoadingSpinner />;

    const scheduledSessions = sessions.filter((s: CounselingSession) => s.status === 'confirmed' || s.status === 'pending').length;

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Selamat Datang, {user?.name}!</h1>
            <p className="text-slate-500 mb-6">Dasbor Administratif SahabatBK.</p>
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full"><GraduationCap className="w-8 h-8 text-blue-500"/></div>
                        <div>
                            <p className="text-3xl font-bold">{students.length}</p>
                            <p className="text-slate-500">Total Siswa</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-full"><Users className="w-8 h-8 text-green-500"/></div>
                        <div>
                            <p className="text-3xl font-bold">{counselors.length}</p>
                            <p className="text-slate-500">Total Konselor</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 p-3 rounded-full"><Calendar className="w-8 h-8 text-yellow-500"/></div>
                        <div>
                            <p className="text-3xl font-bold">{scheduledSessions}</p>
                            <p className="text-slate-500">Sesi Terjadwal</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdminUserManagementView = () => {
    const { students, counselors, isLoading, refetch } = useDashboard();
    const { token } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const users = useMemo(() => [...(students || []), ...(counselors || [])], [students, counselors]);

    const handleOpenModal = (user: User | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Yakin ingin menghapus pengguna ini? Semua data terkait (jadwal, chat) akan dihapus secara permanen.")) return;
        try {
            await authenticatedFetch(`/api/users/${userId}`, token, { method: 'DELETE' });
            alert("Pengguna berhasil dihapus.");
            refetch();
        } catch (error: any) {
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    const columns = useMemo(() => [
        {
            header: 'Pengguna',
            accessorKey: 'name',
            cell: (info: any) => {
                const user = info.row.original;
                const pictureSrc = user.profilePicture?.startsWith('https://') ? user.profilePicture : `${API_URL}/img/${user.profilePicture}`;
                return (
                    <div className="flex items-center gap-3">
                        <img src={pictureSrc} className="w-10 h-10 rounded-full object-cover bg-slate-200" alt={user.name} />
                        <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                    </div>
                )
            }
        },
        { header: 'Peran', accessorKey: 'role', cell: (info:any) => <span className="capitalize">{info.getValue()}</span> },
        { header: 'Sesi', accessorKey: 'sessionCount', cell: (info:any) => <span className="text-center block">{info.getValue()}</span> },
        {
            header: 'Status Konselor',
            accessorKey: 'counselingStatus',
            cell: (info: any) => {
                const user = info.row.original;
                if (user.role !== 'counselor') return <span className="text-slate-400">N/A</span>;
                const status = info.getValue();
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>{status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span>
            }
        },
        {
            header: 'Aksi',
            id: 'actions',
            cell: (info: any) => {
                const user = info.row.original;
                return (
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                    </div>
                )
            }
        }
    ], []);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Manajemen Pengguna</h1>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">
                    <PlusCircle className="w-5 h-5"/> Tambah Pengguna
                </button>
            </div>
            <Card className="overflow-x-auto">
                <DataTable columns={columns} data={users} />
            </Card>
            {isModalOpen && <UserFormModal user={editingUser} onClose={() => setIsModalOpen(false)} onSave={refetch} token={token}/>}
        </div>
    );
};

const UserFormModal = ({ user, onClose, onSave, token }: { user: User | null, onClose: () => void, onSave: () => void, token: string | null }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'student',
        class: user?.class || '',
        school: user?.school || '',
        specialization: user?.specialization || '',
        counselingStatus: user?.counselingStatus || 'active'
    });
    const [error, setError] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const url = user ? `/api/users/${user.id}` : '/api/users';
            const method = user ? 'PUT' : 'POST';
            
            const res = await authenticatedFetch(url, token, {
                method: method,
                body: JSON.stringify(formData)
            });
            
            const targetUserId = user ? user.id : res.id;

            if (profilePictureFile && targetUserId) {
                 const pictureFormData = new FormData();
                 pictureFormData.append('profilePicture', profilePictureFile);
                 await authenticatedFetch(`/api/users/${targetUserId}/picture`, token, {
                     method: 'POST',
                     body: pictureFormData,
                 });
            }

            alert(`Pengguna berhasil ${user ? 'diperbarui' : 'dibuat'}.`);
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const pictureSrc = user?.profilePicture?.startsWith('https://') 
        ? user.profilePicture 
        : user?.profilePicture ? `${API_URL}/img/${user.profilePicture}` : `https://i.pravatar.cc/150?u=new`;

    return (
        <Modal onClose={onClose} title={user ? "Edit Pengguna" : "Tambah Pengguna"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {user && (
                    <div className="flex justify-center">
                         <ProfilePictureUploader 
                            currentPicture={pictureSrc}
                            onUpload={(file) => setProfilePictureFile(file)}
                            onDelete={() => alert("Menghapus foto pengguna lain belum didukung dari form ini.")}
                            userId={user.id}
                        />
                    </div>
                )}
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Lengkap" className="w-full border p-2 rounded" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full border p-2 rounded" required />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? "Password Baru (kosongkan jika tidak berubah)" : "Password"} className="w-full border p-2 rounded" required={!user} />
                <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded">
                    <option value="student">Siswa</option>
                    <option value="counselor">Konselor</option>
                </select>

                {formData.role === 'student' && (
                    <>
                        <input type="text" name="class" value={formData.class} onChange={handleChange} placeholder="Kelas" className="w-full border p-2 rounded" />
                        <input type="text" name="school" value={formData.school} onChange={handleChange} placeholder="Sekolah" className="w-full border p-2 rounded" />
                    </>
                )}
                {formData.role === 'counselor' && (
                    <>
                        <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Spesialisasi" className="w-full border p-2 rounded" />
                        <select name="counselingStatus" value={formData.counselingStatus} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="active">Aktif Konseling</option>
                            <option value="inactive">Tidak Aktif</option>
                        </select>
                    </>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Batal</button>
                    <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">Simpan</button>
                </div>
            </form>
        </Modal>
    );
};


const AdminScheduleManagementView = () => {
    const { sessions, isLoading } = useDashboard();
    
    const columns = useMemo(() => [
        { header: 'ID Sesi', accessorKey: 'id', filterType: 'text' },
        { header: 'Siswa', accessorKey: 'studentName', filterType: 'text' },
        { header: 'Konselor', accessorKey: 'counselorName', filterType: 'text' },
        { 
            header: 'Jadwal', 
            accessorKey: 'dateTime', 
            cell: (info:any) => formatDate(info.getValue()),
            filterType: 'dateRange',
            filterOptions: [
                { value: 'all', label: 'Semua Tanggal' },
                { value: 'today', label: 'Hari Ini' },
                { value: 'next7', label: '7 Hari Kedepan' },
                { value: 'last7', label: '7 Hari Kebelakang' },
                { value: 'next14', label: '14 Hari Kedepan' },
                { value: 'last14', label: '14 Hari Kebelakang' },
                { value: 'next30', label: '30 Hari Kedepan' },
                { value: 'last30', label: '30 Hari Kebelakang' },
                { value: 'next90', label: '90 Hari Kedepan' },
                { value: 'last90', label: '90 Hari Kebelakang' },
            ]
        },
        { header: 'Topik', accessorKey: 'topic', filterType: 'text' },
        { 
            header: 'Status', 
            accessorKey: 'status', 
            cell: (info:any) => getStatusBadge(info.getValue()),
            filterType: 'select',
            filterOptions: [
                { value: '', label: 'Semua Status' },
                { value: 'pending', label: 'Menunggu' },
                { value: 'confirmed', label: 'Dikonfirmasi' },
                { value: 'completed', label: 'Selesai' },
                { value: 'canceled', label: 'Dibatalkan' },
            ]
        }
    ], []);

    if (isLoading) return <LoadingSpinner/>

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Manajemen Jadwal</h1>
            <Card className="overflow-x-auto">
               <DataTable columns={columns} data={sessions || []} />
            </Card>
        </div>
    )
};


// --- REUSABLE COMPONENTS ---

const DataTable = ({ columns, data }: { columns: any[], data: any[]}) => {
    const [sort, setSort] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: columns[0]?.accessorKey || 'name', direction: 'asc' });

    const handleSort = (key: string) => {
        setSort(currentSort => {
            if (currentSort?.key === key) {
                return { key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };
    
    const [filters, setFilters] = useState<Record<string, string>>({});
    
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({...prev, [key]: value }));
    }

    const filteredData = useMemo(() => {
        let filtered = [...data];
        Object.entries(filters).forEach(([key, value]) => {
            if (!value || value === 'all' || value === '') return;
            
            const columnDef = columns.find(c => c.accessorKey === key);
            
            if (columnDef?.filterType === 'dateRange') {
                const { start, end } = getDateRange(value);
                if (start && end) {
                    filtered = filtered.filter(row => {
                        const rowDate = new Date(row[key]);
                        return rowDate >= start && rowDate <= end;
                    });
                }
            } else { // 'text' and 'select' are handled the same way
                filtered = filtered.filter(row =>
                    String(row[key]).toLowerCase().includes(value.toLowerCase())
                );
            }
        });
        return filtered;
    }, [data, filters, columns]);

    const sortedData = useMemo(() => {
        if (!sort || !sort.key) {
            return filteredData;
        }
        return [...filteredData].sort((a, b) => {
            const valA = a[sort.key];
            const valB = b[sort.key];
            if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sort]);

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.header} scope="col" className="px-6 py-3 whitespace-nowrap">
                                <div onClick={() => col.accessorKey && handleSort(col.accessorKey)} className="flex items-center gap-1 cursor-pointer">
                                    {col.header}
                                    {sort && sort.key === col.accessorKey ? (sort.direction === 'asc' ? '▲' : '▼') : null}
                                </div>
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {columns.map(col => (
                            <th key={`${col.header}-filter`} className="px-2 py-1 align-top">
                                {col.filterType === 'select' && col.filterOptions && (
                                    <select
                                        value={filters[col.accessorKey] || ''}
                                        onChange={e => handleFilterChange(col.accessorKey, e.target.value)}
                                        className="w-full border text-sm p-1 rounded-md bg-white"
                                    >
                                        {col.filterOptions.map((opt: {value:string, label:string}) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                )}
                                {col.filterType === 'dateRange' && col.filterOptions && (
                                    <select
                                        value={filters[col.accessorKey] || ''}
                                        onChange={e => handleFilterChange(col.accessorKey, e.target.value)}
                                        className="w-full border text-sm p-1 rounded-md bg-white"
                                    >
                                        {col.filterOptions.map((opt: {value:string, label:string}) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                )}
                                {(!col.filterType || col.filterType === 'text') && col.accessorKey && (
                                    <input
                                        type="text"
                                        placeholder={`Filter ${col.header}...`}
                                        value={filters[col.accessorKey] || ''}
                                        onChange={e => handleFilterChange(col.accessorKey, e.target.value)}
                                        className="w-full border text-sm p-1 rounded-md"
                                    />
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, index) => (
                        <tr key={row.id || index} className="bg-white border-b hover:bg-slate-50">
                            {columns.map(col => (
                                <td key={col.id || col.accessorKey} className="px-6 py-4">
                                    {col.cell ? col.cell({ row: { original: row }, getValue: () => row[col.accessorKey] }) : row[col.accessorKey]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CalendarComponent = ({ availability, onSelectSlot, isCounselorView, onSaveDay, defaultSlots = [3,3,3,3,3,0,0] }: {
    availability: Counselor['availability'] | null,
    onSelectSlot?: (date: Date, time: string) => void,
    isCounselorView?: boolean,
    onSaveDay?: (date: Date, slots: string[]) => void,
    defaultSlots?: number[]
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingDay, setEditingDay] = useState<Date | null>(null);
    const [daySlots, setDaySlots] = useState<string[]>([]);
    const navigate = useNavigate();
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1);
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    const availableSlotsByDate = useMemo(() => {
        const map = new Map<string, string[]>();
        if (!availability || !Array.isArray(availability.available)) {
            return map;
        }
        availability.available.forEach(slot => {
            const dateKey = slot.availableDate;
            const time = slot.startTime.substring(0, 5);
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)?.push(time);
        });
        return map;
    }, [availability]);

    const bookedSlotsMap = useMemo(() => {
        const map = new Map<string, Pick<CounselingSession, 'id' | 'status' | 'studentId'>>();
        if (!availability || !Array.isArray(availability.booked)) {
            return map;
        }
        availability.booked.forEach(session => {
            const dateObj = new Date(session.dateTime);
            const dateKey = dateObj.toISOString().split('T')[0];
            const timeKey = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            map.set(`${dateKey}_${timeKey}`, { id: session.id, status: session.status, studentId: session.studentId });
        });
        return map;
    }, [availability]);

    const handleEditDay = (day: number) => {
        if (!isCounselorView) return;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setEditingDay(date);
        const dateKey = date.toISOString().split('T')[0];
        const existingSlots = availableSlotsByDate.get(dateKey) || [];
        setDaySlots(existingSlots);
    };

    const handleSlotChange = (time: string, checked: boolean) => {
        setDaySlots(prev => {
            if (checked) {
                return [...prev, time].sort();
            } else {
                return prev.filter(t => t !== time);
            }
        });
    }

    const saveDayChanges = () => {
        if (editingDay && onSaveDay) {
            onSaveDay(editingDay, daySlots);
        }
        setEditingDay(null);
    }
    
    const applyDefaultSlots = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        const numSlots = defaultSlots[dayOfWeek];
        const defaultTimes = Array.from({ length: numSlots }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`);
        setDaySlots(defaultTimes);
    }

    const renderDayCell = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        const allPossibleSlots = Array.from({length: 8}, (_, i) => `${String(9+i).padStart(2,'0')}:00`);
        let daySlotsSet = new Set(availableSlotsByDate.get(dateKey));
        bookedSlotsMap.forEach((_val, key) => {
            if (key.startsWith(dateKey)) {
                daySlotsSet.add(key.split('_')[1]);
            }
        });
        const slots = Array.from(daySlotsSet).sort();


        if (editingDay && editingDay.getTime() === date.getTime()) {
            return (
                <div className="p-2 bg-blue-100 rounded-lg">
                    <p className="font-bold text-center">{day}</p>
                    <div className="text-xs space-y-1 mt-1">
                        {allPossibleSlots.map(time => (
                            <label key={time} className="flex items-center gap-1">
                                <input type="checkbox" checked={daySlots.includes(time)} onChange={(e) => handleSlotChange(time, e.target.checked)} />
                                {time}
                            </label>
                        ))}
                    </div>
                    <button onClick={() => applyDefaultSlots(day)} className="text-xs text-blue-600 w-full mt-1">Apply Default</button>
                    <button onClick={saveDayChanges} className="text-xs bg-primary-500 text-white rounded w-full mt-1">Save</button>
                </div>
            )
        }
        
        const isPast = new Date(dateKey) < new Date(new Date().toDateString());
        const cellClass = isPast ? 'bg-slate-50 text-slate-400' : 'bg-white hover:bg-primary-50';

        return (
            <div className={`p-2 rounded-lg h-32 flex flex-col ${isCounselorView ? '' : 'cursor-pointer'} ${cellClass}`} onClick={isCounselorView && !isPast ? () => handleEditDay(day) : undefined}>
                <p className="font-bold">{day}</p>
                {isPast ? <div className="flex-grow flex items-center justify-center text-xs">Past</div> : (
                    <div className="text-xs overflow-y-auto space-y-1 mt-1">
                        {slots.map(time => {
                             const bookedInfo = bookedSlotsMap.get(`${dateKey}_${time}`);
                             const isBooked = !!bookedInfo;
                             
                             let style = 'bg-green-200 text-green-900 hover:bg-green-300'; // Student available
                             if(isCounselorView) {
                                style = isBooked ? 'bg-orange-200 text-orange-900 cursor-pointer hover:bg-orange-300' : 'bg-green-100 text-green-800';
                             } else if (isBooked) {
                                style = 'bg-slate-200 text-slate-500 cursor-not-allowed';
                             }

                             return (
                                <button key={time}
                                    disabled={!isCounselorView && isBooked}
                                    onClick={() => {
                                        if (isCounselorView && isBooked) {
                                            navigate('/dashboard/history', { state: { highlight: bookedInfo.id } });
                                        } else if (!isCounselorView && !isBooked && onSelectSlot) {
                                            onSelectSlot(date, time);
                                        }
                                    }}
                                    className={`w-full text-center p-1 rounded ${style}`}
                                >
                                    {time}
                                </button>
                             );
                        })}
                    </div>
                )}
            </div>
        )
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft/></button>
                <h3 className="text-lg font-bold">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {weekDays.map(day => <div key={day} className="font-bold text-slate-600">{day}</div>)}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysInMonth.map(day => <div key={day}>{renderDayCell(day)}</div>)}
            </div>
        </div>
    );
};


// --- LAYOUT COMPONENTS ---
const Sidebar: React.FC<{ isOpen: boolean; userRole: UserRole, onLinkClick: () => void }> = ({ isOpen, userRole, onLinkClick }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const baseLinkClass = "flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-primary-100 hover:text-primary-600 transition-colors";
    const activeLinkClass = "bg-primary-500 text-white font-semibold shadow-md";

    const studentLinks = [
        { to: '/dashboard/home', icon: Home, label: 'Beranda' },
        { to: '/dashboard/schedule', icon: Calendar, label: 'Jadwal Konseling' },
        { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat Konselor' },
        { to: '/dashboard/history', icon: History, label: 'Riwayat Sesi' },
        { to: '/dashboard/notes', icon: Book, label: 'Catatan Pribadi' },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profil Saya' },
    ];

    const counselorLinks = [
        { to: '/dashboard/home', icon: Home, label: 'Beranda' },
        { to: '/dashboard/schedule', icon: Calendar, label: 'Kelola Jadwal' },
        { to: '/dashboard/requests', icon: Bell, label: 'Permintaan Sesi' },
        { to: '/dashboard/chat', icon: MessageSquare, label: 'Live Chat' },
        { to: '/dashboard/history', icon: Users, label: 'Riwayat Sesi' },
        { to: '/dashboard/notes', icon: Book, label: 'Catatan Pribadi' },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profil Saya' },
    ];

    const adminLinks = [
        { to: '/dashboard/home', icon: Home, label: 'Beranda' },
        { to: '/dashboard/users', icon: Users, label: 'Manajemen Pengguna' },
        { to: '/dashboard/schedules', icon: Calendar, label: 'Manajemen Jadwal' },
        { to: '/dashboard/profile', icon: UserIcon, label: 'Profil Saya' },
    ];

    const navLinks = 
        userRole === UserRole.STUDENT ? studentLinks :
        userRole === UserRole.COUNSELOR ? counselorLinks :
        adminLinks;

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    return (
        <aside className={`bg-white shadow-lg lg:shadow-none fixed lg:relative z-30 inset-y-0 left-0 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
            <div className="p-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-primary-600">Sahabat<span className="text-secondary-600">BK</span></h1>
                <button onClick={onLinkClick} className="lg:hidden text-slate-500 hover:text-slate-800">
                    <X className="w-6 h-6"/>
                </button>
            </div>
            <nav className="p-4 flex flex-col h-[calc(100%-80px)]">
                <div className="flex-grow space-y-2">
                    {navLinks.map(link => (
                        <NavLink key={link.to} to={link.to} onClick={onLinkClick} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}>
                            <link.icon className="w-6 h-6" />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>
                <div className="p-4">
                     <button onClick={handleLogout} className={`${baseLinkClass} w-full`}>
                        <LogOut className="w-6 h-6" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

const DashboardHeader: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user, token } = useAuth();
    const { notifications, unreadCount, refetch } = useDashboard();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) {
            setIsPopoverOpen(false);
            return;
        }
        try {
            await authenticatedFetch('/api/notifications/mark-all-read', token, { method: 'POST' });
            refetch();
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
        setIsPopoverOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popoverRef]);
    
    const pictureSrc = user?.profilePicture?.startsWith('https://') ? user.profilePicture : `${API_URL}/img/${user?.profilePicture}`;
    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-20 shadow-sm p-4 lg:py-6 lg:px-8">
            <div className="flex justify-between items-center">
                <button onClick={onMenuClick} className="lg:hidden text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="hidden lg:block">
                     {/* Can be a breadcrumb in the future */}
                </div>
                <div className="flex items-center space-x-4">
                     {user?.role !== UserRole.ADMIN && (
                        <div className="relative" ref={popoverRef}>
                            <button onClick={() => setIsPopoverOpen(!isPopoverOpen)} className="relative text-slate-500 hover:text-slate-800">
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white ring-2 ring-white">{unreadCount}</span>
                                )}
                            </button>
                            {isPopoverOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border">
                                    <div className="p-3 flex justify-between items-center border-b">
                                        <h4 className="font-bold text-slate-800">Notifikasi</h4>
                                        <button onClick={handleMarkAllRead} className="text-sm text-primary-600 hover:underline disabled:text-slate-400" disabled={unreadCount === 0}>
                                            Tandai semua dibaca
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? notifications.map((n: Notification) => (
                                            <Link to={n.link} key={n.id} onClick={() => setIsPopoverOpen(false)} className="block p-3 hover:bg-slate-50 border-b last:border-b-0">
                                                <p className={`text-sm ${!n.is_read ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_at, { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                                            </Link>
                                        )) : <p className="p-4 text-center text-sm text-slate-500">Tidak ada notifikasi.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                     )}
                    <div className="flex items-center space-x-2">
                        <img src={pictureSrc} alt={user?.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                        <div className="hidden md:block">
                            <p className="font-semibold text-sm text-slate-800">{user?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    React.useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar isOpen={sidebarOpen} userRole={user.role} onLinkClick={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD PAGE ---
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const renderRoutes = () => {
    if (user?.role === UserRole.STUDENT) {
      return (
        <Routes>
          <Route path="home" element={<StudentHomeView />} />
          <Route path="schedule" element={<StudentScheduleView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="history" element={<StudentHistoryView />} />
          <Route path="notes" element={<StudentNotesView />} />
          <Route path="profile" element={<ProfileView />} />
          <Route path="/" element={<Navigate to="home" replace />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
      );
    }

    if (user?.role === UserRole.COUNSELOR) {
      return (
        <Routes>
          <Route path="home" element={<CounselorHomeView />} />
          <Route path="schedule" element={<CounselorScheduleView />} />
          <Route path="requests" element={<CounselorRequestsView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="history" element={<StudentHistoryView />} />
          <Route path="notes" element={<CounselorNotesView />} />
          <Route path="profile" element={<ProfileView />} />
          <Route path="/" element={<Navigate to="home" replace />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
      );
    }
    
    if (user?.role === UserRole.ADMIN) {
        return (
            <Routes>
                <Route path="home" element={<AdminHomeView />} />
                <Route path="users" element={<AdminUserManagementView />} />
                <Route path="schedules" element={<AdminScheduleManagementView />} />
                <Route path="profile" element={<ProfileView />} />
                <Route path="/" element={<Navigate to="home" replace />} />
                <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
        );
    }

    return null;
  };

  return (
    <DashboardProvider>
        <DashboardLayout>
            {renderRoutes()}
        </DashboardLayout>
    </DashboardProvider>
  );
};

export default DashboardPage;