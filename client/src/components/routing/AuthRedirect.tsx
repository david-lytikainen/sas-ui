import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * AuthRedirect component handles automatic redirection based on authentication status:
 * - If user is authenticated: redirect to /events
 * - If user is not authenticated: show the wrapped component (typically LandingPage)
 * - If authentication is loading: show loading spinner
 */
const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        data-testid="auth-loading"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If user is authenticated, redirect to events page
  if (user) {
    return <Navigate to="/events" replace />;
  }

  // If user is not authenticated, show the wrapped component (LandingPage)
  return <>{children}</>;
};

export default AuthRedirect; 