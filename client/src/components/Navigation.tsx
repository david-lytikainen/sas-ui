import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, Container, useTheme } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const navItems = user ? [
    { label: 'S&S', to: '/', brand: true },
    { label: 'Events', to: '/events' },
    { label: `Hi, ${user.first_name}`, to: '/profile' },
  ] : [
    { label: 'S&S', to: '/', brand: true },
    { label: 'Register', to: '/register' },
  ];
  const navLinkSx = (active: boolean, brand = false) => ({ minWidth: 'auto', height: 44, alignItems: 'flex-end', mx: 0.5, px: 1.25, py: 0.8, borderRadius: 0, borderBottom: '2px solid', borderColor: active ? theme.palette.primary.main : 'transparent', fontSize: brand ? '1.25rem' : '1rem', fontWeight: brand ? 900 : 700, lineHeight: 1.2, bgcolor: 'transparent', color: active ? theme.palette.primary.main : theme.palette.text.primary, boxShadow: 'none', '&:hover': { bgcolor: 'transparent', color: theme.palette.primary.main, boxShadow: 'none' }, '&:active, &:focus-visible': { bgcolor: 'transparent', boxShadow: 'none' }, '@media (hover: none), (pointer: coarse)': { '&:hover': { bgcolor: 'transparent', color: active ? theme.palette.primary.main : theme.palette.text.primary, boxShadow: 'none' } } });

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.25, sm: 2.5 } }}>
        <Toolbar disableGutters sx={{ minHeight: '64px !important', gap: 1, overflow: 'hidden' }}>
          <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to === '/register' && ['/login', '/forgot-password'].includes(location.pathname));
              return <Button key={item.to} component={RouterLink} to={item.to} aria-current={active ? 'page' : undefined} sx={navLinkSx(active, item.brand)}>{item.label}</Button>;
            })}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
