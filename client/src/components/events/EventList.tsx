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
  Link,
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
  Pause as PauseIcon,
  Stop as EndIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelEditIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, EventStatus, ScheduleItem } from '../../types/event';
import EventTimer from './EventTimer';

const EventList = () => {
  const { events: contextEvents, createEvent, refreshEvents, isRegisteredForEvent, userRegisteredEvents } = useEvents();
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

  const [pauseEventDialogOpen, setPauseEventDialogOpen] = useState(false);
  const [selectedEventForPausing, setSelectedEventForPausing] = useState<Event | null>(null);

  // Add new state variables for editing
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Add state for schedules
  // const [viewScheduleDialogOpen, setViewScheduleDialogOpen] = useState(false); // REMOVED
  // const [selectedEventForSchedule, setSelectedEventForSchedule] = useState<Event | null>(null); // REMOVED
  // const [schedule, setSchedule] = useState<ScheduleItem[]>([]); // REMOVED
  // const [loadingSchedule, setLoadingSchedule] = useState(false); // REMOVED

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
  const [submittedEventIds, setSubmittedEventIds] = useState<Set<number>>(new Set());

  const events: Event[] = contextEvents.map((contextEvent: any) => {
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
      registration: registration
    } as Event;
  });

  // Calculate eventOptions directly instead of storing in state
  const eventOptions = events.filter(event => userRegisteredEvents.includes(event.id) && event.registration?.status === 'Registered');

  const handleSignUpClick = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event && event.status === 'Completed') {
      setErrorMessage("Registration is not available for completed events.");
      return;
    }
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
    const event = events.find(e => e.id === eventId);
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
    const selectedEvent = events.find(e => e.id === eventId) || null;
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
      case 'Paused':
        return 'warning';
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
      'Paused': 2,
      'Registration Open': 3,
      'Completed': 4,
      'Cancelled': 5
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
    // Clear error for this event when a selection is made
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  };

  const handleAttendeeSubmitSelections = async (eventId: number) => {
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null })); // Clear previous error

    const selectionsToSubmit = Object.entries(attendeeSpeedDateSelections)
      .filter(([_, selection]) => selection.eventId === eventId)
      .map(([id, selection]) => ({
        event_speed_date_id: Number(id),
        interested: selection.interested,
      }));

    if (selectionsToSubmit.length === 0) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'No selections have been made for this event.' }));
      return;
    }

    try {
      await eventsApi.submitSpeedDateSelections(eventId.toString(), selectionsToSubmit);
      // Basic success feedback. Consider a Snackbar for better UX.
      // alert('Your selections have been submitted successfully!'); 
      // Update state to mark as submitted
      setSubmittedEventIds(prev => new Set(prev).add(eventId));
      // Optionally clear selections for this event from local state after success?
      // setAttendeeSpeedDateSelections(prev => {
      //     const newState = {...prev};
      //     Object.keys(newState).forEach(key => {
      //         if (newState[Number(key)].eventId === eventId) {
      //             delete newState[Number(key)];
      //         }
      //     });
      //     return newState;
      // });
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null })); // Clear error on success
    } catch (error: any) {
      setAttendeeSelectionError(prev => ({
        ...prev,
        [eventId]: error.response?.data?.message || error.message || 'Failed to submit your selections.'
      }));
    }
  };

  const renderActionButtons = (event: Event) => {
    // Check if the user is registered for this event
    const isRegistered = isRegisteredForEvent(event.id);
    const registrationStatus = event.registration?.status || null;
    
    // Don't show any action buttons for completed events
    if (event.status === 'Completed') {
      if (isRegistered && registrationStatus === 'Checked In') {
        return (
          // Ensure this outer Box uses column flex direction to stack elements vertically
          // and alignItems controls horizontal alignment
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}> 
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
                onClick={() => toggleUserScheduleInline(event.id)} // MODIFIED
                startIcon={expandedUserSchedules[event.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                        key={item.event_speed_date_id || index} // Use event_speed_date_id if available
                        sx={{ 
                          mb: { xs: 0.5, sm: index === userSchedules[event.id].length - 1 ? 0 : 0.75 }, // Reduced margin
                          p: { xs: 0.5, sm: 0.75 }, // Reduced padding
                          borderLeft: '3px solid', 
                          borderColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                          borderRadius: '4px',
                          backgroundColor: theme.palette.action.hover,
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={item.event_speed_date_id ? 7 : 12}> {/* Adjusted grid for text */} 
                            <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}> {/* Reduced margin bottom */}
                              Round {item.round}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.1 }}> {/* Reduced margin bottom */}
                              Table: {item.table}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}> {/* Reduced margin bottom */}
                              Partner: {item.partner_name} (Age: {item.partner_age || 'N/A'})
                            </Typography>
                          </Grid>
                          {item.event_speed_date_id && (
                            <Grid item xs={12} sm={5}> {/* Adjusted grid for buttons */} 
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 0.5, sm: 0 } }}> {/* Reduced gap and margin top */} 
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'}
                                  size="small"
                                  color="success"
                                  onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, true)}
                                  sx={{ minWidth: '60px' }}
                                >
                                  Yes
                                </Button>
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'}
                                  size="small"
                                  color="error"
                                  onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, false)}
                                  sx={{ minWidth: '60px' }}
                                >
                                  No
                                </Button>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    ))}
                    {attendeeSelectionError[event.id] && (
                      <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setAttendeeSelectionError(prev => ({...prev, [event.id]: null}))}>
                        {attendeeSelectionError[event.id]}
                      </Alert>
                    )}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAttendeeSubmitSelections(event.id)}
                      sx={{ mt: 1.5 }}
                      disabled={
                        !Object.values(attendeeSpeedDateSelections).some(sel => sel.eventId === event.id) ||
                        submittedEventIds.has(event.id) // Disable if already submitted
                      }
                    >
                      {submittedEventIds.has(event.id) ? 'Selections Submitted' : 'Submit My Selections'} {/* Change text after submission */}
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">Your schedule for this event is not yet available or you are not checked in.</Typography>
                )}
              </Paper>
            </Collapse>
          </Box>
        );
      }
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Chip
          label="Event Completed"
          color="info"
          size="small"
        />
        </Box>
      );
    }
    
    // Events in progress or paused
    if ((event.status === 'In Progress' || event.status === 'Paused') && isRegistered) {
      if (registrationStatus === 'Checked In') {
        // User is checked in: Show Chip, View Schedule button, and potentially paused status.
        // Schedule for current round is shown inline via EventTimer.
        return (
          // Ensure this outer Box uses column flex direction AND aligns itself to the start
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', alignSelf: 'flex-start', width: '100%' }}> 
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', mb: expandedUserSchedules[event.id] ? 1 : 0 }}> 
              <Chip
                label="Checked In"
                color="success"
                icon={<CheckInIcon />}
                size="small"
              />
              {/* Re-add View Schedule Button - NOW A TOGGLE FOR INLINE VIEW */}
              <Button
                size="small"
                variant="outlined"
                onClick={() => toggleUserScheduleInline(event.id)} // MODIFIED
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
                        key={item.event_speed_date_id || index} // Use event_speed_date_id if available
                        sx={{ 
                          mb: { xs: 0.5, sm: index === userSchedules[event.id].length - 1 ? 0 : 0.75 }, // Reduced margin
                          p: { xs: 0.5, sm: 0.75 }, // Reduced padding
                          borderLeft: '3px solid', 
                          borderColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                          borderRadius: '4px',
                          backgroundColor: theme.palette.action.hover,
                        }}
                      >
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={item.event_speed_date_id ? 6 : 12}>
                            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>
                              Round {item.round}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Table: {item.table}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Partner: {item.partner_name} (Age: {item.partner_age || 'N/A'})
                            </Typography>
                          </Grid>
                          {item.event_speed_date_id && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 1, sm: 0 } }}>
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'}
                                  size="small"
                                  color="success"
                                  onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, true)}
                                  sx={{ minWidth: '60px' }}
                                >
                                  Yes
                                </Button>
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'}
                                  size="small"
                                  color="error"
                                  onClick={() => handleAttendeeSelectionChange(item.event_speed_date_id, event.id, false)}
                                  sx={{ minWidth: '60px' }}
                                >
                                  No
                                </Button>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    ))}
                     {attendeeSelectionError[event.id] && (
                      <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setAttendeeSelectionError(prev => ({...prev, [event.id]: null}))}>
                        {attendeeSelectionError[event.id]}
                      </Alert>
                    )}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAttendeeSubmitSelections(event.id)}
                      sx={{ mt: 1.5 }}
                      disabled={
                        !Object.values(attendeeSpeedDateSelections).some(sel => sel.eventId === event.id) ||
                        submittedEventIds.has(event.id) // Disable if already submitted
                      }
                    >
                      {submittedEventIds.has(event.id) ? 'Selections Submitted' : 'Submit My Selections'} {/* Change text after submission */}
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">Your schedule for this event is not yet available or you are not checked in.</Typography>
                )}
              </Paper>
            </Collapse>
            {/* Optionally show paused status chip - This should be outside the collapse triggering group if it also should not move */}
            {event.status === 'Paused' && (
              <Chip
                label="Event Paused"
                color="warning"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        );
      } else {
        return null;
      }
    }
    
    if (isRegistered && registrationStatus === 'Registered') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button 
          size="small" 
          startIcon={<CancelIcon />} 
          color="error"
          onClick={() => handleCancelClick(event.id)}
        >
          Cancel Registration
        </Button>
        </Box>
      );
    } else if (isRegistered && registrationStatus === 'Checked In') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Chip
          label="Checked In"
          color="success"
          icon={<CheckInIcon />}
        />
        </Box>
      );
    } else if (event.status === 'Registration Open') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button 
          size="small" 
          startIcon={<SignUpIcon />} 
          color="primary" 
          onClick={() => handleSignUpClick(event.id)}
        >
          Register
        </Button>
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
      const event = events.find(e => e.id === eventId) || null;
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
    setStartEventDialogOpen(true);
  };

  const handleStartEvent = async () => {
    try {
      if (!selectedEventForStarting) return;
      
      await eventsApi.startEvent(selectedEventForStarting.id.toString());
      setStartEventDialogOpen(false);
      setSelectedEventForStarting(null);
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    }
  };

  const handlePauseEventClick = (event: Event) => {
    setSelectedEventForPausing(event);
    setPauseEventDialogOpen(true);
  };

  const handlePauseEvent = async () => {
    try {
      if (!selectedEventForPausing) return;
      
      // Update the event status to 'Paused'
      await eventsApi.updateEventStatus(selectedEventForPausing.id.toString(), 'Paused');
      setPauseEventDialogOpen(false);
      setSelectedEventForPausing(null);
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to pause event');
    }
  };

  // Add a new function to handle resuming an event
  const handleResumeEvent = async (event: Event) => {
    try {
      await eventsApi.resumeEvent(event.id.toString());
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resume event');
    }
  };

  // Modified to show confirmation dialog only if event is in progress or paused
  const handleEndEventClick = (event: Event) => {
    if (event.status !== 'In Progress' && event.status !== 'Paused') {
      setErrorMessage('Events can only be ended when they are in progress or paused.');
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
      const event = events.find(e => e.id === eventId) || null;
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
              <Grid item xs={4}>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<StartIcon />}
                  onClick={() => handleStartEventClick(event)}
                  fullWidth
                  disabled={event.status === 'In Progress' || event.status === 'Completed' || event.status === 'Paused'}
                  sx={{ borderRadius: 1 }}
                >
                  Start
                </Button>
              </Grid>
              <Grid item xs={4}>
                {event.status === 'Paused' ? (
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    startIcon={<StartIcon />}
                    onClick={() => handleResumeEvent(event)}
                    fullWidth
                    sx={{ borderRadius: 1 }}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    startIcon={<PauseIcon />}
                    onClick={() => handlePauseEventClick(event)}
                    fullWidth
                    disabled={event.status !== 'In Progress'}
                    sx={{ borderRadius: 1 }}
                  >
                    Pause
                  </Button>
                )}
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<EndIcon />}
                  onClick={() => handleEndEventClick(event)}
                  fullWidth
                  disabled={event.status !== 'In Progress' && event.status !== 'Paused'}
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
              color="secondary"
              startIcon={<ViewIcon />}
              onClick={() => handleViewPins(event.id)}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              View Pins
            </Button>

            {/* View all schedules button - only visible when event is in progress or completed */}
            {(event.status === 'In Progress' || event.status === 'Paused' || event.status === 'Completed') && (
              <Button
                variant="outlined"
                size="small"
                color="info"
                startIcon={<ViewIcon />}
                onClick={() => handleViewAllSchedules(event.id)}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                View All Schedules
              </Button>
            )}
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
      setSelectedEventForAllSchedules(events.find(e => e.id === eventId) || null);
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
      let needsUpdate = false;

      for (const event of events) {
        const isRegistered = isRegisteredForEvent(event.id);
        const registrationStatus = event.registration?.status || null;

        // --- Add Log ---
        // Log conditions for *every* event in the loop
        console.log(`Event ${event.id}: Status=${event.status}, Registered=${isRegistered}, CheckInStatus=${registrationStatus}, AlreadyFetched=${userSchedules.hasOwnProperty(event.id)}`);
        // ---------------

        // Now check conditions to fetch
        if ((event.status === 'In Progress' || event.status === 'Paused') && isRegistered && registrationStatus === 'Checked In') {
          // Only fetch if we don\'t already have it
          if (!userSchedules.hasOwnProperty(event.id)) { 
            try {
              console.log(`Fetching schedule for event ${event.id}`);
              const response = await eventsApi.getSchedule(event.id.toString());
              if (response && response.schedule) {
                console.log(`Fetched schedule for event ${event.id}:`, response.schedule);
                schedulesToUpdate[event.id] = response.schedule;
                needsUpdate = true;
              } else {
                 console.log(`No schedule found for event ${event.id}`);
                 schedulesToUpdate[event.id] = []; 
                 needsUpdate = true;
              }
            } catch (err) {
              console.error(`Failed to fetch schedule for event ${event.id}:`, err);
              schedulesToUpdate[event.id] = []; 
              needsUpdate = true;
            }
          }
        }
      } // End of for loop

      if (needsUpdate) {
        setUserSchedules(prev => ({ ...prev, ...schedulesToUpdate }));
      }
    }; // End of fetchSchedulesForActiveEvents

    // Check if user data and events are loaded before fetching
    if (user && events.length > 0) {
        fetchSchedulesForActiveEvents();
    }
  // Dependencies: events array changes, user registration status changes
  }, [events, isRegisteredForEvent, user, userSchedules]); // Added userSchedules to prevent re-fetching if already present

  // ADD useEffect to check initial notification permission
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      // Show snackbar only if permission is default (not granted or denied)
      setShowNotificationSnackbar(currentPermission === 'default');
    } else {
      setShowNotificationSnackbar(false); // Don't show if notifications not supported
    }
  }, []);

  // ADD Functions to handle notification permission request
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'unsupported'; // Indicate unsupported
    }
    try {
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setShowNotificationSnackbar(false); // Hide snackbar after interaction
        return permission;
      }
      return Notification.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowNotificationSnackbar(false); // Hide snackbar on error
      return 'denied';
    }
  }, []);

  const handleEnableNotifications = () => {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted via EventList');
      } else {
        console.log(`Notification permission status: ${permission}`);
      }
    });
  };

  // Function to explicitly close the snackbar without enabling
  const handleCloseNotificationSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return; // Don't close on clickaway
    }
    setShowNotificationSnackbar(false);
  };

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
      // Show success feedback (e.g., a Snackbar or Alert)
      // For now, using a simple alert. Consider replacing with a Snackbar.
      alert('Speed date selections saved successfully!');
      // Optionally, you might want to close the dialog or refresh data
      // setViewAllSchedulesDialogOpen(false); 
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

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'flex-start', sm: 'space-between' }, // This will push title to left and button group to right
          alignItems: 'center', 
          mb: 4,
          flexDirection: { xs: 'row', sm: 'row' } 
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ fontWeight: 'bold' }}>
          Events
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}> {/* Grouping Box for buttons */}
          {user && (
            <Button
              variant="outlined" // Or "contained" based on your design preference
              color="secondary" // Or "primary"
              onClick={handleGlobalCheckInClick}
              startIcon={<CheckInIcon />}
              sx={{
                minWidth: { xs: 'auto', sm: 'inherit' }, 
                p: { xs: '6px 10px', sm: '6px 16px' },  // Reduced padding for xs
                fontSize: { xs: '0.75rem', sm: '0.875rem' } // Reduced font size for xs
              }}
            >
              {/* <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> */}
                Check-In
              {/* </Box> */}
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
                p: { xs: '6px 10px', sm: '6px 16px' },  // Reduced padding for xs
                fontSize: { xs: '0.75rem', sm: '0.875rem' } // Reduced font size for xs
              }}
            >
              {/* <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> */}
                Create Event
              {/* </Box> */}
            </Button>
          )}
        </Box>
      </Box>

      {showCreateCard && (isAdmin() || isOrganizer()) && (
        <Card sx={{ mb: 4, mt: isMobile ? 2 : 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create New Event
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Event Name"
                  name="name" // Ensure 'name' prop matches the state key
                  value={createForm.name}
                  onChange={handleChange} // This should now work
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description" // Ensure 'name' prop matches the state key
                  value={createForm.description}
                  onChange={handleChange} // This should now work
                  fullWidth
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date and Time"
                  name="starts_at" // Ensure 'name' prop matches the state key
                  type="datetime-local"
                  value={createForm.starts_at}
                  onChange={handleDateChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address"
                  name="address" // Ensure 'name' prop matches the state key
                  value={createForm.address}
                  onChange={handleChange} // This should now work
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Capacity"
                  name="max_capacity" // Ensure 'name' prop matches the state key
                  type="number"
                  value={createForm.max_capacity}
                  onChange={handleChange} // This should now work
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price Per Person"
                  name="price_per_person" // Ensure 'name' prop matches the state key
                  type="number"
                  value={createForm.price_per_person}
                  onChange={handlePriceChange} // Use specific handlePriceChange for its validation
                  fullWidth
                  InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="event-status-label">Status</InputLabel>
                  <Select
                    labelId="event-status-label"
                    name="status"
                    value={createForm.status}
                    label="Status"
                    onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as EventStatus }))} // Select might need specific handling or adapt handleChange
                  >
                    <MenuItem value="Registration Open">Registration Open</MenuItem>
                    <MenuItem value="Registration Closed">Registration Closed</MenuItem>
                    <MenuItem value="Upcoming">Upcoming</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Paused">Paused</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            <Button onClick={handleToggleCreateCard} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} variant="contained" color="primary">
              Create Event
            </Button>
          </CardActions>
        </Card>
      )}
      
      {/* Grid for displaying event cards */}
      {/* ... existing event cards grid ... */}

      {/* actual event cards */}
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
              <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}> {/* Reduced padding on xs */}
                {/* Align items center for better vertical alignment on wrap */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 2 }, flexWrap: 'wrap', gap: 1 /* Add gap for wrapping */ }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: isMobile ? '1.1rem' : '1.5rem', // Reduced font size on mobile
                      lineHeight: 1.2
                    }}
                  >
                    {event.name}
                  </Typography>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status)}
                    sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }} // Slightly smaller chip text on mobile
                    />
                  </Box>
                <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                        mb: { xs: 1, sm: 2 }, 
                        fontSize: isMobile ? '0.875rem' : '1rem' // Reduced font size for description
                    }}
                  >
                  {event.description}
                </Typography>
                </Box>
                
                {/* Add the Timer Component for Events in Progress or Paused */}
                {(event.status === 'In Progress' || event.status === 'Paused') && (
                  <Box sx={{ mb: { xs: 1.5, sm: 3 } }}> {/* Reduced bottom margin */}
                    <Divider sx={{ mb: { xs: 1, sm: 2 } }} />
                    <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}> {/* Reduced font size */}
                      Round Timer
                    </Typography>
                    {(() => {
                      // Moved logging logic outside the direct JSX return
                      const scheduleForTimer = isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In' ? userSchedules[event.id] : undefined;
                      console.log(`Passing userSchedule to EventTimer for event ${event.id}:`, scheduleForTimer);
                      return (
                        <EventTimer 
                          eventId={event.id} 
                          isAdmin={canManageEvent(event)} 
                          eventStatus={event.status} // Pass status down
                          userSchedule={scheduleForTimer} // Pass the determined schedule
                        />
                      );
                    })()}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}> {/* Reduced gap on xs */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' // Reduced font size for details
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
                      fontSize: isMobile ? '0.75rem' : '0.875rem' // Reduced font size for details
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    {event.max_capacity} attendees max
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem' // Reduced font size for details
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
                      fontSize: isMobile ? '0.75rem' : '0.875rem' // Reduced font size for details
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
                p: { xs: 1, sm: 2 }, // Reduced padding on xs
                pt: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1,
                justifyContent: 'flex-start' // Align buttons to the start
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
              Select Event
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
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleEventSelection(event.id)}
                >
                  <Typography variant="body1" fontWeight={500}>{event.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(event.starts_at)}
                  </Typography>
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
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Gender</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Birthday</strong></TableCell>
                    <TableCell><strong>Registered</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Check-in Time</strong></TableCell>
                    <TableCell><strong>PIN</strong></TableCell>
                    {(isAdmin() || isOrganizer()) && (
                      <TableCell><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {editingUserId === user.id ? (
                        // Edit mode - Render all cells, including placeholders/read-only for non-editable data
                        <>
                          <TableCell>
                            {/* Name Input */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField size="small" label="First Name" value={editFormData.first_name} onChange={(e) => handleEditFormChange(e.target.value, 'first_name')} sx={{ minWidth: 120 }} />
                              <TextField size="small" label="Last Name" value={editFormData.last_name} onChange={(e) => handleEditFormChange(e.target.value, 'last_name')} sx={{ minWidth: 120 }} />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {/* Email Input */}
                            <TextField size="small" label="Email" value={editFormData.email} onChange={(e) => handleEditFormChange(e.target.value, 'email')} sx={{ minWidth: 200 }} />
                          </TableCell>
                          <TableCell>
                            {/* Phone Input */}
                            <TextField size="small" label="Phone" value={editFormData.phone} onChange={(e) => handleEditFormChange(e.target.value, 'phone')} sx={{ minWidth: 120 }} />
                          </TableCell>
                          <TableCell>
                            {/* Gender Select */}
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <InputLabel>Gender</InputLabel>
                              <Select value={editFormData.gender} label="Gender" onChange={(e) => handleEditFormChange(e.target.value, 'gender')}> <MenuItem value="Male">Male</MenuItem> <MenuItem value="Female">Female</MenuItem> </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            {/* Age (Read-only) */}
                            {editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : ''}
                          </TableCell>
                          <TableCell>
                            {/* Birthday Input */}
                            <TextField size="small" label="Birthday" type="date" value={editFormData.birthday || ''} onChange={(e) => handleEditFormChange(e.target.value, 'birthday')} InputLabelProps={{ shrink: true }} sx={{ minWidth: 120 }} />
                          </TableCell>
                          <TableCell>
                            {/* Registered (Read-only) */}
                            {user.registration_date ? new Date(user.registration_date).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {/* Status (Read-only Chip) */}
                            <Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" />
                          </TableCell>
                          <TableCell>
                            {/* Check-in Time (Read-only) */}
                            {user.check_in_date ? new Date(user.check_in_date).toLocaleString() : 'Not checked in'}
                          </TableCell>
                          <TableCell>
                            {/* PIN Input */}
                            <TextField size="small" label="PIN" value={editFormData.pin || ''} onChange={(e) => handleEditFormChange(e.target.value, 'pin')} inputProps={{ maxLength: 4, pattern: '[0-9]*' }} sx={{ width: 65 }} />
                          </TableCell>
                          {(isAdmin() || isOrganizer()) && ( // Call isAdmin and isOrganizer as functions
                            <TableCell>
                              {/* Save/Cancel Actions */}
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" color="primary" onClick={() => handleSaveEdits(user.id)} title="Save"> <SaveIcon fontSize="small" /> </IconButton>
                                <IconButton size="small" color="error" onClick={handleCancelEditing} title="Cancel"> <CancelEditIcon fontSize="small" /> </IconButton>
                              </Box>
                            </TableCell>
                          )}
                        </>
                      ) : (
                        // View mode - Render all cells
                        <>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.gender}</TableCell>
                          <TableCell>{user.age}</TableCell>
                          <TableCell> {user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'} </TableCell>
                          <TableCell> {user.registration_date ? new Date(user.registration_date).toLocaleString() : 'N/A'} </TableCell>
                          <TableCell> <Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /> </TableCell>
                          <TableCell> {user.check_in_date ? new Date(user.check_in_date).toLocaleString() : 'Not checked in'} </TableCell>
                          <TableCell>{user.pin}</TableCell>
                          {(isAdmin() || isOrganizer()) && ( // Call isAdmin and isOrganizer as functions
                            <TableCell>
                              {/* Edit Action */}
                              <IconButton size="small" color="primary" onClick={() => handleStartEditing(user)} title="Edit"> <EditIcon fontSize="small" /> </IconButton>
                            </TableCell>
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
        <DialogActions>
          <Button onClick={() => setViewRegisteredUsersDialogOpen(false)}>Close</Button>
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
            This will change the event status to "In Progress".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStartEvent} color="success" variant="contained">
            Yes, Start Event
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Pause Event Confirmation Dialog */}
      <Dialog
        open={pauseEventDialogOpen}
        onClose={() => setPauseEventDialogOpen(false)}
      >
        <DialogTitle>Pause Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to pause the timer for "{selectedEventForPausing?.name}"?
            This will pause the event timer but keep the event status as "In Progress".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPauseEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePauseEvent} color="primary" variant="contained">
            Yes, Pause Timer
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
        maxWidth="md" // Consider "lg" or "xl" if table becomes too wide
        fullWidth
      >
        <DialogTitle>
          {selectedEventForAllSchedules?.name} - All Schedules
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}> {/* Remove padding on xs */}
          {loadingAllSchedules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>Loading all schedules...</Typography>
            </Box>
          ) : Object.keys(allSchedules).length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, px: 1 }}>
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
                      {/* ADD New TableCell for Interest Selection */}
                      <TableCell><strong>Interest</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(filteredSchedules).flatMap(([userId, userSchedule]) => {
                      // Skip if userSchedule is not an array or empty
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
                          {/* ADD Yes/No buttons for interest selection */}
                          <TableCell>
                            {item.event_speed_date_id ? ( // Ensure event_speed_date_id exists
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button
                                  variant={speedDateSelections[item.event_speed_date_id] === true ? 'contained' : 'outlined'}
                                  size="small"
                                  color="success"
                                  onClick={() => setSpeedDateSelections(prev => ({ ...prev, [item.event_speed_date_id]: true }))}
                                  sx={{ minWidth: '50px', p: '2px 6px', fontSize: '0.75rem' }}
                                >
                                  Yes
                                </Button>
                                <Button
                                  variant={speedDateSelections[item.event_speed_date_id] === false ? 'contained' : 'outlined'}
                                  size="small"
                                  color="error"
                                  onClick={() => setSpeedDateSelections(prev => ({ ...prev, [item.event_speed_date_id]: false }))}
                                  sx={{ minWidth: '50px', p: '2px 6px', fontSize: '0.75rem' }}
                                >
                                  No
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="textSecondary">N/A</Typography>
                            )}
                          </TableCell>
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
        <Link 
          component="a"
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
        </Link>
      </Box>

      {/* ADD Snackbar for Notification Permission Request */}
      <Snackbar
         open={showNotificationSnackbar} // Control visibility with state
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
         autoHideDuration={10000} // 10 seconds
         sx={{ position: 'fixed', bottom: 12, zIndex: theme.zIndex.snackbar + 1}} // Ensure it's above other elements if needed
       >
         <Alert 
           severity="info" 
           action={ // Button to trigger the permission request
             <Button color="inherit" size="medium" onClick={handleEnableNotifications}>
               Enable
             </Button>
           }
           onClose={handleCloseNotificationSnackbar} // Add explicit close 'X' button
           sx={{ width: '100%' }} // Ensure alert takes full width of snackbar
         >
           Enable browser notifications for event timer alerts
         </Alert>
       </Snackbar>
    </Container>
  );
};

export default EventList; 