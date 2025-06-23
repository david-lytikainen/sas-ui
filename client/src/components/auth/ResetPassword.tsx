import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import realAuthApi from '../../services/api';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!token) {
        setError("Reset token is missing.");
        return;
      }
      await realAuthApi.resetPassword(token, formData.password);
      setSuccess("Your password has been reset successfully! You can now log in.");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may be invalid or expired.");
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
          Set New Password
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
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                size="small"
                value={formData.password}
                onChange={handleChange}
                error={!!error}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                size="small"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!error}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                sx={{ mt: 1.5, mb: 1 }}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Set New Password'}
              </Button>
            </Box>
          </>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link component={RouterLink} to="/login" variant="body2" sx={{ fontSize: '0.8rem' }}>
            {"Back to Login"}
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword; 