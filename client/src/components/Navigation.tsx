import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navItems = user ? [
    { label: 'S&S', to: '/', brand: true },
    { label: 'Events', to: '/events' },
    { label: `Hi, ${user.first_name}`, to: '/profile' },
  ] : [];
  const navPillSx = (active: boolean, brand = false) => ({ minHeight: 44, minWidth: 44, maxWidth: brand ? 76 : { xs: 112, sm: 180 }, px: brand ? 1.5 : { xs: 1.25, sm: 1.75 }, borderRadius: 999, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? theme.palette.primary.contrastText : theme.palette.text.primary, bgcolor: active ? theme.palette.primary.main : 'transparent', fontSize: brand ? '1.1rem' : '0.9rem', fontWeight: brand ? 800 : 700, letterSpacing: 0, boxShadow: active ? theme.shadows[1] : 'none', '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 }, '&:active': { bgcolor: active ? theme.palette.primary.dark : theme.palette.action.selected }, '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: active ? theme.palette.primary.main : theme.palette.action.hover } } });

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.25, sm: 2.5 } }}>
        <Toolbar disableGutters sx={{ minHeight: '64px !important', gap: 1, overflow: 'hidden' }}>
          {user ? (
            <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return <Button key={item.to} component={RouterLink} to={item.to} aria-current={active ? 'page' : undefined} sx={navPillSx(active, item.brand)}>{item.label}</Button>;
              })}
            </Box>
          ) : (
            <Typography variant="h6" component={RouterLink} to="/" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', color: 'primary.main', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', letterSpacing: 0 }}>
              S&S
            </Typography>
          )}

          {!user && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', position: 'relative' }}>
              <>
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
                    minHeight: 44,
                    px: isMobile ? 1.25 : 1.75,
                    borderRadius: 999,
                    '@media (hover: hover) and (pointer: fine)': { '&:hover': { backgroundColor: theme.palette.action.hover, color: theme.palette.primary.dark } },
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
                    LOGIN
                  </Typography>
                </Button>
                {location.pathname === '/' && (
                  <Box
                    role="status"
                    sx={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: 'max-content',
                      maxWidth: 'calc(100vw - 32px)',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      color: 'text.primary',
                      bgcolor: 'background.paper',
                      border: '1px solid rgba(166, 192, 254, 0.35)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                      fontSize: '0.85rem',
                      lineHeight: 1.35,
                      textAlign: 'left',
                      zIndex: theme.zIndex.tooltip,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -8,
                        right: { xs: 18, sm: 24 },
                        width: 14,
                        height: 14,
                        bgcolor: 'background.paper',
                        borderLeft: '1px solid rgba(166, 192, 254, 0.35)',
                        borderTop: '1px solid rgba(166, 192, 254, 0.35)',
                        transform: 'rotate(45deg)',
                      },
                    }}
                  >
                    Login to attend or organize events
                  </Box>
                )}
              </>
          </Box>}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
