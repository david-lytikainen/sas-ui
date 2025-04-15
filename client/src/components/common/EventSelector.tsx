import React from 'react';
import { useEvents } from '../../context/EventContext';
import { Event } from '../../context/EventContext';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface EventSelectorProps {
  value: string | null;
  onChange: (eventId: string | null) => void;
  events?: Event[];
  label?: string;
  filterStatus?: Array<Event['status']>;
}

const EventSelector: React.FC<EventSelectorProps> = ({
  value,
  onChange,
  events: propEvents,
  label = 'Event',
  filterStatus = ['open', 'in_progress']
}) => {
  const { events: contextEvents } = useEvents();
  const events = propEvents || contextEvents || [];

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value || null);
  };

  const filteredEvents = events.filter(event => filterStatus.includes(event.status));

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        label={label}
        onChange={handleChange}
      >
        {filteredEvents.map((event) => (
          <MenuItem key={event.id} value={event.id}>
            {event.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default EventSelector; 