import { useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ProfilePage from './components/profile/ProfilePage';
import Footer from './components/common/Footer'; // Assuming you have/want a global footer
import SplashScreen from './components/common/SplashScreen';
import { SplashProvider, useSplash } from './context/SplashContext';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

const DARK_PAGE_BACKGROUND = '#222222';

const ProtectedRoutes = () => {
  return (
    <Routes>
      {/* Auth pages - redirect authenticated users to /events */}
      <Route path="/login" element={ <AuthRedirect> <Login /> </AuthRedirect> } />
      <Route path="/register" element={ <AuthRedirect> <Register /> </AuthRedirect> } />

      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Home route is now accessible to everyone */}
      <Route path="/" element={<LandingPage />} />

      {/* Routes available to all user roles */}
      <Route path="/events" element={ <PrivateRoute> <AnimatedWrapper> <EventList /> </AnimatedWrapper> </PrivateRoute> } />
      <Route path="/profile" element={ <PrivateRoute> <AnimatedWrapper> <ProfilePage /> </AnimatedWrapper> </PrivateRoute> } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppLayout = () => {
  const { showLoginSplash, setShowLoginSplash, showLogoutSplash, setShowLogoutSplash } = useSplash();
  useEffect(() => {
    if (!showLoginSplash && !showLogoutSplash) return;
    const timer = window.setTimeout(() => {
      setShowLoginSplash(false);
      setShowLogoutSplash(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [showLoginSplash, showLogoutSplash, setShowLoginSplash, setShowLogoutSplash]);
  if (showLoginSplash || showLogoutSplash) return <SplashScreen type={showLoginSplash ? 'login' : 'logout'} />;
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <main className="flex-grow-1 px-2 px-sm-3 py-4">
        <ProtectedRoutes />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  const [mode, setMode] = useState<'dark' | 'light'>(() => {
    const savedMode = window.localStorage.getItem('color-mode');
    if (savedMode === 'dark' || savedMode === 'light') return savedMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.bsTheme = mode;
    window.localStorage.setItem('color-mode', mode);
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', mode === 'dark' ? DARK_PAGE_BACKGROUND : '#F7F7F8');
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => setMode((previousMode) => (previousMode === 'dark' ? 'light' : 'dark')),
      mode,
    }),
    [mode]
  );

  return (
    <SplashProvider>
      <AuthProvider>
        <EventProvider>
          <ColorModeContext.Provider value={colorMode}>
            <Router>
              <AppLayout />
            </Router>
          </ColorModeContext.Provider>
        </EventProvider>
      </AuthProvider>
    </SplashProvider>
  );
}

export default App;
