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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { HowToReg as CheckInIcon } from '@mui/icons-material';

const CheckInPage = () => {
  const { isAdmin } = useAuth();
  const { events, loading, error } = useEvents();
  const navigate = useNavigate();
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  useEffect(() => {
    // Filter for active events (not cancelled or completed)
    const filtered = events.filter(event => 
      event.status !== 'cancelled' && event.status !== 'completed'
    );
    setActiveEvents(filtered);
  }, [events]);

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

  const handleCheckIn = (eventId: string) => {
    navigate(`/check-in/${eventId}`);
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Event Check-in Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography>Loading events...</Typography>
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
                    <TableCell>
                      {new Date(event.starts_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{event.status}</TableCell>
                    <TableCell>{event.address}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckInIcon />}
                        onClick={() => handleCheckIn(event.id)}
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

export default CheckInPage; 