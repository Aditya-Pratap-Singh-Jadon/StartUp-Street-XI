import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperadmin: false,
  login: async () => {},
  register: async () => {},
  verifyOtp: async () => {},
  googleLogin: async () => {},
  refreshProfile: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (uid) => {
    try {
      const res = await fetch(`/api/auth?user_id=${uid}`);
      if (res.ok) {
        const p = await res.json();
        setProfile(p);
      } else {
        setProfile(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
          } else {
            setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
            await refreshProfile(decoded.id);
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    init();
  }, [refreshProfile]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('token', data.token);
    setUser({ id: data.user.id || data.user._id, email: data.user.email, role: data.user.role });
    setProfile(data.user);
  };

  const register = async (userData) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...userData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // OTP sent successfully, no login yet
  };

  const verifyOtp = async (userData) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-otp', ...userData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    localStorage.setItem('token', data.token);
    setUser({ id: data.user.id || data.user._id, email: data.user.email, role: data.user.role });
    setProfile(data.user);
  };

  const googleLogin = async (credential, participant_type) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google', credential, participant_type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    localStorage.setItem('token', data.token);
    setUser({ id: data.user.id || data.user._id, email: data.user.email, role: data.user.role });
    setProfile(data.user);
  };

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        profile, 
        loading, 
        isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
        isSuperadmin: profile?.role === 'superadmin', 
        login, register, verifyOtp, googleLogin, refreshProfile, signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
