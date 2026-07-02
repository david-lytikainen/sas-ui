import { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Card, CardContent, Container, Divider, IconButton, TextField, Typography, useMediaQuery } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import authApi from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
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

  const getUserFormData = (currentUser: typeof user) => ({
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    birthday: currentUser?.birthday || '',
    gender: currentUser?.gender || '',
    current_church: currentUser?.current_church || '',
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
    setFormData(getUserFormData(user));
  }, [user]);

  const resetForm = () => {
    if (!user) return;
    setFormData(getUserFormData(user));
  };

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

    const birthday = parseDateOnly(formData.birthday);
    if (!birthday) {
      return 'Birthday is required.';
    }
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

  const handleStopEditing = () => {
    resetForm();
    setIsEditing(false);
    setMessage(null);
    setError(null);
  };

  const handleLogout = async () => {
    await logout();
  };

  const readOnlyRows = [
    { label: 'First Name', value: formData.first_name },
    { label: 'Last Name', value: formData.last_name },
    { label: 'Email Address', value: formData.email },
    { label: 'Phone Number', value: formattedPhone },
    {
      label: 'Birthday',
      value: parseDateOnly(formData.birthday)?.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) || '',
    },
    { label: 'Gender', value: formData.gender },
    { label: 'Church', value: formData.current_church || 'Other' },
  ];

  const hasChanges = useMemo(() => {
    if (!user) return false;

    const normalizedCurrentChurch = formData.current_church || 'Other';
    const normalizedUserChurch = user.current_church || 'Other';

    return (
      formData.first_name !== (user.first_name || '') ||
      formData.last_name !== (user.last_name || '') ||
      formData.email !== (user.email || '') ||
      formData.phone !== (user.phone || '') ||
      formData.birthday !== (user.birthday || '') ||
      normalizedCurrentChurch !== normalizedUserChurch
    );
  }, [formData, user]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" sx={{ fontWeight: 'bold' }}>
            Profile
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? (
              <>
                <IconButton
                  aria-label="Save profile changes"
                  onClick={handleSubmit}
                  disabled={!hasChanges || loading}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    border: '1px solid',
                    borderColor: hasChanges && !loading ? 'primary.main' : 'divider',
                    borderRadius: 2.5,
                    px: 1.1,
                    py: 0.75,
                  }}
                >
                  <CheckIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
                <IconButton
                  aria-label="Stop editing profile"
                  onClick={handleStopEditing}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2.5,
                    px: 1.1,
                    py: 0.75,
                  }}
                >
                  <CloseIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </>
            ) : (
              <IconButton
                aria-label="Edit profile"
                onClick={() => {
                  setIsEditing(true);
                  setMessage(null);
                  setError(null);
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2.5,
                  px: 1.1,
                  py: 0.75,
                }}
              >
                <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
          </Box>
        </Box>
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
          {isEditing ? (
            <>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => handleTextChange('first_name', e.target.value)}
                fullWidth
                required
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => handleTextChange('last_name', e.target.value)}
                fullWidth
                required
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleTextChange('email', e.target.value)}
                fullWidth
                required
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                label="Phone Number"
                value={formattedPhone}
                onChange={(e) => handleTextChange('phone', e.target.value)}
                fullWidth
                required
                size={isMobile ? 'small' : 'medium'}
                inputProps={{ inputMode: 'numeric', maxLength: 14 }}
              />
              <DatePicker
                label="Birthday"
                value={parseDateOnly(formData.birthday)}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, birthday: !value || Number.isNaN(value.getTime()) ? '' : formatDateOnly(value) }));
                }}
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
                    inputProps: { readOnly: true },
                  }
                }}
              />
              <Autocomplete
                freeSolo
                options={churchOptions}
                value={formData.current_church}
                onInputChange={(_, value) => {
                  setFormData(prev => ({ ...prev, current_church: value }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Church"
                    size={isMobile ? 'small' : 'medium'}
                  />
                )}
              />
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {readOnlyRows.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.4 }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {row.value || 'Not provided'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          <Divider sx={{ mt: isEditing ? 0 : 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              onClick={handleLogout}
              variant="outlined"
              color="inherit"
              sx={{
                borderRadius: 999,
                px: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Log out
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfilePage;
