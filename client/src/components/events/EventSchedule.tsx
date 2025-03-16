import React, { useState, useEffect, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
  useTheme,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Tooltip,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
  FormHelperText
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  TableBar as TableIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Done as DoneIcon,
  Save as SaveIcon,
  HowToReg as HowToRegIcon,
  Schedule as ScheduleIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';

interface ScheduleItem {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  startTime: string;
  endTime: string;
  tableNumber: number;
  status: 'upcoming' | 'current' | 'completed' | 'paused';
}

interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
}

// Admin Quick Links Component
const AdminQuickLinks = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const { isAdmin, isOrganizer, mockAttendeeMode } = useAuth();
  const theme = useTheme();
  
  // Don't show admin links in mock attendee mode
  if (mockAttendeeMode || (!isAdmin() && !isOrganizer())) return null;
  
  return (
    <Box 
      sx={{ 
        mb: 4, 
        p: 3, 
        borderRadius: 2,
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <Typography variant="h6" color="primary" gutterBottom>
        Event Management Tools
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Round Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage event rounds, schedule, and timing
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                startIcon={<PlayIcon />}
                onClick={() => navigate(`/events/${eventId}/live`)}
              >
                Live Controls
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Participant Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage check-ins and participant details
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                startIcon={<HowToRegIcon />}
                onClick={() => navigate(`/events/${eventId}/check-in`)}
              >
                Check-in Station
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Results & Reporting
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View matches and event statistics
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                startIcon={<EventIcon />}
                onClick={() => navigate(`/events/${eventId}`)}
              >
                Event Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Event List Component shown when no eventId is provided
const EventListForSchedule = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { isAdmin, isOrganizer, user, mockAttendeeMode } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Filter events to show only published and in_progress events
  const availableEvents = events.filter(event => 
    event.status === 'published' || event.status === 'in_progress'
  );
  
  // Modified filtering logic to respect mock attendee mode
  const filteredEvents = (!mockAttendeeMode && (isAdmin() || isOrganizer()))
    ? availableEvents // Admins and organizers see all available events
    : [
        ...availableEvents.filter(event => event.creator_id === user?.id), // Events created by user
        ...availableEvents.filter(event => event.status === 'in_progress') // ALL in-progress events should be visible to everyone
      ];
  
  const handleEventSelect = (eventId: string) => {
    navigate(`/events/${eventId}/schedule`);
  };
  
  if (eventsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (filteredEvents.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No events available. {(mockAttendeeMode || (!isAdmin() && !isOrganizer())) && "Please register for events to view their schedules."}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select an Event to View Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose an event from the dropdown below to view its detailed schedule
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, alignItems: 'center', gap: 2, mt: 3 }}>
          <Box sx={{ flexGrow: 1, width: {xs: '100%', sm: 'auto'} }}>
            <FormControl fullWidth>
              <InputLabel id="event-select-label">Event</InputLabel>
              <Select
                labelId="event-select-label"
                id="event-select"
                label="Event"
                defaultValue=""
                onChange={(e) => handleEventSelect(e.target.value as string)}
              >
                {filteredEvents.map((event) => (
                  <MenuItem 
                    key={event.id} 
                    value={event.id}
                    sx={{
                      borderLeft: event.id === '01c39e23-6a60-41ef-b7dc-8f990d7911ed' 
                        ? `4px solid ${theme.palette.primary.main}` 
                        : 'none',
                      fontWeight: event.id === '01c39e23-6a60-41ef-b7dc-8f990d7911ed' ? 'bold' : 'normal'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography variant="body1">
                        {event.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={event.status === 'in_progress' ? 'LIVE NOW' : 'UPCOMING'} 
                        color={event.status === 'in_progress' ? 'success' : 'primary'}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: {xs: '100%', sm: '200px'} }}
            onClick={() => handleEventSelect('01c39e23-6a60-41ef-b7dc-8f990d7911ed')}
          >
            View Christian Singles Mixer
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Available Events
      </Typography>
      <Grid container spacing={3}>
        {filteredEvents.map(event => (
          <Grid item xs={12} md={6} key={event.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                },
                borderLeft: event.id === '01c39e23-6a60-41ef-b7dc-8f990d7911ed' 
                  ? `4px solid ${theme.palette.primary.main}` 
                  : 'none'
              }}
              onClick={() => handleEventSelect(event.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {event.name}
                  </Typography>
                  <Chip 
                    label={event.status === 'in_progress' ? 'LIVE NOW' : 'UPCOMING'} 
                    color={event.status === 'in_progress' ? 'success' : 'primary'} 
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(event.starts_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Schedule
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const EventSchedule = (): ReactElement => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isAdmin, isOrganizer, mockAttendeeMode } = useAuth();
  const { events } = useEvents(); // Get events at the component level
  const theme = useTheme();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [nextMeeting, setNextMeeting] = useState<ScheduleItem | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<ScheduleItem | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [event, setEvent] = useState<any>(null);
  
  // State for dialogs and editing
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<ScheduleItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    tableNumber: 0
  });
  const [endEventDialogOpen, setEndEventDialogOpen] = useState(false);
  const [pauseRoundDialogOpen, setPauseRoundDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Batch edit state
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [timeAdjustmentMinutes, setTimeAdjustmentMinutes] = useState(0);
  const [applyToUpcomingOnly, setApplyToUpcomingOnly] = useState(true);

  // Check if user is admin or organizer, respecting mock attendee mode
  const canManageEvent = !mockAttendeeMode && (isAdmin() || isOrganizer());
  
  // If the user navigates directly to /schedule, check if we should redirect to a specific event
  useEffect(() => {
    const currentPath = window.location.pathname;
    // If we're at /schedule and there's a default event ID we can use
    if (currentPath === '/schedule' && !eventId) {
      const defaultEventId = '01c39e23-6a60-41ef-b7dc-8f990d7911ed';
      // Check if this event exists in the context
      const eventExists = events.some(e => e.id === defaultEventId);
      
      if (eventExists) {
        // Redirect to the event-specific schedule
        navigate(`/events/${defaultEventId}/schedule`, { replace: true });
      }
    }
  }, [navigate, eventId, events]);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // First fetch the event details to check status
        const eventData = await eventsApi.getEvent(eventId);
        setEvent(eventData);
        
        // Continue if the event is either published or in_progress
        if (eventData.status !== 'published' && eventData.status !== 'in_progress' && !canManageEvent) {
          setError('This event schedule is not available');
          setLoading(false);
          return;
        }
        
        const scheduleData: ScheduleItem[] = await eventsApi.getEventSchedule(eventId);
        setSchedule(scheduleData);
        
        // Fetch participant details for each schedule item
        const participantIds = new Set<string>();
        scheduleData.forEach(item => {
          participantIds.add(item.participant1Id);
          participantIds.add(item.participant2Id);
        });
        
        // In a real app, we would fetch participant details here
        // For now, we'll create mock data
        const participantsMap: Record<string, Participant> = {};
        Array.from(participantIds).forEach(id => {
          participantsMap[id] = {
            id: id,
            user_id: id,
            first_name: id === user?.id ? 'You' : `Partner ${id.substring(0, 4)}`,
            last_name: id === user?.id ? '' : `${id.substring(4, 8)}`,
          };
        });
        
        setParticipants(participantsMap);
      } catch (error: any) {
        setError(error.message || 'Failed to load schedule');
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [eventId, user?.id, canManageEvent]);

  // Update current time and determine current/next meeting
  useEffect(() => {
    if (!schedule.length) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      
      // Use the now variable for immediate calculations
      const current = schedule.find(item => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);
        return now >= start && now < end;
      });
      
      // Find next meeting
      const upcoming = schedule.filter(item => {
        const start = new Date(item.startTime);
        return now < start;
      }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
      
      setCurrentMeeting(current || null);
      setNextMeeting(upcoming || null);
      
      // Calculate time remaining for next meeting
      if (upcoming) {
        const startTime = new Date(upcoming.startTime).getTime();
        const diff = startTime - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setTimeRemaining(
            `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
          );
        } else {
          setTimeRemaining('Starting now');
        }
      } else {
        setTimeRemaining('');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [schedule]);

  // If no eventId is provided, show the event list
  if (!eventId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Schedule
        </Typography>
        <EventListForSchedule />
      </Container>
    );
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'current':
        return 'success';
      case 'upcoming':
        return 'primary';
      case 'completed':
        return 'default';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  // Function to navigate back to live event view
  const navigateToLiveView = () => {
    // If we have a specific event ID from URL, use that
    if (eventId) {
      navigate(`/events/${eventId}/live`);
    } else {
      // Otherwise, navigate to events page
      navigate('/events');
    }
  };

  // Add these functions to handle admin actions
  
  // Open edit dialog for a round
  const handleEditRound = (round: ScheduleItem) => {
    setSelectedRound(round);
    setEditFormData({
      startTime: new Date(round.startTime).toISOString().substring(0, 16),
      endTime: new Date(round.endTime).toISOString().substring(0, 16),
      tableNumber: round.tableNumber
    });
    setEditDialogOpen(true);
  };
  
  // Save edited round
  const handleSaveRound = async () => {
    if (!selectedRound) return;
    
    try {
      // In a real app, this would call an API to update the round
      console.log('Saving round changes:', selectedRound.id, editFormData);
      
      // Mock implementation - update local state
      const updatedSchedule = schedule.map(item => 
        item.id === selectedRound.id 
          ? {
              ...item,
              startTime: new Date(editFormData.startTime).toISOString(),
              endTime: new Date(editFormData.endTime).toISOString(),
              tableNumber: editFormData.tableNumber
            }
          : item
      );
      
      setSchedule(updatedSchedule);
      setSuccessMessage('Round updated successfully');
      setEditDialogOpen(false);
      
      // In a real app, refresh data from server
      // await fetchSchedule();
    } catch (error: any) {
      setError(error.message || 'Failed to update round');
    }
  };
  
  // Handle pausing a round
  const handlePauseRound = async (round: ScheduleItem) => {
    setPauseRoundDialogOpen(false); // Close dialog after action
    try {
      console.log('Pausing round:', round.id);
      
      // Mock implementation - update local state
      const updatedSchedule = schedule.map(item => 
        item.id === round.id 
          ? { ...item, status: 'paused' as const }
          : item
      );
      
      setSchedule(updatedSchedule);
      setSuccessMessage('Round paused successfully');
      
      // In a real app, call API and refresh data
      // await eventsApi.pauseRound(eventId, round.id);
      // await fetchSchedule();
    } catch (error: any) {
      setError(error.message || 'Failed to pause round');
    }
  };
  
  // Add function to open pause dialog
  const openPauseDialog = (round: ScheduleItem) => {
    setSelectedRound(round);
    setPauseRoundDialogOpen(true);
  };
  
  // Handle resuming a round
  const handleResumeRound = async (round: ScheduleItem) => {
    try {
      console.log('Resuming round:', round.id);
      setPauseRoundDialogOpen(true);
      
      
      // Mock implementation - update local state
      const updatedSchedule = schedule.map(item => 
        item.id === round.id 
          ? { ...item, status: 'current' as const }
          : item
      );
      
      setSchedule(updatedSchedule);
      setSuccessMessage('Round resumed successfully');
      
      // In a real app, call API and refresh data
      // await eventsApi.resumeRound(eventId, round.id);
      // await fetchSchedule();
    } catch (error: any) {
      setError(error.message || 'Failed to resume round');
    }
  };
  
  // Handle ending the event
  const handleEndEvent = async () => {
    if (!eventId) return;
    
    try {
      console.log('Ending event:', eventId);
      
      // In a real app, call API to complete the event
      await eventsApi.completeEvent(eventId);
      setSuccessMessage('Event completed successfully');
      
      // Redirect to events page after a short delay
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to end event');
    } finally {
      setEndEventDialogOpen(false);
    }
  };

  // Add this function to handle batch time adjustment
  const handleBatchTimeAdjust = () => {
    try {
      const adjustmentMs = timeAdjustmentMinutes * 60 * 1000; // Convert minutes to milliseconds
      
      // Update the schedule with adjusted times
      const updatedSchedule = schedule.map(item => {
        // Skip if not applying to completed rounds and this round is completed
        if (applyToUpcomingOnly && item.status === 'completed') {
          return item;
        }
        
        // Adjust start and end times
        const newStartTime = new Date(new Date(item.startTime).getTime() + adjustmentMs).toISOString();
        const newEndTime = new Date(new Date(item.endTime).getTime() + adjustmentMs).toISOString();
        
        return {
          ...item,
          startTime: newStartTime,
          endTime: newEndTime
        };
      });
      
      setSchedule(updatedSchedule);
      setSuccessMessage(`Schedule adjusted by ${timeAdjustmentMinutes > 0 ? '+' : ''}${timeAdjustmentMinutes} minutes`);
      setBatchEditDialogOpen(false);
      
      // Reset adjustment value
      setTimeAdjustmentMinutes(0);
    } catch (error: any) {
      setError(error.message || 'Failed to adjust schedule');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (schedule.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="300px"
        flexDirection="column"
        gap={2}
        sx={{ p: 3 }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            maxWidth: 500,
            background: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Your Schedule is Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              The event organizer will generate the schedule when the event starts. 
              Once it begins, you'll see your matches and meeting times here.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Check back once the event status changes to "IN PROGRESS"
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Sort schedule by start time
  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Get partner for current meeting
  const currentPartner = currentMeeting ? 
    participants[currentMeeting.participant1Id === user?.id 
      ? currentMeeting.participant2Id 
      : currentMeeting.participant1Id] : null;

  // Get partner for next meeting
  const nextPartner = nextMeeting ? 
    participants[nextMeeting.participant1Id === user?.id 
      ? nextMeeting.participant2Id 
      : nextMeeting.participant1Id] : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Event Schedule
      </Typography>
      
      {/* Event Status Banner */}
      {event && event.status === 'in_progress' && (
        <Alert 
          severity="info" 
          icon={<PlayIcon />} 
          sx={{ 
            mb: 3, 
            bgcolor: theme.palette.success.light + '30',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: theme.palette.success.dark }}>
                  Event is LIVE
                </Typography>
                <Typography variant="body2">
                  {currentMeeting ? 'Current round in progress' : nextMeeting ? 'Waiting for next round' : 'All rounds completed'}
                </Typography>
              </Box>
              {currentMeeting && (
                <Chip
                  color="success"
                  label={`Round ${sortedSchedule.findIndex(item => item.id === currentMeeting.id) + 1} of ${sortedSchedule.length}`}
                  sx={{ fontWeight: 'bold', fontSize: '1rem', height: 32 }}
                />
              )}
            </Box>
            
            {/* Current Round Details */}
            {currentMeeting && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mt: 1, 
                  bgcolor: theme.palette.success.light + '15',
                  border: `1px solid ${theme.palette.success.light}`
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Current Round</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Round {sortedSchedule.findIndex(item => item.id === currentMeeting.id) + 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Time Remaining</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {timeRemaining}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Table Number</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Table {currentMeeting.tableNumber}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            
            {/* Next Round Preview */}
            {!currentMeeting && nextMeeting && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mt: 1, 
                  bgcolor: theme.palette.primary.light + '15',
                  border: `1px solid ${theme.palette.primary.light}`
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Next Round</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Round {sortedSchedule.findIndex(item => item.id === nextMeeting.id) + 1} starts in {timeRemaining}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Table Assignment</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Table {nextMeeting.tableNumber}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </Alert>
      )}
      
      {/* Add Admin Quick Links */}
      <AdminQuickLinks eventId={eventId || ''} />
      
      {/* Status Cards (only shown for regular users, not for admins) */}
      {!canManageEvent && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Current Meeting Card */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                background: currentMeeting 
                  ? theme.palette.success.light + '20' 
                  : theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.02)',
                borderLeft: currentMeeting ? `4px solid ${theme.palette.success.main}` : 'none',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Meeting
                </Typography>
                {currentMeeting ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {currentPartner 
                          ? `${currentPartner.first_name} ${currentPartner.last_name}`.trim() 
                          : 'Unknown Partner'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(currentMeeting.startTime)} - {formatTime(currentMeeting.endTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TableIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Table {currentMeeting.tableNumber}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No active meeting at this time
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Next Meeting Card */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                background: nextMeeting 
                  ? theme.palette.primary.light + '20' 
                  : theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.02)',
                borderLeft: nextMeeting ? `4px solid ${theme.palette.primary.main}` : 'none',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Next Meeting
                </Typography>
                {nextMeeting ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {nextPartner 
                          ? `${nextPartner.first_name} ${nextPartner.last_name}`.trim() 
                          : 'Unknown Partner'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(nextMeeting.startTime)} - {formatTime(nextMeeting.endTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TableIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Table {nextMeeting.tableNumber}
                      </Typography>
                    </Box>
                    {timeRemaining && (
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`Starts in: ${timeRemaining}`} 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No more meetings scheduled
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Admin View Title */}
      {canManageEvent && !loading && !error && schedule.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Complete Event Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Showing all {sortedSchedule.length} scheduled rounds for all participants
            {event && event.status === 'in_progress' && ' - Event is currently LIVE'}
          </Typography>
        </Box>
      )}

      {/* Legend */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <InfoIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">
          Status Legend:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
          <Chip size="small" label="Current" color="success" />
          <Chip size="small" label="Upcoming" color="primary" />
          <Chip size="small" label="Completed" color="default" />
          <Chip size="small" label="Paused" color="default" />
        </Stack>
      </Box>

      {/* Batch Edit Button for admins */}
      {canManageEvent && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UpdateIcon />}
            onClick={() => setBatchEditDialogOpen(true)}
          >
            Batch Time Adjustment
          </Button>
        </Box>
      )}

      {/* Schedule Table */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Round</TableCell>
              <TableCell>Time</TableCell>
              {canManageEvent ? (
                <>
                  <TableCell>Participant 1</TableCell>
                  <TableCell>Participant 2</TableCell>
                </>
              ) : (
                <TableCell>Partner</TableCell>
              )}
              <TableCell>Table</TableCell>
              <TableCell>Status</TableCell>
              {canManageEvent && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSchedule.map((item, index) => {
              const partnerId = item.participant1Id === user?.id 
                ? item.participant2Id 
                : item.participant1Id;
              const partner = participants[partnerId];
              
              // Determine if this is the current meeting
              const isCurrentMeeting = currentMeeting?.id === item.id;
              
              // For regular users, only show their own meetings
              // For admins/organizers, show all meetings
              if (!canManageEvent && item.participant1Id !== user?.id && item.participant2Id !== user?.id) {
                return null;
              }
              
              return (
                <TableRow 
                  key={item.id}
                  sx={{
                    backgroundColor: isCurrentMeeting 
                      ? theme.palette.success.light + '20'
                      : item.status === 'upcoming'
                        ? theme.palette.primary.light + '10'
                        : 'inherit',
                    '&:hover': {
                      backgroundColor: isCurrentMeeting 
                        ? theme.palette.success.light + '30'
                        : theme.palette.action.hover,
                    },
                    position: 'relative',
                    ...(isCurrentMeeting && {
                      borderLeft: `4px solid ${theme.palette.success.main}`,
                      '& td:first-of-type': {
                        position: 'relative',
                        '&::before': {
                          content: '"CURRENT"',
                          position: 'absolute',
                          top: -12,
                          left: 16,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: theme.palette.success.main,
                          backgroundColor: theme.palette.background.paper,
                          padding: '2px 8px',
                          borderRadius: 4,
                          boxShadow: theme.shadows[1],
                        }
                      }
                    })
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={isCurrentMeeting ? 'bold' : 'normal'}
                        color={isCurrentMeeting ? 'success.main' : 'inherit'}
                      >
                        Round {index + 1}
                      </Typography>
                      {isCurrentMeeting && (
                        <PlayIcon 
                          fontSize="small" 
                          color="success"
                          sx={{ animation: 'pulse 2s infinite', '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 },
                          }}}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </Typography>
                  </TableCell>
                  {canManageEvent ? (
                    <>
                      <TableCell>
                        <Typography variant="body2">
                          {participants[item.participant1Id] 
                            ? `${participants[item.participant1Id].first_name} ${participants[item.participant1Id].last_name}`.trim() 
                            : 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {participants[item.participant2Id] 
                            ? `${participants[item.participant2Id].first_name} ${participants[item.participant2Id].last_name}`.trim() 
                            : 'Unknown'}
                        </Typography>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      <Typography variant="body2">
                        {partner ? `${partner.first_name} ${partner.last_name}`.trim() : 'Unknown Partner'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      Table {item.tableNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </TableCell>
                  {canManageEvent && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {/* Edit button */}
                        <Tooltip title="Edit Round">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRound(item)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Pause/Resume button */}
                        {item.status === 'current' ? (
                          <Tooltip title="Pause Round">
                            <IconButton
                              size="small"
                              onClick={() => openPauseDialog(item)}
                              color="warning"
                            >
                              <PauseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : item.status === 'paused' ? (
                          <Tooltip title="Resume Round">
                            <IconButton
                              size="small"
                              onClick={() => handleResumeRound(item)}
                              color="success"
                            >
                              <PlayIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Success message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}
      
      {/* Bottom buttons for admins/organizers */}
      {canManageEvent && (
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayIcon />}
              onClick={navigateToLiveView}
            >
              Go to Live Event View
            </Button>
            
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => setEndEventDialogOpen(true)}
            >
              End Event
            </Button>
          </Stack>
        </Box>
      )}
      
      {/* Edit Round Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Round</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Start Time"
              type="datetime-local"
              value={editFormData.startTime}
              onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="End Time"
              type="datetime-local"
              value={editFormData.endTime}
              onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Table Number"
              type="number"
              value={editFormData.tableNumber}
              onChange={(e) => setEditFormData({ ...editFormData, tableNumber: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveRound} 
            color="primary" 
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save Changes
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
            Are you sure you want to end this event? This will mark the event as completed and move it to the archived events list.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndEventDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEndEvent} 
            color="error" 
            variant="contained"
            startIcon={<DoneIcon />}
          >
            End Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Time Adjustment Dialog */}
      <Dialog
        open={batchEditDialogOpen}
        onClose={() => setBatchEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adjust Schedule Timing</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Shift all rounds forward or backward in time. Positive values move rounds later, negative values move rounds earlier.
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mb: 4 }}>
            <Typography id="time-adjustment-slider" gutterBottom>
              Time Adjustment (minutes): {timeAdjustmentMinutes > 0 ? '+' : ''}{timeAdjustmentMinutes}
            </Typography>
            <Slider
              value={timeAdjustmentMinutes}
              onChange={(e, newValue) => setTimeAdjustmentMinutes(newValue as number)}
              aria-labelledby="time-adjustment-slider"
              min={-60}
              max={60}
              marks={[
                { value: -60, label: '-60' },
                { value: -30, label: '-30' },
                { value: 0, label: '0' },
                { value: 30, label: '+30' },
                { value: 60, label: '+60' }
              ]}
            />
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch 
                checked={applyToUpcomingOnly} 
                onChange={(e) => setApplyToUpcomingOnly(e.target.checked)} 
              />
            }
            label="Apply to upcoming rounds only"
          />
          <FormHelperText>
            If checked, completed rounds will not be adjusted
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBatchTimeAdjust} 
            color="primary" 
            variant="contained"
            startIcon={<ScheduleIcon />}
            disabled={timeAdjustmentMinutes === 0}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Pause Round Confirmation Dialog */}
      <Dialog
        open={pauseRoundDialogOpen}
        onClose={() => setPauseRoundDialogOpen(false)}
      >
        <DialogTitle>Pause Round</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to pause the current round? This will temporarily stop the timer and notify all participants.
          </DialogContentText>
          {selectedRound && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Round Details:</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Round ${sortedSchedule.findIndex(item => item.id === selectedRound.id) + 1}`}
                    secondary={`${formatTime(selectedRound.startTime)} - ${formatTime(selectedRound.endTime)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TableIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={`Table ${selectedRound.tableNumber}`} />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPauseRoundDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedRound && handlePauseRound(selectedRound)} 
            color="warning" 
            variant="contained"
            startIcon={<PauseIcon />}
          >
            Pause Round
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventSchedule; 