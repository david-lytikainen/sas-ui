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
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
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
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface Event {
  id: string;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  is_registered?: boolean;
}

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

// Helper functions for status chip styling
function getStatusChipColor(status: string, theme: Theme) {
  switch (status) {
    case 'open':
      return theme.palette.success.light;
    case 'in_progress':
      return theme.palette.info.light;
    case 'completed':
      return theme.palette.grey[300];
    case 'cancelled':
      return theme.palette.error.light;
    default:
      return theme.palette.grey[200];
  }
}

function getStatusChipTextColor(status: string, theme: Theme) {
  switch (status) {
    case 'open':
      return theme.palette.success.contrastText || '#fff';
    case 'in_progress':
      return theme.palette.info.contrastText || '#fff';
    case 'completed':
      return theme.palette.text.primary;
    case 'cancelled':
      return theme.palette.error.contrastText || '#fff';
    default:
      return theme.palette.text.primary;
  }
}

const EventList = () => {
  const navigate = useNavigate();
  const { events, deleteEvent, refreshEvents } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    starts_at: '',
    ends_at: '',
    address: '',
    max_capacity: '',
    price_per_person: '',
    registration_deadline: '',
    status: 'open',
  });

  console.log(user)
  console.log('isAdmin():', isAdmin());
  console.log('isOrganizer():', isOrganizer());

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
      const promises = events.filter(event => event.status === 'open').map(event => 
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

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        await eventsApi.registerForEvent(signUpEventId);
        setSuccessMessage('Successfully signed up for the event!');
        setSignUpDialogOpen(false);
        setSignUpEventId(null);
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
      await refreshEvents();
      setTimeout(() => {
        navigate(`/events/${eventId}/live`);
      }, 1000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    } finally {
      setStartEventLoading(null);
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

  const handleCheckInNavigation = (eventId: string) => {
    navigate(`/events/${eventId}/check-in`);
  };

  // Sort events by status priority and date
  const sortedEvents = [...events].sort((a, b) => {
    const statusPriority: Record<Event['status'], number> = {
      'in_progress': 0,
      'open': 1,
      'completed': 2,
      'cancelled': 3
    };
    
    const priorityA = statusPriority[a.status];
    const priorityB = statusPriority[b.status];
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });

  const handleTestGetEvents = async () => {
    try {
      setTestError(null);
      const response = await eventsApi.testGetEvents();
      setTestResponse(response);
      console.log('Test response:', response);
    } catch (error: any) {
      setTestError(error.message || 'Failed to test get_events endpoint');
      console.error('Test error:', error);
    }
  };

  const isEventActive = (event: Event) => {
    return event.status === 'open' || event.status === 'in_progress';
  };

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
      <Box sx={{ mt: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Speed Dating Events
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleTestGetEvents}
              size={isMobile ? 'small' : 'medium'}
            >
              Test Get Events
            </Button>
            {(isAdmin() || isOrganizer()) && (
              <Button
                variant="contained"
                startIcon={<EventIcon />}
                onClick={() => setShowCreateCard((prev) => !prev)}
                size={isMobile ? 'small' : 'medium'}
              >
                Create Event
              </Button>
            )}
          </Box>
        </Box>

        {/* Create Event Card */}
        {showCreateCard && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Card sx={{
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                transition: 'transform 0.2s, box-shadow 0.2s',
                mb: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{
                      fontWeight: 600,
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      lineHeight: 1.2,
                      flex: 1
                    }}>
                      <input
                        type="text"
                        placeholder="Event Name"
                        value={createForm.name}
                        onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                        style={{
                          fontWeight: 600,
                          fontSize: isMobile ? '1rem' : '1.25rem',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          width: '100%'
                        }}
                      />
                    </Typography>
                    <select
                      value={createForm.status}
                      onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}
                      style={{
                        border: 'none',
                        outline: 'none',
                        borderRadius: 16,
                        padding: '2px 12px',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        background: getStatusChipColor(createForm.status, theme),
                        color: getStatusChipTextColor(createForm.status, theme),
                        marginLeft: 8,
                        minWidth: 100,
                        textAlign: 'center',
                        boxShadow: theme.shadows[1],
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </Box>
                  <input
                    type="text"
                    placeholder="Description"
                    value={createForm.description}
                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    style={{
                      marginBottom: 8,
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: theme.palette.text.secondary,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%'
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <input
                      type="datetime-local"
                      value={createForm.starts_at}
                      onChange={e => setCreateForm(f => ({ ...f, starts_at: e.target.value }))}
                      style={{ flex: 1, minWidth: 180 }}
                      placeholder="Start Time"
                    />
                    <input
                      type="datetime-local"
                      value={createForm.ends_at}
                      onChange={e => setCreateForm(f => ({ ...f, ends_at: e.target.value }))}
                      style={{ flex: 1, minWidth: 180 }}
                      placeholder="End Time"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Address"
                      value={createForm.address}
                      onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
                      style={{ flex: 2, minWidth: 180 }}
                    />
                    <input
                      type="number"
                      placeholder="Max Capacity"
                      value={createForm.max_capacity}
                      onChange={e => setCreateForm(f => ({ ...f, max_capacity: e.target.value }))}
                      style={{ flex: 1, minWidth: 120 }}
                    />
                    <input
                      type="number"
                      placeholder="Price Per Person"
                      value={createForm.price_per_person}
                      onChange={e => setCreateForm(f => ({ ...f, price_per_person: e.target.value }))}
                      style={{ flex: 1, minWidth: 120 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <input
                      type="datetime-local"
                      value={createForm.registration_deadline}
                      onChange={e => setCreateForm(f => ({ ...f, registration_deadline: e.target.value }))}
                      style={{ flex: 1, minWidth: 180 }}
                      placeholder="Registration Deadline"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {testError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTestError(null)}>
            {testError}
          </Alert>
        )}

        {testResponse && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setTestResponse(null)}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(testResponse, null, 2)}
            </Typography>
          </Alert>
        )}

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

        <Grid container spacing={2}>
          {sortedEvents.map(event => (
            <Grid item xs={12} key={event.id}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ 
                      fontWeight: 600,
                      fontSize: isMobile ? '1rem' : '1.25rem',
                      lineHeight: 1.2
                    }}>
                      {event.name}
                    </Typography>
                    <Chip
                      label={getStatusLabel(event.status)}
                      color={getStatusColor(event.status) as any}
                      size="small"
                      sx={{ 
                        ml: 1,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ 
                    mb: 1,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: 'text.secondary'
                  }}>
                    {event.description}
                  </Typography>
                  <Typography color="text.secondary" sx={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <EventIcon fontSize="small" />
                    {formatDate(event.starts_at)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    mb: 1,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <LocationOnIcon fontSize="small" />
                    {event.address}
                  </Typography>
                </CardContent>
                <CardActions sx={{ 
                  p: 2,
                  pt: 1,
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 1
                }}>
                  {user?.role_id === ROLES.ATTENDEE.id ? (
                    registeredEvents.has(event.id) ? (
                      <Button
                        fullWidth={isMobile}
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelClick(event.id)}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        Cancel Registration
                      </Button>
                    ) : (
                      <Button
                        fullWidth={isMobile}
                        variant="contained"
                        color="primary"
                        startIcon={<SignUpIcon />}
                        onClick={() => handleSignUpClick(event.id)}
                        disabled={event.status !== 'open'}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        Register
                      </Button>
                    )
                  ) : (
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 1,
                      width: '100%'
                    }}>
                      {event.status === 'open' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleStartEvent(event.id)}
                          startIcon={startEventLoading === event.id ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
                          disabled={!!startEventLoading}
                          size={isMobile ? 'small' : 'medium'}
                        >
                          {startEventLoading === event.id ? 'Starting...' : 'Start Event'}
                        </Button>
                      )}
                      {(event.status === 'open' || event.status === 'in_progress') && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleCheckInNavigation(event.id)}
                          startIcon={<HowToReg />}
                          size={isMobile ? 'small' : 'medium'}
                        >
                          Manage Check-in
                        </Button>
                      )}
                      {event.status === 'open' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/events/${event.id}/schedule`)}
                          startIcon={<EventIcon />}
                          size={isMobile ? 'small' : 'medium'}
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
                          size={isMobile ? 'small' : 'medium'}
                        >
                          View Live Event
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/events/edit/${event.id}`)}
                        startIcon={<EditIcon />}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error" 
                        onClick={() => handleDeleteClick(event.id)}
                        startIcon={<DeleteIcon />}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
          {sortedEvents.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                No events available at this time.
              </Alert>
            </Grid>
          )}
        </Grid>

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
      </Box>
    </Container>
  );
};

export default EventList; 