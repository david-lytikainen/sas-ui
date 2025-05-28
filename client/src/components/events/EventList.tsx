import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  useMediaQuery,
  useTheme,
  TextField,
  Paper,
  Link as MuiLink,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  DialogContentText,
  Divider,
  Snackbar,
  SnackbarCloseReason,
  Tooltip,
} from '@mui/material';
import {
  Event as EventIcon,
  HowToReg as SignUpIcon, 
  Cancel as CancelIcon, 
  Person as PersonIcon, 
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckInIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  List as ListIcon,
  PlayArrow as StartIcon,
  Stop as EndIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelEditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus, ScheduleItem } from '../../types/event';
import EventTimer from './EventTimer';
import MatchesDialog from './MatchesDialog';


interface Match {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
}

const EventList = () => {
  const { events: contextEvents, createEvent, refreshEvents, isRegisteredForEvent, userRegisteredEvents, filteredEvents } = useEvents(); // Destructure filteredEvents
  const { user, isAdmin, isOrganizer } = useAuth();
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
  
  const [globalCheckInDialogOpen, setGlobalCheckInDialogOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<Event | null>(null);
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Expanded event controls state
  const [expandedEventControls, setExpandedEventControls] = useState<number | null>(null);
  
 
  const [viewPinsDialogOpen, setViewPinsDialogOpen] = useState(false);
  const [selectedEventForPins, setSelectedEventForPins] = useState<Event | null>(null);
  const [attendeePins, setAttendeePins] = useState<{name: string, email: string, pin: string}[]>([]);

  const [viewRegisteredUsersDialogOpen, setViewRegisteredUsersDialogOpen] = useState(false);
  const [selectedEventForRegisteredUsers, setSelectedEventForRegisteredUsers] = useState<Event | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{
    id: number,
    name: string,
    email: string,
    first_name: string,
    last_name: string,
    birthday: string | null,
    age: number,
    gender: string | null,
    phone: string,
    registration_date: string | null,
    check_in_date: string | null,
    status: string,
    pin: string
  }[]>([]);

  const [endEventDialogOpen, setEndEventDialogOpen] = useState(false);
  const [selectedEventForEnding, setSelectedEventForEnding] = useState<Event | null>(null);

  const [startEventDialogOpen, setStartEventDialogOpen] = useState(false);
  const [selectedEventForStarting, setSelectedEventForStarting] = useState<Event | null>(null);


  // Add new state variables for editing
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);


  // Add new state variables for all schedules functionality
  const [viewAllSchedulesDialogOpen, setViewAllSchedulesDialogOpen] = useState(false);
  const [selectedEventForAllSchedules, setSelectedEventForAllSchedules] = useState<Event | null>(null);
  const [allSchedules, setAllSchedules] = useState<Record<number, any[]>>({});
  const [loadingAllSchedules, setLoadingAllSchedules] = useState(false);

  // Define a mapping of user IDs to user objects to be used for displaying schedules
  const [usersMap, setUsersMap] = useState<Record<number, {id: number, first_name: string, last_name: string}>>({});

  // Add new state variables for sorting and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'ascending' | 'descending'} | null>(null);
  const [filteredSchedules, setFilteredSchedules] = useState<Record<number, any[]>>({});

  // Add a new state variable for pin search
  const [pinSearchTerm, setPinSearchTerm] = useState('');
  const [filteredPins, setFilteredPins] = useState<{name: string, email: string, pin: string}[]>([]);

  // State to hold fetched user schedules keyed by eventId
  const [userSchedules, setUserSchedules] = useState<Record<number, ScheduleItem[]>>({});

  // ADD State for notification permission
  const [showNotificationSnackbar, setShowNotificationSnackbar] = useState<boolean>(false);

  // ADD State for speed date selections (organizer/admin making selections on behalf of users)
  const [speedDateSelections, setSpeedDateSelections] = useState<Record<number, boolean>>({});
  const [selectionErrorMessage, setSelectionErrorMessage] = useState<string | null>(null);

  // ADD State for expanding user's own schedule inline
  const [expandedUserSchedules, setExpandedUserSchedules] = useState<Record<number, boolean>>({});

  // ADD State for attendee's own speed date selections
  const [attendeeSpeedDateSelections, setAttendeeSpeedDateSelections] = useState<Record<number, { eventId: number, interested: boolean }>>({});
  const [attendeeSelectionError, setAttendeeSelectionError] = useState<Record<number, string | null>>({});
  // ADD State to track successful submissions by the attendee
  // const [submittedEventIds, setSubmittedEventIds] = useState<Set<number>>(new Set());
  // ADD State to track if the selection window is confirmed closed for an event
  const [selectionWindowClosedError, setSelectionWindowClosedError] = useState<Record<number, boolean>>({});

  const [viewMatchesDialogOpen, setViewMatchesDialogOpen] = useState<boolean>(false);
  const [selectedEventIdForMatches, setSelectedEventIdForMatches] = useState<string | null>(null);
  // Assuming Match interface is imported or defined above this component
  const [currentMatches, setCurrentMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // Add state for tables and rounds input
  const [numTables, setNumTables] = useState<number>(10);
  const [numRounds, setNumRounds] = useState<number>(10);
  const [isTableConfigOpen, setIsTableConfigOpen] = useState<boolean>(false);
  const [savedAttendeeSelections, setSavedAttendeeSelections] = useState<Record<number, Record<number, boolean>>>({}); // eventId -> { event_speed_date_id: interested }
  const [saveIndicator, setSaveIndicator] = useState<Record<number, boolean>>({}); // eventId -> true if just saved

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

  // Add state for the waitlist confirmation dialog
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [eventForWaitlist, setEventForWaitlist] = useState<Event | null>(null);

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

  // Update the formatDate function
  const formatDate = (dateString: string) => {
    return formatUTCToLocal(dateString, true);
  };

  const fetchMatchesForEvent = async (eventId: string) => {
    setMatchesLoading(true);
    setMatchesError(null);
    setCurrentMatches([]);
    try {
      const response = await eventsApi.getMyMatches(eventId);
      setCurrentMatches(response.matches); 
    } catch (err: any) {
      setMatchesError(err.message || 'Failed to load matches.');
    }
    setMatchesLoading(false);
  };

  // ADDED: Handler for clicking the "View My Matches" button
  const handleViewMatchesClick = (event: Event) => {
    setSelectedEventIdForMatches(event.id.toString());
    // It's better to store the whole event or just its name for the dialog title
    // For simplicity, I'll assume we can find the event again from 'events' array or pass name
    setViewMatchesDialogOpen(true);
    fetchMatchesForEvent(event.id.toString());
  };

  contextEvents.map((contextEvent: any) => {
    // Find the corresponding registration if it exists
    const registration = contextEvent.registration || null;
    
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
      registered_attendee_count: typeof contextEvent.registered_attendee_count === 'number' ? contextEvent.registered_attendee_count : 0, // Modified this line
      registration: registration
    } as Event;
  });

  // Calculate eventOptions directly instead of storing in state
  // Use filteredEvents for options available for check-in etc., if appropriate
  const eventOptions = filteredEvents.filter(event => 
    userRegisteredEvents.includes(event.id) && 
    (event.status === 'Registration Open' || event.status === 'In Progress')
  );

  const isRegistrationClosed = (event: Event) => {
    if (!event.starts_at) return false;
    
    const eventStart = new Date(event.starts_at);
    const now = new Date();
    
    // Calculate time difference in hours
    const timeDiff = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Get rid of the limit of 2 hours
    // TODO: Remove this once we have a better way to handle this
    return timeDiff <= 0.01;
  };

  // Update handleSignUpClick to check registration close time
  const handleSignUpClick = (eventId: number) => {
    const event = filteredEvents.find(e => e.id === eventId); // Use filteredEvents
    if (!event) return;
    
    if (event.status === 'Completed') {
      setErrorMessage("Registration is not available for completed events.");
      return;
    }
    
    // Check if event starts within 2 hours
    if (isRegistrationClosed(event)) {
      setErrorMessage("Registration is closed for this event (starts within 2 hours).");
      return;
    }
    
    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        // Ensure API call is made without join_waitlist initially
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
        const backendMsg = registrationError.response?.data?.message; // Renamed to avoid conflict
        const waitlistAvailable = registrationError.response?.data?.waitlist_available === true;

        if ((backendError === "Event is full, cannot register" 
                || backendError === "Event is full for this gender, cannot register") 
              && waitlistAvailable) {
          const event = filteredEvents.find(e => e.id.toString() === signUpEventId); // Use filteredEvents
          if (event) {
            setEventForWaitlist(event);
            setWaitlistDialogOpen(true); // Open the dialog to ASK to join waitlist
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

  // New function to handle confirming to join the waitlist
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
  
  // Global check-in handlers
  const handleGlobalCheckInClick = () => {
    setSelectedEventForCheckIn(null);
    setCheckInPin('');
    setCheckInError(null);
    setGlobalCheckInDialogOpen(true);
  };
  
  const handleEventSelection = (eventId: number) => {
    const selectedEvent = filteredEvents.find(e => e.id === eventId) || null; // Use filteredEvents
    setSelectedEventForCheckIn(selectedEvent);
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
  const sortedEvents = [...filteredEvents].sort((a, b) => { // Use filteredEvents
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
      // Convert form data to correct types for API
      const eventData = {
        name: createForm.name || 'Unnamed Event',
        description: createForm.description || '',
        starts_at: createForm.starts_at, 
        address: createForm.address || '',
        max_capacity: createForm.max_capacity || '10', // Keep as string for API
        price_per_person: createForm.price_per_person || '0', // Keep as string for API
        status: 'Registration Open' as EventStatus,
      };
      
      // Submit the form with converted values
      await createEvent(eventData);
      
      // Reset form and hide the form after successful creation
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

  // Add a date validation function
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validate date format and year length
    if (value) {
      const dateObj = new Date(value);
      const year = dateObj.getFullYear();
      
      // If year has more than 4 digits or is invalid (NaN)
      if (year > 9999 || year < 1000 || isNaN(year)) {
        // Set to current date/time formatted for datetime-local input
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        const formattedDate = localDate.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:MM
        
        setCreateForm(f => ({ ...f, starts_at: formattedDate }));
        return;
      }
    }
    
    setCreateForm(f => ({ ...f, starts_at: value }));
  };

  // Add price validation function
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers and a single decimal point
    const regex = /^[0-9]*\.?[0-9]*$/;
    
    if (value === '' || regex.test(value)) {
      setCreateForm(f => ({ ...f, price_per_person: value }));
    }
  };

  // Function to toggle inline user schedule visibility
  const toggleUserScheduleInline = (eventId: number) => {
    setExpandedUserSchedules(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
    // Clear previous error for this event when toggling
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  };

  const handleAttendeeSelectionChange = (eventSpeedDateId: number, eventId: number, interested: boolean) => {
    setAttendeeSpeedDateSelections(prev => ({
      ...prev,
      [eventSpeedDateId]: { eventId, interested }
    }));
    // Persist this individual selection to localStorage
    persistSelection(eventId, eventSpeedDateId, interested);
    // Clear error for this event when a selection is made
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

  const handleSaveAttendeeSelections = async (eventId: number) => {
    const event = filteredEvents.find(e => e.id === eventId);
    if (!event) {
      console.error("Event not found in handleSaveAttendeeSelections for eventId:", eventId);
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'Event details not found. Cannot save selections.' }));
      return;
    }

    const currentPicks = getCurrentPicksForEvent(eventId);
    // Update local saved state first for immediate UI feedback if desired for isSaveDisabled
    setSavedAttendeeSelections(prev => ({ ...prev, [eventId]: { ...currentPicks } }));
    // Persist all current selections for this event to localStorage
    persistAllSelectionsForEvent(eventId, currentPicks);

    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null })); // Clear previous error
    const schedule = userSchedules[eventId] || [];
    
    const selectionsToSubmit = schedule.map(item => ({
      event_speed_date_id: item.event_speed_date_id,
      interested: currentPicks[item.event_speed_date_id] === true // Default to false (NO) if not in currentPicks
    }));

    if (schedule.length === 0) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'No schedule found to save selections for this event.' }));
      return;
    }
    setSaveIndicator(prev => ({ ...prev, [eventId]: true }));

    // Only attempt to submit to the backend if the event is not completed
    if (event.status !== 'Completed') {
      try {
        await eventsApi.submitSpeedDateSelections(eventId.toString(), selectionsToSubmit);

        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
        setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: false })); // Reset this flag on successful submission
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
        // Ensure save indicator is turned off on error too
        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
      }
    } else {
      // For completed events, selections are saved locally. API submission is skipped.
      console.log(`Event ${eventId} (${event.name}) is completed. Selections saved locally only.`);
      // The save indicator is already true, turn it off after a delay.
      setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
      // No need to set specific errors here, as local save is successful.
      // Backend selectionWindowClosedError is not relevant as we didn't attempt submission.
    }
  };


  const renderActionButtons = (event: Event) => {
    // Check if the user is registered for this event
    const isRegistered = isRegisteredForEvent(event.id);
    // Ensure registrationStatus has a fallback for clarity
    let registrationStatusText = event.registration?.status || null;

    // Handle Waitlisted status first
    if (registrationStatusText === 'Waitlisted') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Chip
            label="Waitlisted"
            color="warning" // Or another color you prefer for waitlisted
            size="small"
          />
          {/* Optionally, allow cancellation from waitlist here if desired */}
          <Button 
            size="small"
            variant="outlined" 
            color="error" 
            onClick={() => handleCancelClick(event.id)} // Assumes handleCancelClick can also cancel waitlist
            startIcon={<CancelIcon />}
          >
            Leave Waitlist
          </Button>
        </Box>
      );
    }
    
    if (isRegistered && !registrationStatusText && event.status !== 'Completed' && event.status !== 'In Progress') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Chip
            label={registrationStatusText} // Use the derived status text
            color={registrationStatusText === 'Checked In' ? 'success' : 'info'}
            icon={registrationStatusText === 'Checked In' ? <CheckInIcon /> : undefined}
            size="small"
          />
          <Button 
            size="small"
            variant="outlined" 
            color="error" 
            onClick={() => handleCancelClick(event.id)} 
            startIcon={<CancelIcon />}
          >
            Cancel Registration
          </Button>
        </Box>
      );
    }
    
    if (event.status === 'Completed') {
      if (isRegistered && registrationStatusText === 'Checked In') {
        const isCurrentUserAttendee = user && !isAdmin() && !isOrganizer();

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', alignSelf: 'flex-start' }}> 
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', mb: expandedUserSchedules[event.id] ? 1 : 0 }}> 
              <Chip
                label="Checked In"
                color="success"
                icon={<CheckInIcon />}
                size="small"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => toggleUserScheduleInline(event.id)} // Keep this toggle
                startIcon={expandedUserSchedules[event.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                My Schedule
              </Button>
              {isCurrentUserAttendee && (
                <Button
                  size="small"
                  variant="contained" // Or outlined, depending on preference
                  color="primary"
                  onClick={() => handleViewMatchesClick(event)} // Keep this handler
                  sx={{ mt: 0.5 }} // Add a little margin top
                >
                  View My Matches
                </Button>
              )}
            </Box>
            {/* This Collapse should show schedule and selection UI for Completed events too */}
            <Collapse in={expandedUserSchedules[event.id]} timeout="auto" unmountOnExit sx={{ width: '100%'}}>
              <Paper elevation={1} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default' }}>
                {userSchedules[event.id] && userSchedules[event.id].length > 0 ? (
                  <>
                    {/* Map through schedule items - existing code */}
                    {userSchedules[event.id].map((item, index) => (
                      <Box 
                        key={item.event_speed_date_id || index} 
                        sx={{ 
                          mb: { xs: 0.5, sm: index === userSchedules[event.id].length - 1 ? 0 : 0.75 },
                          p: { xs: 0.5, sm: 0.75 }, 
                          borderLeft: '3px solid', 
                          borderColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                          borderRadius: '4px',
                          backgroundColor: theme.palette.action.hover,
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12}> 
                            <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}>
                              Round {item.round}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.1 }}>
                                  Table: {item.table}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>
                                  Partner: {item.partner_name} (Age: {item.partner_age || 'N/A'})
                                </Typography>
                              </Box>
                              {item.event_speed_date_id && (
                                <Box sx={{ 
                                  display: 'flex',
                                  gap: 0.75,
                                  ml: 2,
                                  position: 'relative',
                                  top: '-10px'
                                }}> 
                                  <Button
                                    variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'}
                                    size="small"
                                    color="success"
                                    onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, true)}
                                    sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'}
                                    size="small"
                                    color="error"
                                    onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, false)}
                                    sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  >
                                    No
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    {attendeeSelectionError[event.id] && (
                      <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setAttendeeSelectionError(prev => ({...prev, [event.id]: null}))}>
                        {attendeeSelectionError[event.id]}
                      </Alert>
                    )}
                    {/* Horizontal Save and Submit buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}> {/* MODIFIED: justifyContent to flex-end */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="inherit" // Changed from secondary to inherit
                          size="small"
                          onClick={() => handleSaveAttendeeSelections(event.id)}
                          disabled={isSaveDisabled(event.id)}
                        >
                          Save Selections {/* MODIFIED TEXT */}
                        </Button>
                        {saveIndicator[event.id] && (
                          <Typography variant="body2" color="success.main">Saved!</Typography>
                        )}
                      </Box>
                      {/* REMOVED SUBMIT BUTTON
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleAttendeeSubmitSelections(event.id)}
                        disabled={ // Logic for Completed events
                          (!userSchedules[event.id] || userSchedules[event.id].length === 0) ||
                          submittedEventIds.has(event.id) ||
                          selectionWindowClosedError[event.id]
                        }
                      >
                        {submittedEventIds.has(event.id) ? 'Selections Submitted' : 'Submit My Selections'}
                      </Button>
                      */}
                    </Box>
                    {/* ADDED: Display specific message if window is closed */}
                    {selectionWindowClosedError[event.id] && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                        Selection window closed (24 hours after event end).
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">Your schedule for this event is not yet available or you were not checked in.</Typography> // Adjusted text slightly
                )}
              </Paper>
            </Collapse>
          </Box>
        );
      }
      if (!canManageEvent(event)) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label="Event Completed"
              color="info"
              size="small"
            />
          </Box>
        );
      }
      return null;
    }
    
    if (event.status === 'In Progress'  && isRegistered) {
      if (registrationStatusText === 'Checked In') {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', alignSelf: 'flex-start', width: '100%' }}> 
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', mb: expandedUserSchedules[event.id] ? 1 : 0 }}> 
              <Chip
                label="Checked In"
                color="success"
                icon={<CheckInIcon />}
                size="small"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => toggleUserScheduleInline(event.id)}
                startIcon={expandedUserSchedules[event.id] ? <ExpandLessIcon fontSize="small"/> : <ExpandMoreIcon fontSize="small"/>}
              >
                My Schedule
              </Button>
            </Box>
            <Collapse in={expandedUserSchedules[event.id]} timeout="auto" unmountOnExit sx={{ width: '100%'}}>
              <Paper elevation={1} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default' }}>
                {userSchedules[event.id] && userSchedules[event.id].length > 0 ? (
                  <>
                    {userSchedules[event.id].map((item, index) => (
                      <Box 
                        key={item.event_speed_date_id || index}
                        sx={{ 
                          mb: { xs: 0.5, sm: index === userSchedules[event.id].length - 1 ? 0 : 0.75 },
                          p: { xs: 0.5, sm: 0.75 },
                          borderLeft: '3px solid', 
                          borderColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                          borderRadius: '4px',
                          backgroundColor: theme.palette.action.hover,
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12}> 
                            <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}>
                              Round {item.round}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.1 }}>
                                  Table: {item.table}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>
                                  Partner: {item.partner_name} (Age: {item.partner_age || 'N/A'})
                                </Typography>
                              </Box>
                              {item.event_speed_date_id && (
                                <Box sx={{ 
                                  display: 'flex',
                                  gap: 0.75,
                                  ml: 2,
                                  position: 'relative',
                                  top: '-8px'
                                }}> 
                                  <Button
                                    variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'}
                                    size="small"
                                    color="success"
                                    onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, true)}
                                    sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'}
                                    size="small"
                                    color="error"
                                    onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, false)}
                                    sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  >
                                    No
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    {attendeeSelectionError[event.id] && (
                      <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setAttendeeSelectionError(prev => ({...prev, [event.id]: null}))}>
                        {attendeeSelectionError[event.id]}
                      </Alert>
                    )}
                    {/* Horizontal Save and Submit buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}> {/* MODIFIED: justifyContent to flex-end */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="inherit" // Changed from secondary to inherit
                          size="small"
                          onClick={() => handleSaveAttendeeSelections(event.id)}
                          disabled={isSaveDisabled(event.id)}
                        >
                          Save Selections {/* MODIFIED TEXT */}
                        </Button>
                        {saveIndicator[event.id] && (
                          <Typography variant="body2" color="success.main">Saved!</Typography>
                        )}
                      </Box>
                      {/* REMOVED SUBMIT BUTTON
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleAttendeeSubmitSelections(event.id)}
                        disabled={ // Corrected disabled logic for In Progress events
                          (!userSchedules[event.id] || userSchedules[event.id].length === 0) || // Disable if no schedule
                          submittedEventIds.has(event.id) ||
                          selectionWindowClosedError[event.id]
                        }
                      >
                        {submittedEventIds.has(event.id) ? 'Selections Submitted' : 'Submit My Selections'}
                      </Button>
                       */}
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">Your schedule for this event is not yet available or you were not checked in.</Typography>
                )}
              </Paper>
            </Collapse>
          </Box>
        );
      }
      return (
        <Chip
          label="In Progress"
          color="warning"
          size="small"
        />
      );
    }
    
    if (isRegistered) {
      if (event.status === 'Registration Open') {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label={registrationStatusText} // Use the derived status text
              color={registrationStatusText === 'Checked In' ? 'success' : 'info'}
              icon={registrationStatusText === 'Checked In' ? <CheckInIcon /> : undefined}
              size="small"
            />
            <Button 
              size="small"
              variant="outlined" 
              color="error" 
              onClick={() => handleCancelClick(event.id)} 
              startIcon={<CancelIcon />}
            >
              Cancel Registration
            </Button>
          </Box>
        );
      }
    } 
    else if (event.status === 'Registration Open') {
      // Check if event starts within 2 hours
      const registrationDisabled = isRegistrationClosed(event);
      
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip 
            title={
              registrationDisabled ? (
                <Typography 
                  sx={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'medium',
                    textAlign: 'center',
                    p: 0.5
                  }}
                >
                  Registration closed, event starts within 2 hours.
                </Typography>
              ) : ""
            }
            arrow
            placement="top"
            enterTouchDelay={0}
            leaveTouchDelay={1500}
          >
            <span>
              <Button 
                size="small" 
                startIcon={<SignUpIcon />} 
                color="primary" 
                onClick={() => handleSignUpClick(event.id)}
                disabled={registrationDisabled}
                sx={{
                  opacity: registrationDisabled ? 0.6 : 1,
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'text.disabled'
                  }
                }}
              >
                {registrationDisabled ? 'Registration Closed' : 'Register'}
              </Button>
            </span>
          </Tooltip>
          {registrationDisabled && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.7rem', 
                mt: 0.5, 
                textAlign: 'center',
                display: { xs: 'block', md: 'none' }
              }}
            >
              Tap for details
            </Typography>
          )}
        </Box>
      );
    }
    
    return null;
  };

  // Function to check if user can manage event
  const canManageEvent = (event: Event) => {
    if (!user) return false;
    return isAdmin() || (isOrganizer() && Number(event.creator_id) === Number(user.id));
  };
  
  // Navigate to attendees page - now fetches and displays attendees in a dialog
  const navigateToAttendees = async (eventId: number) => {
    try {
      console.log(`Fetching registered users for event ID: ${eventId}`);
      const event = filteredEvents.find(e => e.id === eventId) || null; // Use filteredEvents
      setSelectedEventForRegisteredUsers(event);
      
      const response = await eventsApi.getEventAttendees(eventId.toString());
      setRegisteredUsers(response.data);
      setViewRegisteredUsersDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching registered users:', error);
      setErrorMessage(error.message || 'Failed to fetch registered users');
    }
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


  // Modified to show confirmation dialog only if event is in progress
  const handleEndEventClick = (event: Event) => {
    if (event.status !== 'In Progress') {
      setErrorMessage('Events can only be ended when they are in progress.');
      return;
    }
    
    setSelectedEventForEnding(event);
    setEndEventDialogOpen(true);
  };
  
  // Actual event ending logic, called after confirmation
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
  
  // View attendee pins
  const handleViewPins = async (eventId: number) => {
    try {
      const event = filteredEvents.find(e => e.id === eventId) || null; // Use filteredEvents
      setSelectedEventForPins(event);
      setPinSearchTerm(''); // Reset search term
      
      const response = await eventsApi.getEventAttendeePins(eventId.toString());
      setAttendeePins(response.data);
      setFilteredPins(response.data); // Initialize filtered pins with all pins
      setViewPinsDialogOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to fetch attendee pins');
    }
  };

  // Function to render event controls
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
          onClick={() => setExpandedEventControls(expandedEventControls === event.id ? null : event.id)}
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
              onClick={() => navigateToAttendees(event.id)}
              fullWidth
              color="primary"
              sx={{ borderRadius: 1 }}
            >
              View Registered Users
            </Button>
            
            {/* Event status management buttons */}
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
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
                  Start
                </Button>
              </Grid>
              <Grid item xs={6}>
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
              </Grid>
            </Grid>
            
            {/* View attendee pins button */}
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ViewIcon />}
              onClick={() => handleViewPins(event.id)}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              View Pins
            </Button>

            {/* View all schedules button - only visible when event is in progress or completed */}
            {(event.status === 'In Progress' || event.status === 'Completed') && (
              <Button
                variant="outlined"
                size="small"
                color="primary"
                startIcon={<ViewIcon />}
                onClick={() => handleViewAllSchedules(event.id)}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                View All Schedules
              </Button>
            )}

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
                  sx={{ borderRadius: 1 }}
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

  // In the handleStartEditing function, add birthday and pin to editFormData
  const handleStartEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      birthday: user.birthday ? user.birthday.substring(0, 10) : '', // Format as YYYY-MM-DD
      pin: user.pin
    });
  };

  // Add function to cancel editing
  const handleCancelEditing = () => {
    setEditingUserId(null);
    setEditFormData(null);
  };

  // Update the handleSaveEdits function to use the new API endpoint for attendee details
  const handleSaveEdits = async (userId: number) => {
    try {
      if (!selectedEventForRegisteredUsers) {
        setErrorMessage('No event selected');
        return;
      }
      
      // Find the attendee record in the registeredUsers array
      const attendee = registeredUsers.find(user => user.id === userId);
      if (!attendee) {
        setErrorMessage('Attendee record not found');
        return;
      }
      
      // Call API to update user details
      await eventsApi.updateAttendeeDetails(
        selectedEventForRegisteredUsers.id.toString(), 
        attendee.id.toString(), 
        editFormData
      );
      
      // Update the user in the local state
      setRegisteredUsers(users => 
        users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              ...editFormData,
              name: `${editFormData.first_name} ${editFormData.last_name}`,
              age: editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : user.age
            };
          }
          return user;
        })
      );
      
      // Exit edit mode
      setEditingUserId(null);
      setEditFormData(null);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update user information');
    }
  };

  // Add a helper function to calculate age
  const calculateAge = (birthday: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  // Update the handleEditFormChange function to use a more generic type
  const handleEditFormChange = (value: any, field: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  // Function to handle viewing all schedules (for admin/organizer)
  const handleViewAllSchedules = async (eventId: number) => {
    try {
      setLoadingAllSchedules(true);
      setSelectedEventForAllSchedules(filteredEvents.find(e => e.id === eventId) || null); // Use filteredEvents
      setSearchTerm(''); // Reset search term when opening dialog
      setSortConfig(null); // Reset sort config when opening dialog
      setSpeedDateSelections({}); // Initialize/reset selections
      setSelectionErrorMessage(null); // Reset selection error message
      
      // Fetch all schedules
      const response = await eventsApi.getAllSchedules(eventId.toString());
      console.log("All schedules response:", response);
      setAllSchedules(response.schedules || {});
      setFilteredSchedules(response.schedules || {}); // Initialize filtered schedules
      
      // Fetch attendees to get user data for display
      const attendeesResponse = await eventsApi.getEventAttendees(eventId.toString());
      const userMap: Record<number, {id: number, first_name: string, last_name: string}> = {};
      
      // Create a map of user IDs to user objects
      attendeesResponse.data.forEach((attendee: any) => {
        userMap[attendee.id] = {
          id: attendee.id,
          first_name: attendee.first_name || '',
          last_name: attendee.last_name || ''
        };
      });
      
      setUsersMap(userMap);
      setViewAllSchedulesDialogOpen(true);
    } catch (error: any) {
      console.error("Error fetching all schedules:", error);
      setErrorMessage(error.message || 'Failed to load all schedules');
    } finally {
      setLoadingAllSchedules(false);
    }
  };

  // Add a function to handle sorting
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    // If we're already sorting by this key, toggle the direction
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    
    // Apply the sort and filter
    applyFilterAndSort(searchTerm, { key, direction });
  };
  
  // Add a function to handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    applyFilterAndSort(value, sortConfig);
  };
  
  // Function to apply both filtering and sorting
  const applyFilterAndSort = (search: string, sort: {key: string, direction: 'ascending' | 'descending'} | null) => {
    // Start with all schedules
    let filtered: Record<number, any[]> = {};
    
    if (!search || search.trim() === '') {
      // If no search term, use all schedules
      filtered = { ...allSchedules };
    } else {
      // Apply filtering based on search term
      const lowercaseSearch = search.toLowerCase();
      
      Object.entries(allSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;
        
        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : '';
        
        // Filter this user's schedule based on search
        const filteredUserSchedule = userSchedule.filter((item: any) => {
          const partnerName = item.partner_name.toLowerCase();
          const round = item.round.toString();
          const table = item.table.toString();
          
          return userName.includes(lowercaseSearch) || 
                 partnerName.includes(lowercaseSearch) || 
                 round.includes(lowercaseSearch) || 
                 table.includes(lowercaseSearch);
        });
        
        if (filteredUserSchedule.length > 0) {
          filtered[Number(userId)] = filteredUserSchedule;
        }
      });
    }
    
    // Apply sorting if specified
    if (sort) {
      // Create a flattened array of all schedule items with user information
      let allItems: any[] = [];
      
      Object.entries(filtered).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule)) return;
        
        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
        
        userSchedule.forEach((item: any) => {
          allItems.push({
            userId: Number(userId),
            userName,
            ...item
          });
        });
      });
      
      // Sort the flattened array
      allItems.sort((a, b) => {
        let compareA: string | number = '';
        let compareB: string | number = '';
        
        // Determine what to compare based on sort key
        switch(sort.key) {
          case 'user':
            compareA = a.userName.toLowerCase();
            compareB = b.userName.toLowerCase();
            break;
          case 'round':
            compareA = a.round;
            compareB = b.round;
            break;
          case 'table':
            compareA = a.table;
            compareB = b.table;
            break;
          case 'partner':
            compareA = a.partner_name.toLowerCase();
            compareB = b.partner_name.toLowerCase();
            break;
          case 'partnerAge':
            compareA = a.partner_age || 0;
            compareB = b.partner_age || 0;
            break;
          default:
            return 0;
        }
        
        // Compare values
        if (compareA < compareB) {
          return sort.direction === 'ascending' ? -1 : 1;
        }
        if (compareA > compareB) {
          return sort.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      
      // Convert back to the structure needed for display
      filtered = {};
      allItems.forEach(item => {
        const userId = item.userId;
        if (!filtered[userId]) {
          filtered[userId] = [];
        }
        // Remove the added props before putting back
        const { userId: _, userName: __, ...rest } = item;
        filtered[userId].push(rest);
      });
    }
    
    setFilteredSchedules(filtered);
  };


  // Add a function to handle pin search
  const handlePinSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPinSearchTerm(value);
    filterPins(value);
  };

  // Add a function to filter pins
  const filterPins = (search: string) => {
    if (!search || search.trim() === '') {
      setFilteredPins(attendeePins);
    } else {
      const lowercaseSearch = search.toLowerCase();
      const filtered = attendeePins.filter(attendee => 
        attendee.name?.toLowerCase().includes(lowercaseSearch) || 
        attendee.email?.toLowerCase().includes(lowercaseSearch) ||
        // Assume pin is always a string, but add check just in case
        attendee.pin?.includes(lowercaseSearch) 
      );
      setFilteredPins(filtered);
    }
  };

  // Effect to fetch user schedules for active, checked-in events
  useEffect(() => {
    const fetchSchedulesForActiveEvents = async () => {
      const schedulesToUpdate: Record<number, ScheduleItem[]> = {};
      const newAttendeeSelections: Record<number, { eventId: number, interested: boolean }> = {};
      const newSavedSelections: Record<number, Record<number, boolean>> = {};
      let needsScheduleUpdate = false;

      for (const event of filteredEvents) { // Use filteredEvents
        const isRegistered = isRegisteredForEvent(event.id);
        const registrationStatus = event.registration?.status || null;

        // console.log(`Event ${event.id}: Status=${event.status}, Registered=${isRegistered}, CheckInStatus=${registrationStatus}, AlreadyFetched=${userSchedules.hasOwnProperty(event.id)}`);

        if ((event.status === 'In Progress' || event.status === 'Completed') && 
            isRegistered && 
            registrationStatus === 'Checked In') 
        {
          if (!userSchedules.hasOwnProperty(event.id)) { 
            try {
              // console.log(`Fetching schedule for event ${event.id}`);
              const response = await eventsApi.getSchedule(event.id.toString());
              if (response && response.schedule) {
                // console.log(`Fetched schedule for event ${event.id}:`, response.schedule);
                schedulesToUpdate[event.id] = response.schedule;
                
                // Load persisted selections for this event's schedule
                const persisted = getPersistedSelections(event.id);
                newSavedSelections[event.id] = { ...persisted }; // Initialize saved selections
                response.schedule.forEach(item => {
                  if (item.event_speed_date_id && persisted.hasOwnProperty(item.event_speed_date_id)) {
                    newAttendeeSelections[item.event_speed_date_id] = {
                      eventId: event.id,
                      interested: persisted[item.event_speed_date_id]
                    };
                  }
                });
                needsScheduleUpdate = true;
              } else {
                 // console.log(`No schedule found for event ${event.id}`);
                 schedulesToUpdate[event.id] = []; 
                 newSavedSelections[event.id] = {}; // Initialize saved selections even if no schedule
                 needsScheduleUpdate = true;
              }
            } catch (err) {
              console.error(`Failed to fetch schedule for event ${event.id}:`, err);
              schedulesToUpdate[event.id] = []; 
              newSavedSelections[event.id] = {}; // Initialize saved selections on error
              needsScheduleUpdate = true;
            }
          } else {
            // Schedules already fetched, ensure selections are loaded if not already part of initial load
            // This handles cases where component re-renders but schedules were already present
            if (!savedAttendeeSelections[event.id]) {
              const persisted = getPersistedSelections(event.id);
              newSavedSelections[event.id] = { ...persisted };
              (userSchedules[event.id] || []).forEach(item => {
                if (item.event_speed_date_id && persisted.hasOwnProperty(item.event_speed_date_id) && !attendeeSpeedDateSelections[item.event_speed_date_id]) {
                  newAttendeeSelections[item.event_speed_date_id] = {
                    eventId: event.id,
                    interested: persisted[item.event_speed_date_id]
                  };
                }
              });
            }
          }
        }
      }

      if (needsScheduleUpdate) {
        setUserSchedules(prev => ({ ...prev, ...schedulesToUpdate }));
      }
      // Update selections states together
      if (Object.keys(newAttendeeSelections).length > 0) {
        setAttendeeSpeedDateSelections(prev => ({ ...prev, ...newAttendeeSelections }));
      }
      if (Object.keys(newSavedSelections).length > 0) {
        setSavedAttendeeSelections(prev => ({ ...prev, ...newSavedSelections}));
      }
    }; // End of fetchSchedulesForActiveEvents

    // Check if user data and events are loaded before fetching
    if (user && filteredEvents.length > 0) { // Use filteredEvents
        fetchSchedulesForActiveEvents();
    }
  }, [filteredEvents, isRegisteredForEvent, user, userSchedules, savedAttendeeSelections, attendeeSpeedDateSelections]); // Added savedAttendeeSelections & attendeeSpeedDateSelections to deps

  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      // Show snackbar only if permission is default (not granted or denied)
      setShowNotificationSnackbar(currentPermission === 'default');
    } else {
      setShowNotificationSnackbar(false); // Don't show if notifications not supported
    }
  }, []);


  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'unsupported'; // Indicate unsupported
    }
    try {
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setShowNotificationSnackbar(false); 
        return permission;
      }
      return Notification.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowNotificationSnackbar(false); 
      return 'denied';
    }
  }, [setShowNotificationSnackbar]);

  const handleEnableNotifications = () => {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted via EventList');
      } else {
        console.log(`Notification permission status: ${permission}`);
      }
    });
  };

  const handleDeclineNotifications = () => {
    setShowNotificationSnackbar(false);
    // Optionally store this preference in localStorage to prevent showing again
    localStorage.setItem('notificationsDeclined', 'true');
  };

  const handleCloseNotificationSnackbar = useCallback((_event: any, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowNotificationSnackbar(false);
  }, [setShowNotificationSnackbar]);

  const handleAlertClose = useCallback(() => {
    setShowNotificationSnackbar(false);
  }, [setShowNotificationSnackbar]);

  // ADD Function to handle saving speed date selections
  const handleSaveSpeedDateSelections = async () => {
    if (!selectedEventForAllSchedules) {
      setSelectionErrorMessage('No event selected for saving selections.');
      return;
    }

    const selectionsToSubmit = Object.entries(speedDateSelections).map(([id, interested]) => ({
      event_speed_date_id: Number(id),
      interested: interested,
    }));

    if (selectionsToSubmit.length === 0) {
      setSelectionErrorMessage('No selections have been made to save.');
      return;
    }

    try {
      setSelectionErrorMessage(null); // Clear previous errors
      await eventsApi.submitSpeedDateSelections(selectedEventForAllSchedules.id.toString(), selectionsToSubmit);
      alert('Speed date selections saved successfully!');

    } catch (error: any) {
      setSelectionErrorMessage(error.response?.data?.message || error.message || 'Failed to save speed date selections.');
    }
  };

  // ADD THIS GENERIC HANDLER
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleExportSchedules = () => {
    if (!selectedEventForAllSchedules || !filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      setErrorMessage('No schedules available to export');
      return;
    }

    try {
      let csvContent = 'User Name,Round,Table,Partner Name,Partner Age\n';

      Object.entries(filteredSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;

        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;

        userSchedule.forEach((item: any) => {
          // Escape fields that might contain commas
          const escapedUserName = `"${userName}"`;
          const escapedPartnerName = `"${item.partner_name}"`;
          
          csvContent += `${escapedUserName},${item.round},${item.table},${escapedPartnerName},${item.partner_age || 'N/A'}\n`;
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedEventForAllSchedules.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_schedules.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting schedules:', error);
      setErrorMessage('Failed to export schedules');
    }
  };

  const handleExportRegisteredUsers = () => {
    if (!selectedEventForRegisteredUsers || !registeredUsers || registeredUsers.length === 0) {
      setErrorMessage('No registered users available to export');
      return;
    }

    try {
      let csvContent = 'Name,Email,Phone,Gender,Age,Birthday,Registration Date,Check-in Time,Status,PIN\n';

      registeredUsers.forEach((user) => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const registrationDate = user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A';
        const checkInDate = user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in';

        const escapedName = `"${user.name}"`;
        const escapedEmail = `"${user.email}"`;
        const escapedPhone = `"${user.phone}"`;
        
        csvContent += `${escapedName},${escapedEmail},${escapedPhone},${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${registrationDate},${checkInDate},${user.status},${user.pin}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedEventForRegisteredUsers.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registered_users.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting registered users:', error);
      setErrorMessage('Failed to export registered users');
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
            {user && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleGlobalCheckInClick}
                startIcon={<CheckInIcon />}
                sx={{
                  minWidth: { xs: 'auto', sm: 'inherit' }, 
                  p: { xs: '6px 10px', sm: '6px 16px' }, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                  Check-In
              </Button>
            )}
            {(isAdmin() || isOrganizer()) && !showCreateCard && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleToggleCreateCard}
                startIcon={<EventIcon />}
                sx={{
                  minWidth: { xs: 'auto', sm: 'inherit' }, 
                  p: { xs: '6px 10px', sm: '6px 16px' }, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                  Create Event
              </Button>
            )}
          </Box>
        </Box>

        {showCreateCard && (isAdmin() || isOrganizer()) && (
          <Card sx={{ mb: 3, mt: isMobile ? 1 : 0 }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: isMobile ? 1 : 2 }}>
                Create New Event
              </Typography>
              <Grid container spacing={isMobile ? 1 : 2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Event Name"
                    name="name"
                    value={createForm.name}
                    onChange={handleChange}
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
                    value={createForm.description}
                    onChange={handleChange}
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
                    value={createForm.starts_at}
                    onChange={handleDateChange}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    required
                    size={isMobile ? "small" : "medium"}
                    margin="dense"
                    inputProps={{
                      style: { 
                        textAlign: 'left',
                        paddingLeft: '12px'
                      }
                    }}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        paddingRight: '14px',
                        // Add iOS-specific fixes
                        WebkitAppearance: 'none', // Ensure consistent appearance across iOS versions
                        textAlign: 'left !important',
                        direction: 'ltr !important',
                        '&::placeholder': {
                          opacity: 0.7,
                          color: 'text.secondary',
                        },
                        '&::-webkit-calendar-picker-indicator': {
                          position: 'absolute',
                          right: 0,
                          padding: '8px',
                          marginRight: '4px',
                          cursor: 'pointer',
                          color: 'rgba(0, 0, 0, 0.54)',
                          opacity: 0, // Hide default icon as we're using a custom one
                          height: '24px',
                          width: '24px',
                          display: 'block',
                          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'rgba(0,0,0,0.54)\' d=\'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z\'/></svg>")',
                          backgroundPosition: 'center',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          zIndex: 2
                        }
                      },
                      // Simplified placeholder approach to avoid overlapping text
                      '& .MuiInputBase-root:has(input[value=""]):before': {
                        content: '"MM/DD/YYYY hh:mm"',
                        display: createForm.starts_at ? 'none' : 'block',
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: theme.palette.mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgba(0, 0, 0, 0.38)',
                        fontSize: '16px',
                        zIndex: 1
                      },
                      // Remove other placeholder mechanisms
                      '& .MuiInputBase-root:after': {
                        display: 'none'
                      },
                      '& .MuiOutlinedInput-root': {
                        paddingRight: 0
                      },
                      '& .MuiInputAdornment-root': {
                        marginLeft: 0
                      },
                      // iOS specific styles for date display
                      '& input[type="datetime-local"]': {
                        display: 'flex',
                        textAlign: 'left !important',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        paddingLeft: '12px !important',
                        '&::-webkit-date-and-time-value': {
                          textAlign: 'left !important',
                          margin: 0,
                          opacity: createForm.starts_at ? 1 : 0 // Hide when empty to prevent overlap
                        },
                        '&::-webkit-datetime-edit': {
                          textAlign: 'left !important',
                          paddingLeft: 0,
                          opacity: createForm.starts_at ? 1 : 0 // Hide when empty to prevent overlap
                        },
                        '&::-webkit-datetime-edit-fields-wrapper': {
                          padding: 0,
                          margin: 0,
                          textAlign: 'left !important'
                        },
                        '&::-webkit-datetime-edit-text': {
                          padding: 0,
                          margin: 0,
                          textAlign: 'left !important'
                        },
                        '&::-webkit-datetime-edit-hour-field, &::-webkit-datetime-edit-minute-field, &::-webkit-datetime-edit-day-field, &::-webkit-datetime-edit-month-field, &::-webkit-datetime-edit-year-field, &::-webkit-datetime-edit-ampm-field': {
                          textAlign: 'left !important'
                        },
                        '&:not([value]), &[value=""]': {
                          color: 'transparent' // Hide the actual input text when empty
                        }
                      },
                      // Explicit alignment and visibility for when the field has a value
                      '& input[type="datetime-local"][value]:not([value=""])': {
                        textAlign: 'left !important',
                        direction: 'ltr !important',
                        color: theme.palette.mode === 'dark' ? 'white !important' : 'text.primary !important',
                        '&::-webkit-datetime-edit': {
                          paddingLeft: 0,
                          textAlign: 'left !important',
                          opacity: 1
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <div style={{
                          position: 'absolute',
                          right: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          pointerEvents: 'none',
                          zIndex: 2
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{
                            opacity: 0.7,
                            color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0, 0, 0, 0.54)'
                          }}>
                            <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                          </svg>
                        </div>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Address"
                    name="address"
                    value={createForm.address}
                    onChange={handleChange}
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
                    value={createForm.max_capacity}
                    onChange={handleChange}
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
                    value={createForm.price_per_person}
                    onChange={handlePriceChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    size={isMobile ? "small" : "medium"}
                    margin="dense"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"} margin="dense">
                    <InputLabel id="event-status-label">Status</InputLabel>
                    <Select
                      labelId="event-status-label"
                      name="status"
                      value={createForm.status}
                      label="Status"
                      onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                    >
                      <MenuItem value="Registration Open">Registration Open</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
              <Button onClick={handleToggleCreateCard} color="inherit" size={isMobile ? "small" : "medium"}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} variant="contained" color="primary" size={isMobile ? "small" : "medium"}>
                Create Event
              </Button>
            </CardActions>
          </Card>
        )}
        
        <Grid container spacing={3}>
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
                      <Chip
                        label={event.status}
                        color={getStatusColor(event.status)}
                      sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    />
                  </Box>
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
                  
                {(event.status === 'In Progress') && (
                  <Box sx={{ mb: { xs: 1, sm: 3 } }}> 
                    <Divider sx={{ mb: { xs: 0.5, sm: 2 } }} /> 
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1.25rem' },
                        mb: { xs: 0.5, sm: 2}
                      }}
                    >
                      Round Timer
                    </Typography>
                    {(() => {
                      const scheduleForTimer = isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In' ? userSchedules[event.id] : undefined;
                      return (
                        <EventTimer 
                          eventId={event.id} 
                          isAdmin={canManageEvent(event)} 
                          eventStatus={event.status} 
                          userSchedule={scheduleForTimer} 
                        />
                      );
                    })()}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}> 
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' 
                    }}
                  >
                  <EventIcon fontSize="small" />
                  {formatDate(event.starts_at)}
                </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' 
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    {event.max_capacity} attendees max
                  </Typography>
                  {/* Add Spots Filled Display START */} 
                  {typeof event.registered_attendee_count === 'number' && event.max_capacity && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: isMobile ? '0.75rem' : '0.875rem' 
                      }}
                    >
                      <PeopleIcon fontSize="small" />
                      {`${event.registered_attendee_count}/${event.max_capacity} spots filled`}
                    </Typography>
                  )}
                  {/* Add Spots Filled Display END */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' 
                    }}
                  >
                    <AttachMoneyIcon fontSize="small" />
                    ${parseFloat(event.price_per_person).toFixed(2)} per person
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' 
                    }}
                  >
                  <LocationOnIcon fontSize="small" />
                  {event.address}
                </Typography>
                </Box>
                
                {/* Event admin controls */}
                {renderEventControls(event)}
              </CardContent>
              <CardActions sx={{ 
                p: { xs: 1, sm: 2 }, 
                pt: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1,
                justifyContent: 'flex-start' 
              }}>
                {renderActionButtons(event)}
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

      {/* Global Check-in Dialog */}
      <Dialog open={globalCheckInDialogOpen} onClose={() => setGlobalCheckInDialogOpen(false)}>
        <DialogTitle>Event Check-In</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Select the event you're attending and enter your 4-digit PIN to check in.
          </Typography>
          
          {/* Event selection */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select Event to Check In
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {eventOptions.map((event: Event) => (
                <Paper 
                  key={event.id}
                  variant="outlined"
                  sx={{ 
                    p: 1, 
                    cursor: 'pointer',
                    bgcolor: selectedEventForCheckIn?.id === event.id ? 'action.selected' : 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                  onClick={() => handleEventSelection(event.id)}
                >
                  {selectedEventForCheckIn?.id === event.id ? (
                    <RadioButtonCheckedIcon color="primary" />
                  ) : (
                    <RadioButtonUncheckedIcon color="action" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={500}>{event.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.starts_at)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
              
              {eventOptions.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 1 }}>
                  You don't have any events to check in to.
                </Typography>
              )}
            </Box>
          </Box>
          
          {checkInError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checkInError}
            </Alert>
          )}
          
          <TextField
            label="PIN"
            type="password"
            value={checkInPin}
            onChange={(e) => setCheckInPin(e.target.value)}
            inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
            fullWidth
            margin="dense"
            disabled={!selectedEventForCheckIn}
          />
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
      
      {/* View Pins Dialog */}
      <Dialog 
        open={viewPinsDialogOpen} 
        onClose={() => setViewPinsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEventForPins?.name} - Attendee PINs
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}> {/* Add responsive padding */}
          {attendeePins.length > 0 ? (
            <>
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Search"
                  placeholder="Search by name, email, or PIN..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={pinSearchTerm}
                  onChange={handlePinSearchChange}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        🔍
                      </Box>
                    ),
                  }}
                />
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {filteredPins.length} of {attendeePins.length} attendees
              </Typography>
            <List>
                {filteredPins.map((attendee, index) => (
                  <ListItem key={index} divider={index < filteredPins.length - 1}>
                  <ListItemText
                    primary={attendee.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {attendee.email}
                        </Typography>
                        <Typography 
                          component="span" 
                          variant="body2" 
                          sx={{ 
                            display: 'block', 
                            fontWeight: 'bold',
                            color: theme.palette.primary.main 
                          }}
                        >
                          PIN: {attendee.pin}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            </>
          ) : (
            <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
              No registered attendees with PINs found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPinsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Registered Users Dialog */}
      <Dialog 
        open={viewRegisteredUsersDialogOpen} 
        onClose={() => setViewRegisteredUsersDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedEventForRegisteredUsers?.name} - Registered Users
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}> {/* Remove padding on xs */}
          {registeredUsers.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 500, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '15%', minWidth: 150 }}><strong>Name</strong></TableCell>
                    <TableCell sx={{ width: '20%', minWidth: 180 }}><strong>Email</strong></TableCell>
                    <TableCell sx={{ width: 130, minWidth: 120 }}><strong>Phone</strong></TableCell>
                    <TableCell sx={{ width: 80, minWidth: 70 }}><strong>Gender</strong></TableCell>
                    <TableCell sx={{ width: 60, minWidth: 50, textAlign: 'center' }}><strong>Age</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Birthday</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Registered</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Status</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Check-in Time</strong></TableCell>
                    <TableCell sx={{ width: 70, minWidth: 60, textAlign: 'center' }}><strong>PIN</strong></TableCell>
                    {(isAdmin() || isOrganizer()) && (
                      <TableCell sx={{ width: 100, minWidth: 90, textAlign: 'center' }}><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {editingUserId === user.id ? (
                        <>
                          <TableCell><Box sx={{ display: 'flex', gap: 1 }}><TextField size="small" label="First Name" value={editFormData.first_name} onChange={(e) => handleEditFormChange(e.target.value, 'first_name')} sx={{ width: 'calc(50% - 4px)' }} /><TextField size="small" label="Last Name" value={editFormData.last_name} onChange={(e) => handleEditFormChange(e.target.value, 'last_name')} sx={{ width: 'calc(50% - 4px)' }} /></Box></TableCell>
                          <TableCell><TextField size="small" label="Email" value={editFormData.email} onChange={(e) => handleEditFormChange(e.target.value, 'email')} fullWidth /></TableCell>
                          <TableCell><TextField size="small" label="Phone" value={editFormData.phone} onChange={(e) => handleEditFormChange(e.target.value, 'phone')} fullWidth /></TableCell>
                          <TableCell><FormControl size="small" fullWidth><InputLabel>Gender</InputLabel><Select value={editFormData.gender || ''} label="Gender" onChange={(e) => handleEditFormChange(e.target.value, 'gender')}><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></Select></FormControl></TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : ''}</TableCell>
                          <TableCell><TextField size="small" label="Birthday" type="date" value={editFormData.birthday || ''} onChange={(e) => handleEditFormChange(e.target.value, 'birthday')} InputLabelProps={{ shrink: true }} fullWidth /></TableCell>
                          <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                          <TableCell><Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /></TableCell>
                          <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}><TextField size="small" label="PIN" value={editFormData.pin || ''} onChange={(e) => handleEditFormChange(e.target.value, 'pin')} inputProps={{ maxLength: 4, pattern: '[0-9]*' }} sx={{ width: 65 }} /></TableCell>
                          {(isAdmin() || isOrganizer()) && (
                            <TableCell sx={{ textAlign: 'center' }}><Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}><IconButton size="small" color="primary" onClick={() => handleSaveEdits(user.id)} title="Save"><SaveIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={handleCancelEditing} title="Cancel"><CancelEditIcon fontSize="small" /></IconButton></Box></TableCell>
                          )}
                        </>
                      ) : (
                        <>
                          <TableCell>{user.name}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.gender}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                          <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                          <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                          <TableCell><Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /></TableCell>
                          <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{user.pin}</TableCell>
                          {(isAdmin() || isOrganizer()) && (
                            <TableCell sx={{ textAlign: 'center' }}><IconButton size="small" color="primary" onClick={() => handleStartEditing(user)} title="Edit"><EditIcon fontSize="small" /></IconButton></TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
              No registered users found for this event.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Box>
            {isAdmin() && registeredUsers.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleExportRegisteredUsers}
                startIcon={<DownloadIcon />}
              >
                Export CSV
              </Button>
            )}
          </Box>
          <Button onClick={() => setViewRegisteredUsersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Table and Round Configuration Dialog */}
      <Dialog 
        open={isTableConfigOpen} 
        onClose={() => setIsTableConfigOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Configure Speed Dating</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please specify how many tables and rounds you want for this event.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              label="Number of Tables"
              type="number"
              variant="outlined"
              value={numTables}
              onChange={(e) => setNumTables(parseInt(e.target.value) || 1)}
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
              onChange={(e) => setNumRounds(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTableConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleTableConfigSubmit} color="primary" variant="contained">
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Event Confirmation Dialog */}
      <Dialog
        open={startEventDialogOpen}
        onClose={() => setStartEventDialogOpen(false)}
      >
        <DialogTitle>Start Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start "{selectedEventForStarting?.name}"?
          </DialogContentText>
          <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
            This will use {numTables} tables and {numRounds} rounds.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStartEvent} color="success" variant="contained">
            Yes, Start Event
          </Button>
        </DialogActions>
      </Dialog>
      
      
      {/* End Event Confirmation Dialog */}
      <Dialog
        open={endEventDialogOpen}
        onClose={() => setEndEventDialogOpen(false)}
      >
        <DialogTitle>End Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end "{selectedEventForEnding?.name}"? 
            This will mark the event as completed and cannot be undone.
          </DialogContentText>
          <DialogContentText variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Note: Only events that are currently in progress can be ended.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEndEvent} color="error" variant="contained">
            Yes, End Event
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* All Schedules Dialog (for admins/organizers) */}
      <Dialog
        open={viewAllSchedulesDialogOpen}
        onClose={() => setViewAllSchedulesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEventForAllSchedules?.name} - All Schedules
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}>
          {loadingAllSchedules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Loading all schedules...</Typography>
            </Box>
          ) : Object.keys(allSchedules).length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, px: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Search"
                  placeholder="Search by name, round, table..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        🔍
                      </Box>
                    ),
                  }}
                />
                {isAdmin() && ( // Only show export button for admins
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleExportSchedules}
                    startIcon={<DownloadIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Export CSV
                  </Button>
                )}
              </Box>
              {selectionErrorMessage && (
                <Alert severity="error" sx={{ mb: 2, mx: 1 }} onClose={() => setSelectionErrorMessage(null)}>
                  {selectionErrorMessage}
                </Alert>
              )}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
                Showing schedules for {Object.keys(filteredSchedules).length} users
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => handleSort('user')}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: sortConfig?.key === 'user' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>User</strong>
                          {sortConfig?.key === 'user' && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('round')}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: sortConfig?.key === 'round' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>Round</strong>
                          {sortConfig?.key === 'round' && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('table')}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: sortConfig?.key === 'table' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>Table</strong>
                          {sortConfig?.key === 'table' && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('partner')}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: sortConfig?.key === 'partner' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>Partner</strong>
                          {sortConfig?.key === 'partner' && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('partnerAge')}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: sortConfig?.key === 'partnerAge' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>Partner Age</strong>
                          {sortConfig?.key === 'partnerAge' && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(filteredSchedules).flatMap(([userId, userSchedule]) => {
                      if (!Array.isArray(userSchedule) || userSchedule.length === 0) {
                        return [];
                      }
                      const user = Object.values(usersMap).find(u => u.id === Number(userId));
                      const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
                      return userSchedule.map((item: any, index: number) => (
                        <TableRow key={`${userId}-${index}`}>
                          <TableCell>{userName}</TableCell>
                          <TableCell>{item.round}</TableCell>
                          <TableCell>{item.table}</TableCell>
                          <TableCell>{item.partner_name}</TableCell>
                          <TableCell>{item.partner_age || 'N/A'}</TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : !loadingAllSchedules ? ( // Show text only if not loading
            <DialogContentText sx={{ textAlign: 'center', py: 3 }}>
              No schedules available. The event might not have started yet, or there may not be enough attendees checked in.
            </DialogContentText>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Loading all schedules...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAllSchedulesDialogOpen(false)}>Close</Button>
          {/* ADD Save Selections Button */}
          <Button 
            onClick={handleSaveSpeedDateSelections} 
            color="primary" 
            variant="contained"
            disabled={Object.keys(speedDateSelections).length === 0 || loadingAllSchedules}
          >
            Save Selections
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Support email footer */}
      <Box sx={{ mt: 4, pt: 2, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
        <MuiLink 
          href="mailto:savedandsingle.events@gmail.com" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            color: theme.palette.text.secondary,
            textDecoration: 'none',
            '&:hover': {
              color: theme.palette.primary.main,
              textDecoration: 'underline'
            }
          }}
        >
          <EmailIcon fontSize="small" />
          <Typography variant="body2">
            Need help? Contact Us
          </Typography>
        </MuiLink>
      </Box>

      {/* UPDATE Snackbar for Notification Permission Request */}
      <Snackbar
         open={showNotificationSnackbar} 
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
         onClose={handleCloseNotificationSnackbar}
         sx={{ position: 'fixed', bottom: 12, zIndex: theme.zIndex.snackbar + 1}}
         autoHideDuration={null} // Remove auto-hide
       >
         <Alert 
           severity="info" 
           action={
             <Box sx={{ display: 'flex', gap: 1 }}>
               <Button 
                 color="error" 
                 size="medium" 
                 onClick={handleDeclineNotifications} 
                 variant="outlined"
               >
                 Decline
               </Button>
               <Button 
                 color="inherit" 
                 size="medium" 
                 onClick={handleEnableNotifications} 
                 variant="outlined"
               >
                 Enable
               </Button>
             </Box>
           }
           onClose={handleAlertClose} 
           sx={{width: '100%', textAlign: 'center', pt: 1, pb: 1 }}
         >
           Enable browser notifications for event timer alerts
         </Alert>
       </Snackbar>

      {/* ADDED: Matches Dialog */}
      {selectedEventIdForMatches && (
        <MatchesDialog
          open={viewMatchesDialogOpen}
          onClose={() => {
            setViewMatchesDialogOpen(false);
            setSelectedEventIdForMatches(null); // Reset when closing
            setCurrentMatches([]);
            setMatchesError(null);
          }}
          eventName={filteredEvents.find(e => e.id.toString() === selectedEventIdForMatches)?.name}
          matches={currentMatches}
          loading={matchesLoading}
          error={matchesError}
        />
      )}

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
                  <MenuItem value="Registration Closed">Registration Closed</MenuItem>
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
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

      {/* ADD: Delete Event Confirmation Dialog */}
      <Dialog
        open={deleteEventConfirmOpen}
        onClose={() => setDeleteEventConfirmOpen(false)}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event: <strong>{filteredEvents.find(e => e.id === eventToDeleteId)?.name}</strong>? {/* Use filteredEvents to find name */}
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteEventConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteEvent} color="error" variant="contained">
            Delete Event
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
          <DialogContentText>
            This event is currently full. Would you like to be added to the waitlist?
          </DialogContentText>
          <DialogContentText variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            If a spot opens up, you may be automatically registered.
          </DialogContentText>
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
    </Container>
  </>
  );
};

export default EventList; 