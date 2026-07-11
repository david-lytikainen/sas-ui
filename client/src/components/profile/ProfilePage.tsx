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
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
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

  useEffect(() => {
    if (!user || (user.role_id !== 2 && user.role_id !== 3)) {
      setDashboard(null);
      return;
    }

    let active = true;
    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        const response = await authApi.getProfileDashboard();
        if (active) {
          setDashboard(response);
        }
      } catch (dashboardError: any) {
        if (active) {
          setError(dashboardError.message || 'Failed to load profile dashboard.');
        }
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
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

  const ownBilling = dashboard?.billing?.own_summary;
  const organizerOverview = dashboard?.billing?.organizer_overview || [];
  const latestRuns = dashboard?.admin_tools?.latest_runs || [];
  const recentFailures = dashboard?.admin_tools?.recent_failures || [];

  const billingHighlights = ownBilling
    ? [
        { label: 'Gross', value: `$${ownBilling.gross_amount}` },
        { label: 'Refunded', value: `$${ownBilling.refunded_amount}` },
        { label: 'Net', value: `$${ownBilling.net_amount}` },
        { label: 'Registrations', value: String(ownBilling.successful_registrations ?? 0) },
        { label: 'Refund Issues', value: String(ownBilling.refund_failures ?? 0) },
        { label: 'Mismatches', value: String(ownBilling.payment_mismatches ?? 0) },
      ]
    : [];

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
      {user?.role_id === 3 && (
        <Card sx={{ borderRadius: 2, mb: 2 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700 }}>
              Admin Tools
            </Typography>
            {dashboardLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading scheduler status...
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
                  {latestRuns.map((run: any) => (
                    <Box
                      key={run.job_name}
                      sx={{
                        border: '1px solid',
                        borderColor: run.status === 'failed' ? 'error.light' : 'divider',
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', mb: 0.4 }}>
                        {run.job_name}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.3 }}>
                        {run.status === 'failed' ? 'Failed' : 'Healthy'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Processed {run.processed_count ?? 0} item(s)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {run.created_at ? new Date(run.created_at).toLocaleString() : 'No run recorded'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {recentFailures.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Recent Scheduler Failures
                    </Typography>
                    {recentFailures.map((failure: any, index: number) => (
                      <Box
                        key={`${failure.job_name}-${index}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'error.light',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                          backgroundColor: 'rgba(211, 47, 47, 0.04)',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {failure.job_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {failure.error_message || 'Unknown error'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {failure.created_at ? new Date(failure.created_at).toLocaleString() : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(user?.role_id === 2 || user?.role_id === 3) && (
        <Card sx={{ borderRadius: 2, mb: 2 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700 }}>
              Billing
            </Typography>
            {dashboardLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading billing summary...
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: 1.25 }}>
                  {billingHighlights.map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        px: 1.5,
                        py: 1.25,
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', mb: 0.4 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', mb: 0.4 }}>
                    Stripe Account
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {dashboard?.billing?.stripe_connect_onboarding_complete ? 'Connected' : 'Not Connected'}
                  </Typography>
                </Box>
                {ownBilling?.recent_activity?.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Recent Billing Activity
                    </Typography>
                    {ownBilling.recent_activity.map((activity: any, index: number) => (
                      <Box
                        key={`${activity.created_at || activity.event_name}-${index}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {activity.event_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.attendee_name} • ${activity.amount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payment {activity.payment_status} | Registration {activity.registration_status}{activity.refund_status ? ` | Refund ${activity.refund_status}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {user?.role_id === 3 && organizerOverview.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Organizer Overview
                    </Typography>
                    {organizerOverview.map((organizer: any) => (
                      <Box
                        key={organizer.organizer_id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {organizer.organizer_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {organizer.organizer_email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gross ${organizer.gross_amount} | Net ${organizer.net_amount} | {organizer.onboarding_complete ? 'Connected' : 'Not Connected'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
