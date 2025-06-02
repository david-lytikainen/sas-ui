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
import PrivateRoute from './components/routing/PrivateRoute';
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

// ADDED getDesignTokens function
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#D98B9C',
          },
          secondary: {
            main: '#B0A1C4',
          },
          background: {
            default: '#FFF9F5',
            paper: '#FFFFFF',   
          },
          text: {
            primary: '#4A4A4A', 
            secondary: '#6E6E6E', 
          },
        }
      : {
          secondary: {
            main: '#707070', // Darker gray secondary color
          },
          background: {
            default: '#222222', // Dark gray background
            paper: '#333333',   // Slightly lighter gray for paper elements
          },
          text: {
            primary: '#E0E0E0', // Light gray text for good contrast
            secondary: '#B0B0B0', // Slightly darker gray for secondary text
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
          textTransform: 'none',
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
          variants: [],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(mode === 'dark' && {
            backgroundColor: '#333333',
          }),
           // Light mode paper background will be taken from palette.background.paper
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' 
              ? '0 6px 20px rgba(0, 0, 0, 0.4)' 
              // Softer shadow for feminine light mode
              : '0 6px 15px rgba(217, 139, 156, 0.2)', 
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' 
            ? 'rgba(19, 19, 19, 0.85)' 
            // Light mode AppBar - using warm off-white with blur
            : 'rgba(255, 249, 245, 0.85)', 
          backdropFilter: 'blur(20px)',
          borderBottom: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            // Softer, themed border for light mode
            : '1px solid rgba(217, 139, 156, 0.25)', 
        },
      },
    },
  },
});

// Global style definitions (remains an object)
const globalStyleObject = {
  '*': {
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    '@media (min-width: 600px)': {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  body: {
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
};

const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/" element={<LandingPage />} />
      
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
          paddingTop: '64px', 
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
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <SplashProvider>
      <AuthProvider>
        <EventProvider>
          <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <GlobalStyles styles={globalStyleObject} />
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
