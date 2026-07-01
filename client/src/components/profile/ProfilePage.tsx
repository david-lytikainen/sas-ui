import { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Card, CardContent, Container, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import authApi from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, refreshUser } = useAuth();
  const [churchOptions, setChurchOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    gender: '',
    current_church: '',
  });

  useEffect(() => {
    const loadChurches = async () => {
      const churches = await authApi.getChurches();
      setChurchOptions(Array.from(new Set([...churches, 'Other'])));
    };

    loadChurches();
  }, []);

  useEffect(() => {
    if (!user) return;

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      birthday: user.birthday || '',
      gender: user.gender || '',
      current_church: user.current_church || '',
    });
  }, [user]);

  const formattedPhone = useMemo(() => {
    const digits = formData.phone.replace(/\D/g, '').slice(0, 10);
    if (!digits) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }, [formData.phone]);

  const handleTextChange = (field: string, value: string) => {
    if (field === 'phone') {
      setFormData(prev => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: field === 'email' ? value.toLowerCase() : value,
    }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.birthday || !formData.gender) {
      return 'First name, last name, email, phone, birthday, and gender are required.';
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      return 'Phone number must be exactly 10 digits.';
    }

    const birthday = new Date(formData.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }

    if (age < 18) {
      return 'You must be 18+ to use Saved & Single.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await authApi.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
        current_church: formData.current_church || 'Other',
      });

      await refreshUser();
      setMessage('Profile updated.');
      setIsEditing(false);
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" sx={{ fontWeight: 'bold' }}>
            Profile
          </Typography>
          <IconButton
            aria-label="Edit profile"
            onClick={() => {
              setIsEditing(true);
              setMessage(null);
              setError(null);
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isEditing
            ? 'Update the personal details used for registration, schedules, and matches.'
            : 'Review the personal details used for registration, schedules, and matches.'}
        </Typography>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleTextChange('first_name', e.target.value)}
            fullWidth
            required
            InputProps={{ readOnly: !isEditing }}
            size={isMobile ? 'small' : 'medium'}
          />
          <TextField
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => handleTextChange('last_name', e.target.value)}
            fullWidth
            required
            InputProps={{ readOnly: !isEditing }}
            size={isMobile ? 'small' : 'medium'}
          />
          <TextField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleTextChange('email', e.target.value)}
            fullWidth
            required
            InputProps={{ readOnly: !isEditing }}
            size={isMobile ? 'small' : 'medium'}
          />
          <TextField
            label="Phone Number"
            value={formattedPhone}
            onChange={(e) => handleTextChange('phone', e.target.value)}
            fullWidth
            required
            size={isMobile ? 'small' : 'medium'}
            InputProps={{ readOnly: !isEditing }}
            inputProps={{ inputMode: 'numeric', maxLength: 14 }}
          />
          <DatePicker
            label="Birthday"
            value={formData.birthday ? new Date(formData.birthday) : null}
            onChange={(value) => {
              if (!isEditing) return;
              setFormData(prev => ({ ...prev, birthday: !value || Number.isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0] }));
            }}
            readOnly={!isEditing}
            disabled={!isEditing}
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
                size: isMobile ? 'small' : 'medium',
                helperText: '18+ only. Use calendar icon to select date.',
                inputProps: { readOnly: true },
                disabled: !isEditing,
              }
            }}
          />
          <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
            <InputLabel id="profile-gender-label">Gender</InputLabel>
            <Select
              labelId="profile-gender-label"
              value={formData.gender}
              label="Gender"
              onChange={(e) => handleTextChange('gender', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            freeSolo
            options={churchOptions}
            value={formData.current_church}
            readOnly={!isEditing}
            onInputChange={(_, value) => {
              if (!isEditing) return;
              setFormData(prev => ({ ...prev, current_church: value }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Church"
                size={isMobile ? 'small' : 'medium'}
                InputProps={{
                  ...params.InputProps,
                  readOnly: !isEditing,
                }}
              />
            )}
          />
          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfilePage;
