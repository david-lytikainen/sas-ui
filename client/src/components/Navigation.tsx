import React, { useContext } from 'react';
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
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../context/AuthContext';
import { ColorModeContext } from '../context/ColorModeContext';
import {
  Event as EventIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  Favorite as FavoriteIcon,
  Notes as NotesIcon,
  HowToReg as CheckInIcon,
} from '@mui/icons-material';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const baseMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Events', icon: <EventIcon />, path: '/events' },
    { text: 'Schedule', icon: <CalendarMonthIcon />, path: '/schedule' },
    { text: 'Notes', icon: <NotesIcon />, path: '/notes' },
    { text: 'Matches', icon: <FavoriteIcon />, path: '/matches' },
  ];

  // Add check-in option for admin users
  const menuItems = isAdmin() ? [
    ...baseMenuItems,
    { text: 'Check-in', icon: <CheckInIcon />, path: '/check-in' }
  ] : baseMenuItems;

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Speed Dating App
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                color="inherit"
                startIcon={item.icon}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                {item.text}
              </Button>
            ))}
            <IconButton 
              sx={{ ml: 1 }} 
              onClick={colorMode.toggleColorMode} 
              color="inherit"
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {user && (
              <Button
                color="inherit"
                onClick={logout}
              >
                Logout
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 