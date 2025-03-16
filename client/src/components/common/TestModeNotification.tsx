import React from 'react';
import { Box, Button, Paper, Typography, useTheme } from '@mui/material';
import { ExitToApp as ExitIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const TestModeNotification = () => {
  const { mockAttendeeMode, disableMockAttendeeMode } = useAuth();
  const theme = useTheme();

  if (!mockAttendeeMode) {
    return null;
  }

  const handleExitTestMode = () => {
    disableMockAttendeeMode();
    // Refresh the page to ensure UI updates properly
    window.location.reload();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        zIndex: 1000,
        padding: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.warning.light,
        borderLeft: `4px solid ${theme.palette.warning.main}`,
        maxWidth: '300px',
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Test Attendee Mode Active
      </Typography>
      <Typography variant="body2" paragraph>
        You are currently viewing this page as if you were an attendee.
      </Typography>
      <Button
        variant="contained"
        color="warning"
        size="small"
        startIcon={<ExitIcon />}
        onClick={handleExitTestMode}
        fullWidth
      >
        Exit Test Mode
      </Button>
    </Paper>
  );
};

export default TestModeNotification; 