import { useMemo, useEffect } from 'react';
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
import PrivateRoute from './components/routing/PrivateRoute';
import AuthRedirect from './components/routing/AuthRedirect';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import Navigation from './components/Navigation';
import { ColorModeContext } from './context/ColorModeContext';
import AnimatedWrapper from './components/common/AnimatedWrapper';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import LandingPage from './components/landing/LandingPage';
import Footer from './components/common/Footer'; // Assuming you have/want a global footer
import SplashScreen from './components/common/SplashScreen';
import { SplashProvider, useSplash } from './context/SplashContext';
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

const ACTUAL_DARK_MODE_PAGE_BACKGROUND = '#222222';

const getDesignTokens = () => ({
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#A6C0FE',
    },
    secondary: {
      main: '#707070',
    },
    background: {
      default: ACTUAL_DARK_MODE_PAGE_BACKGROUND,
      paper: '#333333',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#B0B0B0',
    },
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
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.02) translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            },
          '&:active': {
            transform: 'scale(0.98)',
          },
          variants: [],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: '#333333',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(19, 19, 19, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

// Global style definitions (remains an object)
const globalStyleObject = (theme: any) => ({
  '*': {
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    '@media (min-width: 600px)': {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  html: {
    backgroundColor: theme.palette.background.default,
    height: '100%',
  },
  body: {
    backgroundColor: theme.palette.background.default,
    height: '100%',
    transition: 'background-color 0.15s ease-in-out, color 0.15s ease-in-out',
    '@media (min-width: 600px)': {
      transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
    },
  },
  '.fade-enter': {
    opacity: 0,
    transform: 'translateY(10px)',
  },
  '.fade-enter-active': {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'opacity 300ms, transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    '@media (min-width: 600px)': {
      transition: 'opacity 400ms, transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  '.hover-scale': {
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    '@media (min-width: 600px)': {
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
  '.slide-in': {
    animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    '@media (min-width: 600px)': {
      animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
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
    animation: 'fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    '@media (min-width: 600px)': {
      animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
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
    animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    '@media (min-width: 600px)': {
      animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
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
    animation: 'staggerFade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    '@media (min-width: 600px)': {
      animation: 'staggerFade 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    },
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
});

const ProtectedRoutes = () => {
  return (
    <Routes>
      {/* Auth pages - redirect authenticated users to /events */}
      <Route 
        path="/login" 
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AuthRedirect>
            <Register />
          </AuthRedirect>
        } 
      />
      
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Home route is now accessible to everyone */}
      <Route 
        path="/" 
        element={<LandingPage />}
      />
      
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppNavigation = () => {
  return <Navigation />;
};

const AppLayout = () => {
  const theme = useTheme();
  const { 
    showLoginSplash, 
    setShowLoginSplash,
    showLogoutSplash,
    setShowLogoutSplash 
  } = useSplash();

  useEffect(() => {
    if (showLoginSplash) {
      const timer = setTimeout(() => {
        setShowLoginSplash(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [showLoginSplash, setShowLoginSplash]);

  useEffect(() => {
    if (showLogoutSplash) {
      const timer = setTimeout(() => {
        setShowLogoutSplash(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [showLogoutSplash, setShowLogoutSplash]);

  if (showLoginSplash || showLogoutSplash) {
    return <SplashScreen type={showLoginSplash ? 'login' : 'logout'} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavigation />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1, 
          py: theme.spacing(3),
          px: theme.spacing(2),
          backgroundColor: theme.palette.background.default,
          [theme.breakpoints.up('sm')]: {
            px: theme.spacing(3),
          },
        }}
      >
        <ProtectedRoutes /> 
      </Box>
      <Footer />
    </Box>
  );
};

function App() {
  useEffect(() => {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', ACTUAL_DARK_MODE_PAGE_BACKGROUND);
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {},
      mode: 'dark' as const,
    }),
    []
  );

  const theme = useMemo(() => createTheme(getDesignTokens()), []);

  return (
    <SplashProvider>
      <AuthProvider>
        <EventProvider>
          <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <GlobalStyles styles={globalStyleObject(theme)} />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Router>
                  <AppLayout />
                </Router>
              </LocalizationProvider>
            </ThemeProvider>
          </ColorModeContext.Provider>
        </EventProvider>
      </AuthProvider>
    </SplashProvider>
  );
}

export default App;
