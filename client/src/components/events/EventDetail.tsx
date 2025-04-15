import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { 
  PlayArrow as StartIcon,
  HowToReg as SignUpIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  HowToReg,
} from '@mui/icons-material';

interface Event {
  id: string;
  name: string;
  description: string;
  status: string;
  starts_at: string;
  address: string;
  price_per_person: number;
  max_capacity: number;
}

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, refreshEvents } = useEvents();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    const currentEvent = events.find(e => e.id === eventId);
    if (currentEvent) {
      setEvent(currentEvent);
      
      // If event is in progress, automatically set the active tab to schedule
      if (currentEvent.status === 'in_progress' && activeTab === '') {
        setActiveTab('schedule');
        navigate(`/events/${eventId}/schedule`);
      } else if (activeTab === '') {
        setActiveTab('matches');
        navigate(`/events/${eventId}/matches`);
      }
    }
  }, [eventId, events, navigate, activeTab]);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (eventId && user?.role_id === ROLES.ATTENDEE.id) {
        try {
          const isRegistered = await eventsApi.isRegisteredForEvent(eventId);
          setIsRegistered(isRegistered);
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      }
    };

    checkRegistrationStatus();
  }, [eventId, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    // First update the state
    setActiveTab(newValue);
    // Then navigate with a small delay to prevent animation conflicts
    setTimeout(() => {
      navigate(`/events/${eventId}/${newValue}`, { replace: true });
    }, 10);
  };

  const handleStartEvent = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await eventsApi.startEvent(eventId);
      setSuccess('Event started successfully! Schedule and matches have been generated.');
      setStartDialogOpen(false);
      
      // Refresh events to get updated status
      await refreshEvents();
      
      // Set a small timeout to allow the UI to update before navigation
      setTimeout(() => {
        // First update the state
        setActiveTab('schedule');
        // Then navigate after a small delay to prevent animation conflicts
        setTimeout(() => {
          navigate(`/events/${eventId}/schedule`, { replace: true });
        }, 50);
      }, 100);
    } catch (error: any) {
      setError(error.message || 'Failed to start event');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpClick = () => {
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await eventsApi.registerForEvent(eventId);
      setSuccess('Successfully signed up for the event!');
      setSignUpDialogOpen(false);
      setIsRegistered(true);
    } catch (error: any) {
      setError(error.message || 'Failed to sign up for the event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await eventsApi.cancelRegistration(eventId);
      setSuccess('Successfully cancelled registration');
      setCancelDialogOpen(false);
      setIsRegistered(false);
    } catch (error: any) {
      setError(error.message || 'Failed to cancel registration');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'UPCOMING';
      case 'in_progress':
        return 'IN PROGRESS';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      case 'draft':
        return 'DRAFT';
      default:
        return status.toUpperCase();
    }
  };

  const isEventInProgress = event.status === 'in_progress';
  const canStartEvent = (user?.role_id === ROLES.ADMIN.id || user?.role_id === ROLES.ORGANIZER.id) && 
                        event.status === 'published';
  const isAttendee = user?.role_id === ROLES.ATTENDEE.id;
  const canRegister = isAttendee && !isRegistered && event.status === 'published';
  const canCancelRegistration = isAttendee && isRegistered && event.status === 'published';
  const isAdmin = user?.role_id === ROLES.ADMIN.id;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        {isEventInProgress && isRegistered && (
          <Alert 
            severity="info" 
            variant="filled" 
            sx={{ 
              mb: 3, 
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.9 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.9 },
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              This event is in progress!
            </Typography>
            <Typography variant="body2">
              Your schedule has been generated. Check the tabs below to see your matches and schedule.
            </Typography>
          </Alert>
        )}

        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3,
            background: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {event.name}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
              <Chip
                label={getStatusLabel(event.status)}
                color={
                  event.status === 'published' 
                    ? 'success' 
                    : event.status === 'in_progress' 
                      ? 'primary' 
                      : 'default'
                }
                sx={{ alignSelf: 'flex-end', mb: 1 }}
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                {canStartEvent && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<StartIcon />}
                    onClick={() => setStartDialogOpen(true)}
                    disabled={loading}
                    sx={{ height: 40 }}
                  >
                    Start Event
                  </Button>
                )}

                {canRegister && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SignUpIcon />}
                    onClick={handleSignUpClick}
                    disabled={loading}
                    sx={{ height: 40 }}
                  >
                    Sign Up
                  </Button>
                )}

                {canCancelRegistration && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelClick}
                    disabled={loading}
                    sx={{ height: 40 }}
                  >
                    Cancel Registration
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EventIcon />}
                    onClick={() => navigate(`/events/${event.id}/schedule`)}
                    sx={{ height: 40 }}
                  >
                    View Schedule
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<HowToReg />}
                    onClick={() => navigate(`/events/${event.id}/check-in`)}
                    sx={{ height: 40 }}
                  >
                    Manage Check-in
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
          <Typography color="text.secondary" gutterBottom>
            {formatDate(event.starts_at)}
          </Typography>
          <Typography variant="body1" paragraph>
            {event.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
            <Typography variant="body2">
              Location: {event.address}
            </Typography>
            <Typography variant="body2">
              Price: ${event.price_per_person}
            </Typography>
            <Typography variant="body2">
              Capacity: {event.max_capacity} people
            </Typography>
          </Box>
        </Paper>

        {isRegistered && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                label="Schedule" 
                value="schedule"
                component={RouterLink}
                to={`/events/${eventId}/schedule`}
                sx={{
                  fontWeight: activeTab === 'schedule' ? 'bold' : 'normal',
                  ...(isEventInProgress && activeTab !== 'schedule' && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                    }
                  })
                }}
              />
              <Tab 
                label="Notes" 
                value="notes"
                component={RouterLink}
                to={`/events/${eventId}/notes`}
                sx={{
                  fontWeight: activeTab === 'notes' ? 'bold' : 'normal',
                  ...(isEventInProgress && activeTab !== 'notes' && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                    }
                  })
                }}
              />
            </Tabs>
          </Box>
        )}

        <Box sx={{ py: 3 }}>
          {isRegistered ? (
            <Box
              sx={{
                position: 'relative',
                minHeight: '200px',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Outlet />
            </Box>
          ) : (
            <Alert severity="info" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You need to register for this event to see schedule, matches, and notes.
              </Typography>
              {canRegister && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SignUpIcon />}
                  onClick={handleSignUpClick}
                  disabled={loading}
                  size="small"
                >
                  Sign Up Now
                </Button>
              )}
            </Alert>
          )}
        </Box>
      </Box>

      <Dialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
      >
        <DialogTitle>Start Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Starting the event will generate the schedule and matches for all registered participants.
            This action cannot be undone. Are you sure you want to start this event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStartEvent} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Event'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={signUpDialogOpen}
        onClose={() => setSignUpDialogOpen(false)}
      >
        <DialogTitle>Sign Up for Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign up for this event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignUpDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSignUpConfirm} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your registration for this event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Registration</Button>
          <Button 
            onClick={handleCancelConfirm} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Registration'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetail; 