import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';

interface AttendeePin {
  name: string;
  email: string;
  pin: string;
}

interface ViewPinsProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewPins = ({
  open,
  event,
  onClose,
}: ViewPinsProps) => {
  const theme = useTheme();
  const [attendeePins, setAttendeePins] = useState<AttendeePin[]>([]);
  const [filteredPins, setFilteredPins] = useState<AttendeePin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !event) return;

    const fetchPins = async () => {
      try {
        setSearchTerm('');
        setErrorMessage(null);
        const response = await eventsApi.getEventAttendeePins(event.id.toString());
        setAttendeePins(response.data);
        setFilteredPins(response.data);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch attendee pins');
      }
    };

    fetchPins();
  }, [open, event]);

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);

    if (!value || value.trim() === '') {
      setFilteredPins(attendeePins);
      return;
    }

    const lowercaseSearch = value.toLowerCase().trim();
    const isPinSearch = /^\d{4}$/.test(value);

    const filtered = attendeePins.filter(attendee => {
      if (isPinSearch) {
        return attendee.pin === value;
      }

      const nameWords = (attendee.name || '').toLowerCase().split(/\s+/);
      const nameMatch = nameWords.some(word => word.startsWith(lowercaseSearch));
      const emailUsername = (attendee.email || '').toLowerCase().split('@')[0];
      const emailMatch = emailUsername.startsWith(lowercaseSearch);

      return nameMatch || emailMatch;
    });

    setFilteredPins(filtered);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{event?.name} - Attendee PINs</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {attendeePins.length > 0 ? (
          <>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Search"
                placeholder="Search by name, email, or PIN..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      🔍
                    </Box>
                  ),
                }}
              />
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Showing {filteredPins.length} of {attendeePins.length} attendees
            </Typography>
            <List>
              {filteredPins.map((attendee, index) => (
                <ListItem key={index} divider={index < filteredPins.length - 1}>
                  <ListItemText
                    primary={attendee.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {attendee.email}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            display: 'block',
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                          }}
                        >
                          PIN: {attendee.pin}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No registered attendees with PINs found.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPins;
