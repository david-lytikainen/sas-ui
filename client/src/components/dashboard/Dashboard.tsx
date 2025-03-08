import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Event as EventIcon,
  Notes as NotesIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Schedule Dates',
      description: 'View and manage your speed dating events',
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      path: '/schedule',
    },
    {
      title: 'Date Notes',
      description: 'Keep track of your speed dating experiences',
      icon: <NotesIcon sx={{ fontSize: 40 }} />,
      path: '/notes',
    },
    {
      title: 'Matches',
      description: 'View and manage your matches',
      icon: <FavoriteIcon sx={{ fontSize: 40 }} />,
      path: '/matches',
    },
  ];

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Welcome, {user?.first_name}!
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Grid container spacing={3}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {item.title}
                  </Typography>
                  <Typography>{item.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" fullWidth onClick={() => navigate(item.path)}>
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 