import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Alert,
  Snackbar,
  SnackbarCloseReason,
} from '@mui/material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus, ScheduleItem } from '../../types/event';

// Import new components
import EventHeader from './EventHeader';
import EventCard from './EventCard';
import CreateEventForm from './CreateEventForm';
import EventActionDialogs from './EventActionDialogs';
import EventManagementDialogs from './EventManagementDialogs';

// Import new hooks and utilities
import { useEventActionsHandler } from './EventActionsHandler';
import { useSpeedDateManager } from './SpeedDateManager';
import { 
  formatDate, 
  isRegistrationClosed, 
  getStatusColor, 
  sortEvents, 
  canManageEvent, 
  getMatchMessage, 
  handleCopyEmail 
} from './EventUtilities';

const EventList = () => {
  const { createEvent, refreshEvents, isRegisteredForEvent, filteredEvents } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  
  // Create event form state
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
  
  // Event management states
  const [expandedEventControls, setExpandedEventControls] = useState<number | null>(null);
  const [userSchedules, setUserSchedules] = useState<Record<number, ScheduleItem[]>>({});
  const [showNotificationSnackbar, setShowNotificationSnackbar] = useState<boolean>(false);
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

  // Speed date submission dialog states
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [eventToSubmitId, setEventToSubmitId] = useState<number | null>(null);

  // Track which events we've fetched schedules for
  const fetchedSchedulesRef = useRef<Set<number>>(new Set());

  // Use custom hooks
  const [eventActionsState, eventActionsHandlers] = useEventActionsHandler();
  const [speedDateState, speedDateActions] = useSpeedDateManager(setSubmitConfirmOpen, setEventToSubmitId);

  // Event management control handlers
  const handleViewRegisteredUsers = async (eventId: number) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId);
      if (!event) return;
      
      const response = await eventsApi.getEventAttendees(eventId.toString());
      setSelectedEventForRegisteredUsers(event);
      setRegisteredUsers(response.data);
      setViewRegisteredUsersDialogOpen(true);
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to fetch registered users');
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
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to fetch attendee pins');
    }
  };

  const handleViewWaitlist = async (event: Event) => {
    try {
      const response = await eventsApi.getEventWaitlist(event.id.toString());
      setSelectedEventForWaitlist(event);
      setWaitlistUsers(response.data);
      setViewWaitlistDialogOpen(true);
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to fetch waitlist');
    }
  };

  const handleStartEvent = async (event: Event) => {
    try {
      await eventsApi.startEvent(event.id.toString());
      await refreshEvents();
      eventActionsHandlers.setErrorMessage(null);
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to start event');
    }
  };

  const handleEndEvent = async (event: Event) => {
    try {
      await eventsApi.updateEventStatus(event.id.toString(), 'Completed');
      await refreshEvents();
      eventActionsHandlers.setErrorMessage(null);
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to end event');
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
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to fetch all schedules');
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
      eventActionsHandlers.setErrorMessage(null);
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to delete event');
      setDeleteEventDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Callback handlers for dialog operations
  const handleEditEventSuccess = async () => {
    await refreshEvents();
    setEditEventDialogOpen(false);
    setEventToEdit(null);
  };

  const handleUserDataRefresh = async (eventId: number, isWaitlist: boolean = false) => {
    try {
      if (isWaitlist) {
        const response = await eventsApi.getEventWaitlist(eventId.toString());
        setWaitlistUsers(response.data);
      } else {
        const response = await eventsApi.getEventAttendees(eventId.toString());
        setRegisteredUsers(response.data);
      }
    } catch (error: any) {
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to refresh user data');
    }
  };

  // Create event handlers
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
      eventActionsHandlers.setErrorMessage(error.message || 'Failed to create event');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrentRoundUpdate = (eventId: number, round: number) => {
    setCurrentRounds(prev => ({ ...prev, [eventId]: round }));
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
            const persistedSelections = speedDateActions.getPersistedSelections(event.id);
            Object.entries(persistedSelections).forEach(([speedDateId, interested]) => {
              speedDateActions.handleAttendeeSelectionChange(Number(speedDateId), event.id, interested as boolean);
            });
          } catch (error) {
            console.error('Error fetching user schedule for event', event.id, ':', error);
          }
        }
      }
    };

    fetchSchedulesForActiveEvents();
  }, [filteredEvents, user, isRegisteredForEvent, speedDateActions]);

  const sortedEvents = sortEvents(filteredEvents);

  return (
    <>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 14 }}>
        {eventActionsState.errorMessage && (
          <Alert severity="error" onClose={() => eventActionsHandlers.setErrorMessage(null)} sx={{ mb: 2 }}>
            {eventActionsState.errorMessage}
          </Alert>
        )}

        <EventHeader
          isAdmin={isAdmin()}
          isOrganizer={isOrganizer()}
          showCreateCard={showCreateCard}
          onToggleCreateCard={handleToggleCreateCard}
        />

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
                canManageEvent={canManageEvent(event, isAdmin, isOrganizer, user?.id)}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                isRegistrationClosed={isRegistrationClosed}
                
                // Action handlers
                onSignUpClick={(eventId) => eventActionsHandlers.handleSignUpClick(eventId, filteredEvents, isRegistrationClosed)}
                onCancelClick={eventActionsHandlers.handleCancelClick}
                onCheckInClick={eventActionsHandlers.handleCheckInClick}
                
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
                expandedUserSchedules={speedDateState.expandedUserSchedules}
                onToggleUserSchedule={speedDateActions.toggleUserScheduleInline}
                currentRounds={currentRounds}
                onCurrentRoundUpdate={handleCurrentRoundUpdate}
                attendeeSpeedDateSelections={speedDateState.attendeeSpeedDateSelections}
                onAttendeeSelectionChange={speedDateActions.handleAttendeeSelectionChange}
                onSaveAttendeeSelections={(eventId) => speedDateActions.handleSaveAttendeeSelections(eventId, filteredEvents, userSchedules)}
                submittedEventIds={speedDateState.submittedEventIds}
                attendeeSelectionError={speedDateState.attendeeSelectionError}
                selectionWindowClosedError={speedDateState.selectionWindowClosedError}
                saveIndicator={speedDateState.saveIndicator}
                isSaveDisabled={speedDateActions.isSaveDisabled}
                onSubmitClick={speedDateActions.handleSubmitClick}
                onCopyEmail={handleCopyEmail}
                getMatchMessage={(isMatch) => getMatchMessage(isMatch, user?.gender)}
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

        <EventActionDialogs
          signUpDialogOpen={eventActionsState.signUpDialogOpen}
          onSignUpDialogClose={() => eventActionsHandlers.setSignUpDialogOpen(false)}
          onSignUpConfirm={() => eventActionsHandlers.handleSignUpConfirm(refreshEvents)}
          cancelDialogOpen={eventActionsState.cancelDialogOpen}
          onCancelDialogClose={() => eventActionsHandlers.setCancelDialogOpen(false)}
          onCancelConfirm={() => eventActionsHandlers.handleCancelConfirm(refreshEvents)}
          globalCheckInDialogOpen={eventActionsState.globalCheckInDialogOpen}
          selectedEventForCheckIn={eventActionsState.selectedEventForCheckIn}
          checkInPin={eventActionsState.checkInPin}
          checkInError={eventActionsState.checkInError}
          onCheckInDialogClose={() => eventActionsHandlers.setGlobalCheckInDialogOpen(false)}
          onCheckInPinChange={eventActionsHandlers.setCheckInPin}
          onCheckInConfirm={() => eventActionsHandlers.handleGlobalCheckInConfirm(refreshEvents)}
          formatDate={formatDate}
          waitlistDialogOpen={eventActionsState.waitlistDialogOpen}
          eventForWaitlist={eventActionsState.eventForWaitlist}
          waitlistReason={eventActionsState.waitlistReason}
          onWaitlistDialogClose={() => {
            eventActionsHandlers.setWaitlistDialogOpen(false);
            eventActionsHandlers.setEventForWaitlist(null);
          }}
          onJoinWaitlistConfirm={() => eventActionsHandlers.handleJoinWaitlistConfirm(refreshEvents)}
          submitConfirmOpen={submitConfirmOpen}
          onSubmitDialogClose={() => setSubmitConfirmOpen(false)}
          onSubmitConfirm={() => speedDateActions.handleSubmitConfirm(eventToSubmitId)}
        />

        <EventManagementDialogs
          viewRegisteredUsersDialogOpen={viewRegisteredUsersDialogOpen}
          selectedEventForRegisteredUsers={selectedEventForRegisteredUsers}
          registeredUsers={registeredUsers}
          onViewRegisteredUsersDialogClose={() => setViewRegisteredUsersDialogOpen(false)}
          viewPinsDialogOpen={viewPinsDialogOpen}
          selectedEventForPins={selectedEventForPins}
          attendeePins={attendeePins}
          onViewPinsDialogClose={() => setViewPinsDialogOpen(false)}
          viewWaitlistDialogOpen={viewWaitlistDialogOpen}
          selectedEventForWaitlist={selectedEventForWaitlist}
          waitlistUsers={waitlistUsers}
          onViewWaitlistDialogClose={() => setViewWaitlistDialogOpen(false)}
          viewAllSchedulesDialogOpen={viewAllSchedulesDialogOpen}
          selectedEventForAllSchedules={selectedEventForAllSchedules}
          allSchedules={allSchedules}
          onViewAllSchedulesDialogClose={() => setViewAllSchedulesDialogOpen(false)}
          editEventDialogOpen={editEventDialogOpen}
          eventToEdit={eventToEdit}
          onEditEventDialogClose={() => setEditEventDialogOpen(false)}
          onEditEventSuccess={handleEditEventSuccess}
          deleteEventDialogOpen={deleteEventDialogOpen}
          eventToDelete={eventToDelete}
          onDeleteEventDialogClose={() => setDeleteEventDialogOpen(false)}
          onDeleteEventConfirm={handleDeleteEventConfirm}
          onUserDataRefresh={handleUserDataRefresh}
        />

        <Snackbar
          open={showNotificationSnackbar}
          onClose={(_, reason?: SnackbarCloseReason) => {
            if (reason === 'clickaway') return;
            setShowNotificationSnackbar(false);
          }}
          message="Notifications enabled!"
          autoHideDuration={3000}
        />
    </Container>
  </>
  );
};

export default EventList; 