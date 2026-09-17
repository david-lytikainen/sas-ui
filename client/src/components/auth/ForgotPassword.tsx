import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert, Paper, Fade } from '@mui/material';
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
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 2 }}>
      <Typography variant="h4" component="h1" sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Saved & Single
      </Typography>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Forgot Password
        </Typography>

        {success ? (
          <Fade in={!!success}>
            <Alert severity="success" sx={{ width: '100%', mt: 1, mb: 1, fontSize: '0.8rem', py: 0.5 }}>
              {success}
            </Alert>
          </Fade>
        ) : (
          <>
            {error && <Fade in={!!error}>
              <Alert severity="error" sx={{ width: '100%', mb: 1, fontSize: '0.8rem', py: 0.5 }}>
                {error}
              </Alert>
            </Fade>}
            <Box component="form" onSubmit={handleSubmit}>
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
        
        <Button component={RouterLink} to="/login" fullWidth size="small" sx={{ mt: 0.5 }}>Remembered your password? Login</Button>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
