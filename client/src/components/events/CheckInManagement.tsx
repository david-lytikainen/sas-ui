import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface EventParticipant {
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

const CheckInManagement = ({ eventId }: { eventId: string }) => {
  const { isAdmin } = useAuth();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<EventParticipant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  useEffect(() => {
    filterParticipants();
  }, [searchTerm, participants]);

  const fetchParticipants = async () => {
    try {
      // Mock data - replace with actual API call
      const mockParticipants: EventParticipant[] = [
        {
          id: '1',
          user_id: 'user1',
          event_id: eventId,
          first_name: 'Jamie',
          last_name: 'FitzGerald',
          email: 'jamie@example.com',
          phone: '(555) 123-4567',
          status: 'registered',
          registration_date: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user2',
          event_id: eventId,
          first_name: 'Laura',
          last_name: 'Josuweit',
          email: 'laura@example.com',
          phone: '(555) 987-6543',
          status: 'registered',
          registration_date: new Date().toISOString(),
        },
      ];
      setParticipants(mockParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Failed to load participants');
    }
  };

  const filterParticipants = () => {
    const filtered = participants.filter(participant => {
      const searchString = searchTerm.toLowerCase();
      return (
        participant.first_name.toLowerCase().includes(searchString) ||
        participant.last_name.toLowerCase().includes(searchString) ||
        participant.email.toLowerCase().includes(searchString) ||
        participant.phone.includes(searchString)
      );
    });
    setFilteredParticipants(filtered);
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      // Mock API call - replace with actual API call
      const updatedParticipants = participants.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            status: 'checked_in' as const,
            check_in_time: new Date().toISOString(),
          };
        }
        return p;
      });
      setParticipants(updatedParticipants);
      setSuccessMessage('Participant checked in successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error checking in participant:', error);
      setError('Failed to check in participant');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancelCheckIn = async (participantId: string) => {
    try {
      // Mock API call - replace with actual API call
      const updatedParticipants = participants.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            status: 'registered' as const,
            check_in_time: undefined,
          };
        }
        return p;
      });
      setParticipants(updatedParticipants);
      setSuccessMessage('Check-in cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error cancelling check-in:', error);
      setError('Failed to cancel check-in');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'success';
      case 'registered':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!isAdmin()) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            You do not have permission to access this page.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Check-In Management
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchParticipants}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>

        {(error || successMessage) && (
          <Box sx={{ mb: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
          </Box>
        )}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search participants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registration Date</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    {participant.first_name} {participant.last_name}
                  </TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={participant.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(participant.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(participant.registration_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {participant.check_in_time
                      ? new Date(participant.check_in_time).toLocaleTimeString()
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {participant.status === 'registered' ? (
                      <Tooltip title="Check In">
                        <IconButton
                          color="success"
                          onClick={() => handleCheckIn(participant.id)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    ) : participant.status === 'checked_in' ? (
                      <Tooltip title="Cancel Check-in">
                        <IconButton
                          color="error"
                          onClick={() => handleCancelCheckIn(participant.id)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default CheckInManagement; 