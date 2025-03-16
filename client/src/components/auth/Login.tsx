import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Paper,
  Grid,
  Divider,
  Chip,
} from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      // Error is handled by the AuthContext
    } finally {
      setLoading(false);
    }
  };
  
  const loginAsAdmin = () => {
    setFormData({
      email: 'admin@example.com',
      password: 'password'
    });
  };
  
  const loginAsAttendee = () => {
    setFormData({
      email: 'attendee@example.com',
      password: 'password'
    });
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Sign in
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Demo Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You can use these accounts to test different user roles:
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Admin</Typography>
                    <Chip label="Admin" color="primary" size="small" />
                  </Box>
                  <Typography variant="body2">Email: admin@example.com</Typography>
                  <Typography variant="body2">Password: password</Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    size="small" 
                    sx={{ mt: 2 }}
                    onClick={loginAsAdmin}
                  >
                    Use Admin Account
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Attendee</Typography>
                    <Chip label="Attendee" color="secondary" size="small" />
                  </Box>
                  <Typography variant="body2">Email: attendee@example.com</Typography>
                  <Typography variant="body2">Password: password</Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    size="small" 
                    sx={{ mt: 2 }}
                    onClick={loginAsAttendee}
                  >
                    Use Attendee Account
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Chip label="OR" />
          </Divider>
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 