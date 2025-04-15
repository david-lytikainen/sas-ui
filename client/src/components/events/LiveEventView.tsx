import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  ViewList as ViewListIcon,
  People as PeopleIcon,
  TableChart as TableIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { eventsApi } from '../../services/api';
import NextPlanIcon from '@mui/icons-material/NextPlan';
import StopIcon from '@mui/icons-material/Stop';
import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';

// Type definitions
interface ScheduleItem {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  startTime: string;
  endTime: string;
  tableNumber: number;
  status: 'upcoming' | 'current' | 'completed' | 'paused';
  isPaused?: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'registered' | 'checked_in' | 'cancelled';
  registration_date: string;
  check_in_time?: string;
}

interface Event {
  id: string;
  creator_id: string;
  starts_at: string;
  ends_at: string;
  address: string;
  name: string;
  max_capacity: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'in_progress';
  price_per_person: number;
  registration_deadline: string;
  description: string;
  updated_at: string;
  created_at: string;
}

interface Match {
  id: string;
  participant1Id: string;
  participant2Id: string;
  compatibilityScore: number;
}

const LiveEventView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin: authIsAdmin, isOrganizer: authIsOrganizer, mockAttendeeMode } = useAuth();
  const { refreshEvents } = useEvents();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  // Add a loader notification for when the event is first started
  const [isNewEvent, setIsNewEvent] = useState(false);

  // Round management state
  const [roundSettingsDialogOpen, setRoundSettingsDialogOpen] = useState(false);
  const [numRoundsDialogOpen, setNumRoundsDialogOpen] = useState(false);
  const [roundLengthDialogOpen, setRoundLengthDialogOpen] = useState(false);
  const [breakLengthDialogOpen, setBreakLengthDialogOpen] = useState(false);
  const [roundSettings, setRoundSettings] = useState({
    numberOfRounds: 10,
    roundLengthMinutes: 5,
    breakLengthMinutes: 2
  });

  // Match management state
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);

  // Helpers to check roles
  const checkIsAdmin = () => {
    // In test attendee mode, always return false
    if (mockAttendeeMode) return false;
    return authIsAdmin();
  };
  
  const checkIsOrganizer = () => {
    // Return false if no event exists
    if (!event) return false;
    // Check if user is the creator of the event
    return authIsOrganizer() || (user && event.creator_id === user.id);
  };
  
  // Check if the user can manage this event
  const canManageEvent = () => {
    return checkIsAdmin() || checkIsOrganizer();
  };

  // Function to refresh event data
  const refreshEventData = useCallback(async () => {
    if (!eventId) return;
    
    try {
      // Fetch schedule
      const scheduleData = await eventsApi.getEventSchedule(eventId);
      setSchedule(scheduleData);
      
      // Also refresh the event in case its status has changed
      const eventData = await eventsApi.getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error refreshing event data:', error);
    }
  }, [eventId]);

  // Load event data, schedule, matches and participants
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch event details
        const eventData = await eventsApi.getEvent(eventId);
        setEvent(eventData);
        
        // Fetch schedule
        const scheduleData = await eventsApi.getEventSchedule(eventId);
        setSchedule(scheduleData);
        
        // Fetch participants
        const participantsData = await eventsApi.getEventParticipants(eventId);
        setParticipants(participantsData);
        
        // Fetch matches
        const matchesData = await eventsApi.getEventMatches(eventId);
        setMatches(matchesData);
        
        // Check if this is a newly started event
        if (eventData.status === 'in_progress' && scheduleData.length > 0) {
          const hasActiveRounds = scheduleData.some(
            item => item.status === 'current' || item.status === 'upcoming'
          );
          
          // If we have a schedule but no active rounds, this might be a newly started event
          if (!hasActiveRounds) {
            setIsNewEvent(true);
          }
        }
      } catch (error: any) {
        console.error('Error loading event data:', error);
        setError(error.message || 'Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Format and sort schedule
  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Get current and next rounds
  const currentRound = sortedSchedule.find(item => item.status === 'current') || null;
  const nextRound = sortedSchedule.find(item => item.status === 'upcoming') || null;

  // Get all tables
  const tables = Array.from(new Set(sortedSchedule.map(item => item.tableNumber))).sort((a, b) => a - b);

  // Create a map of tables to their schedules
  const tableScheduleMap: Record<number, ScheduleItem[]> = {};
  tables.forEach(tableNum => {
    tableScheduleMap[tableNum] = [];
  });
  sortedSchedule.forEach(item => {
    tableScheduleMap[item.tableNumber].push(item);
  });

  // Update time remaining and progress
  useEffect(() => {
    if (!currentRound && !nextRound) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      
      // Calculate time remaining for current round
      if (currentRound && currentRound.status !== 'paused') {
        const endTime = new Date(currentRound.endTime);
        const startTime = new Date(currentRound.startTime);
        const totalDuration = endTime.getTime() - startTime.getTime();
        const elapsed = now.getTime() - startTime.getTime();
        const remaining = endTime.getTime() - now.getTime();
        
        // Calculate progress percentage
        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        setProgressPercent(progress);
        
        // Format time remaining
        if (remaining > 0) {
          const minutes = Math.floor(remaining / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('Ending...');
          // Auto-refresh data when a round should be ending
          if (remaining < -5000) { // 5 seconds grace period
            refreshEventData();
          }
        }
      }
      // Calculate time until next round starts
      else if (nextRound) {
        const startTime = new Date(nextRound.startTime);
        const remaining = startTime.getTime() - now.getTime();
        
        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          
          let timeStr = '';
          if (hours > 0) {
            timeStr += `${hours}h `;
          }
          timeStr += `${minutes}m ${seconds}s`;
          setTimeRemaining(timeStr);
        } else {
          setTimeRemaining('Starting...');
          // Auto-refresh data when a round should be starting
          if (remaining < -5000) { // 5 seconds grace period
            refreshEventData();
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentRound, nextRound, refreshEventData, eventId]);

  // Handle pausing a round
  const handlePauseRound = async (roundId: string) => {
    if (!roundId) return;
    
    try {
      // For now, let's just show a message since the API method doesn't exist yet
      console.log('Pausing round:', roundId);
      setSuccessMessage('Round paused successfully');
      await refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to pause round');
    }
  };

  // Handle resuming a round
  const handleResumeRound = async (roundId: string) => {
    if (!roundId) return;
    
    try {
      // For now, let's just show a message since the API method doesn't exist yet
      console.log('Resuming round:', roundId);
      setSuccessMessage('Round resumed successfully');
      await refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to resume round');
    }
  };

  // Format time helper
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color for visual indication
  const getStatusColor = (status: 'upcoming' | 'current' | 'completed' | 'paused') => {
    switch (status) {
      case 'current':
        return 'success';
      case 'upcoming':
        return 'primary';
      case 'completed':
        return 'default';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Handle generating a new schedule
  const handleGenerateNewSchedule = async () => {
    if (!eventId) return;
    
    try {
      // In a real app, this would call an API endpoint
      console.log('Generating new schedule for event:', eventId);
      
      // Update local state with new settings
      setRoundSettings({
        ...roundSettings,
      });
      
      setSuccessMessage('Schedule generated successfully');
      setRoundSettingsDialogOpen(false);
      
      // Refresh data to get the new schedule
      await refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to generate new schedule');
    }
  };

  // Handle ending the event
  const handleEndEvent = async () => {
    if (!eventId) return;
    
    try {
      // For now, let's just show a message since the API method doesn't exist yet
      console.log('Ending event:', eventId);
      setSuccessMessage('Event ended successfully');
      await refreshEvents();
      navigate('/events');
    } catch (error: any) {
      setError(error.message || 'Failed to end event');
    }
  };

  // Function to handle adding or removing rounds
  const handleUpdateNumRounds = (newNumRounds: number) => {
    try {
      // In a real app, this would call an API endpoint
      console.log('Updating number of rounds to:', newNumRounds);
      
      // Update local state
      setRoundSettings({
        ...roundSettings,
        numberOfRounds: newNumRounds
      });
      
      setSuccessMessage(`Number of rounds updated to ${newNumRounds}`);
      setNumRoundsDialogOpen(false);
      
      // Refresh data
      refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to update number of rounds');
    }
  };
  
  // Function to update round length
  const handleUpdateRoundLength = (newLengthMinutes: number) => {
    try {
      // In a real app, this would call an API endpoint
      console.log('Updating round length to:', newLengthMinutes, 'minutes');
      
      // Update local state
      setRoundSettings({
        ...roundSettings,
        roundLengthMinutes: newLengthMinutes
      });
      
      setSuccessMessage(`Round length updated to ${newLengthMinutes} minutes`);
      setRoundLengthDialogOpen(false);
      
      // Refresh data
      refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to update round length');
    }
  };
  
  // Function to update break length
  const handleUpdateBreakLength = (newLengthMinutes: number) => {
    try {
      // In a real app, this would call an API endpoint
      console.log('Updating break length to:', newLengthMinutes, 'minutes');
      
      // Update local state
      setRoundSettings({
        ...roundSettings,
        breakLengthMinutes: newLengthMinutes
      });
      
      setSuccessMessage(`Break length updated to ${newLengthMinutes} minutes`);
      setBreakLengthDialogOpen(false);
      
      // Refresh data
      refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to update break length');
    }
  };
  
  // Function to start the next round
  const handleStartNextRound = async () => {
    if (!eventId || !nextRound) return;
    
    try {
      // For now, let's just show a message since the API method doesn't exist yet
      console.log('Starting next round for event:', eventId);
      setSuccessMessage('Next round started successfully');
      await refreshEventData();
    } catch (error: any) {
      setError(error.message || 'Failed to start next round');
    }
  };

  // Load matches data
  useEffect(() => {
    const fetchMatches = async () => {
      if (!eventId || !event?.status) return;
      
      setMatchesLoading(true);
      try {
        const matchesData = await eventsApi.getEventMatches(eventId);
        setMatches(matchesData);
      } catch (error: any) {
        console.error('Error loading matches:', error);
        setError(error.message || 'Failed to load matches');
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchMatches();
  }, [eventId, event?.status]);

  // Handle running the matching algorithm
  const handleRunMatching = async () => {
    if (!eventId) return;
    
    setMatchesLoading(true);
    try {
      await eventsApi.runMatching(eventId);
      // Refresh matches after running algorithm
      const matchesData = await eventsApi.getEventMatches(eventId);
      setMatches(matchesData);
      setSuccessMessage('Matching completed successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to run matching');
    } finally {
      setMatchesLoading(false);
    }
  };

  // Get participant name helper
  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    return participant ? `${participant.first_name} ${participant.last_name}` : 'Unknown';
  };

  // Component layout
  return (
    <Box p={3}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : !event ? (
        <Alert severity="info">
          Event not found or no longer available.
        </Alert>
      ) : (
        <Container maxWidth="lg">
          {/* Header & Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {event?.name || 'Live Event'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate('/events')}
                variant="outlined"
                color="primary"
              >
                Back
              </Button>
              <Button 
                startIcon={<TableIcon />} 
                onClick={() => navigate(`/events/${eventId}/schedule`)}
                variant="contained"
                color="primary"
                sx={{ fontWeight: 'medium' }}
              >
                View Schedule
              </Button>
              {canManageEvent() && (
                <Button 
                  startIcon={<PeopleIcon />} 
                  onClick={() => navigate(`/events/${eventId}/participants`)}
                  variant="contained"
                  color="secondary"
                  sx={{ fontWeight: 'medium' }}
                >
                  Manage Users
                </Button>
              )}
            </Box>
          </Box>

          {/* Admin helper alert */}
          {canManageEvent() && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => navigate(`/events/${eventId}/check-in`)}
                >
                  MANAGE CHECK-IN
                </Button>
              }
            >
              As an admin, you can view the full event schedule, manage participants, and handle check-ins.
            </Alert>
          )}
          
          {/* Main content would go here */}
          <Box p={3}>
            {/* Success message */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}
            
            {/* New Event Alert */}
            {isNewEvent && (
              <Alert severity="info" sx={{ mb: 3 }} onClose={() => setIsNewEvent(false)}>
                Event has been started. Please configure your rounds in the Round Management section.
              </Alert>
            )}
            
            {/* Event Info Card */}
            <Paper elevation={2} sx={{ mb: 3, p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EventIcon color="primary" />
                    <Typography variant="h5">{event.name}</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {new Date(event.starts_at).toLocaleDateString()} {formatTime(event.starts_at)} - {formatTime(event.ends_at)}
                  </Typography>
                  <Typography variant="body2">Location: {event.address}</Typography>
                  {currentRound && (
                    <>
                      <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                        Round {sortedSchedule.findIndex(item => item.id === currentRound.id) + 1} of {sortedSchedule.length}
                      </Typography>
                      <Box sx={{ mt: 2, width: '100%' }}>
                        <LinearProgress variant="determinate" value={progressPercent} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Time Remaining: {timeRemaining}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      icon={<CheckIcon />}
                      label={`${participants.length} Checked In`} 
                      color="success" 
                    />
                    <Chip 
                      icon={<TableIcon />}
                      label={`${sortedSchedule.length} Rounds`} 
                      color={getStatusColor(currentRound?.status || 'completed')} 
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Status information and other content would go here */}
            <Typography variant="h5" gutterBottom>
              Event Status: <Chip 
                label={event.status.toUpperCase()} 
                color={getStatusColor(event.status === 'in_progress' ? 'current' : 'completed')}
                size="small"
              />
            </Typography>
            
            {event.status === 'in_progress' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1">
                  This event is currently in progress. You can view the schedule and manage participants.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Management Cards (Only for admins and organizers) */}
          {(canManageEvent()) && (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Grid container spacing={3}>
                {/* Event Control Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Event Control
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Control the event flow
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {currentRound && (
                          <>
                            {currentRound.status === 'current' ? (
                              <Button
                                variant="contained"
                                color="warning"
                                startIcon={<PauseIcon />}
                                onClick={() => handlePauseRound(currentRound.id)}
                              >
                                Pause Round
                              </Button>
                            ) : currentRound.status === 'paused' ? (
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<PlayIcon />}
                                onClick={() => handleResumeRound(currentRound.id)}
                              >
                                Resume Round
                              </Button>
                            ) : null}
                          </>
                        )}
                        {nextRound && (
                          <Button
                            variant="contained"
                            startIcon={<NextPlanIcon />}
                            onClick={() => handleStartNextRound()}
                          >
                            Start Next Round
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<StopIcon />}
                          onClick={() => handleEndEvent()}
                        >
                          End Event
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Match Management Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Match Management
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          View and manage participant matches
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setShowMatchesDialog(true)}
                          startIcon={<PeopleIcon />}
                        >
                          View Matches
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={handleRunMatching}
                          disabled={matchesLoading}
                          startIcon={<SettingsIcon />}
                        >
                          Run Matching
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Round Management Card */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Round Management
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Manage event rounds and timing
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          onClick={() => setRoundSettingsDialogOpen(true)}
                        >
                          All Round Settings
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ViewListIcon />}
                          onClick={() => setNumRoundsDialogOpen(true)}
                        >
                          Adjust Rounds
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<TimerIcon />}
                          onClick={() => setRoundLengthDialogOpen(true)}
                        >
                          Round Length
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<BreakfastDiningIcon />}
                          onClick={() => setBreakLengthDialogOpen(true)}
                        >
                          Break Length
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Container>
          )}
        </Container>
      )}

      {/* Round settings dialogs */}
      <Dialog open={numRoundsDialogOpen} onClose={() => setNumRoundsDialogOpen(false)}>
        <DialogTitle>Update Number of Rounds</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Specify the total number of rounds for this event.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Number of Rounds"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={roundSettings.numberOfRounds}
            inputProps={{ min: 1, max: 20 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNumRoundsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[type="number"]');
              if (input && input.value) {
                handleUpdateNumRounds(parseInt(input.value, 10));
              }
            }}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roundLengthDialogOpen} onClose={() => setRoundLengthDialogOpen(false)}>
        <DialogTitle>Update Round Length</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Specify the length of each round in minutes.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Round Length (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={roundSettings.roundLengthMinutes}
            inputProps={{ min: 5, max: 120, step: 5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoundLengthDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[type="number"]');
              if (input && input.value) {
                handleUpdateRoundLength(parseInt(input.value, 10));
              }
            }}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={breakLengthDialogOpen} onClose={() => setBreakLengthDialogOpen(false)}>
        <DialogTitle>Update Break Length</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Specify the length of breaks between rounds in minutes.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Break Length (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={roundSettings.breakLengthMinutes}
            inputProps={{ min: 0, max: 60, step: 5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakLengthDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[type="number"]');
              if (input && input.value) {
                handleUpdateBreakLength(parseInt(input.value, 10));
              }
            }}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={roundSettingsDialogOpen}
        onClose={() => setRoundSettingsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Round Settings</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText 
                primary="Number of Rounds" 
                secondary={`${roundSettings.numberOfRounds} rounds`} 
              />
              <Button onClick={() => setNumRoundsDialogOpen(true)}>Change</Button>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Round Length" 
                secondary={`${roundSettings.roundLengthMinutes} minutes`} 
              />
              <Button onClick={() => setRoundLengthDialogOpen(true)}>Change</Button>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Break Length" 
                secondary={`${roundSettings.breakLengthMinutes} minutes`} 
              />
              <Button onClick={() => setBreakLengthDialogOpen(true)}>Change</Button>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoundSettingsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateNewSchedule} 
            variant="contained" 
            color="primary"
          >
            Regenerate Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Matches Dialog */}
      <Dialog
        open={showMatchesDialog}
        onClose={() => setShowMatchesDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Event Matches</DialogTitle>
        <DialogContent>
          {matchesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : matches.length === 0 ? (
            <Typography color="text.secondary">
              No matches have been generated yet. Click "Run Matching" to create matches.
            </Typography>
          ) : (
            <List>
              {matches.map((match) => (
                <ListItem key={match.id} divider>
                  <ListItemText
                    primary={
                      <Typography>
                        {getParticipantName(match.participant1Id)} + {getParticipantName(match.participant2Id)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Compatibility Score: {match.compatibilityScore}%
                      </Typography>
                    }
                  />
                  <Button
                    startIcon={<PersonIcon />}
                    onClick={() => navigate(`/events/${eventId}/participants`)}
                    size="small"
                  >
                    Details
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMatchesDialog(false)}>Close</Button>
          <Button
            onClick={handleRunMatching}
            variant="contained"
            color="primary"
            disabled={matchesLoading}
          >
            Regenerate Matches
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveEventView; 