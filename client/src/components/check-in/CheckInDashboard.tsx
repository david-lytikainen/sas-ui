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
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HowToReg as CheckInIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';

const CheckInDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isOrganizer } = useAuth();
  const { events, loading, error } = useEvents();
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  useEffect(() => {
    // Filter for active events (not cancelled or completed)
    const filtered = events.filter(event => 
      event.status !== 'cancelled' && event.status !== 'completed'
    );
    setActiveEvents(filtered);
  }, [events]);

  if (!isAdmin() && !isOrganizer()) {
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

  const handleManageCheckIn = (eventId: string) => {
    navigate(`/events/${eventId}/check-in`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'UPCOMING';
      case 'in_progress':
        return 'IN PROGRESS';
      case 'draft':
        return 'DRAFT';
      default:
        return status.toUpperCase();
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

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Check-in Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : activeEvents.length === 0 ? (
          <Alert severity="info">
            No active events found. Create an event to start managing check-ins.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{formatDate(event.starts_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{event.address}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckInIcon />}
                        onClick={() => handleManageCheckIn(event.id)}
                      >
                        Manage Check-in
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default CheckInDashboard; 