import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { animated, useSpring, useTrail } from '@react-spring/web';
import { useAuth } from '../context/AuthContext';
import { ExitToApp as ExitIcon } from '@mui/icons-material';

const AnimatedBox = animated(Box);

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    return [
      {
        label: 'EVENTS',
        to: '/events',
        show: true,
      },
      {
        label: 'PROFILE',
        to: '/profile',
        show: true,
      },
    ];
  };

  const navItems = getNavItems();

  const trail = useTrail(navItems.length, {
    from: { opacity: 0, y: 5 },
    to: { opacity: 1, y: 0 },
    config: { tension: 280, friction: 20 },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, marginTop: '4px'}}>
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
                  fontWeight: 1100,
                  fontSize: '1.5rem',
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
            </AnimatedBox>

            {user && (
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
                      sx={{
                        fontWeight: isActive(navItems[index].to) ? 700 : 600,
                        color: isActive(navItems[index].to) 
                          ? theme.palette.primary.main 
                          : 'inherit',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: theme.palette.primary.main,
                        },
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        padding: isMobile ? '6px 8px' : '8px 16px',
                        minWidth: isMobile ? 'auto' : undefined,
                        letterSpacing: '0.08em',
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: 'inherit',
                          fontSize: '1rem',
                          lineHeight: 1.5,
                          fontWeight: 'bold',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {navItems[index].label}
                      </Typography>
                    </Button>
                  </animated.div>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center'}}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: 'inherit',
                    fontSize: '0.95rem',
                    mr: 0
                  }}
                  noWrap
                >
                  Hi, {user.first_name}
                </Typography>
                {/* TODO remove */}
                <IconButton
                  onClick={handleLogout}
                  sx={{ color: 'inherit' }}
                >
                  <ExitIcon />
                </IconButton> 
              </Box>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  letterSpacing: '0.08em',
                  fontSize: '1rem',
                  background: 'none',
                  boxShadow: 'none',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: theme.palette.primary.dark,
                  },
                  padding: isMobile ? '6px 8px' : '8px 16px',
                  minWidth: isMobile ? 'auto' : undefined,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: 'inherit',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                  }}
                >
                  SIGN IN
                </Typography>
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
