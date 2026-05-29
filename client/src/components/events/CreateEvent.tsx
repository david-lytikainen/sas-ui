import { Button, Card, CardActions, CardContent, Grid, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useEvents } from '../../context/EventContext';
import { EventStatus } from '../../types/event';

interface CreateEventProps {
  onCancel: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}

const initialCreateForm = {
  name: '',
  description: '',
  starts_at: '',
  address: '',
  max_capacity: '',
  price_per_person: '',
};

const CreateEvent = ({ onCancel, onCreated, onError }: CreateEventProps) => {
  const { createEvent } = useEvents();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const handleCreateEvent = async () => {
    try {
      await createEvent({
        name: createForm.name || 'Unnamed Event',
        description: createForm.description || '',
        starts_at: createForm.starts_at,
        address: createForm.address || '',
        max_capacity: createForm.max_capacity || '10',
        price_per_person: createForm.price_per_person || '0',
        status: 'Registration Open' as EventStatus,
      });

      setCreateForm(initialCreateForm);
      onCreated();
    } catch (error: any) {
      onError(error.message || 'Failed to create event');
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCreateForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value) {
      const dateObj = new Date(value);
      const year = dateObj.getFullYear();

      if (year > 9999 || year < 1000 || isNaN(year)) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        setCreateForm(form => ({ ...form, starts_at: localDate.toISOString().slice(0, 16) }));
        return;
      }
    }

    setCreateForm(form => ({ ...form, starts_at: value }));
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setCreateForm(form => ({ ...form, price_per_person: value }));
    }
  };

  return (
    <Card sx={{ mb: 3, mt: isMobile ? 1 : 0 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: isMobile ? 1 : 2 }}>
          Create New Event
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Event Name" name="name" value={createForm.name} onChange={handleChange} fullWidth required size={isMobile ? 'small' : 'medium'} margin="dense" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" name="description" value={createForm.description} onChange={handleChange} fullWidth multiline rows={isMobile ? 2 : 4} size={isMobile ? 'small' : 'medium'} margin="dense" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start Date and Time"
              name="starts_at"
              type="datetime-local"
              value={createForm.starts_at}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
              size={isMobile ? 'small' : 'medium'}
              margin="dense"
              inputProps={{ style: { textAlign: 'left', paddingLeft: '12px' } }}
              sx={{
                '& .MuiInputBase-input': {
                  paddingRight: '14px',
                  WebkitAppearance: 'none',
                  textAlign: 'left !important',
                  direction: 'ltr !important',
                  '&::placeholder': { opacity: 0.7, color: 'text.secondary' },
                  '&::-webkit-calendar-picker-indicator': {
                    position: 'absolute',
                    right: 0,
                    padding: '8px',
                    marginRight: '4px',
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                    opacity: 0,
                    height: '24px',
                    width: '24px',
                    display: 'block',
                    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'rgba(0,0,0,0.54)\' d=\'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z\'/></svg>")',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 2
                  }
                },
                '& .MuiInputBase-root:has(input[value=""]):before': {
                  content: '"MM/DD/YYYY hh:mm"',
                  display: createForm.starts_at ? 'none' : 'block',
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgb(255, 255, 255)',
                  fontSize: '16px',
                  zIndex: 1
                },
                '& .MuiInputBase-root:after': { display: 'none' },
                '& .MuiOutlinedInput-root': { paddingRight: 0 },
                '& .MuiInputAdornment-root': { marginLeft: 0 },
                '& input[type="datetime-local"]': {
                  display: 'flex',
                  textAlign: 'left !important',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  paddingLeft: '12px !important',
                  '&::-webkit-date-and-time-value': { textAlign: 'left !important', margin: 0, opacity: createForm.starts_at ? 1 : 0 },
                  '&::-webkit-datetime-edit': { textAlign: 'left !important', paddingLeft: 0, opacity: createForm.starts_at ? 1 : 0 },
                  '&::-webkit-datetime-edit-fields-wrapper': { padding: 0, margin: 0, textAlign: 'left !important' },
                  '&::-webkit-datetime-edit-text': { padding: 0, margin: 0, textAlign: 'left !important' },
                  '&::-webkit-datetime-edit-hour-field, &::-webkit-datetime-edit-minute-field, &::-webkit-datetime-edit-day-field, &::-webkit-datetime-edit-month-field, &::-webkit-datetime-edit-year-field, &::-webkit-datetime-edit-ampm-field': { textAlign: 'left !important' },
                  '&:not([value]), &[value=""]': { color: 'transparent' }
                },
                '& input[type="datetime-local"][value]:not([value=""])': {
                  textAlign: 'left !important',
                  direction: 'ltr !important',
                  color: 'white !important',
                  '&::-webkit-datetime-edit': { paddingLeft: 0, textAlign: 'left !important', opacity: 1 }
                }
              }}
              InputProps={{
                endAdornment: (
                  <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{ opacity: 0.7, color: 'white' }}>
                      <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </div>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Address" name="address" value={createForm.address} onChange={handleChange} fullWidth size={isMobile ? 'small' : 'medium'} margin="dense" />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField label="Max Capacity" name="max_capacity" type="number" value={createForm.max_capacity} onChange={handleChange} fullWidth InputProps={{ inputProps: { min: 0 } }} size={isMobile ? 'small' : 'medium'} margin="dense" />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField label="Price Per Person" name="price_per_person" type="number" value={createForm.price_per_person} onChange={handlePriceChange} fullWidth InputProps={{ inputProps: { min: 0, step: '0.01' } }} size={isMobile ? 'small' : 'medium'} margin="dense" />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
        <Button onClick={onCancel} color="inherit" size={isMobile ? 'small' : 'medium'}>
          Cancel
        </Button>
        <Button onClick={handleCreateEvent} variant="contained" color="primary" size={isMobile ? 'small' : 'medium'}>
          Create Event
        </Button>
      </CardActions>
    </Card>
  );
};

export default CreateEvent;
