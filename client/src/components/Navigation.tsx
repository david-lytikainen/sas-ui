import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  useTheme,
  useMediaQuery,
  List,
  Chip,
} from '@mui/material';
import { animated, useSpring, useTrail, config } from '@react-spring/web';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../context/ColorModeContext';
import useHoverAnimation from '../hooks/useHoverAnimation';
import {
  Event as EventIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Favorite as FavoriteIcon,
  Notes as NotesIcon,
  HowToReg as CheckInIcon,
  CalendarToday as CalendarTodayIcon,
  HowToReg as HowToRegIcon,
  Person as PersonIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';

const AnimatedButton = animated(Button);
const AnimatedIconButton = animated(IconButton);
const AnimatedBox = animated(Box);
const AnimatedTypography = animated(Typography);

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

const Navigation = () => {
  const { user, logout, isAdmin, isOrganizer, mockAttendeeMode, disableMockAttendeeMode } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext);

  const buttonHover = useHoverAnimation({ 
    scale: 1.02,
    lift: 2,
    config: { 
      tension: 340,
      friction: 25,
      mass: 1
    }
  });
  
  const iconHover = useHoverAnimation({ 
    scale: 1.08,
    rotation: 180,
    config: { 
      tension: 320,
      friction: 20,
      mass: 0.8
    }
  });
  
  const logoSpring = useSpring({
    from: { scale: 1, rotate: 0 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.02, rotate: 2 });
        await next({ scale: 1, rotate: 0 });
      }
    },
    config: {
      tension: 300,
      friction: 10,
      mass: 1
    },
    pause: true,
  });

  const [logoHovered, setLogoHovered] = useState(false);

  const logoStyle = useSpring({
    scale: logoHovered ? 1.05 : 1,
    y: logoHovered ? -2 : 0,
    config: {
      tension: 300,
      friction: 15,
      mass: 1
    }
  });

  const [scrollAnim, setScrollAnim] = useSpring(() => ({
    y: 0,
    scale: 1,
    config: {
      ...config.gentle,
      tension: 200,
      friction: 25,
      mass: 1
    }
  }));

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId: number;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;

        setScrollAnim({
          y: scrollY > 0 ? -2 : 0,
          scale: scrollY > 0 ? 0.99 : 1,
          immediate: Math.abs(delta) > 50
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [setScrollAnim]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    if (!user) return [];

    const items = [
      {
        label: 'Dashboard',
        icon: <DashboardIcon />,
        to: '/',
        show: user.role_id !== ROLES.ATTENDEE.id,
      },
      {
        label: 'Events',
        icon: <EventIcon />,
        to: '/events',
        show: true,
      },
      {
        label: 'Schedule',
        icon: <CalendarTodayIcon />,
        to: '/schedule',
        show: user.role_id !== ROLES.ATTENDEE.id,
      },
      {
        label: 'Notes',
        icon: <NotesIcon />,
        to: '/notes',
        show: user.role_id !== ROLES.ATTENDEE.id,
      },
      {
        label: 'Matches',
        icon: <FavoriteIcon />,
        to: '/matches',
        show: true,
      },
      {
        label: 'Check-in',
        icon: <HowToRegIcon />,
        to: '/check-in',
        show: user.role_id !== ROLES.ATTENDEE.id,
      },
      {
        label: 'Account',
        icon: <PersonIcon />,
        to: '/account',
        show: true,
      },
    ];

    return items.filter(item => item.show);
  };

  const navItems = getNavItems();

  const trail = useTrail(navItems.length, {
    from: { opacity: 0, y: 5 },
    to: { opacity: 1, y: 0 },
    config: { tension: 280, friction: 20 },
  });

  // Function to handle exiting test attendee mode
  const handleExitTestMode = () => {
    disableMockAttendeeMode();
    // Refresh the page to ensure UI updates properly
    window.location.reload();
  };

  // Dark mode toggle button spring animation
  const toggleButtonProps = useSpring({
    opacity: 1,
    transform: 'scale(1)',
    from: { opacity: 0, transform: 'scale(0.8)' },
    config: { tension: 280, friction: 20 },
  });

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AnimatedBox
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              style={{
                transform: logoStyle.scale.to(s => `scale(${s})`).to(s => `translate3d(0,${logoStyle.y.get()}px,0) scale(${s})`),
              }}
              sx={{ mr: 4 }}
            >
              <Typography
                variant="h6"
                noWrap
                component={RouterLink}
                to="/"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  letterSpacing: '.1rem',
                  display: 'inline-block',
                  transition: 'color 0.2s ease-in-out',
                  '&:hover': {
                    color: theme.palette.primary.light,
                  },
                }}
              >
                SAS-UI
              </Typography>
            </AnimatedBox>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {trail.map(({ y, opacity }, index) => (
                <animated.div 
                  key={navItems[index].to} 
                  style={{ 
                    opacity,
                    transform: y.to(value => `translate3d(0,${value}px,0)`),
                  }}
                >
                  <Button
                    component={RouterLink}
                    to={navItems[index].to}
                    color={isActive(navItems[index].to) ? "primary" : "inherit"}
                    startIcon={navItems[index].icon}
                    sx={{
                      fontWeight: isActive(navItems[index].to) ? 600 : 500,
                      color: isActive(navItems[index].to) 
                        ? theme.palette.primary.main 
                        : theme.palette.mode === 'light' 
                          ? theme.palette.primary.dark
                          : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {!isMobile && navItems[index].label}
                  </Button>
                </animated.div>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnimatedIconButton 
              onClick={colorMode.toggleColorMode} 
              color="inherit"
              style={toggleButtonProps}
              sx={{ ml: 1 }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </AnimatedIconButton>
            {user && (
              <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                {/* Test mode indicator and exit button */}
                {mockAttendeeMode && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Chip
                      label="Test Attendee Mode"
                      color="warning"
                      sx={{ mr: 1 }}
                    />
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<ExitIcon />}
                      onClick={handleExitTestMode}
                    >
                      Exit Test
                    </Button>
                  </Box>
                )}
                
                <Button
                  color="inherit"
                  onClick={logout}
                  startIcon={<ExitIcon />}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 