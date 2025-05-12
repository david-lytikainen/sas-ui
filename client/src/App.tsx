import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
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


// Add global styles for animations
const GlobalStyles = {
  '@global': {
    '*': {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    // Add new animation classes
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
  },
};

// Create a separate component for the protected routes
const ProtectedRoutes = () => {
  const { isAdmin, isOrganizer } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        path="/"
        element={
          <PrivateRoute>
            <AnimatedWrapper>
              <EventList />
            </AnimatedWrapper>
          </PrivateRoute>
        }
      />
      
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

function App() {
  // Initialize state by reading from localStorage, default to 'light'
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'light' || savedMode === 'dark') ? savedMode : 'light';
  });

  // Effect to save mode to localStorage whenever it changes
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

  const theme = useMemo(
    () =>
      createTheme({
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
        },
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
        components: {
          MuiCssBaseline: {
            styleOverrides: GlobalStyles,
          },
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
                    // Softer shadow for feminine light mode
                    : '0 4px 10px rgba(217, 139, 156, 0.25)', 
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
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
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <EventProvider>
              <Router>
                <AnimatedWrapper>
                  <Navigation />
                  <Box sx={{ pt: { xs: 2, sm: 4, md: 8 } }}>
                    <ProtectedRoutes />
                  </Box>
                </AnimatedWrapper>
              </Router>
            </EventProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
