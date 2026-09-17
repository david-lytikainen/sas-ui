import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navItems = user ? [
    { label: 'S&S', to: '/' },
    { label: 'Events', to: '/events' },
    { label: `Hi, ${user.first_name}`, to: '/profile' },
  ] : [];
  const navPillSx = (active: boolean) => ({ minWidth: 'auto', borderRadius: 999, px: 1.75, py: 0.8, fontSize: isMobile ? '0.8rem' : '1rem', fontWeight: 700, lineHeight: 1.2, bgcolor: active ? theme.palette.primary.main : theme.palette.background.paper, color: active ? theme.palette.primary.contrastText : theme.palette.text.primary, boxShadow: 'none', '&:hover': { bgcolor: active ? theme.palette.primary.main : theme.palette.action.hover, boxShadow: 'none' }, '&:active, &:focus-visible': { boxShadow: 'none' }, '@media (hover: none), (pointer: coarse)': { '&:hover': { bgcolor: active ? theme.palette.primary.main : theme.palette.background.paper, boxShadow: 'none' } } });

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
                return <Button key={item.to} component={RouterLink} to={item.to} aria-current={active ? 'page' : undefined} sx={navPillSx(active)}>{item.label}</Button>;
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
              </>
          </Box>}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
