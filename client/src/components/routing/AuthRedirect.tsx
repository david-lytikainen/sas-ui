import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthRedirectProps {
  children: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div data-testid="auth-loading" className="d-flex justify-content-center align-items-center min-vh-100">
        <div role="status" className="spinner-border spinner-border-sm">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};

export default AuthRedirect;
