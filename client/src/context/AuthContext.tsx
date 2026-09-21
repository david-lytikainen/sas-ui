import React, { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../services/api';
import { AuthResponse, TokenValidationResponse, User } from '../types/user';
import { useSplash } from './SplashContext';

const ROLES = {
  ADMIN: { id: 3, name: 'admin' },
  ORGANIZER: { id: 2, name: 'organizer' },
  ATTENDEE: { id: 1, name: 'attendee' },
} as const;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    birthday: string;
    gender: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isOrganizer: () => boolean;
  hasRole: (roleId: number) => boolean;
  persistLogin: boolean;
  togglePersistLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistLogin, setPersistLogin] = useState<boolean>(() => {
    return localStorage.getItem('persistLogin') !== 'false';
  });
  const { setShowLogoutSplash } = useSplash();

  const isAdmin = () => user?.role_id === ROLES.ADMIN.id;
  const isOrganizer = () => user?.role_id === ROLES.ORGANIZER.id;
  const hasRole = (roleId: number) => user?.role_id === roleId;
  const clearSession = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const saveAuth = ({ user, token }: AuthResponse) => {
    if (user) setUser(user);
    localStorage.setItem('token', token);
  };

  const togglePersistLogin = () => {
    const newValue = !persistLogin;
    setPersistLogin(newValue);
    localStorage.setItem('persistLogin', newValue.toString());
    
    if (!newValue) {
      clearSession();
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!persistLogin) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }
  
      const token = localStorage.getItem('token');
      if (!token || token.split('.').length !== 3) {
        clearSession();
        setLoading(false);
        return;
      }
  
      try {
        const response: TokenValidationResponse | null = await authApi.validateToken(token);
  
        if (response && response.user) {
          setUser(response.user);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
  
    checkAuth();
  }, [persistLogin]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      saveAuth(await authApi.login(email, password));
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    birthday: string;
    gender: string;
  }) => {
    setError(null);
    try {
      saveAuth(await authApi.register(userData));
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await authApi.validateToken(token);
    if (response?.user) {
      setUser(response.user);
    }
  };

  const logout = async () => {
    setShowLogoutSplash(true);
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        refreshUser,
        logout,
        isAdmin,
        isOrganizer,
        hasRole,
        persistLogin,
        togglePersistLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
