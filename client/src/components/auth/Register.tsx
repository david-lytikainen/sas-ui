import React, { useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Container, FormControl, IconButton, InputAdornment, InputLabel, Link, MenuItem, Paper, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../../context/AuthContext';
import { useSplash } from '../../context/SplashContext';
import authApi from '../../services/api';

const parseDateOnly = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateOnly = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { setShowLoginSplash } = useSplash();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedPhone = useMemo(() => {
    const digits = formData.phone.replace(/\D/g, '').slice(0, 10);
    if (!digits) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }, [formData.phone]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: name === 'email' ? value.toLowerCase() : value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword || !formData.birthday || !formData.gender || !formData.phone) {
      return 'All fields are required';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      return 'Phone number must be exactly 10 digits';
    }

    const birthday = parseDateOnly(formData.birthday);
    if (!birthday) {
      return 'Birthday is required';
    }
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    if (age < 18) {
      return 'You must be 18+ to Register';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await register({
        email: formData.email.toLowerCase(),
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday: formData.birthday,
        gender: formData.gender,
        phone: formData.phone,
      });
      setShowLoginSplash(true);
      navigate('/events', { replace: true });
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h4" component="h1" sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Saved & Single
      </Typography>

      <Paper elevation={1} sx={{ p: { xs: 2, sm: 2, md: 3 }, borderRadius: 2 }}>
        <Typography sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Register
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem', py: 0.5 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="First Name" name="first_name" value={formData.first_name} onChange={handleTextChange} margin="dense" required size="small" />
          <TextField fullWidth label="Last Name" name="last_name" value={formData.last_name} onChange={handleTextChange} margin="dense" required size="small" />
          <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleTextChange} margin="dense" required size="small" />
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formattedPhone}
            onChange={handleTextChange}
            margin="dense"
            required
            type="tel"
            size="small"
            inputProps={{ inputMode: 'numeric', maxLength: 14, pattern: "\\(\\d{3}\\)-\\d{3}-\\d{4}" }}
          />
          <DatePicker
            label="Birthday"
            value={parseDateOnly(formData.birthday)}
            onChange={(value) => setFormData(prev => ({ ...prev, birthday: !value || Number.isNaN(value.getTime()) ? '' : formatDateOnly(value) }))}
            closeOnSelect
            disableFuture
            referenceDate={new Date(2000, 0, 1)}
            views={['year', 'month', 'day']}
            openTo="year"
            slotProps={{
              actionBar: { actions: [] },
              textField: {
                fullWidth: true,
                required: true,
                margin: 'dense',
                size: 'small',
                helperText: '18+ only. Use calendar icon to select date.',
                inputProps: { readOnly: true },
              }
            }}
          />
          <FormControl fullWidth margin="dense" required size="small">
            <InputLabel id="gender-select-label">Gender</InputLabel>
            <Select labelId="gender-select-label" id="gender-select" name="gender" value={formData.gender} label="Gender" onChange={handleSelectChange}>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(prev => !prev)} edge="end">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField fullWidth label="Confirm Password" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleTextChange} margin="dense" required size="small" />
          <Button type="submit" fullWidth variant="contained" size="medium" sx={{ mt: 1.5, mb: 1 }} disabled={loading}>
            {loading ? 'Working...' : 'Register'}
          </Button>
          <Button fullWidth onClick={() => navigate('/login')} size="small" sx={{ mt: 0.5 }}>
            Already have an account? Login
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/forgot-password" variant="subtitle1" sx={{ fontSize: '0.7rem' }}>
              Forgot Password?
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
