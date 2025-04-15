import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import EventSelector from '../common/EventSelector';
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

const DateSchedule = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { events } = useEvents();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  // Filter events to only show those created by the current user
  const filteredEvents = events.filter(event => event.creator_id === user?.id);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedEventId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await eventsApi.getEventSchedule(selectedEventId);
        setSchedule(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedEventId]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddNote = (item: ScheduleItem) => {
    setSelectedItem(item);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedItem || !noteContent.trim()) return;

    try {
      await eventsApi.saveNote(selectedItem.eventId, selectedItem.participant1Id, noteContent);
      setNoteContent('');
      setNoteDialogOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Event Schedule
      </Typography>

      <EventSelector
        value={selectedEventId || ''}
        onChange={setSelectedEventId}
        filterStatus={['open', 'in_progress']}
        events={filteredEvents} // Pass filtered events
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : selectedEventId ? (
        schedule.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Table Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedule.map((item) => (
                  <TableRow 
                    key={item.id}
                    sx={{
                      backgroundColor: item.status === 'current' 
                        ? 'action.selected' 
                        : 'inherit'
                    }}
                  >
                    <TableCell>{formatTime(item.startTime)}</TableCell>
                    <TableCell>{formatTime(item.endTime)}</TableCell>
                    <TableCell>Table {item.tableNumber}</TableCell>
                    <TableCell>
                      <Typography
                        color={
                          item.status === 'completed'
                            ? 'success.main'
                            : item.status === 'current'
                            ? 'primary.main'
                            : 'text.secondary'
                        }
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleAddNote(item)}
                        title="Add Note"
                      >
                        <AddIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No schedule available for this event yet.
          </Alert>
        )
      ) : (
        <Alert severity="info">
          Please select an event to view its schedule.
        </Alert>
      )}

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
    </Container>
  );
};

export default DateSchedule; 