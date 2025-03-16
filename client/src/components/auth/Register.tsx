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
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    church: '',
    age: '',
    gender: '',
    matchingPreference: '',
    role: 'attendee' as 'attendee' | 'organizer' | 'admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age' && value !== '') {
      const age = parseInt(value);
      if (age < 18 || age > 99) {
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
    
    // Reset matching preference if gender changes
    if (name === 'gender') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        matchingPreference: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.church || !formData.age || !formData.gender) {
      setError('All fields are required');
      return;
    }

    // Validate matching preference for non-binary and other genders
    if ((formData.gender === 'non-binary' || formData.gender === 'other') && !formData.matchingPreference) {
      setError('Please select a matching preference');
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

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18 || age > 99) {
      setError('Please enter a valid age between 18 and 99');
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
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        church: formData.church,
        age: parseInt(formData.age),
        role: formData.role as 'attendee' | 'organizer' | 'admin',
        // Store gender as part of denomination field
        denomination: `gender:${formData.gender}|matchPref:${formData.matchingPreference || (formData.gender === 'male' ? 'female' : formData.gender === 'female' ? 'male' : '')}`
      };
      
      await register(registrationData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Check if matching preference field should be shown
  const showMatchingPreference = formData.gender === 'non-binary' || formData.gender === 'other';

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Register
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleTextChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Church Name"
              name="church"
              value={formData.church}
              onChange={handleTextChange}
              margin="normal"
              required
              helperText="Please enter your church's full name"
            />

            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleTextChange}
              margin="normal"
              required
              inputProps={{ min: 18, max: 99 }}
              helperText="Must be 18 or older"
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="gender-select-label">Gender</InputLabel>
              <Select
                labelId="gender-select-label"
                id="gender-select"
                name="gender"
                value={formData.gender}
                label="Gender"
                onChange={handleSelectChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              <FormHelperText>
                For matching purposes - males will be paired with females during events.
              </FormHelperText>
            </FormControl>

            {showMatchingPreference && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="matching-preference-label">Matching Preference</InputLabel>
                <Select
                  labelId="matching-preference-label"
                  id="matching-preference-select"
                  name="matchingPreference"
                  value={formData.matchingPreference}
                  label="Matching Preference"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="male">Match with Males</MenuItem>
                  <MenuItem value="female">Match with Females</MenuItem>
                  <MenuItem value="all">Match with All Genders</MenuItem>
                </Select>
                <FormHelperText>
                  Please select who you would prefer to be matched with during events
                </FormHelperText>
              </FormControl>
            )}

            <FormControl component="fieldset" margin="normal" required>
              <FormLabel component="legend">I want to:</FormLabel>
              <RadioGroup
                name="role"
                value={formData.role}
                onChange={handleTextChange}
                row
              >
                <FormControlLabel
                  value="attendee"
                  control={<Radio />}
                  label="Attend Speed Dating Events"
                />
                <FormControlLabel
                  value="organizer"
                  control={<Radio />}
                  label="Organize Speed Dating Events"
                />
                <FormControlLabel
                  value="admin"
                  control={<Radio />}
                  label="Admin"
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleTextChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <Button
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Already have an account? Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 