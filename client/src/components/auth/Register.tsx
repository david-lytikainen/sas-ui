import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: '',
    phone: '',
    role: 'attendee' as 'attendee' | 'organizer' | 'admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'birthday') {
      const date = new Date(value);
      if (date > new Date()) {
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    // Validate phone number is exactly 10 digits
    if (!/^\d{10}$/.test(formData.phone)) {
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
      setError('You must be at least 18 years old to register');
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
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthday: new Date(formData.birthday).toISOString().split('T')[0],
        gender: formData.gender,
        phone: formData.phone,
        role: formData.role as 'attendee' | 'organizer' | 'admin',
      };
      
      await register(registrationData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 2, mb: 2 }}>
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 2, md: 3 }, borderRadius: 2 }}>
        <Typography 
          variant="h4"
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center', 
            mb: 0.5,
            fontWeight: 'bold',
            color: 'primary.main',
          }}
        >
         Saved & Single
        </Typography>
        <Typography variant="subtitle1" component="h2" sx={{ textAlign: 'center', mb: 1.5 , fontWeight: 'bold' }}>
          Register
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
            value={formData.phone}
            onChange={handleTextChange}
            margin="dense"
            required
            type="tel"
            size="small"
            inputProps={{
              pattern: "[0-9]{10}",
              title: "Please enter a 10-digit phone number"
            }}
            sx={{ mb: 1 }}
          />

          <TextField
            fullWidth
            label="Birthday"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleTextChange}
            margin="dense"
            required
            size="small"
            InputLabelProps={{
              shrink: true,
              sx: {
                color: 'text.secondary',
                textAlign: 'left',
                transform: 'translate(12px, -9px) scale(0.75)',
                transformOrigin: 'top left'
              }
            }}
            inputProps={{
              max: new Date().toISOString().split('T')[0],
              style: { 
                textAlign: 'left',
                paddingLeft: '12px'
              }
            }}
            helperText="Must be 18 or older"
            FormHelperTextProps={{ 
              sx: { 
                fontSize: '0.75rem',
                marginTop: '2px',
                color: 'text.secondary',
                opacity: 0.8
              } 
            }}
            sx={{
              mt: 0.5,
              mb: .5,
              '& .MuiInputBase-root': {
                marginBottom: '0px',
                height: '40px',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                '& input': {
                  textAlign: 'left',
                  paddingLeft: '12px !important',
                  opacity: 1,
                  color: 'text.primary'
                }
              },
              '& input[type="date"]::-webkit-date-and-time-value': {
                textAlign: 'left',
                opacity: 1,
                color: 'text.primary'
              },
              '& input::-webkit-calendar-picker-indicator': {
                marginRight: '8px',
                position: 'absolute',
                right: '0',
                opacity: 0.7
              },
              '& input::-webkit-datetime-edit': {
                paddingLeft: 0,
                textAlign: 'left',
                opacity: 1,
                color: 'text.primary'
              },
              '& input::-webkit-datetime-edit-fields-wrapper': {
                textAlign: 'left',
                paddingLeft: 0,
                opacity: 1
              },
              '& input::-webkit-datetime-edit-text': {
                opacity: 1, 
                color: 'inherit'
              },
              '& input::-webkit-datetime-edit-month-field': {
                opacity: 1,
                color: 'inherit'
              },
              '& input::-webkit-datetime-edit-day-field': {
                opacity: 1,
                color: 'inherit'
              },
              '& input::-webkit-datetime-edit-year-field': {
                opacity: 1,
                color: 'inherit'
              },
              '@supports (-webkit-touch-callout: none)': {
                '& input[type="date"]': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  opacity: 1,
                  '&::-webkit-date-and-time-value': {
                    margin: 0,
                    opacity: 1,
                    color: 'text.primary'
                  }
                }
              }
            }}
          />

          <FormControl fullWidth margin="dense" required size="small">
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

          <FormControl component="fieldset" margin="dense" required sx={{ mt: 1}}>
            <FormLabel component="legend" sx={{ fontSize: '0.8rem' }}>I want to:</FormLabel>
            <RadioGroup
              name="role"
              value={formData.role}
              onChange={handleTextChange}
              row
              sx={{ mt: -0.5 }}
            >
              <FormControlLabel
                value="attendee"
                control={<Radio size="small" />}
                label="Attend Speed Dating Events"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
              {/* TODO: Add organizer role back in , hidden for now*/}
              {/* <FormControlLabel
                value="organizer"
                control={<Radio size="small" />}
                label="Organize Speed Dating Events"
                 sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              /> */}
              {/* TODO: Add admin role back in , hidden for now*/}
              {/* <FormControlLabel
                value="admin"
                control={<Radio size="small"/>}
                label="Admin"
                 sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              /> */}
            </RadioGroup>
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
            {loading ? 'Registering...' : 'Register'}
          </Button>

          <Button
            fullWidth
            onClick={() => navigate('/login')}
            size="small"
            sx={{ mt: 0.5 }}
          >
            Already have an account? Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 