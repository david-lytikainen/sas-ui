import { useContext, useState } from 'react';
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
} from '@mui/material';
import { animated, useSpring, useTrail } from '@react-spring/web';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../context/ColorModeContext';
import {
  ExitToApp as ExitIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const AnimatedIconButton = animated(IconButton);
const AnimatedBox = animated(Box);

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const colorMode = useContext(ColorModeContext);

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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    if (!user) return [];

    const items = [
      {
        label: 'Home',
        icon: <HomeIcon />,
        to: '/events',
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


  // Dark mode toggle button spring animation
  const toggleButtonProps = useSpring({
    opacity: .5,
    transform: 'scale(1)',
    from: { opacity: 0, transform: 'scale(0.8)' },
    config: { tension: 280, friction:10 },
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
              <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                {isMobile ? (
                  <Box 
                    component="img" 
                    src="/favicon.svg" 
                    alt="Saved & Single Logo" 
                    sx={{ 
                      height: 32, 
                      width: 32,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }} 
                  />
                ) : (
                  <Typography
                    variant="h6"
                    noWrap
                    sx={{
                      fontWeight: 1100,
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      letterSpacing: '.05rem',
                      display: 'inline-block',
                      transition: 'color 0.2s ease-in-out',
                      '&:hover': {
                        color: theme.palette.primary.dark,
                        transform: 'scale(1.05)',
                        transition: 'color 0.2s ease-in-out, transform 0.2s ease-in-out',
                      },
                    }}
                  >
                    S&S
                  </Typography>
                )}
              </RouterLink>
            </AnimatedBox>

            <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, alignItems: 'center' }}>
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
                          ? theme.palette.text.primary
                          : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                        color: theme.palette.primary.main,
                      },
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      padding: isMobile ? '6px 8px' : '8px 16px',
                      minWidth: isMobile ? 'auto' : undefined,
                      '& .MuiButton-startIcon': {
                        marginRight: isMobile ? 0 : 2,
                      },
                    }}
                  >
                    {!isMobile && (
                      <Typography
                        component="span"
                        sx={{
                          color: 'inherit',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          ml: -0.5,
                        }}
                      >
                        {navItems[index].label}
                      </Typography>
                    )}
                  </Button>
                </animated.div>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnimatedIconButton 
              onClick={colorMode.toggleColorMode} 
              sx={{ 
                ml: 1,
                color: theme.palette.mode === 'light' 
                  ? theme.palette.primary.dark
                  : 'inherit'
              }}
              style={toggleButtonProps}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </AnimatedIconButton>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2, ml: 'auto' }}>
                <Button
                  sx={{
                    color: theme.palette.mode === 'light' 
                      ? theme.palette.primary.dark
                      : 'inherit',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                    pl: isMobile ? 1.5 : undefined,
                    pr: isMobile ? 1.5 : undefined,
                  }}
                  onClick={logout}
                  startIcon={isMobile ? undefined : <ExitIcon />}
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