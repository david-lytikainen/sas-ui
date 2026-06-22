import React, { useState } from 'react';
import { Container, Box, Typography, Button, Card, CardContent, CardActions, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, useMediaQuery, useTheme, TextField, Collapse, Select, MenuItem, InputLabel, FormControl, DialogContentText, Divider } from '@mui/material';
import { Event as EventIcon, Cancel as CancelIcon, LocationOn as LocationOnIcon, AttachMoney as AttachMoneyIcon, CheckCircle as CheckInIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Settings as SettingsIcon, List as ListIcon, PlayArrow as StartIcon, Stop as EndIcon, Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon, CheckBox as CheckBoxIcon } from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus } from '../../types/event';
import CreateEvent from './CreateEvent';
import EventTimer from './EventTimer';
import MySchedule from './MySchedule';
import ViewAllSchedules from './ViewAllSchedules';
import ViewPins from './ViewPins';
import ViewRegisteredUsers from './ViewRegisteredUsers';
import ViewWaitlistedUsers from './ViewWaitlistedUsers';
import ConfirmDialog from '../common/ConfirmDialog';

type EventView = 'all' | 'my' | 'create';

const EventList = () => {
  const { refreshEvents, isRegisteredForEvent, filteredEvents } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeView, setActiveView] = useState<EventView>('my');
  const [pastEventsOpen, setPastEventsOpen] = useState(false);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);

  const [globalCheckInDialogOpen, setGlobalCheckInDialogOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<Event | null>(null);
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [expandedEventControls, setExpandedEventControls] = useState<number | null>(null);
  const [viewPinsDialogOpen, setViewPinsDialogOpen] = useState(false);
  const [selectedEventForPins, setSelectedEventForPins] = useState<Event | null>(null);
  const [viewRegisteredUsersDialogOpen, setViewRegisteredUsersDialogOpen] = useState(false);
  const [selectedEventForRegisteredUsers, setSelectedEventForRegisteredUsers] = useState<Event | null>(null);

  const [endEventDialogOpen, setEndEventDialogOpen] = useState(false);
  const [selectedEventForEnding, setSelectedEventForEnding] = useState<Event | null>(null);
  const [startEventDialogOpen, setStartEventDialogOpen] = useState(false);
  const [selectedEventForStarting, setSelectedEventForStarting] = useState<Event | null>(null);


  const [viewAllSchedulesDialogOpen, setViewAllSchedulesDialogOpen] = useState(false);
  const [selectedEventForAllSchedules, setSelectedEventForAllSchedules] = useState<Event | null>(null);

  const [numTables, setNumTables] = useState<number>(10);
  const [numRounds, setNumRounds] = useState<number>(10);
  const [isTableConfigOpen, setIsTableConfigOpen] = useState<boolean>(false);

  const [editEventDialogOpen, setEditEventDialogOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<Event>>({
    name: '',
    description: '',
    starts_at: '',
    address: '',
    max_capacity: '0',
    price_per_person: '0',
    status: 'Registration Open' as EventStatus,
  });

  const [deleteEventConfirmOpen, setDeleteEventConfirmOpen] = useState<boolean>(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null);

  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [eventForWaitlist, setEventForWaitlist] = useState<Event | null>(null);

  const [waitlistReason, setWaitlistReason] = useState<string>('');
  const [viewWaitlistDialogOpen, setViewWaitlistDialogOpen] = useState<boolean>(false);
  const [selectedEventForWaitlistUsers, setSelectedEventForWaitlistUsers] = useState<Event | null>(null);
  const [currentRounds, setCurrentRounds] = useState<Record<number, number>>({});

  const formatUTCToLocal = (utcDateString: string, includeTime: boolean = true) => {
    try {
      const date = new Date(utcDateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined,
        timeZoneName: includeTime ? 'short' : undefined,
      };

      return date.toLocaleString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatDate = (dateString: string) => {
    return formatUTCToLocal(dateString, true);
  };

  const handleSignUpClick = (eventId: number) => {
    const event = filteredEvents.find(e => e.id === eventId);
    if (!event) return;

    if (event.status === 'In Progress') {
      setErrorMessage("Registration is not available for In Progress events.");
      return;
    }

    if (event.status === 'Completed') {
      setErrorMessage("Registration is not available for Completed events.");
      return;
    }

    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        await eventsApi.registerForEvent(signUpEventId, { join_waitlist: false });

        setSignUpDialogOpen(false);
        const successfullyRegisteredEventId = signUpEventId;
        setSignUpEventId(null);

        try {
          await refreshEvents();
        } catch (refreshError: any) {
          console.error(`Registration for event ${successfullyRegisteredEventId} was successful, but failed to refresh the events list:`, refreshError);
          const backendMsg = refreshError.response?.data?.message || refreshError.response?.data?.error; // Renamed to avoid conflict
          setErrorMessage(
            `You've been registered for the event, but we couldn't update the list automatically. Error: ${backendMsg || refreshError.message}. Please try refreshing the page.`
          );
        }
      } catch (registrationError: any) {
        console.error('Failed to register for event:', registrationError);
        const backendError = registrationError.response?.data?.error;
        const backendMsg = registrationError.response?.data?.message;
        const waitlistAvailable = registrationError.response?.data?.waitlist_available === true;

        if ((backendError === "Event is currently full"
                || backendError === "Event is currently full for this gender")
              && waitlistAvailable) {
          const event = filteredEvents.find(e => e.id.toString() === signUpEventId);
          if (event) {
            setEventForWaitlist(event);
            setWaitlistReason(backendError);
            setWaitlistDialogOpen(true);
          } else {
            setErrorMessage("This event is currently full. Waitlist option available, but event details could not be found.");
          }
        } else {
          setErrorMessage(backendError || backendMsg || registrationError.message || 'An error occurred while trying to register for the event.');
        }
        setSignUpDialogOpen(false);
      }
    }
  };

  const handleJoinWaitlistConfirm = async () => {
    if (eventForWaitlist) {
      try {
        await eventsApi.registerForEvent(eventForWaitlist.id.toString(), { join_waitlist: true });
        setWaitlistDialogOpen(false);
        setEventForWaitlist(null);
        setErrorMessage(null); // Clear previous error messages
        // Show a success message (e.g., using a Snackbar or a simple alert for now)
        alert(`Successfully joined the waitlist for "${eventForWaitlist.name}"! You will be notified if a spot opens up.`);
        await refreshEvents(); // Refresh events to show waitlist status if applicable
      } catch (waitlistError: any) {
        console.error('Failed to join waitlist:', waitlistError);
        const backendError = waitlistError.response?.data?.error;
        const backendMessage = waitlistError.response?.data?.message;
        setErrorMessage(backendError || backendMessage || waitlistError.message || 'An error occurred while trying to join the waitlist.');
        setWaitlistDialogOpen(false); // Close the dialog even on error
      }
    }
  };

  const handleCancelClick = (eventId: number) => {
    const event = filteredEvents.find(e => e.id === eventId); // Use filteredEvents
    if (event && event.status === 'Completed') {
      setErrorMessage("Cannot cancel registration for completed events.");
      return;
    }
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


  const handleGlobalCheckInConfirm = async () => {
    if (!selectedEventForCheckIn) {
      setCheckInError('Please select an event');
      return;
    }

    if (!checkInPin) {
      setCheckInError('Please enter your check-in PIN');
      return;
    }

    try {
      await eventsApi.checkIn(selectedEventForCheckIn.id.toString(), checkInPin);
      setGlobalCheckInDialogOpen(false);
      setSelectedEventForCheckIn(null);
      setCheckInPin('');
      // Refresh events to update check-in status
      await refreshEvents();
    } catch (error: any) {
      // Extract error message from API response
      const errorMsg = error.response?.data?.error || error.message || 'Failed to check in to the event';
      setCheckInError(errorMsg);
    }
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const statusOrder: Record<EventStatus, number> = {
      'In Progress': 1,
      'Registration Open': 2,
      'Completed': 3,
      'Cancelled': 4
    };

    const statusCompare = statusOrder[a.status] - statusOrder[b.status];
    if (statusCompare !== 0) return statusCompare;

    if (a.starts_at < b.starts_at) return 1;
    if (a.starts_at > b.starts_at) return -1;

    return a.id - b.id;
  });

  const isPastEvent = (event: Event) => {
    if (event.status === 'Completed') return true;
    const startTime = new Date(event.starts_at).getTime();
    return Date.now() - startTime > 48 * 60 * 60 * 1000;
  };

  const isMyEvent = (event: Event) => {
    if (!user) return false;
    return isRegisteredForEvent(event.id) || Number(event.creator_id) === Number(user.id);
  };

  const baseEvents = activeView === 'my' ? sortedEvents.filter(isMyEvent) : sortedEvents;
  const visibleEvents = baseEvents.filter(event => !isPastEvent(event));
  const pastEvents = baseEvents.filter(isPastEvent);

  const renderActionButtons = (event: Event) => {
    const isUserRegistered = isRegisteredForEvent(event.id);
    const registrationStatus = event.registration?.status;
    if (isPastEvent(event)) return null;
    const openCheckInDialog = () => {
      setSelectedEventForCheckIn(event);
      setCheckInPin('');
      setCheckInError(null);
      setGlobalCheckInDialogOpen(true);
    };

    // Handle Waitlisted status first
    if (registrationStatus === 'Waitlisted') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', width: '100%' }}>
          <Chip label="Waitlisted" color="warning" size="small" sx={{ alignSelf: 'flex-start' }} />
          <Button size="small" variant="outlined" color="error" onClick={() => handleCancelClick(event.id)} startIcon={<CancelIcon />} sx={{ alignSelf: 'flex-start' }}>
            Leave Waitlist
          </Button>
        </Box>
      );
    }

    // If registered (and not waitlisted) and event is not completed or in progress
    if (isUserRegistered && registrationStatus !== 'Waitlisted' && event.status !== 'Completed' && event.status !== 'In Progress') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 1 }}>
          {registrationStatus === 'Checked In' ? (
            <Chip label="Checked In" color="success" icon={<CheckInIcon />} size="small" />
          ) : (
            <Button size="small" variant="outlined" color="primary" onClick={openCheckInDialog} startIcon={<CheckInIcon />}>
              Check In
            </Button>
          )}
          {registrationStatus !== 'Checked In' && (
            <Button size="small" variant="outlined" color="error" onClick={() => handleCancelClick(event.id)} startIcon={<CancelIcon />}>
              Cancel Registration
            </Button>
          )}
        </Box>
      );
    }

    // Standard Sign Up / Join Waitlist button logic refined
    const isUserNotRegisteredOrWaitlisted = !isUserRegistered && registrationStatus !== 'Waitlisted';

    if (event.status === 'Registration Open' && isUserNotRegisteredOrWaitlisted) {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSignUpClick(event.id)}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: {xs: 'stretch', sm: 'flex-start'} }}
        >
          Sign Up
        </Button>
      );
    }

    return null;
  };

  // Function to check if user can manage event
  const canManageEvent = (event: Event) => {
    if (!user) return false;
    return isAdmin() || (isOrganizer() && Number(event.creator_id) === Number(user.id));
  };

  const renderEventControls = (event: Event) => {
    if (!canManageEvent(event)) return null;
    const isExpanded = expandedEventControls === event.id;

    return (
      <>
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: `1px dashed ${theme.palette.divider}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={() => setExpandedEventControls(isExpanded ? null : event.id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" color="text.secondary">
              Event Controls
            </Typography>
          </Box>
          {isExpanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ListIcon />}
              onClick={() => {
                setSelectedEventForRegisteredUsers(event);
                setViewRegisteredUsersDialogOpen(true);
              }}
              fullWidth
              color="primary"
              sx={{ borderRadius: 1 }}
            >
              View Registered Users
            </Button>

            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ViewIcon />}
              onClick={() => {
                setSelectedEventForPins(event);
                setViewPinsDialogOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              View Pins
            </Button>

            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ListIcon />}
              onClick={() => {
                setSelectedEventForWaitlistUsers(event);
                setViewWaitlistDialogOpen(true);
              }}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              View Waitlist
            </Button>

            {(event.status === 'In Progress' || event.status === 'Completed') && (
              <Button
                variant="outlined"
                size="small"
                color="primary"
                startIcon={<ViewIcon />}
                onClick={() => {
                  setSelectedEventForAllSchedules(event);
                  setViewAllSchedulesDialogOpen(true);
                }}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                View All Schedules
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<StartIcon />}
              onClick={() => handleStartEventClick(event)}
              fullWidth
              disabled={event.status === 'In Progress' || event.status === 'Completed'}
              sx={{ borderRadius: 1 }}
            >
              Generate Schedules
            </Button>

            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<EndIcon />}
              onClick={() => handleEndEventClick(event)}
              fullWidth
              disabled={event.status !== 'In Progress'}
              sx={{ borderRadius: 1 }}
            >
              End
            </Button>

            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditEventDialog(event)}
                  fullWidth
                  sx={{ borderRadius: 1 }}
                >
                  Edit Event
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleOpenDeleteEventConfirm(event.id)}
                  fullWidth
                  sx={{ borderRadius: 1, whiteSpace: 'nowrap' }}
                  disabled={event.status === 'In Progress' || event.status === 'Completed'}
                >
                  Delete Event
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </>
    );
  };

  // Event status update functions
  const handleStartEventClick = (event: Event) => {
    setSelectedEventForStarting(event);
    setNumTables(10); // Default values
    setNumRounds(10);
    setIsTableConfigOpen(true); // Open the table/round config dialog first
  };

  const handleTableConfigSubmit = () => {
    setIsTableConfigOpen(false);
    setStartEventDialogOpen(true); // Now open the confirmation dialog
  };

  const handleStartEvent = async () => {
    try {
      if (!selectedEventForStarting) return;

      await eventsApi.startEvent(
        selectedEventForStarting.id.toString(),
        numTables,
        numRounds
      );
      setStartEventDialogOpen(false);
      setSelectedEventForStarting(null);
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    }
  };


  const handleEndEventClick = (event: Event) => {
    if (event.status !== 'In Progress') {
      setErrorMessage('Events can only be ended when they are in progress.');
      return;
    }

    setSelectedEventForEnding(event);
    setEndEventDialogOpen(true);
  };

  const handleEndEvent = async () => {
    try {
      if (!selectedEventForEnding) return;

      await eventsApi.updateEventStatus(selectedEventForEnding.id.toString(), 'Completed');
      setEndEventDialogOpen(false);
      setSelectedEventForEnding(null);
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to end event');
    }
  };

  const handleOpenEditEventDialog = (event: Event) => {
    setEventToEdit(event);
    setEditEventForm({
      name: event.name,
      description: event.description,
      starts_at: event.starts_at ? new Date(new Date(event.starts_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      address: event.address,
      max_capacity: event.max_capacity.toString(),
      price_per_person: event.price_per_person.toString(),
      status: event.status,
        });
    setEditEventDialogOpen(true);
  };

  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement; // Type assertion
    const name = target.name;
    const value = target.value;

    setEditEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateEvent = async () => {
    if (!eventToEdit || !editEventForm) return;

    try {
      const dataToUpdate: Partial<Event> = { ...editEventForm };
      if (dataToUpdate.max_capacity) {
        dataToUpdate.max_capacity = dataToUpdate.max_capacity.toString();
      }
      if (dataToUpdate.price_per_person) {
        dataToUpdate.price_per_person = dataToUpdate.price_per_person.toString();
      }
       if (dataToUpdate.starts_at) {
        dataToUpdate.starts_at = new Date(dataToUpdate.starts_at).toISOString();
      }

      await eventsApi.updateEvent(eventToEdit.id.toString(), dataToUpdate);
      setEditEventDialogOpen(false);
      setEventToEdit(null);
      refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to update event');
    }
  };

  const handleOpenDeleteEventConfirm = (eventId: number) => {
    setEventToDeleteId(eventId);
    setDeleteEventConfirmOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDeleteId) return;
    try {
      await eventsApi.deleteEvent(eventToDeleteId.toString());
      setDeleteEventConfirmOpen(false);
      setEventToDeleteId(null);
      refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to delete event');
    }
  };

  const pillSx = (view: EventView) => ({
    minWidth: 'auto',
    borderRadius: 999,
    px: 1.75,
    py: 0.45,
    fontSize: isMobile ? '0.8rem' : '0.875rem',
    fontWeight: 700,
    lineHeight: 1.2,
    bgcolor: activeView === view ? theme.palette.primary.main : '#303030',
    color: activeView === view ? '#000000' : theme.palette.common.white,
    '&:hover': {
      bgcolor: activeView === view ? theme.palette.primary.main : '#383838'
    }
  });

  const renderEventCard = (event: Event) => (
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
        <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 2 }, flexWrap: 'wrap', gap: 1}}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                fontSize: isMobile ? '1.1rem' : '1.5rem',
                lineHeight: 1.2
              }}
            >
              {event.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={event.status}
                sx={{
                  fontWeight: 600,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  bgcolor: '#2b2b2b',
                  color: '#f5f5f5'
                }}
              />
            </Box>
          </Box>

          {event.status !== 'In Progress' && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                  mb: { xs: 1, sm: 2 },
                  fontSize: isMobile ? '0.85rem' : '1rem'
              }}
            >
            {event.description}
          </Typography>
          </Box>
          )}

        {(event.status === 'In Progress' && (isAdmin() || event.registration)) && (
          <Box sx={{ mb: { xs: 1, sm: 3 } }}>
            <Divider sx={{ mb: { xs: 0.5, sm: 2 } }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' }, mb: { xs: 0.5, sm: 2} }}>
                Round Timer
              </Typography>
              {isAdmin() ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize:  { xs: '0.675rem', sm: '1rem' }}}>
                  Rounds: {event.num_rounds}, Tables: {event.num_tables}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize:  { xs: '0.675rem', sm: '1rem' }}}>
                  Rounds: {event.num_rounds}
                </Typography>
              )}
            </Box>
            <EventTimer
              eventId={event.id}
              isAdmin={canManageEvent(event)}
              isCheckedIn={isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In'}
              eventStatus={event.status}
              onRoundChange={(round) => {
                setCurrentRounds(prev => (
                  prev[event.id] === round ? prev : { ...prev, [event.id]: round }
                ));
              }}
            />
          </Box>
        )}

        {event.status !== 'In Progress' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            <EventIcon fontSize="small" />
            {formatDate(event.starts_at)}
          </Typography>
          {typeof event.registered_attendee_count === 'number' && event.max_capacity && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
              <PeopleIcon fontSize="small" />
              {`${event.registered_attendee_count}/${event.max_capacity} spots filled`}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            <AttachMoneyIcon fontSize="small" />
            ${parseFloat(event.price_per_person).toFixed(2)} per person
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            <LocationOnIcon fontSize="small" />
            {event.address}
          </Typography>
        </Box>
        )}

        {renderEventControls(event)}

        {isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In' && (
          <MySchedule
            event={event}
            currentRound={currentRounds[event.id]}
          />
        )}
      </CardContent>
      <CardActions sx={{ p: { xs: 1, sm: 2 }, pt: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, justifyContent: 'flex-start' }}>
        {renderActionButtons(event)}
      </CardActions>
    </Card>
  </Grid>
  );

  return (
    <>
      <Container maxWidth="lg">
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            mb: 2,
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ fontWeight: 'bold' }}>
            Events
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => setActiveView('my')} sx={pillSx('my')}>My</Button>
            <Button onClick={() => setActiveView('all')} sx={pillSx('all')}>All</Button>
            <Button onClick={() => setActiveView('create')} sx={pillSx('create')}>Create</Button>
          </Box>
        </Box>

        {activeView === 'create' && (isAdmin() || isOrganizer()) && (
          <CreateEvent
            onCreated={() => setActiveView('all')}
            onError={setErrorMessage}
          />
        )}

        {activeView === 'create' && !isAdmin() && !isOrganizer() && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6">TODO</Typography>
          </Box>
        )}

        {activeView !== 'create' && (
          <>
            <Grid container spacing={3}>
              {visibleEvents.map(renderEventCard)}
            </Grid>

            {activeView === 'my' && visibleEvents.length === 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  To sign up for an event, switch to All.
                </Typography>
              </Box>
            )}

            {(activeView !== 'my' || pastEvents.length > 0) && (
              <Box sx={{ mt: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setPastEventsOpen(prev => !prev)}
                >
                  <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 600 }}>
                    Past Events
                  </Typography>
                  {pastEventsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                <Collapse in={pastEventsOpen}>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Grid container spacing={3}>
                      {pastEvents.map(renderEventCard)}
                    </Grid>
                  </Box>
                </Collapse>
              </Box>
            )}
          </>
        )}

      <ConfirmDialog
        open={signUpDialogOpen}
        title="Sign Up for Event"
        confirmLabel="Sign Up"
        onCancel={() => setSignUpDialogOpen(false)}
        onConfirm={handleSignUpConfirm}
      >
        Are you sure you want to sign up for this event?
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel Event Registration"
        confirmLabel="Yes, Cancel Registration"
        cancelLabel="No"
        confirmColor="error"
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
      >
        Are you sure you want to cancel your registration for this event?
      </ConfirmDialog>

      {/* Global Check-in Dialog (now per-event) */}
      <Dialog open={globalCheckInDialogOpen} onClose={() => setGlobalCheckInDialogOpen(false)}>
        <DialogTitle>Event Check-In</DialogTitle>
        <DialogContent>
          {selectedEventForCheckIn && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {selectedEventForCheckIn.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDate(selectedEventForCheckIn.starts_at)}
              </Typography>
            </>
          )}
          {checkInError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checkInError}
            </Alert>
          )}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Enter the 4-digit PIN given to you by an admin
            </Typography>
            <TextField
              sx={{ mt: 0, mb: 0 }}
              label="PIN"
              type="password"
              value={checkInPin}
              onChange={(e) => setCheckInPin(e.target.value)}
              inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
              fullWidth
              margin="dense"
              disabled={!selectedEventForCheckIn}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGlobalCheckInDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGlobalCheckInConfirm}
            color="primary"
            variant="contained"
            disabled={!selectedEventForCheckIn || !checkInPin || checkInPin.length !== 4}
            startIcon={<CheckBoxIcon />}
          >
            Check In
          </Button>
        </DialogActions>
      </Dialog>

      <ViewPins
        open={viewPinsDialogOpen}
        event={selectedEventForPins}
        onClose={() => setViewPinsDialogOpen(false)}
      />

      <ViewRegisteredUsers
        open={viewRegisteredUsersDialogOpen}
        event={selectedEventForRegisteredUsers}
        onClose={() => setViewRegisteredUsersDialogOpen(false)}
      />

      {/* Generate Schedules Dialog */}
      <Dialog
        open={isTableConfigOpen}
        onClose={() => setIsTableConfigOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Generate Schedules</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please specify how many tables and rounds you want for this event.
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              label="Number of Tables"
              type="number"
              variant="outlined"
              value={numTables}
              onChange={(e) => setNumTables(e.target.value as any)}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Number of Rounds"
              type="number"
              variant="outlined"
              value={numRounds}
              onChange={(e) => setNumRounds(e.target.value as any)}
              inputProps={{ min: 1 }}
            />
          </Box>
          <DialogContentText sx={{ fontSize: '0.8rem' }}>
              Note: The Algorithm will try to use the inputted values, but it may bump these numbers down
              (e.g. 10 tables are inputted but there are only 9 males).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTableConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleTableConfigSubmit} color="primary" variant="contained">
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Event Confirmation Dialog */}
      <ConfirmDialog
        open={startEventDialogOpen}
        title="Generate Schedules"
        confirmLabel="Generate Schedules"
        confirmColor="success"
        onCancel={() => setStartEventDialogOpen(false)}
        onConfirm={handleStartEvent}
      >
        Are you sure you want to generate schedules for "{selectedEventForStarting?.name}"?
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
          This will use {numTables} tables and {numRounds} rounds.
        </Typography>
      </ConfirmDialog>


      <ConfirmDialog
        open={endEventDialogOpen}
        title="End Event"
        confirmLabel="Yes, End Event"
        confirmColor="error"
        onCancel={() => setEndEventDialogOpen(false)}
        onConfirm={handleEndEvent}
      >
        Are you sure you want to end "{selectedEventForEnding?.name}"? Attendees will no longer be able to select Yes or No and all blank entries will be treated as No.
      </ConfirmDialog>

      <ViewAllSchedules
        open={viewAllSchedulesDialogOpen}
        event={selectedEventForAllSchedules}
        onClose={() => setViewAllSchedulesDialogOpen(false)}
      />

      {/* ADD: Edit Event Dialog */}
      <Dialog open={editEventDialogOpen} onClose={() => setEditEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event: {eventToEdit?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Event Name"
                name="name"
                value={editEventForm.name || ''}
                onChange={handleEditEventFormChange}
                fullWidth
                required
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={editEventForm.description || ''}
                onChange={handleEditEventFormChange}
                fullWidth
                multiline
                rows={isMobile ? 2 : 4}
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date and Time"
                name="starts_at"
                type="datetime-local"
                value={editEventForm.starts_at || ''}
                onChange={handleEditEventFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Address"
                name="address"
                value={editEventForm.address || ''}
                onChange={handleEditEventFormChange}
                fullWidth
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField
                label="Max Capacity"
                name="max_capacity"
                type="number"
                value={editEventForm.max_capacity || ''}
                onChange={handleEditEventFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={6} sm={6}>
              <TextField
                label="Price Per Person"
                name="price_per_person"
                type="number"
                value={editEventForm.price_per_person || '0'}
                onChange={handleEditEventFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                size={isMobile ? "small" : "medium"}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"} margin="dense">
                <InputLabel id="edit-event-status-label">Status</InputLabel>
                <Select
                  labelId="edit-event-status-label"
                  name="status"
                  value={editEventForm.status || 'Registration Open'}
                  label="Status"
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                >
                  <MenuItem value="Registration Open">Registration Open</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateEvent} color="primary" variant="contained">Update Event</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteEventConfirmOpen}
        title="Delete Event"
        confirmLabel="Delete Event"
        confirmColor="error"
        onCancel={() => setDeleteEventConfirmOpen(false)}
        onConfirm={handleDeleteEvent}
      >
        Are you sure you want to delete the event: <strong>{filteredEvents.find(e => e.id === eventToDeleteId)?.name}</strong>? This action cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={waitlistDialogOpen}
        title={`Join Waitlist for "${eventForWaitlist?.name}"?`}
        confirmLabel="Yes, Join Waitlist"
        cancelLabel="No, Thanks"
        onCancel={() => {
          setWaitlistDialogOpen(false);
          setEventForWaitlist(null);
        }}
        onConfirm={handleJoinWaitlistConfirm}
      >
        {waitlistReason}. Would you like to be added to the waitlist?
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          If a spot opens up, you may be automatically registered.
        </Typography>
      </ConfirmDialog>

      <ViewWaitlistedUsers
        open={viewWaitlistDialogOpen}
        event={selectedEventForWaitlistUsers}
        onClose={() => setViewWaitlistDialogOpen(false)}
      />
    </Container>
  </>
  );
};

export default EventList;
