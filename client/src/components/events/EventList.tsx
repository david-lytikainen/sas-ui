import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  HowToReg as SignUpIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Person as PersonIcon,
  HowToReg,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

const EventList = () => {
  const navigate = useNavigate();
  const { events, deleteEvent, refreshEvents } = useEvents();
  const { user, enableMockAttendeeMode } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [startEventLoading, setStartEventLoading] = useState<string | null>(null);
  const [mockAttendDialogOpen, setMockAttendDialogOpen] = useState(false);
  const [mockAttendEventId, setMockAttendEventId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEventId) {
      await deleteEvent(selectedEventId);
      setDeleteDialogOpen(false);
      setSelectedEventId(null);
    }
  };

  const handleSignUpClick = (eventId: string) => {
    setSignUpEventId(eventId);
    setSignUpDialogOpen(true);
  };

  // Optimize registration status loading
  const loadRegistrationStatus = useCallback(async () => {
    if (!user?.role_id || user.role_id !== ROLES.ATTENDEE.id) return;

    try {
      const registeredSet = new Set<string>();
      const promises = events.filter(event => event.status === 'published').map(event => 
        eventsApi.isRegisteredForEvent(event.id)
          .then(isRegistered => {
            if (isRegistered) registeredSet.add(event.id);
          })
          .catch(error => console.error(`Error checking registration for event ${event.id}:`, error))
      );
      
      await Promise.all(promises);
      setRegisteredEvents(registeredSet);
    } catch (error) {
      console.error('Error loading registration status:', error);
    }
  }, [events, user?.role_id]);

  useEffect(() => {
    loadRegistrationStatus();
  }, [loadRegistrationStatus]);

  // Check for tab selection in sessionStorage
  useEffect(() => {
    const tabValue = sessionStorage.getItem('openEventsTab');
    if (tabValue) {
      setTabValue(parseInt(tabValue));
      // Clear the value so it doesn't persist on refresh
      sessionStorage.removeItem('openEventsTab');
    }
  }, []);

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        await eventsApi.registerForEvent(signUpEventId);
        setSuccessMessage('Successfully signed up for the event!');
        setSignUpDialogOpen(false);
        setSignUpEventId(null);
        // Update registration status immediately
        setRegisteredEvents(prev => new Set(Array.from(prev).concat([signUpEventId])));
        setTimeout(() => setSuccessMessage(null), 10000);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to sign up for the event');
      }
    }
  };

  const handleCancelClick = (eventId: string) => {
    setCancelEventId(eventId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (cancelEventId) {
      try {
        await eventsApi.cancelRegistration(cancelEventId);
        setSuccessMessage('Successfully cancelled registration');
        setCancelDialogOpen(false);
        setCancelEventId(null);
        // Update registration status immediately
        setRegisteredEvents(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(cancelEventId);
          return newSet;
        });
        setTimeout(() => setSuccessMessage(null), 10000);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to cancel registration');
      }
    }
  };

  const handleStartEvent = async (eventId: string) => {
    setStartEventLoading(eventId);
    setErrorMessage(null);
    
    try {
      await eventsApi.startEvent(eventId);
      setSuccessMessage('Event started successfully! Schedule and matches have been generated.');
      
      // Refresh events to get updated status
      await refreshEvents();
      
      // Navigate to the live event view after a short delay
      setTimeout(() => {
        navigate(`/events/${eventId}/live`);
      }, 1000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    } finally {
      setStartEventLoading(null);
    }
  };

  const handleMockAttendClick = (eventId: string) => {
    setMockAttendEventId(eventId);
    setMockAttendDialogOpen(true);
  };

  const handleMockAttendConfirm = async () => {
    if (!mockAttendEventId) return;
    
    try {
      // Register for the event if not already registered
      if (!registeredEvents.has(mockAttendEventId)) {
        await eventsApi.registerForEvent(mockAttendEventId);
        
        // Update registration status immediately
        setRegisteredEvents(prev => new Set(Array.from(prev).concat([mockAttendEventId])));
      }
      
      // Enable mock attendee mode in AuthContext
      user?.role_id && enableMockAttendeeMode();
      
      // Close dialog
      setMockAttendDialogOpen(false);
      setMockAttendEventId(null);
      
      // Set success message
      setSuccessMessage('You are now testing the attendee experience for this event. To exit this mode, click "Exit Test Mode" in the navbar.');
      
      // Navigate to event detail page
      navigate(`/events/${mockAttendEventId}`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to mock attend the event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'UPCOMING';
      case 'in_progress':
        return 'LIVE NOW';
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

  // Filter events by status
  const activeEvents = events.filter(event => event.status === 'in_progress');
  const archivedEvents = events.filter(event => event.status === 'completed');
  const publishedEvents = events.filter(event => event.status === 'published');
  
  // For My Events tab - include both events created by the user and published events
  const myEvents = [
    ...events.filter(event => event.creator_id === user?.id), // Events created by user
    ...publishedEvents.filter(event => event.creator_id !== user?.id) // Published events not created by user
  ];
  
  // Show ALL in-progress events in the Active Events tab, regardless of creator
  // This ensures users can see all live events, including their own
  const liveEvents = activeEvents;

  // Add a new handler for check-in navigation
  const handleCheckInNavigation = (eventId: string) => {
    navigate(`/events/${eventId}/check-in`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Speed Dating Events
          </Typography>
          {(user?.role_id === ROLES.ORGANIZER.id || user?.role_id === ROLES.ADMIN.id) && (
            <Button
              variant="contained"
              startIcon={<EventIcon />}
              onClick={() => navigate('/events/new')}
            >
              Create Event
            </Button>
          )}
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Active Events" />
            {(user?.role_id === ROLES.ORGANIZER.id || user?.role_id === ROLES.ADMIN.id) && (
              <Tab label="My Events" />
            )}
            <Tab label="Archive" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {liveEvents.map(event => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name}
                      </Typography>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {formatDate(event.starts_at)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                      />
                      <Chip
                        label={formatDate(event.starts_at)}
                        size="small"
                        icon={<EventIcon />}
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ flexWrap: 'wrap', p: 2, gap: 1 }}>
                    {user?.role_id === ROLES.ATTENDEE.id ? (
                      registeredEvents.has(event.id) ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelClick(event.id)}
                        >
                          Cancel Registration
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<SignUpIcon />}
                          onClick={() => handleSignUpClick(event.id)}
                          disabled={event.status !== 'published'}
                        >
                          Sign Up
                        </Button>
                      )
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, width: '100%' }}>
                        {event.status === 'published' && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleStartEvent(event.id)}
                              startIcon={startEventLoading === event.id ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
                              disabled={!!startEventLoading}
                              sx={{ height: 40 }}
                            >
                              {startEventLoading === event.id ? 'Starting...' : 'Start Event'}
                            </Button>
                          </>
                        )}
                        {(event.status === 'published' || event.status === 'in_progress') && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleCheckInNavigation(event.id)}
                            startIcon={<HowToReg />}
                            sx={{ height: 40 }}
                          >
                            Manage Check-in
                          </Button>
                        )}
                        {event.status === 'published' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/events/${event.id}/schedule`)}
                            startIcon={<EventIcon />}
                            sx={{ height: 40 }}
                          >
                            View Schedule
                          </Button>
                        )}
                        {event.status === 'in_progress' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/events/${event.id}/live`)}
                            startIcon={<PlayIcon />}
                            sx={{ height: 40 }}
                          >
                            View Live Event
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/events/edit/${event.id}`)}
                          startIcon={<EditIcon />}
                          sx={{ height: 40 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error" 
                          onClick={() => handleDeleteClick(event.id)}
                          startIcon={<DeleteIcon />}
                          sx={{ height: 40 }}
                        >
                          Delete
                        </Button>
                        {user?.role_id === ROLES.ORGANIZER.id && event.status === 'published' && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleMockAttendClick(event.id)}
                            startIcon={<PersonIcon />}
                            sx={{ height: 40 }}
                          >
                            Test View
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {liveEvents.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No active events available at this time.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {myEvents.map(event => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name}
                      </Typography>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {formatDate(event.starts_at)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                      />
                      <Chip
                        label={formatDate(event.starts_at)}
                        size="small"
                        icon={<EventIcon />}
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ flexWrap: 'wrap', p: 2, gap: 1 }}>
                    <Button size="small" onClick={() => navigate(`/events/${event.id}`)}>
                      View Details
                    </Button>
                    {(user?.role_id === ROLES.ORGANIZER.id && event.creator_id === user.id) || user?.role_id === ROLES.ADMIN.id ? (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, width: '100%' }}>
                        {event.status === 'published' && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleStartEvent(event.id)}
                              startIcon={startEventLoading === event.id ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
                              disabled={!!startEventLoading}
                              sx={{ height: 40 }}
                            >
                              {startEventLoading === event.id ? 'Starting...' : 'Start Event'}
                            </Button>
                          </>
                        )}
                        {(event.status === 'published' || event.status === 'in_progress') && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleCheckInNavigation(event.id)}
                            startIcon={<HowToReg />}
                            sx={{ height: 40 }}
                          >
                            Manage Check-in
                          </Button>
                        )}
                        {event.status === 'published' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/events/${event.id}/schedule`)}
                            startIcon={<EventIcon />}
                            sx={{ height: 40 }}
                          >
                            View Schedule
                          </Button>
                        )}
                        {event.status === 'in_progress' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/events/${event.id}/live`)}
                            startIcon={<PlayIcon />}
                            sx={{ height: 40 }}
                          >
                            View Live Event
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/events/edit/${event.id}`)}
                          startIcon={<EditIcon />}
                          sx={{ height: 40 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error" 
                          onClick={() => handleDeleteClick(event.id)}
                          startIcon={<DeleteIcon />}
                          sx={{ height: 40 }}
                        >
                          Delete
                        </Button>
                        {user?.role_id === ROLES.ORGANIZER.id && event.status === 'published' && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleMockAttendClick(event.id)}
                            startIcon={<PersonIcon />}
                            sx={{ height: 40 }}
                          >
                            Test View
                          </Button>
                        )}
                      </Box>
                    ) : null}
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {myEvents.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  You haven't created any events yet.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {archivedEvents.map(event => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card sx={{ opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name}
                      </Typography>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {formatDate(event.starts_at)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Ended: ${formatDate(event.ends_at)}`}
                        size="small"
                        icon={<EventIcon />}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/events/${event.id}`)}
                      startIcon={<EventIcon />}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {archivedEvents.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No completed events in the archive.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={signUpDialogOpen}
          onClose={() => setSignUpDialogOpen(false)}
        >
          <DialogTitle>Sign Up for Event</DialogTitle>
          <DialogContent>
            Are you sure you want to sign up for this event?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSignUpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSignUpConfirm} color="primary" variant="contained">
              Sign Up
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        >
          <DialogTitle>Cancel Registration</DialogTitle>
          <DialogContent>
            Are you sure you want to cancel your registration for this event?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Keep Registration</Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Cancel Registration
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={mockAttendDialogOpen}
          onClose={() => setMockAttendDialogOpen(false)}
        >
          <DialogTitle>Test Attendee Experience</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              This will let you experience the event as an attendee would see it. You'll be registered for the event if you aren't already.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Note: This is for testing purposes only.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMockAttendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMockAttendConfirm} color="primary" variant="contained">
              Test Attendee View
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EventList; 