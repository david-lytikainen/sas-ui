import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Switch, 
  FormControlLabel, 
  Divider,
  Stack
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const AccountSettings = () => {
  const { user, persistLogin, togglePersistLogin } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account preferences and settings
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Login Preferences
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={persistLogin}
                onChange={togglePersistLogin}
                color="primary"
              />
            }
            label="Stay logged in between sessions"
          />
          <Typography variant="caption" color="text.secondary">
            When disabled, you will be logged out each time you close or refresh the browser.
            For added security in shared devices, consider turning this off.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1">
            <strong>Name:</strong> {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {user?.role_id === 1 ? 'Admin' : user?.role_id === 2 ? 'Organizer' : 'Attendee'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountSettings; 