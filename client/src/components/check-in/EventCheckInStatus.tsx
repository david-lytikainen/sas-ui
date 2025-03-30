import React, { useEffect, useState, useMemo } from 'react';
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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as StartIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { useEvents } from '../../context/EventContext';

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

interface Props {
  eventId?: string;
  embedded?: boolean;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

// Role constants
const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
};

const EventCheckInStatus: React.FC<Props> = ({ eventId: propEventId, embedded = false }) => {
  const { eventId: routeEventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isOrganizer, user, mockAttendeeMode } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'checked_in'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'registration_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const selectedEventId = propEventId || routeEventId;
  const { refreshEvents } = useEvents();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [startEventLoading, setStartEventLoading] = useState(false);

  // Redirect if not admin or organizer
  useEffect(() => {
    if (!isAdmin() && !isOrganizer()) {
      navigate('/');
    }
  }, [isAdmin, isOrganizer, navigate]);

  // Redirect attendees away from this page
  useEffect(() => {
    // Check if user is an attendee or in mock attendee mode
    if (user?.role_id === ROLES.ATTENDEE.id || mockAttendeeMode) {
      navigate('/events');
    }
  }, [user, mockAttendeeMode, navigate]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!selectedEventId) {
          setError('Event ID is missing');
          return;
        }

        setLoading(true);
        setError(null);
        
        try {
          const eventData = await eventsApi.getEvent(selectedEventId);
          setEvent(eventData);
        } catch (err) {
          console.error("Error loading event data:", err);
          setError('Failed to load event data');
          setLoading(false);
          return;
        }

        try {
          const participantsData = await eventsApi.getEventParticipants(selectedEventId);
          setParticipants(participantsData);
        } catch (err) {
          console.error("Error loading participants data:", err);
          setError('Failed to load participants data');
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("General error:", err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchEventData();
  }, [selectedEventId]);

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    return participants
      .filter(participant => {
        const matchesSearch = searchQuery === '' || 
          `${participant.first_name} ${participant.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.phone.includes(searchQuery);
        
        const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'registration_date':
            comparison = new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime();
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [participants, searchQuery, statusFilter, sortBy, sortOrder]);

  if (!isAdmin() && !isOrganizer()) {
    navigate('/events');
    return null;
  }

  const handleCheckIn = async (participantId: string) => {
    try {
      await eventsApi.checkInParticipant(selectedEventId!, participantId);
      const updatedParticipants = participants.map(p =>
        p.id === participantId ? { 
          ...p, 
          status: 'checked_in' as const, 
          check_in_time: new Date().toISOString() 
        } : p
      );
      setParticipants(updatedParticipants);
      setSuccessMessage('Participant checked in successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to check in participant');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancelCheckIn = async (participantId: string) => {
    try {
      await eventsApi.cancelCheckIn(selectedEventId!, participantId);
      const updatedParticipants = participants.map(p =>
        p.id === participantId ? { 
          ...p, 
          status: 'registered' as const, 
          check_in_time: undefined 
        } : p
      );
      setParticipants(updatedParticipants);
      setSuccessMessage('Check-in cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to cancel check-in');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddNote = (participant: Participant) => {
    setSelectedParticipant(participant);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedEventId || !selectedParticipant || !noteContent.trim()) return;

    try {
      await eventsApi.saveNote(selectedEventId, selectedParticipant.user_id, noteContent);
      setNoteContent('');
      setNoteDialogOpen(false);
      setSelectedParticipant(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    }
  };

  // Add a minimum required checked-in users constant
  const MIN_CHECKED_IN_USERS = 2;

  // Modify the handleCompleteRegistrationCheckIn function
  const handleCompleteRegistrationCheckIn = async () => {
    setStartEventLoading(true);
    setError(null);
    
    // Get number of checked-in participants
    const checkedInCount = participants.filter(p => p.status === 'checked_in').length;
    
    // Validate minimum required participants
    if (checkedInCount < MIN_CHECKED_IN_USERS) {
      setError(`At least ${MIN_CHECKED_IN_USERS} participants must be checked in to start the event.`);
      setStartEventLoading(false);
      return;
    }
    
    try {
      // First, start the event
      await eventsApi.startEvent(selectedEventId!);
      
      // Then run the matching algorithm
      await eventsApi.runMatching(selectedEventId!);
      
      // Refresh events to get updated status
      await refreshEvents();
      
      setSuccessMessage('Registration check-in completed! Schedule and matches have been generated.');
      
      // Navigate to the live event view after a short delay
      setTimeout(() => {
        navigate(`/events/${selectedEventId}/live`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration check-in');
    } finally {
      setStartEventLoading(false);
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box p={3}>
        <Alert severity="warning">Event not found</Alert>
      </Box>
    );
  }

  const handleSort = (column: 'name' | 'status' | 'registration_date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <Box p={3}>
      {!embedded && (
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/check-in')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Check-in Management
          </Typography>
        </Box>
      )}

      <Paper elevation={2} sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {event?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {formatDate(event?.starts_at)} - {formatDate(event?.ends_at)}
            </Typography>
            <Typography variant="body2">
              Location: {event?.address}
            </Typography>
          </Box>
          
          {/* Show for both published and in_progress events for admin/organizers */}
          {(event?.status === 'published' || event?.status === 'in_progress') && (isAdmin() || isOrganizer()) && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Check-in Progress: {participants.filter(p => p.status === 'checked_in').length} / {participants.length}
              </Typography>
              
              {event?.status === 'published' && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleCompleteRegistrationCheckIn}
                  disabled={startEventLoading || participants.filter(p => p.status === 'checked_in').length < MIN_CHECKED_IN_USERS}
                  startIcon={startEventLoading ? <CircularProgress size={20} /> : <StartIcon />}
                  sx={{ mt: 1 }}
                >
                  {startEventLoading ? 'Starting Event...' : 'Complete Check-In & Start Event'}
                </Button>
              )}
              
              {event?.status === 'published' && participants.filter(p => p.status === 'checked_in').length < MIN_CHECKED_IN_USERS && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                  At least {MIN_CHECKED_IN_USERS} participants must be checked in
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value as any)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="registered">Registered</MenuItem>
              <MenuItem value="checked_in">Checked In</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="registration_date">Registration Date</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </Stack>
      </Paper>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('name')}
                sx={{ cursor: 'pointer' }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell 
                onClick={() => handleSort('status')}
                sx={{ cursor: 'pointer' }}
              >
                Check-in Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParticipants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>{`${participant.first_name} ${participant.last_name}`}</TableCell>
                <TableCell>{participant.email}</TableCell>
                <TableCell>{participant.phone}</TableCell>
                <TableCell>{formatDate(participant.registration_date)}</TableCell>
                <TableCell>
                  {participant.status === 'checked_in' ? (
                    <Typography color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon fontSize="small" />
                      Checked in at {formatDate(participant.check_in_time!)}
                    </Typography>
                  ) : (
                    <Typography color="warning.main">Not checked in</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {participant.status === 'checked_in' ? (
                      <Tooltip title="Cancel Check-in">
                        <IconButton
                          onClick={() => handleCancelCheckIn(participant.id)}
                          color="error"
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleCheckIn(participant.id)}
                      >
                        Check In
                      </Button>
                    )}
                    <Tooltip title="Add Note">
                      <IconButton
                        onClick={() => handleAddNote(participant)}
                        color="primary"
                        size="small"
                      >
                        <NoteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNote} variant="contained" color="primary">
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventCheckInStatus; 