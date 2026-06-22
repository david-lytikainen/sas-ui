import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, InputAdornment, IconButton, FormControl, Select, MenuItem, InputLabel, SelectChangeEvent, Link as MuiLink, Autocomplete } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../../context/AuthContext';
import { useSplash } from '../../context/SplashContext';
import authApi from '../../services/api';

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
    current_church: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [churchOptions, setChurchOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadChurches = async () => {
      const churches = await authApi.getChurches();
      const uniqueOptions = Array.from(new Set([...churches, 'Other']));
      setChurchOptions(uniqueOptions);
    };
    loadChurches();
  }, []);

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
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'email' ? value.toLowerCase() : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.birthday || !formData.gender || !formData.phone) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    // Calculate age from birthday
    const birthday = new Date(formData.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('You must be 18+ to Sign Up');
      return;
    }

    if (!formData.gender) {
      setError('Please select a gender');
      return;
    }

    try {
      setLoading(true);
      // Create registration data object with fields that match the API interface
      const registrationData = {
        email: formData.email.toLowerCase(),
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday: new Date(formData.birthday).toISOString().split('T')[0],
        gender: formData.gender,
        phone: phoneDigits,
        current_church: formData.current_church || 'Other',
      };
      
      await register(registrationData);
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
      <Typography 
        variant="h4"
        component="h1" 
        sx={{ 
          textAlign: 'center', 
          mb: 3,
          fontWeight: 'bold',
          color: 'primary.main',
        }}
      >
        Saved & Single
      </Typography>
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 2, md: 3 }, borderRadius: 2 }}>
        <Typography sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Sign Up
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem', py: 0.5 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
          />
          
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
          />
          
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
          />

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
            inputProps={{
              inputMode: 'numeric',
              maxLength: 14,
              pattern: "\\(\\d{3}\\)-\\d{3}-\\d{4}",
              title: "Enter exactly 10 digits"
            }}
            sx={{ mb: 1 }}
          />

          <DatePicker
            label="Birthday"
            value={formData.birthday ? new Date(formData.birthday) : null}
            onChange={(value) => {
              if (!value || Number.isNaN(value.getTime())) {
                setFormData(prev => ({ ...prev, birthday: '' }));
                return;
              }
              setFormData(prev => ({ ...prev, birthday: value.toISOString().split('T')[0] }));
            }}
            disableFuture
            referenceDate={new Date(2000, 0, 1)}
            views={['year', 'month', 'day']}
            openTo="year"
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                margin: 'dense',
                size: 'small',
                helperText: '18+ only. Use calendar icon to select date.',
                inputProps: { readOnly: true },
                FormHelperTextProps: {
                  sx: {
                    fontSize: '0.75rem',
                    marginTop: '2px',
                    color: 'text.secondary',
                    opacity: 0.8
                  }
                }
              }
            }}
          />

          <FormControl fullWidth margin="dense" required size="small" sx={{ mb: -0.5 }}>
            <InputLabel id="gender-select-label">Gender</InputLabel>
            <Select
              labelId="gender-select-label"
              id="gender-select"
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={handleSelectChange}
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            fullWidth
            freeSolo
            size="small"
            options={churchOptions}
            value={formData.current_church}
            onChange={(event, newValue) => {
              setFormData(prev => ({
                ...prev,
                current_church: newValue || ''
              }));
            }}
            onInputChange={(event, newInputValue) => {
              setFormData(prev => ({
                ...prev,
                current_church: newInputValue
              }));
            }}
            ListboxProps={{
              style: {
                maxHeight: '200px', // Limits to approximately 5 options
              },
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Current Church" 
                margin="dense"
                helperText="Search for you Church. If not listed please type the name"
                sx={{ mt: 1 }}
              />
            )}
            sx={{ mt: 1 }}
          />
          
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
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="medium"
            sx={{ mt: 1.5, mb: 0.5 }}
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>

          <Typography variant="caption" display="block" sx={{ mt: 1.5, textAlign: 'center', color: 'text.secondary' }}>
            By clicking Sign Up, you acknowledge that you have read and agree to the{' '}
            <MuiLink component="a" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </MuiLink>
            .
          </Typography>

          <Button
            fullWidth
            onClick={() => navigate('/login')}
            size="small"
            sx={{ mt: 0.5 }}
          >
            Already have an account? Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
