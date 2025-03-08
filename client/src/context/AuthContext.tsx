import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  phone: string | null;
  age: number;
  church: string;
  denomination: string | null;
}

// Role constants to match the mockApi
const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    age: number;
    church: string;
    denomination?: string;
    role: 'attendee' | 'organizer' | 'admin';
  }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isOrganizer: () => boolean;
  hasRole: (roleId: number) => boolean;
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

  const isAdmin = () => user?.role_id === ROLES.ADMIN.id;
  const isOrganizer = () => user?.role_id === ROLES.ORGANIZER.id;
  const hasRole = (roleId: number) => user?.role_id === roleId;

  // Check for existing session using token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { user } = await authApi.validateToken(token);
          setUser(user);
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await authApi.login(email, password);
      setUser(user);
      localStorage.setItem('token', token);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    age: number;
    church: string;
    denomination?: string;
    role: 'attendee' | 'organizer' | 'admin';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await authApi.register(userData);
      setUser(user);
      localStorage.setItem('token', token);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin,
        isOrganizer,
        hasRole,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}; 