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
  FormControl,
  Select,
  MenuItem,
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
import { Event, EventStatus } from '../../types/event';

const ROLES = {
  ADMIN: { id: 3, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 1, name: 'attendee', permission_level: 10 },
} as const;

// Helper functions for status chip styling
function getStatusChipColor(status: string, theme: Theme) {
  switch (status) {
    case 'Registration Open':
      return theme.palette.success.light;
    case 'In Progress':
      return theme.palette.info.light;
    case 'Completed':
      return theme.palette.grey[300];
    case 'Cancelled':
      return theme.palette.error.light;
    default:
      return theme.palette.grey[200];
  }
}

function getStatusChipTextColor(status: string, theme: Theme) {
  switch (status) {
    case 'Registration Open':
      return theme.palette.success.contrastText || '#fff';
    case 'In Progress':
      return theme.palette.info.contrastText || '#fff';
    case 'Completed':
      return theme.palette.text.primary;
    case 'Cancelled':
      return theme.palette.error.contrastText || '#fff';
    default:
      return theme.palette.text.primary;
  }
}

const EventList = () => {
  const navigate = useNavigate();
  const { events: contextEvents, refreshEvents, createEvent } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [startEventLoading, setStartEventLoading] = useState<string | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    starts_at: '',
    ends_at: '',
    address: '',
    max_capacity: '',
    price_per_person: '',
    registration_deadline: '',
    status: 'Registration Open' as EventStatus,
  });

  // Convert context events to our Event interface
  const events: Event[] = contextEvents.map((contextEvent: any) => {
    return {
      id: Number(contextEvent.id),
      name: contextEvent.name,
      description: contextEvent.description || '',
      creator_id: typeof contextEvent.creator_id === 'string' ? parseInt(contextEvent.creator_id) : contextEvent.creator_id || 0,
      starts_at: contextEvent.starts_at,
      ends_at: contextEvent.ends_at,
      address: contextEvent.address,
      max_capacity: contextEvent.max_capacity,
      status: contextEvent.status,
      price_per_person: typeof contextEvent.price_per_person === 'number' 
        ? contextEvent.price_per_person.toString() 
        : contextEvent.price_per_person || '0',
      registration_deadline: contextEvent.registration_deadline,
    } as Event;
  });

  console.log(user)
  console.log('isAdmin():', isAdmin());
  console.log('isOrganizer():', isOrganizer());


  const handleSignUpClick = (eventId: number) => {
    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        await eventsApi.registerForEvent(signUpEventId);
        setSuccessMessage('Successfully signed up for the event!');
        setSignUpDialogOpen(false);
        setSignUpEventId(null);
        setTimeout(() => setSuccessMessage(null), 10000);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to sign up for the event');
      }
    }
  };

  const handleCancelClick = (eventId: number) => {
    setCancelEventId(eventId.toString());
    setCancelDialogOpen(true);
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'Registration Open':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Completed':
        return 'info';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
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

  // Sort events by status priority and date
  const sortedEvents = [...events].sort((a, b) => {
    const statusPriority: Record<EventStatus, number> = {
      'In Progress': 0,
      'Registration Open': 1,
      'Completed': 2,
      'Cancelled': 3
    };
    
    const priorityA = statusPriority[a.status];
    const priorityB = statusPriority[b.status];
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });

  const isEventActive = (event: Event) => {
    return event.status === 'Registration Open' || event.status === 'In Progress';
  };

  const handleCreateEvent = async () => {
    try {
      // Basic validation
      if (!createForm.name || !createForm.description || !createForm.starts_at || 
          !createForm.ends_at || !createForm.address || !createForm.max_capacity) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
      
      // Convert string values to appropriate types
      const eventData = {
        ...createForm,
        max_capacity: Number(createForm.max_capacity),
        price_per_person: createForm.price_per_person || '0'
      };
      
      await createEvent(eventData);
      setSuccessMessage('Event created successfully!');
      setShowCreateCard(false);
      setCreateForm({
        name: '',
        description: '',
        starts_at: '',
        ends_at: '',
        address: '',
        max_capacity: '',
        price_per_person: '',
        registration_deadline: '',
        status: 'Registration Open' as EventStatus,
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create event');
    }
  };

  // Handle show/hide card with animation
  const handleToggleCreateCard = () => {
    if (showCreateCard) {
      setAnimatingOut(true);
      setTimeout(() => {
        setShowCreateCard(false);
        setAnimatingOut(false);
      }, 600); // Match this with the transition duration
    } else {
      setShowCreateCard(true);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
      <Box sx={{ mt: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Speed Dating Events
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {(isAdmin() || isOrganizer()) && (
              <Button
                variant="contained"
                startIcon={showCreateCard || animatingOut ? <CancelIcon /> : <EventIcon />}
                onClick={handleToggleCreateCard}
                size={isMobile ? 'small' : 'medium'}
              >
                {showCreateCard || animatingOut ? 'Cancel' : 'Create Event'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Create Event Card */}
        <Box sx={{
          overflow: 'hidden',
          maxHeight: (showCreateCard || animatingOut) ? '1000px' : '0px',
          transition: `max-height 0.6s cubic-bezier(${animatingOut ? '1, 0, 0.825, 0.115' : '0.175, 0.885, 0.32, 1.275'}), 
                       opacity 0.4s ease-in-out, 
                       transform 0.6s cubic-bezier(${animatingOut ? '1, 0, 0.825, 0.115' : '0.175, 0.885, 0.32, 1.275'})`,
          opacity: animatingOut ? 0 : showCreateCard ? 1 : 0,
          transform: animatingOut ? 'scale(0.95)' : showCreateCard ? 'scale(1)' : 'scale(0.95)',
          transformOrigin: 'top center',
          mb: showCreateCard ? 2 : 0
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
                    <Chip
                      label="Registration Open"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
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
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
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
                      label={event.status}
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
                  {event.status === 'Registration Open' ? (
                      <Button
                        fullWidth={isMobile}
                        variant="contained"
                        color="primary"
                        startIcon={<SignUpIcon />}
                        onClick={() => handleSignUpClick(event.id)}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        Register
                      </Button>
                    ) : (
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
                    )
                  }
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
      </Box>
    </Container>
  );
};

export default EventList; 