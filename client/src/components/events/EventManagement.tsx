import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  PlayArrow as StartIcon,
  CheckCircle as CheckInIcon,
  Save as SaveIcon,
  Event as EventIcon,
  HowToReg,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import EventCheckInStatus from '../check-in/EventCheckInStatus';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

interface Match {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  compatibilityScore: number;
  createdAt: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  status: string;
  starts_at: string;
  ends_at: string;
  address: string;
  price_per_person: number;
  max_capacity: number;
  registration_deadline: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  address: string;
  max_capacity: number;
  price_per_person: number;
  registration_deadline: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'in_progress';
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const EventManagement = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isOrganizer } = useAuth();
  const { updateEvent, refreshEvents } = useEvents();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [checkedInParticipants, setCheckedInParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<EventFormData>({
    name: event?.name || '',
    description: event?.description || '',
    starts_at: event?.starts_at || new Date().toISOString(),
    ends_at: event?.ends_at || new Date().toISOString(),
    address: event?.address || '',
    max_capacity: event?.max_capacity || 20,
    price_per_person: event?.price_per_person || 0,
    registration_deadline: event?.registration_deadline || new Date().toISOString(),
    status: event?.status as any || 'draft',
  });
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const loadEvent = async () => {
    try {
      const eventData = await eventsApi.getEvent(eventId!);
      setEvent(eventData);
      setFormData({
        name: eventData.name,
        description: eventData.description,
        starts_at: eventData.starts_at,
        ends_at: eventData.ends_at,
        address: eventData.address,
        max_capacity: eventData.max_capacity,
        price_per_person: eventData.price_per_person,
        registration_deadline: eventData.registration_deadline,
        status: eventData.status,
      });
    } catch (err) {
      setError('Failed to load event.');
    }
  };

  const loadCheckedInParticipants = useCallback(async () => {
    try {
      const participants = await eventsApi.getCheckedInParticipants(eventId!);
      setCheckedInParticipants(participants);
    } catch (error: any) {
      setError(error.message || 'Failed to load checked-in participants');
    }
  }, [eventId]);

  const loadEventMatches = useCallback(async () => {
    try {
      const matchData = await eventsApi.getEventMatches(eventId!);
      setMatches(matchData);
    } catch (error: any) {
      setError(error.message || 'Failed to load matches');
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadEvent(),
          loadCheckedInParticipants(),
          loadEventMatches(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [eventId, loadEvent, loadCheckedInParticipants, loadEventMatches]);

  const handleRunMatching = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await eventsApi.runMatching(eventId!);
      // Since the API returns a success message, we'll need to fetch matches separately
      const matchData = await eventsApi.getEventMatches(eventId!);
      setMatches(matchData);
      setSuccess('Successfully generated matches!');
      setActiveTab(1); // Switch to matches tab
    } catch (err: any) {
      setError(err.message || 'Failed to run matching algorithm');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      await eventsApi.checkInParticipant(eventId!, participantId);
      await loadCheckedInParticipants();
      setSuccess('Participant checked in successfully');
    } catch (err: any) {
      setError('Failed to check in participant');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (field: keyof EventFormData) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString()
      }));
    }
  };

  const handleSaveEvent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await updateEvent(eventId!, formData);
      await refreshEvents();
      setSuccess('Event updated successfully!');
      navigate('/events'); // Navigate back to events list after successful save
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await eventsApi.startEvent(eventId!);
      setSuccess('Event started successfully! Schedule and matches have been generated.');
      setStartDialogOpen(false);
      
      // Refresh events to get updated status
      await refreshEvents();
      await loadEvent();
    } catch (error: any) {
      setError(error.message || 'Failed to start event');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistrationCheckIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First, start the event
      await eventsApi.startEvent(eventId!);
      
      // Then run the matching algorithm
      await eventsApi.runMatching(eventId!);
      
      // Fetch updated matches and schedule
      const [matchData, scheduleData] = await Promise.all([
        eventsApi.getEventMatches(eventId!),
        eventsApi.getEventSchedule(eventId!)
      ]);
      
      setMatches(matchData);
      setSuccess('Registration check-in completed! Schedule and matches have been generated.');
      setActiveTab(1); // Switch to matches tab
      
      // Refresh event data to get updated status
      await refreshEvents();
      await loadEvent();
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration check-in');
    } finally {
      setLoading(false);
    }
  };

  if (!event || !user || (!isAdmin() && !isOrganizer())) {
    return (
      <Container>
        <Typography>You don't have permission to manage this event.</Typography>
      </Container>
    );
  }

  const isEventPublished = formData.status === 'published';
  const isEventInProgress = formData.status === 'in_progress';
  const canStartEvent = isEventPublished && !isEventInProgress;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Manage Event: {event.name}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, minWidth: '200px' }}>
            <Chip 
              label={formData.status.toUpperCase().replace('_', ' ')}
              color={
                formData.status === 'published' 
                  ? 'success' 
                  : formData.status === 'in_progress' 
                    ? 'primary' 
                    : 'default'
              }
              sx={{ justifySelf: 'flex-end', mb: 1 }}
            />
            
            {canStartEvent && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<StartIcon />}
                onClick={() => setStartDialogOpen(true)}
                disabled={loading}
                sx={{ height: 40 }}
              >
                Start Event
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EventIcon />}
              onClick={() => navigate(`/events/${event.id}/schedule`)}
              sx={{ height: 40 }}
            >
              View Schedule
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<HowToReg />}
              onClick={() => navigate(`/events/${event.id}/check-in`)}
              sx={{ height: 40 }}
            >
              Manage Check-in
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Event Details" />
              <Tab label="Check-in" />
              <Tab label="Matching" />
              <Tab label="Results" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Event Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={new Date(formData.starts_at)}
                  onChange={handleDateChange('starts_at')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={new Date(formData.ends_at)}
                  onChange={handleDateChange('ends_at')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Capacity"
                  name="max_capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price per Person"
                  name="price_per_person"
                  type="number"
                  value={formData.price_per_person}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Registration Deadline"
                  value={new Date(formData.registration_deadline)}
                  onChange={handleDateChange('registration_deadline')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    disabled={isEventInProgress}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    {isEventInProgress && <MenuItem value="in_progress">In Progress</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEvent}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Check-in Management
              </Typography>
            </Box>
            
            <EventCheckInStatus eventId={eventId || ''} embedded={true} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Matching Management
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRunMatching}
                disabled={loading || checkedInParticipants.length < 2}
                startIcon={loading ? <CircularProgress size={20} /> : <StartIcon />}
              >
                Run Matching Algorithm
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Match ID</TableCell>
                    <TableCell>Participant 1</TableCell>
                    <TableCell>Participant 2</TableCell>
                    <TableCell>Compatibility Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{match.id}</TableCell>
                      <TableCell>{match.participant1Id}</TableCell>
                      <TableCell>{match.participant2Id}</TableCell>
                      <TableCell>{match.compatibilityScore}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Event Results
            </Typography>
            {matches.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Round</TableCell>
                      <TableCell>Male Participant</TableCell>
                      <TableCell>Female Participant</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.id}</TableCell>
                        <TableCell>{match.participant1Id}</TableCell>
                        <TableCell>{match.participant2Id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No matches have been generated yet.</Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>

      <Dialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
      >
        <DialogTitle>Start Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Starting the event will generate the schedule and matches for all registered participants.
            This action cannot be undone. Are you sure you want to start this event?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStartEvent} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventManagement; 