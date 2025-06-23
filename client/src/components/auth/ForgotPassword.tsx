import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Paper,
  Fade,
} from '@mui/material';
import { default as realAuthApi } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase());
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await realAuthApi.forgotPassword(email);
      setSuccess(response.message);
    } catch (err: any) {
      // The API is designed to not throw for this call, but in case it does.
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 15, mb: 15 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center', 
            mb: 1, 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Saved & Single
        </Typography>
        <Typography variant="subtitle1" component="h2" sx={{ textAlign: 'center', mb: 1.5, fontWeight: 'bold', fontSize: '1.2rem' }}>
          Reset Password
        </Typography>

        {success ? (
          <Fade in={!!success}>
            <Alert severity="success" sx={{ width: '100%', mb: 1 }}>
              {success}
            </Alert>
          </Fade>
        ) : (
          <>
            <Fade in={!!error}>
              <Alert severity="error" sx={{ width: '100%', mb: 1 }}>
                {error}
              </Alert>
            </Fade>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 , alignItems: 'center'}}>
              <TextField
                margin="dense"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                size="small"
                value={email}
                onChange={handleChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                sx={{ mt: 1.5, mb: 1 }}
                disabled={loading || !!success}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          </>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link component={RouterLink} to="/login" variant="body2" sx={{ fontSize: '0.8rem' }}>
            {"Remembered your password? Sign In"}
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 