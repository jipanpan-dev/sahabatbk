import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { GraduationCap, UserIcon } from '../components/Icons';
import { API_URL } from '../config';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard/home';
  const defaultRole = location.state?.defaultRole;

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);
  
  useEffect(() => {
    if(defaultRole) {
        setIsLoginView(defaultRole === 'counselor');
        if(defaultRole === 'student') setSelectedRole(UserRole.STUDENT);
        if(defaultRole === 'counselor') setSelectedRole(UserRole.COUNSELOR);
    }
  }, [defaultRole]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    const success = await login(email, password);
    
    setIsLoading(false);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Email atau password salah. Silakan coba lagi.');
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const passwordInput = form.elements.namedItem('signup-password') as HTMLInputElement;
    const confirmPasswordInput = form.elements.namedItem('confirm-password') as HTMLInputElement;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      setIsLoading(false);
      return;
    }

    const fullNameInput = form.elements.namedItem('fullName') as HTMLInputElement;
    const emailInput = form.elements.namedItem('signup-email') as HTMLInputElement;

    const baseData = {
      name: fullNameInput.value,
      email: emailInput.value,
      password,
      role: selectedRole,
    };
    
    let roleSpecificData = {};
    if (selectedRole === UserRole.STUDENT) {
        const classInput = form.elements.namedItem('class') as HTMLInputElement;
        const schoolInput = form.elements.namedItem('school') as HTMLInputElement;
        roleSpecificData = {
            class: classInput.value,
            school: schoolInput.value,
        };
    } else { // Counselor
        const counselorIdInput = form.elements.namedItem('counselorId') as HTMLInputElement;
        const specializationInput = form.elements.namedItem('specialization') as HTMLInputElement;
        roleSpecificData = {
            counselorId: counselorIdInput.value,
            specialization: specializationInput.value,
        }
    }
    
    const payload = { ...baseData, ...roleSpecificData };

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            setIsLoginView(true); // Switch to login view on success
        } else {
            setError(result.message || "Pendaftaran gagal. Silakan coba lagi.");
        }

    } catch (err) {
        console.error("Signup error:", err);
        setError("Terjadi kesalahan jaringan. Periksa koneksi Anda.");
    } finally {
        setIsLoading(false);
    }
  }

  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setError(null);
  };

  const renderStudentForm = () => (
    <>
      <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="fullName">Nama Lengkap</label>
        <input name="fullName" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="fullName" type="text" placeholder="Nama Lengkap" required />
      </div>
       <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="class">Kelas</label>
        <input name="class" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="class" type="text" placeholder="Contoh: IX A" required />
      </div>
       <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="school">Nama Sekolah</label>
        <input name="school" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="school" type="text" placeholder="Contoh: SMP Harapan Bangsa" required />
      </div>
    </>
  );

  const renderCounselorForm = () => (
     <>
      <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="fullName">Nama Lengkap & Gelar</label>
        <input name="fullName" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="fullName" type="text" placeholder="Nama Lengkap & Gelar" required />
      </div>
       <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="counselorId">ID/NIP Konselor</label>
        <input name="counselorId" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="counselorId" type="text" placeholder="Nomor Induk Pegawai" required />
      </div>
      <div className="mb-4">
        <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="specialization">Bidang Spesialisasi</label>
        <input name="specialization" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="specialization" type="text" placeholder="Contoh: Karir, Kecemasan" required />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <Link to="/" className="text-3xl font-bold text-primary-600 mb-6">
            Sahabat<span className="text-secondary-600">BK</span>
        </Link>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transition-all">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">{isLoginView ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h2>
        <p className="text-center text-slate-500 mb-8">{isLoginView ? 'Masuk untuk melanjutkan sesi konselingmu.' : 'Pilih peranmu untuk memulai.'}</p>
        
        {isLoginView ? (
            <form onSubmit={handleLogin}>
                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                    <input name="email" className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="email" type="email" placeholder="contoh@email.com" required />
                </div>
                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                    <input name="password" className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="password" type="password" placeholder="******************" required />
                     <a className="inline-block align-baseline font-bold text-sm text-primary-500 hover:text-primary-800" href="#">Lupa Password?</a>
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <div className="flex items-center justify-between">
                    <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:bg-primary-300" type="submit" disabled={isLoading}>
                        {isLoading ? 'Memproses...' : 'Masuk'}
                    </button>
                </div>
            </form>
        ) : (
            <form onSubmit={handleSignUp}>
                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Saya adalah seorang...</label>
                    <div className="grid grid-cols-2 gap-4">
                         <button type="button" onClick={() => setSelectedRole(UserRole.STUDENT)} className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${selectedRole === UserRole.STUDENT ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'}`}>
                            <GraduationCap className={`w-8 h-8 mb-2 ${selectedRole === UserRole.STUDENT ? 'text-primary-500' : 'text-slate-500'}`} />
                            <span className={`font-semibold ${selectedRole === UserRole.STUDENT ? 'text-primary-600' : 'text-slate-700'}`}>Siswa</span>
                        </button>
                         <button type="button" onClick={() => setSelectedRole(UserRole.COUNSELOR)} className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-colors ${selectedRole === UserRole.COUNSELOR ? 'border-secondary-500 bg-secondary-50' : 'border-slate-300 bg-white'}`}>
                            <UserIcon className={`w-8 h-8 mb-2 ${selectedRole === UserRole.COUNSELOR ? 'text-secondary-500' : 'text-slate-500'}`} />
                            <span className={`font-semibold ${selectedRole === UserRole.COUNSELOR ? 'text-secondary-600' : 'text-slate-700'}`}>Konselor</span>
                        </button>
                    </div>
                </div>

                {selectedRole === UserRole.STUDENT ? renderStudentForm() : renderCounselorForm()}

                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="signup-email">Email</label>
                    <input name="signup-email" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="signup-email" type="email" placeholder="Email" required />
                </div>
                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="signup-password">Password</label>
                    <input name="signup-password" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="signup-password" type="password" placeholder="******************" required />
                </div>
                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="confirm-password">Konfirmasi Password</label>
                    <input name="confirm-password" className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-primary-400" id="confirm-password" type="password" placeholder="******************" required />
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <div className="flex items-center justify-between">
                     <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:bg-primary-300" type="submit" disabled={isLoading}>
                        {isLoading ? 'Memproses...' : 'Daftar'}
                    </button>
                </div>
            </form>
        )}
        
        <p className="text-center text-slate-500 text-sm mt-8">
            {isLoginView ? "Belum punya akun? " : "Sudah punya akun? "}
            <button onClick={toggleView} className="font-bold text-primary-500 hover:text-primary-800">
                {isLoginView ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;