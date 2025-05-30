import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';
import { User, TokenValidationResponse } from '../types/user';

// Role constants to match the mockApi
export const ROLES = {
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
    current_church?: string;
  }) => Promise<void>;
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
    // Default to true unless explicitly set to false
    return localStorage.getItem('persistLogin') !== 'false';
  });

  const isAdmin = () => user?.role_id === ROLES.ADMIN.id;
  const isOrganizer = () => user?.role_id === ROLES.ORGANIZER.id;
  const hasRole = (roleId: number) => user?.role_id === roleId;

  const togglePersistLogin = () => {
    const newValue = !persistLogin;
    setPersistLogin(newValue);
    localStorage.setItem('persistLogin', newValue.toString());
    
    // If turning off persistence, clear token immediately
    if (!newValue) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Check for existing session using token
  useEffect(() => {
    const checkAuth = async () => {
      if (!persistLogin) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }
  
      const token = localStorage.getItem('token');
      if (!token || token.split('.').length !== 3) {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
  
      try {
        const response: TokenValidationResponse | null = await authApi.validateToken(token);
  
        if (response && response.user) {
          setUser(response.user);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
  
    checkAuth();
  }, [persistLogin]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      
      if (response.user) {
        setUser(response.user);
      }
      
      localStorage.setItem('token', response.token);
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
    birthday: string;
    gender: string;
    current_church?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      
      if (response.user) {
        setUser(response.user);
      }
      
      localStorage.setItem('token', response.token);
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
        setError,
        login,
        register,
        logout,
        isAdmin,
        isOrganizer,
        hasRole,
        persistLogin,
        togglePersistLogin,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
