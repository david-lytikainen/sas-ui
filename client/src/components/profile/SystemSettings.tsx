import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { animated, useSpring } from '@react-spring/web';

const AnimatedPaper = animated(Paper);

interface SystemSettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  eventReminders: boolean;
  matchAlerts: boolean;
  emailFrequency: string;
  language: string;
}

const SystemSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSettingsState>({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    eventReminders: true,
    matchAlerts: true,
    emailFrequency: 'daily',
    language: 'english',
  });
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Check if user is admin by calling the function
  const userIsAdmin = isAdmin();

  const paperAnimation = useSpring({
    from: { opacity: 0, transform: 'translate3d(0,20px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    config: { tension: 280, friction: 20 },
  });

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked,
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.value,
    });
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, you would save settings to backend
    console.log('Saving settings:', settings);
    
    setSaved(true);
    setLoading(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure event settings, notifications, and system preferences
        </Typography>

        <Snackbar
          open={saved}
          autoHideDuration={6000}
          onClose={() => setSaved(false)}
          message="Settings saved successfully"
        />

        <Grid container spacing={3}>
          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <AnimatedPaper style={paperAnimation} elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Notification Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleToggleChange}
                      name="emailNotifications"
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleToggleChange}
                      name="pushNotifications"
                      color="primary"
                    />
                  }
                  label="Push Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.eventReminders}
                      onChange={handleToggleChange}
                      name="eventReminders"
                      color="primary"
                    />
                  }
                  label="Event Reminders"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.matchAlerts}
                      onChange={handleToggleChange}
                      name="matchAlerts"
                      color="primary"
                    />
                  }
                  label="Match Alerts"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Email Frequency
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    name="emailFrequency"
                    value={settings.emailFrequency}
                    onChange={handleInputChange}
                    SelectProps={{
                      native: true,
                    }}
                    variant="outlined"
                    size="small"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="none">Don't send</option>
                  </TextField>
                </Box>
              </Box>
            </AnimatedPaper>
          </Grid>
          
          {/* Display Settings */}
          <Grid item xs={12} md={6}>
            <AnimatedPaper style={paperAnimation} elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PaletteIcon sx={{ mr: 1 }} />
                Display Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleToggleChange}
                      name="darkMode"
                      color="primary"
                    />
                  }
                  label="Dark Mode"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Language
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    name="language"
                    value={settings.language}
                    onChange={handleInputChange}
                    SelectProps={{
                      native: true,
                    }}
                    variant="outlined"
                    size="small"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </TextField>
                </Box>
              </Box>
            </AnimatedPaper>
          </Grid>
          
          {/* Email Settings */}
          <Grid item xs={12} md={6}>
            <AnimatedPaper style={paperAnimation} elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1 }} />
                Email Settings
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Email Account: {user?.email || 'Not set'}
                  </Typography>
                  <IconButton size="small" color="primary" aria-label="change email">
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Email Signature
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    size="small"
                    placeholder="Add your email signature here"
                  />
                </Box>
              </Box>
            </AnimatedPaper>
          </Grid>
          
          {/* Admin Settings (Only visible to admins) */}
          {userIsAdmin && (
            <Grid item xs={12}>
              <AnimatedPaper style={paperAnimation} elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  Admin Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  These settings are only visible to administrators and affect the entire system.
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          System Maintenance
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Schedule maintenance windows and system updates.
                        </Typography>
                        <Button variant="outlined" size="small">
                          Configure
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Email Templates
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Customize system email templates and notifications.
                        </Typography>
                        <Button variant="outlined" size="small">
                          Edit Templates
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AnimatedPaper>
            </Grid>
          )}
          
          {/* Save Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SystemSettings; 