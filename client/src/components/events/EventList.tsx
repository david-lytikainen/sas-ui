import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  SnackbarCloseReason,
} from '@mui/material';
import {
  Event as EventIcon,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus, ScheduleItem } from '../../types/event';
import EventCard from './EventCard';
import CreateEventForm from './CreateEventForm';

const EventList = () => {
  const { createEvent, refreshEvents, isRegisteredForEvent, filteredEvents } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Form and dialog states
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
  
  // Check-in states
  const [globalCheckInDialogOpen, setGlobalCheckInDialogOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<Event | null>(null);
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  
  // Event management states
  const [expandedEventControls, setExpandedEventControls] = useState<number | null>(null);
  const [userSchedules, setUserSchedules] = useState<Record<number, ScheduleItem[]>>({});
  const [showNotificationSnackbar, setShowNotificationSnackbar] = useState<boolean>(false);

  // Speed date selection states
  const [expandedUserSchedules, setExpandedUserSchedules] = useState<Record<number, boolean>>({});
  const [attendeeSpeedDateSelections, setAttendeeSpeedDateSelections] = useState<Record<number, { eventId: number, interested: boolean }>>({});
  const [attendeeSelectionError, setAttendeeSelectionError] = useState<Record<number, string | null>>({});
  const [submittedEventIds, setSubmittedEventIds] = useState<Set<number>>(new Set());
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [eventToSubmitId, setEventToSubmitId] = useState<number | null>(null);
  const [selectionWindowClosedError, setSelectionWindowClosedError] = useState<Record<number, boolean>>({});

  // Table and round configuration
  const [savedAttendeeSelections, setSavedAttendeeSelections] = useState<Record<number, Record<number, boolean>>>({});
  const [saveIndicator, setSaveIndicator] = useState<Record<number, boolean>>({});

  // Waitlist states
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [eventForWaitlist, setEventForWaitlist] = useState<Event | null>(null);
  const [waitlistReason, setWaitlistReason] = useState<string>('');

  // Current round tracking for timer display
  const [currentRounds, setCurrentRounds] = useState<Record<number, number>>({});

  // Event management dialog states
  const [viewRegisteredUsersDialogOpen, setViewRegisteredUsersDialogOpen] = useState(false);
  const [selectedEventForRegisteredUsers, setSelectedEventForRegisteredUsers] = useState<Event | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [viewPinsDialogOpen, setViewPinsDialogOpen] = useState(false);
  const [selectedEventForPins, setSelectedEventForPins] = useState<Event | null>(null);
  const [attendeePins, setAttendeePins] = useState<any[]>([]);
  const [viewWaitlistDialogOpen, setViewWaitlistDialogOpen] = useState(false);
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState<Event | null>(null);
  const [waitlistUsers, setWaitlistUsers] = useState<any[]>([]);
  const [viewAllSchedulesDialogOpen, setViewAllSchedulesDialogOpen] = useState(false);
  const [selectedEventForAllSchedules, setSelectedEventForAllSchedules] = useState<Event | null>(null);
  const [allSchedules, setAllSchedules] = useState<Record<number, any[]>>({});
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // Track which events we've fetched schedules for
  const fetchedSchedulesRef = useRef<Set<number>>(new Set());

  // Helper functions for localStorage
  const getPersistedSelections = (eventId: number): Record<number, boolean> => {
    const selections = localStorage.getItem(`attendeeSelections_${eventId}`);
    return selections ? JSON.parse(selections) : {};
  };

  const persistSelection = (eventId: number, eventSpeedDateId: number, interested: boolean) => {
    const selections = getPersistedSelections(eventId);
    selections[eventSpeedDateId] = interested;
    localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
  };
  
  const persistAllSelectionsForEvent = (eventId: number, selections: Record<number, boolean>) => {
    localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleString('en-US', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isRegistrationClosed = (event: Event) => {
    if (event.status === 'Cancelled' || event.status === 'Completed') {
      return true;
    }
    
    if (typeof event.registered_attendee_count === 'number' && event.max_capacity) {
      return event.registered_attendee_count >= parseInt(event.max_capacity);
    }
    
    return false;
  };

  // Event handlers
  const handleSignUpClick = (eventId: number) => {
    const event = filteredEvents.find(e => e.id === eventId);
    if (!event) return;
    
    if (isRegistrationClosed(event)) {
      if (typeof event.registered_attendee_count === 'number' && event.max_capacity && 
          event.registered_attendee_count >= parseInt(event.max_capacity)) {
        setEventForWaitlist(event);
        setWaitlistReason('This event is at full capacity');
        setWaitlistDialogOpen(true);
      } else {
        setErrorMessage('Registration is no longer available for this event.');
      }
      return;
    }
    
    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (!signUpEventId) return;
        
    try {
      await eventsApi.registerForEvent(signUpEventId);
      await refreshEvents();
        setSignUpDialogOpen(false);
        setSignUpEventId(null);
    } catch (error: any) {
      console.error('Error signing up for event:', error);
      
      if (error.response?.status === 409) {
        const event = filteredEvents.find(e => e.id === parseInt(signUpEventId));
          if (event) {
            setEventForWaitlist(event);
          setWaitlistReason(error.response?.data?.message || 'Event is at capacity');
            setWaitlistDialogOpen(true); 
          }
        } else {
        setErrorMessage(error.response?.data?.message || error.message || 'Failed to sign up for event');
        }
      
        setSignUpDialogOpen(false); 
      setSignUpEventId(null);
    }
  };

  const handleJoinWaitlistConfirm = async () => {
    if (!eventForWaitlist) return;

      try {
        await eventsApi.registerForEvent(eventForWaitlist.id.toString(), { join_waitlist: true });
      await refreshEvents();
        setWaitlistDialogOpen(false);
        setEventForWaitlist(null);
    } catch (error: any) {
      console.error('Error joining waitlist:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to join waitlist');
      setWaitlistDialogOpen(false);
      setEventForWaitlist(null);
    }
  };

  const handleCancelClick = (eventId: number) => {
    setCancelEventId(eventId.toString());
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelEventId) return;

      try {
        await eventsApi.cancelRegistration(cancelEventId);
      await refreshEvents();
        setCancelDialogOpen(false);
        setCancelEventId(null);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to cancel registration');
    }
  };
  
  const handleGlobalCheckInConfirm = async () => {
    if (!selectedEventForCheckIn || !checkInPin) return;
    
    try {
      await eventsApi.checkIn(selectedEventForCheckIn.id.toString(), checkInPin);
      await refreshEvents();
      setGlobalCheckInDialogOpen(false);
      setSelectedEventForCheckIn(null);
      setCheckInPin('');
      setCheckInError(null);
    } catch (error: any) {
      setCheckInError(error.response?.data?.message || error.message || 'Invalid PIN or check-in failed');
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

  // Sort events like a SQL database would
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

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        name: createForm.name || 'Unnamed Event',
        description: createForm.description || '',
        starts_at: createForm.starts_at, 
        address: createForm.address || '',
        max_capacity: createForm.max_capacity || '10',
        price_per_person: createForm.price_per_person || '0',
        status: 'Registration Open' as EventStatus,
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

  const handleToggleCreateCard = () => {
    setShowCreateCard(!showCreateCard);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value) {
      const dateObj = new Date(value);
      const year = dateObj.getFullYear();
      
      if (year > 9999 || year < 1000 || isNaN(year)) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        const formattedDate = localDate.toISOString().slice(0, 16);
        
        setCreateForm(f => ({ ...f, starts_at: formattedDate }));
        return;
      }
    }
    
    setCreateForm(f => ({ ...f, starts_at: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^[0-9]*\.?[0-9]*$/;
    
    if (value === '' || regex.test(value)) {
      setCreateForm(f => ({ ...f, price_per_person: value }));
    }
  };

  const toggleUserScheduleInline = (eventId: number) => {
    setExpandedUserSchedules(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  };

  const handleAttendeeSelectionChange = (eventSpeedDateId: number, eventId: number, interested: boolean) => {
    setAttendeeSpeedDateSelections(prev => ({
      ...prev,
      [eventSpeedDateId]: { eventId, interested }
    }));
    persistSelection(eventId, eventSpeedDateId, interested);
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  };

  const getCurrentPicksForEvent = (eventId: number) => {
    return Object.entries(attendeeSpeedDateSelections)
      .filter(([_, sel]) => sel.eventId === eventId)
      .reduce((acc, [id, sel]) => {
        acc[Number(id)] = sel.interested;
        return acc;
      }, {} as Record<number, boolean>);
  };

  const isSaveDisabled = (eventId: number) => {
    const current = getCurrentPicksForEvent(eventId);
    const saved = savedAttendeeSelections[eventId] || {};
    const allIds = new Set([...Object.keys(current), ...Object.keys(saved)]);
    for (const id of Array.from(allIds)) {
      if (current[Number(id)] !== saved[Number(id)]) return false;
    }
    return true;
  };

  const handleSaveAttendeeSelections = async (eventId: number): Promise<boolean> => {
    const event = filteredEvents.find(e => e.id === eventId);
    if (!event) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'Event details not found. Cannot save selections.' }));
      return false;
    }

    const currentPicks = getCurrentPicksForEvent(eventId);
    setSavedAttendeeSelections(prev => ({ ...prev, [eventId]: { ...currentPicks } }));
    persistAllSelectionsForEvent(eventId, currentPicks);

    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
    const schedule = userSchedules[eventId] || [];
    
    const selectionsToSubmit = schedule.map(item => ({
      event_speed_date_id: item.event_speed_date_id,
      interested: currentPicks[item.event_speed_date_id] === true
    }));

    if (schedule.length === 0) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'No schedule found to save selections for this event.' }));
      return false;
    }
    setSaveIndicator(prev => ({ ...prev, [eventId]: true }));

    if (event.status !== 'Completed') {
      try {
        await eventsApi.submitSpeedDateSelections(eventId.toString(), selectionsToSubmit);
        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
        setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: false }));
        return true;
      } catch (error: any) {
        const specificErrorMessage = 'Speed date selections window closed 24 hours after event completion.';
        const backendErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        
        if (backendErrorMessage === specificErrorMessage) {
          setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: true }));
          setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null })); 
        } else {
          setAttendeeSelectionError(prev => ({
            ...prev,
            [eventId]: backendErrorMessage || 'Failed to save your selections.'
          }));
          setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: false }));
        }

        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
        return false;
      }
    } else {
      setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
      return true;
    }
  };

  const handleSubmitClick = (eventId: number) => {
    setEventToSubmitId(eventId);
    setSubmitConfirmOpen(true);
  };

  const handleSubmitConfirm = async () => {
    if (eventToSubmitId === null) return;

    try {
      await eventsApi.submitSpeedDateSelections(eventToSubmitId.toString(), []);
      setSubmittedEventIds(prev => new Set(Array.from(prev).concat([eventToSubmitId])));
      setSubmitConfirmOpen(false);
      setEventToSubmitId(null);
    } catch (error: any) {
      setAttendeeSelectionError(prev => ({
      ...prev,
        [eventToSubmitId]: error.response?.data?.message || error.message || 'Failed to submit selections'
      }));
      setSubmitConfirmOpen(false);
      setEventToSubmitId(null);
    }
  };

  const canManageEvent = (event: Event) => {
    return isAdmin() || (isOrganizer() && event.creator_id === Number(user?.id));
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const getMatchMessage = (isMatch: boolean) => {
    if (isMatch) {
      return 'Match! 🎉';
    }
    
    const messages = {
      Male: [
        'Not a match, head up king 👑',
        'Not a match, stay royal 👑',
        'Not a match, you shining tho 👑',
        'Not a match, no problem 👑',
        'Not a match, still that guy 👑',
        'Not a match, you still the prize 👑',
        'Not a match, but your vibe is elite 👑'
      ],
      Female: [
        'Not a match, head up queen 👸',
        'Not a match, stay royal 👸',
        'Not a match, you shining tho 👸',
        'Not a match, no problem 👸',
        'Not a match, stay glowing 👸',
        'Not a match, royalty never settles 👸',
        'Not a match, but your worth is not up for debate 👸'
      ]
    };
    
    const genderMessages = messages[user?.gender as 'Male' | 'Female'];
    return genderMessages ? genderMessages[Math.floor(Math.random() * genderMessages.length)] : 'Not a match';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrentRoundUpdate = (eventId: number, round: number) => {
    setCurrentRounds(prev => ({ ...prev, [eventId]: round }));
  };

  // Event control handlers
  const handleViewRegisteredUsers = async (eventId: number) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const response = await eventsApi.getEventAttendees(eventId.toString());
      setSelectedEventForRegisteredUsers(event);
      setRegisteredUsers(response.data);
      setViewRegisteredUsersDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to fetch registered users');
    }
  };
  
  const handleViewPins = async (eventId: number) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const response = await eventsApi.getEventAttendeePins(eventId.toString());
      setSelectedEventForPins(event);
      setAttendeePins(response.data);
      setViewPinsDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to fetch attendee pins');
    }
  };

  const handleViewWaitlist = async (event: Event) => {
    try {
      const response = await eventsApi.getEventWaitlist(event.id.toString());
      setSelectedEventForWaitlist(event);
      setWaitlistUsers(response.data);
      setViewWaitlistDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to fetch waitlist');
    }
  };

  const handleStartEvent = async (event: Event) => {
    try {
      await eventsApi.startEvent(event.id.toString());
      await refreshEvents();
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    }
  };

  const handleEndEvent = async (event: Event) => {
    try {
      await eventsApi.updateEventStatus(event.id.toString(), 'Completed');
      await refreshEvents();
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to end event');
    }
  };

  const handleViewAllSchedules = async (eventId: number) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const response = await eventsApi.getAllSchedules(eventId.toString());
      setSelectedEventForAllSchedules(event);
      setAllSchedules(response.schedules);
      setViewAllSchedulesDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to fetch all schedules');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setEditEventDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    setEventToDelete(eventId);
    setDeleteEventDialogOpen(true);
  };

  const handleDeleteEventConfirm = async () => {
    if (!eventToDelete) return;
    
    try {
      await eventsApi.deleteEvent(eventToDelete.toString());
      await refreshEvents();
      setDeleteEventDialogOpen(false);
      setEventToDelete(null);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete event');
      setDeleteEventDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Fetch user schedules for events in progress
  useEffect(() => {
    const fetchSchedulesForActiveEvents = async () => {
      if (!user) return;

      const activeEvents = filteredEvents.filter(event => 
        (event.status === 'In Progress' || event.status === 'Completed') && 
        isRegisteredForEvent(event.id) && 
        event.registration?.status === 'Checked In'
      );

      for (const event of activeEvents) {
        if (!fetchedSchedulesRef.current.has(event.id)) {
          fetchedSchedulesRef.current.add(event.id);
          
          try {
              const response = await eventsApi.getSchedule(event.id.toString());
            setUserSchedules(prev => ({
              ...prev,
              [event.id]: response.schedule || []
            }));

            // Load persisted selections for this event
            const persistedSelections = getPersistedSelections(event.id);
            Object.entries(persistedSelections).forEach(([speedDateId, interested]) => {
              setAttendeeSpeedDateSelections(prev => ({
      ...prev,
                [Number(speedDateId)]: { eventId: event.id, interested }
              }));
            });

            // Check if user has already submitted for completed events
            if (event.status === 'Completed') {
              try {
                // Note: checkSubmissionStatus doesn't exist in API, so we'll skip this check
                // const submissionResponse = await eventsApi.checkSubmissionStatus(event.id.toString());
                // if (submissionResponse.data?.submitted) {
                //   setSubmittedEventIds(prev => new Set(Array.from(prev).concat([event.id])));
                // }
              } catch (submissionError) {
                console.warn('Could not check submission status for event', event.id);
              }
            }
    } catch (error) {
            console.error('Error fetching user schedule for event', event.id, ':', error);
          }
        }
      }
    };

    fetchSchedulesForActiveEvents();
  }, [filteredEvents, user, isRegisteredForEvent]);

  return (
    <>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 14 }}>
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'flex-start', sm: 'space-between' },
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'row', sm: 'row' } 
          }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ fontWeight: 'bold', mr: 1 }}>
            Events
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: { xs: 2, sm: 0 } }}>
            {(isAdmin() || isOrganizer()) && !showCreateCard && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleToggleCreateCard}
                startIcon={<EventIcon />}
                sx={{
                  minWidth: { xs: 'auto', sm: 'inherit' }, 
                  p: { xs: '6px 10px', sm: '6px 16px' }, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                  Create Event
              </Button>
            )}
          </Box>
        </Box>

        <CreateEventForm
          showCreateCard={showCreateCard && (isAdmin() || isOrganizer())}
          createForm={createForm}
          onToggleCreateCard={handleToggleCreateCard}
          onCreateEvent={handleCreateEvent}
          onFormChange={handleChange}
          onDateChange={handleDateChange}
          onPriceChange={handlePriceChange}
          onStatusChange={(status) => setCreateForm(prev => ({ ...prev, status }))}
        />
        
        <Grid container spacing={3}>
          {sortedEvents.map(event => (
            <Grid item xs={12} key={event.id}>
              <EventCard
                event={event}
                isRegisteredForEvent={isRegisteredForEvent}
                canManageEvent={canManageEvent(event)}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                isRegistrationClosed={isRegistrationClosed}
                
                // Action handlers
                onSignUpClick={handleSignUpClick}
                onCancelClick={handleCancelClick}
                onCheckInClick={(event) => {
                                setSelectedEventForCheckIn(event);
                                setCheckInPin('');
                                setCheckInError(null);
                                setGlobalCheckInDialogOpen(true);
                              }}
                
                // Event controls handlers
                expandedEventControls={expandedEventControls}
                setExpandedEventControls={setExpandedEventControls}
                onViewRegisteredUsers={handleViewRegisteredUsers}
                onViewPins={handleViewPins}
                onViewWaitlist={handleViewWaitlist}
                onStartEvent={handleStartEvent}
                onEndEvent={handleEndEvent}
                onViewAllSchedules={handleViewAllSchedules}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
                
                // User schedule props
                userSchedule={userSchedules[event.id]}
                expandedUserSchedules={expandedUserSchedules}
                onToggleUserSchedule={toggleUserScheduleInline}
                currentRounds={currentRounds}
                onCurrentRoundUpdate={handleCurrentRoundUpdate}
                attendeeSpeedDateSelections={attendeeSpeedDateSelections}
                onAttendeeSelectionChange={handleAttendeeSelectionChange}
                onSaveAttendeeSelections={handleSaveAttendeeSelections}
                submittedEventIds={submittedEventIds}
                attendeeSelectionError={attendeeSelectionError}
                selectionWindowClosedError={selectionWindowClosedError}
                saveIndicator={saveIndicator}
                isSaveDisabled={isSaveDisabled}
                onSubmitClick={handleSubmitClick}
                onCopyEmail={handleCopyEmail}
                getMatchMessage={getMatchMessage}
                user={user}
              />
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

        {/* Sign Up Dialog */}
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

        {/* Cancel Registration Dialog */}
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

        {/* Global Check-in Dialog */}
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
      
      {/* Waitlist Confirmation Dialog */}
      <Dialog 
        open={waitlistDialogOpen}
        onClose={() => {
          setWaitlistDialogOpen(false);
          setEventForWaitlist(null);
        }}
      >
        <DialogTitle>Join Waitlist for "{eventForWaitlist?.name}"?</DialogTitle>
        <DialogContent>
            <Typography>
            {waitlistReason}. Would you like to be added to the waitlist?
              </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            If a spot opens up, you may be automatically registered.
                        </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWaitlistDialogOpen(false);
            setEventForWaitlist(null);
          }}>No, Thanks</Button>
          <Button onClick={handleJoinWaitlistConfirm} color="primary" variant="contained">
            Yes, Join Waitlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Selections Confirmation Dialog */}
      <Dialog
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
      >
        <DialogTitle>Submit Final Selections?</DialogTitle>
        <DialogContent>
            <Typography>
            Once you submit, you will not be able to change your selections. Are you sure?
                        </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitConfirm} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
        <Snackbar
          open={showNotificationSnackbar}
          onClose={(_, reason?: SnackbarCloseReason) => {
            if (reason === 'clickaway') return;
            setShowNotificationSnackbar(false);
          }}
          message="Notifications enabled!"
          autoHideDuration={3000}
        />

        {/* Event Management Dialogs */}
        
        {/* View Registered Users Dialog */}
      <Dialog 
        open={viewRegisteredUsersDialogOpen} 
        onClose={() => setViewRegisteredUsersDialogOpen(false)}
          maxWidth="md"
        fullWidth
      >
        <DialogTitle>
            Registered Users - {selectedEventForRegisteredUsers?.name}
        </DialogTitle>
          <DialogContent>
          {registeredUsers.length > 0 ? (
              <Box>
                {registeredUsers.map((user) => (
                  <Box key={user.id} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email} | Status: {user.status} | PIN: {user.pin}
                    </Typography>
                      </Box>
                ))}
              </Box>
            ) : (
              <Typography>No registered users found.</Typography>
          )}
        </DialogContent>
          <DialogActions>
          <Button onClick={() => setViewRegisteredUsersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
        {/* View Pins Dialog */}
      <Dialog 
          open={viewPinsDialogOpen}
          onClose={() => setViewPinsDialogOpen(false)}
          maxWidth="sm"
        fullWidth
      >
          <DialogTitle>
            Attendee PINs - {selectedEventForPins?.name}
          </DialogTitle>
        <DialogContent>
            {attendeePins.length > 0 ? (
              <Box>
                {attendeePins.map((attendee, index) => (
                  <Box key={index} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle2">{attendee.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      PIN: {attendee.pin} | Status: {attendee.status}
                    </Typography>
          </Box>
                ))}
              </Box>
            ) : (
              <Typography>No attendee pins found.</Typography>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setViewPinsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

        {/* View Waitlist Dialog */}
      <Dialog
          open={viewWaitlistDialogOpen}
          onClose={() => setViewWaitlistDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Waitlist - {selectedEventForWaitlist?.name}
          </DialogTitle>
        <DialogContent>
            {waitlistUsers.length > 0 ? (
              <Box>
                {waitlistUsers.map((user, index) => (
                  <Box key={index} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle2">{user.name || user.email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Waitlisted: {user.waitlisted_at ? new Date(user.waitlisted_at).toLocaleDateString() : 'Unknown'}
          </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography>No users on waitlist.</Typography>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setViewWaitlistDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
        {/* View All Schedules Dialog */}
      <Dialog
        open={viewAllSchedulesDialogOpen}
        onClose={() => setViewAllSchedulesDialogOpen(false)}
          maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
            All Schedules - {selectedEventForAllSchedules?.name}
        </DialogTitle>
          <DialogContent>
            {Object.keys(allSchedules).length > 0 ? (
              <Box>
                {Object.entries(allSchedules).map(([userId, schedule]) => (
                  <Box key={userId} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>User ID: {userId}</Typography>
                    {Array.isArray(schedule) && schedule.map((item, index) => (
                      <Typography key={index} variant="body2">
                        Round {item.round}: Table {item.table} with {item.partner_name}
              </Typography>
                    ))}
                        </Box>
                ))}
                        </Box>
            ) : (
              <Typography>No schedules found.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAllSchedulesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
        {/* Edit Event Dialog */}
        <Dialog
          open={editEventDialogOpen}
          onClose={() => setEditEventDialogOpen(false)}
          maxWidth="sm"
                fullWidth
        >
          <DialogTitle>Edit Event</DialogTitle>
          <DialogContent>
            <Typography>Edit event functionality not yet implemented.</Typography>
            <Typography variant="body2" color="text.secondary">
              Event: {eventToEdit?.name}
            </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEventDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="primary" disabled>
              Save Changes
            </Button>
        </DialogActions>
      </Dialog>

        {/* Delete Event Confirmation Dialog */}
      <Dialog
          open={deleteEventDialogOpen}
          onClose={() => setDeleteEventDialogOpen(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
            <Typography>
              Are you sure you want to delete this event? This action cannot be undone.
              </Typography>
            {eventToDelete && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Event ID: {eventToDelete}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteEventDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteEventConfirm} color="error" variant="contained">
              Delete Event
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  </>
  );
};

export default EventList;