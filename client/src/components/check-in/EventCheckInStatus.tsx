import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Alert,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'registered' | 'checked_in' | 'cancelled';
  checkInTime?: string;
}

// Mock data
const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    status: 'registered'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '(555) 234-5678',
    status: 'checked_in',
    checkInTime: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@example.com',
    phone: '(555) 345-6789',
    status: 'registered'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    phone: '(555) 456-7890',
    status: 'cancelled'
  }
];

const EventCheckInStatus = () => {
  const { id: eventId } = useParams();
  const { isAdmin } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>(mockParticipants);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const filtered = participants.filter(participant =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.phone.includes(searchTerm)
    );
    setFilteredParticipants(filtered);
  }, [searchTerm, participants]);

  const handleCheckIn = (participantId: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          status: 'checked_in',
          checkInTime: new Date().toISOString()
        };
      }
      return p;
    }));
    setMessage({ type: 'success', text: 'Participant checked in successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCancelCheckIn = (participantId: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          status: 'registered',
          checkInTime: undefined
        };
      }
      return p;
    }));
    setMessage({ type: 'success', text: 'Check-in cancelled successfully!' });
    setTimeout(() => setMessage(null), 3000);
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
        <Typography variant="h4" gutterBottom>
          Event Check-in Status
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Registered
                </Typography>
                <Typography variant="h4">
                  {participants.filter(p => p.status === 'registered').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Checked In
                </Typography>
                <Typography variant="h4" color="success.main">
                  {participants.filter(p => p.status === 'checked_in').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Cancelled
                </Typography>
                <Typography variant="h4" color="error.main">
                  {participants.filter(p => p.status === 'cancelled').length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or phone..."
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
                <TableCell>Participant</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon />
                      {participant.name}
                    </Box>
                  </TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={participant.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(participant.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {participant.checkInTime
                      ? new Date(participant.checkInTime).toLocaleTimeString()
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {participant.status === 'registered' && (
                      <Tooltip title="Check In">
                        <IconButton
                          color="success"
                          onClick={() => handleCheckIn(participant.id)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {participant.status === 'checked_in' && (
                      <Tooltip title="Cancel Check-in">
                        <IconButton
                          color="error"
                          onClick={() => handleCancelCheckIn(participant.id)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    )}
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

export default EventCheckInStatus; 