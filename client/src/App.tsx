import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles'; // MUI GlobalStyles component
import './styles/fonts.css'; // Import the fonts
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EventList from './components/events/EventList';
import EventDetail from './components/events/EventDetail';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import Navigation from './components/Navigation';
import { ColorModeContext } from './context/ColorModeContext';
import SystemSettings from './components/profile/SystemSettings';
import AnimatedWrapper from './components/common/AnimatedWrapper';
import EventAttendees from './components/admin/EventAttendees';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import LandingPage from './components/landing/LandingPage';
import Footer from './components/common/Footer'; // Assuming you have/want a global footer

// ADDED getDesignTokens function
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#D98B9C', // Soft Pink
          },
          secondary: {
            main: '#B0A1C4', // Lavender
          },
          background: {
            default: '#FFF9F5', // Warm Off-White
            paper: '#FFFFFF',   
          },
          text: {
            primary: '#4A4A4A', 
            secondary: '#6E6E6E', 
          },
        }
      : {
          primary: {
            main: '#D98B9C', // Keep pink for dark mode too, or adjust
          },
          secondary: {
            main: '#B0A1C4', // Keep lavender for dark mode, or adjust
          },
          background: {
            default: '#222222', 
            paper: '#333333',   
          },
          text: {
            primary: '#E0E0E0',
            secondary: '#B0B0B0',
          },
        }),
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none' as const,
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02) translateY(-1px)',
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
              : '0 4px 10px rgba(217, 139, 156, 0.25)', 
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
      },
      variants: [],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none' as const,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(mode === 'dark' && {
            backgroundColor: '#333333',
          }),
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' 
              ? '0 6px 20px rgba(0, 0, 0, 0.4)' 
              : '0 6px 15px rgba(217, 139, 156, 0.2)', 
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' 
            ? 'rgba(34, 34, 34, 0.85)'  // Darker, less transparent for dark appBar
            : 'rgba(255, 249, 245, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.12)' 
            : '1px solid rgba(217, 139, 156, 0.25)', 
        },
      },
    },
    MuiCssBaseline: {
        styleOverrides: `
        body {
            transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
        }
        `
    }
  },
});

// Global style definitions (remains an object)
const globalStyleObject = {
  '*': {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  body: {
    transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
  },
  '.fade-enter': {
    opacity: 0,
    transform: 'translateY(10px)',
  },
  '.fade-enter-active': {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'opacity 500ms, transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '.hover-scale': {
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
  '.slide-in': {
    animation: 'slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  '@keyframes slideIn': {
    from: {
      opacity: 0,
      transform: 'translateX(-20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  '.fade-up': {
    animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  '@keyframes fadeUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  '.scale-in': {
    animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  '@keyframes scaleIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
  '.stagger-in > *': {
    opacity: 0,
    animation: 'staggerFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  '@keyframes staggerFade': {
    from: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
};

// Create a separate component for the protected routes
const ProtectedRoutes = () => {
  const { isAdmin, isOrganizer } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/" element={<LandingPage />} />

      {/* Settings Route */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <AnimatedWrapper>
              <SystemSettings />
            </AnimatedWrapper>
          </PrivateRoute>
        }
      />
      
      {/* Admin/Organizer routes - use isAdmin() or isOrganizer() from context */}
      {(isAdmin() || isOrganizer()) && (
        <>
          <Route
            path="/admin/events/:eventId/attendees"
            element={
              <PrivateRoute>
                <AnimatedWrapper>
                  <EventAttendees />
                </AnimatedWrapper>
              </PrivateRoute>
            }
          />
        </>
      )}
      
      {/* Routes available to all user roles */}
      <Route
        path="/events"
        element={
          <PrivateRoute>
            <AnimatedWrapper>
              <EventList />
            </AnimatedWrapper>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/events/:id"
        element={
          <PrivateRoute>
            <AnimatedWrapper>
              <EventDetail />
            </AnimatedWrapper>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Component to conditionally render Navigation - now always renders
const AppNavigation = () => {
  // const location = useLocation(); // No longer needed
  // const noNavRoutes = ['/', '/login', '/register', '/privacy-policy']; // No longer needed
  // if (noNavRoutes.includes(location.pathname)) { // No longer needed
  //   return null; // No longer needed
  // }
  return <Navigation />;
};

// Helper to determine if main navigation is visible (REMOVED)
// const useIsNavVisible = () => { ... };

// Main layout component
const AppLayout = () => {
  // const isNavVisible = useIsNavVisible(); // No longer needed
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavigation />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1, 
          py: theme.spacing(3),
          px: theme.spacing(2),
          paddingTop: '64px', // Always apply padding, adjust if nav height is different
          // paddingTop: isNavVisible ? '64px' : theme.spacing(3), // Old logic
          backgroundColor: theme.palette.background.default,
          [theme.breakpoints.up('sm')]: {
            px: theme.spacing(3),
          },
        }}
      >
        <ProtectedRoutes /> 
      </Box>
      <Footer /> {/* Added Footer here */}
    </Box>
  );
};

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'light' || savedMode === 'dark') ? savedMode : 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: 'light' | 'dark') => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          // No need to explicitly save here, the useEffect handles it
          return newMode;
        });
      },
      mode,
    }),
    [mode] // Keep mode as dependency
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <AuthProvider>
      <EventProvider> {/* Ensure EventProvider wraps ColorModeContext */}
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles styles={globalStyleObject} />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Router>
                <AppLayout /> {/* AppLayout now contains Navigation and ProtectedRoutes */}
              </Router>
            </LocalizationProvider>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
