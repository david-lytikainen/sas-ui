import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  SelectChangeEvent,
} from '@mui/material';
import { useEvents } from '../../context/EventContext';

interface Event {
  id: string;
  name: string;
  starts_at: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'in_progress';
}

interface Props {
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  filterStatus?: ('draft' | 'published' | 'cancelled' | 'completed' | 'in_progress')[];
  events?: Event[];
}

const EventSelector: React.FC<Props> = ({ 
  selectedEventId, 
  onEventSelect, 
  filterStatus = ['published', 'in_progress'],
  events: propEvents,
}) => {
  const { events: contextEvents } = useEvents();
  const events = propEvents || contextEvents;

  const filteredEvents = events.filter(event => filterStatus.includes(event.status));

  const handleChange = (event: SelectChangeEvent<string>) => {
    onEventSelect(event.target.value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (filteredEvents.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography color="text.secondary">
          No events available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel>Select Event</InputLabel>
        <Select
          value={selectedEventId || ''}
          label="Select Event"
          onChange={handleChange}
        >
          {filteredEvents.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              <Box>
                <Typography variant="subtitle1">
                  {event.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(event.starts_at)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};

export default EventSelector; 