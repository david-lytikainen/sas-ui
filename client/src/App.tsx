import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/fonts.css'; // Import the fonts
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import DateSchedule from './components/dates/DateSchedule';
import Matches from './components/matches/Matches';
import EventList from './components/events/EventList';
import EventForm from './components/events/EventForm';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import Navigation from './components/Navigation';
import { ColorModeContext } from './context/ColorModeContext';
import EventManagement from './components/events/EventManagement';
import DateNotes from './components/notes/DateNotes';
import CheckInPage from './components/check-in/CheckInPage';
import EventCheckInStatus from './components/check-in/EventCheckInStatus';

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

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: [
            'SF Pro Text',
            'SF Pro Display',
            '-apple-system',
            'BlinkMacSystemFont',
            'system-ui',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'sans-serif',
          ].join(','),
          h1: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
          },
          h2: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
          },
          h3: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 600,
            letterSpacing: '-0.025em',
          },
          h4: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 600,
            letterSpacing: '-0.015em',
          },
          h5: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 600,
            letterSpacing: '-0.015em',
          },
          h6: {
            fontFamily: 'SF Pro Display, -apple-system, system-ui',
            fontWeight: 600,
            letterSpacing: '-0.015em',
          },
          subtitle1: {
            fontFamily: 'SF Pro Text, -apple-system, system-ui',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          },
          subtitle2: {
            fontFamily: 'SF Pro Text, -apple-system, system-ui',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          },
          body1: {
            fontFamily: 'SF Pro Text, -apple-system, system-ui',
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1.5,
          },
          body2: {
            fontFamily: 'SF Pro Text, -apple-system, system-ui',
            fontWeight: 400,
            letterSpacing: 0,
          },
          button: {
            fontFamily: 'SF Pro Text, -apple-system, system-ui',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
        },
        palette: {
          mode,
          primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
          },
          secondary: {
            main: '#424242',
            light: '#616161',
            dark: '#212121',
          },
          background: {
            default: mode === 'dark' ? '#141414' : '#ffffff',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#ffffff' : '#1d1d1f',
            secondary: mode === 'dark' ? '#a1a1a6' : '#6e6e73',
          },
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
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
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
                  backgroundColor: '#1e1e1e',
                }),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'dark' 
                    ? '0 6px 20px rgba(0, 0, 0, 0.4)' 
                    : '0 6px 20px rgba(0, 0, 0, 0.08)',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 600,
                backgroundColor: mode === 'dark' ? '#1e1e1e' : '#f5f5f7',
                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              },
              root: {
                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.05) translateY(-1px)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'dark' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
                    : '0 8px 24px rgba(0, 0, 0, 0.1)',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <AuthProvider>
        <EventProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Navigation />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/events" element={
                    <PrivateRoute>
                      <EventList />
                    </PrivateRoute>
                  } />
                  <Route path="/events/new" element={
                    <PrivateRoute>
                      <EventForm />
                    </PrivateRoute>
                  } />
                  <Route path="/events/edit/:id" element={
                    <PrivateRoute>
                      <EventForm />
                    </PrivateRoute>
                  } />
                  <Route path="/events/manage/:id" element={
                    <PrivateRoute>
                      <EventManagement />
                    </PrivateRoute>
                  } />
                  <Route path="/schedule" element={
                    <PrivateRoute>
                      <DateSchedule />
                    </PrivateRoute>
                  } />
                  <Route path="/notes" element={
                    <PrivateRoute>
                      <DateNotes />
                    </PrivateRoute>
                  } />
                  <Route path="/matches" element={
                    <PrivateRoute>
                      <Matches />
                    </PrivateRoute>
                  } />
                  <Route path="/check-in" element={<CheckInPage />} />
                  <Route path="/check-in/:id" element={<EventCheckInStatus />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </ThemeProvider>
          </LocalizationProvider>
        </EventProvider>
      </AuthProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
