import { useState, useEffect } from 'react';
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
  DialogActions, Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  HowToReg as SignUpIcon,
  Cancel as CancelIcon, Person as PersonIcon, LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus } from '../../types/event';

const EventList = () => {
  const { events: contextEvents, createEvent, refreshEvents, isRegisteredForEvent } = useEvents();
  const { isAdmin, isOrganizer } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    starts_at: '',
    address: '',
    max_capacity: '',
    price_per_person: '',
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
      address: contextEvent.address,
      max_capacity: contextEvent.max_capacity,
      status: contextEvent.status,
      price_per_person: typeof contextEvent.price_per_person === 'number' 
        ? contextEvent.price_per_person.toString() 
        : contextEvent.price_per_person || '0',
      registration_deadline: contextEvent.registration_deadline,
    } as Event;
  });

  const handleSignUpClick = (eventId: number) => {
    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        await eventsApi.registerForEvent(signUpEventId);
        setSignUpDialogOpen(false);
        setSignUpEventId(null);
        // Refresh events to update registration status
        await refreshEvents();
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to sign up for the event');
      }
    }
  };

  const handleCancelClick = (eventId: number) => {
    setCancelEventId(eventId.toString());
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (cancelEventId) {
      try {
        await eventsApi.cancelRegistration(cancelEventId);
        setCancelDialogOpen(false);
        setCancelEventId(null);
        // Refresh events to update registration status
        await refreshEvents();
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to cancel registration');
      }
    }
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

  // Sort events like a SQL database would
  const sortedEvents = [...events].sort((a, b) => {
    // First by status using the statusPriority
    const statusOrder: Record<EventStatus, number> = {
      'In Progress': 1,
      'Registration Open': 2,
      'Completed': 3,
      'Cancelled': 4
    };
    
    // Primary sort by status
    const statusCompare = statusOrder[a.status] - statusOrder[b.status];
    if (statusCompare !== 0) return statusCompare;
    
    // Secondary sort by starts_at date string (direct string comparison)
    // This is more like how SQL would compare date strings in ORDER BY
    if (a.starts_at < b.starts_at) return 1;
    if (a.starts_at > b.starts_at) return -1;
    
    // If both status and date are equal, sort by ID for consistent order
    return a.id - b.id;
  });

  const handleCreateEvent = async () => {
    try {
      // Basic validation
      if (!createForm.name || !createForm.starts_at 
          || !createForm.address || !createForm.max_capacity || !createForm.price_per_person) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
      
      const eventData = {
        ...createForm
      };
      
      await createEvent(eventData);
      setShowCreateCard(false);
      setCreateForm({
        name: '',
        description: '',
        starts_at: '',
        address: '',
        max_capacity: '',
        price_per_person: '',
        status: 'Registration Open' as EventStatus,
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create event');
    }
  };

  // Modified toggle function to keep animations for opening but make closing immediate
  const handleToggleCreateCard = () => {
    if (showCreateCard) {
      // Immediately hide without animation
      setShowCreateCard(false);
    } else {
      // Keep the animation for showing
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
                startIcon={showCreateCard ? <CancelIcon /> : <EventIcon />}
                onClick={handleToggleCreateCard}
                size={isMobile ? 'small' : 'medium'}
              >
                {showCreateCard ? 'Cancel' : 'Create Event'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Create Event Card */}
        <Box sx={{
          maxHeight: showCreateCard ? '1000px' : '0px',
          // Keep animation only for appearing, make disappearing immediate
          transition: showCreateCard 
            ? 'max-height 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease-in-out, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'max-height 0s, opacity 0s, transform 0s',
          opacity: showCreateCard ? 1 : 0,
          transform: showCreateCard ? 'scale(1)' : 'scale(0.95)',
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
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateEvent();
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
                            width: '100%',
                            cursor: 'text',
                            caretColor: theme.palette.primary.main,
                            padding: '2px',
                            color: theme.palette.text.primary
                          }}
                          required
                          autoFocus
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
                      maxLength={400}
                      placeholder="Description"
                      value={createForm.description}
                      onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                      style={{
                        marginBottom: 8,
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        color: theme.palette.text.primary,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%',
                        cursor: 'text',
                        caretColor: theme.palette.primary.main,
                        padding: '2px'
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        flex: 1, 
                        minWidth: 180, 
                        display: 'flex', 
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1,
                          color: theme.palette.text.secondary
                        }}>
                          <EventIcon fontSize="small" />
                        </Box>
                        <input
                          type="datetime-local"
                          value={createForm.starts_at}
                          onChange={e => setCreateForm(f => ({ ...f, starts_at: e.target.value }))}
                          style={{ 
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: theme.palette.text.primary,
                            padding: '8px 12px 8px 0',
                            fontSize: '0.9rem',
                            colorScheme: theme.palette.mode
                          }}
                          required
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ 
                        flex: 2, 
                        minWidth: 180, 
                        display: 'flex', 
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1,
                          color: theme.palette.text.secondary
                        }}>
                          <LocationOnIcon fontSize="small" />
                        </Box>
                        <input
                          type="text"
                          placeholder="Address"
                          value={createForm.address}
                          onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
                          style={{ 
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: theme.palette.text.primary,
                            padding: '8px 0',
                            fontSize: '0.9rem'
                          }}
                          required
                        />
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        minWidth: 120, 
                        display: 'flex', 
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1,
                          color: theme.palette.text.secondary
                        }}>
                          <PersonIcon fontSize="small" />
                        </Box>
                        <input
                          type="number"
                          placeholder="Max Capacity"
                          value={createForm.max_capacity}
                          onChange={e => setCreateForm(f => ({ ...f, max_capacity: e.target.value }))}
                          style={{ 
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: theme.palette.text.primary,
                            padding: '8px 12px 8px 0',
                            fontSize: '0.9rem',
                            colorScheme: theme.palette.mode
                          }}
                          required
                        />
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        minWidth: 120, 
                        display: 'flex', 
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                        }
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1,
                          color: theme.palette.text.secondary
                        }}>
                          <AttachMoneyIcon fontSize="small" />
                        </Box>
                        <input
                          type="number"
                          placeholder="Price Per Person"
                          value={createForm.price_per_person}
                          onChange={e => setCreateForm(f => ({ ...f, price_per_person: e.target.value }))}
                          style={{ 
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: theme.palette.text.primary,
                            padding: '8px 12px 8px 0',
                            fontSize: '0.9rem',
                            colorScheme: theme.palette.mode
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ 
                    p: 2,
                    pt: 1,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1
                  }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth={isMobile}
                      type="submit"
                      size={isMobile ? 'small' : 'medium'}
                      startIcon={<EventAvailableIcon />}
                      sx={{
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      Create Event
                    </Button>
                  </CardActions>
                </form>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* actual event cards */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
                  {event.status === 'Registration Open' && !isRegisteredForEvent(event.id) ? (
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
                  ) : isRegisteredForEvent(event.id) ? (
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
                      variant="outlined"
                      disabled
                      size={isMobile ? 'small' : 'medium'}
                    >
                      {event.status}
                    </Button>
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
          <DialogTitle>Cancel Event Registration</DialogTitle>
          <DialogContent>
            Are you sure you want to cancel your registration for this event?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Yes, Cancel Registration
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EventList; 