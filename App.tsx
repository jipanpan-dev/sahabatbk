
import React, { useState, createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from './types';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { API_URL } from './config';

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (authToken: string) => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          return userData;
        } else {
          // Token is invalid or expired
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to validate token", error);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
      return null;
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        await fetchUser(token);
      }
      setIsLoading(false);
    };
    validateToken();
  }, [token, fetchUser]);
  
  const refreshUser = async () => {
      if (token) {
          await fetchUser(token);
      }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('authToken', result.token);
        setToken(result.token);
        setUser(result.user);
        return true;
      } else {
        console.error('Login failed', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const value = useMemo(() => ({ user, token, login, logout, isLoading, refreshUser }), [user, token, isLoading]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-xl font-semibold">Loading...</div>
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- PROTECTED ROUTE ---
const ProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl font-semibold">Loading...</div></div>;
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

// --- APP COMPONENT ---
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/*" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
