import { Box, Button, Card, CardActions, CardContent, Grid, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useEvents } from '../../context/EventContext';
import { EventStatus } from '../../types/event';
import { Event as EventIcon, LocationOn as LocationOnIcon, AttachMoney as AttachMoneyIcon, People as PeopleIcon } from '@mui/icons-material';

interface CreateEventProps {
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

const CreateEvent = ({ onCreated, onError }: CreateEventProps) => {
  const { createEvent } = useEvents();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const isCreateDisabled = !createForm.name || !createForm.description || !createForm.starts_at || !createForm.address || !createForm.max_capacity || !createForm.price_per_person;

  const handleCreateEvent = async () => {
    if (isCreateDisabled) {
      onError('All fields are required');
      return;
    }

    try {
      await createEvent({
        name: createForm.name,
        description: createForm.description,
        starts_at: createForm.starts_at,
        address: createForm.address,
        max_capacity: createForm.max_capacity,
        price_per_person: createForm.price_per_person,
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
    <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], mb: 3, mt: isMobile ? 1 : 0 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
          <TextField
            label="Event Name"
            name="name"
            value={createForm.name}
            onChange={handleChange}
            fullWidth
            required
            size={isMobile ? 'small' : 'medium'}
            margin="dense"
            sx={{
              '& .MuiInputBase-input': {
                fontWeight: 600,
                fontSize: isMobile ? '1.05rem' : '1.2rem'
              }
            }}
          />
        </Box>

        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <TextField
            name="description"
            value={createForm.description}
            onChange={handleChange}
            fullWidth
            required
            multiline
            rows={isMobile ? 2 : 4}
            placeholder="Description"
            size={isMobile ? 'small' : 'medium'}
            margin="dense"
          />
        </Box>

        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12}>
            <TextField
              label="Start Date and Time"
              name="starts_at"
              type="datetime-local"
              value={createForm.starts_at}
              onChange={handleDateChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
              margin="dense"
            />
          </Grid>
        </Grid>

        <Grid container spacing={isMobile ? 1 : 2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Max Capacity"
              name="max_capacity"
              type="number"
              value={createForm.max_capacity}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{ inputProps: { min: 1 } }}
              size={isMobile ? 'small' : 'medium'}
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Price Per Person"
              name="price_per_person"
              type="number"
              value={createForm.price_per_person}
              onChange={handlePriceChange}
              fullWidth
              required
              InputProps={{ inputProps: { min: 0, step: '0.01' } }}
              size={isMobile ? 'small' : 'medium'}
              margin="dense"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              value={createForm.address}
              onChange={handleChange}
              fullWidth
              required
              size={isMobile ? 'small' : 'medium'}
              margin="dense"
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ p: { xs: 1.5, sm: 2 }, pt: 1, display: 'block' }}>
        <Button
          onClick={handleCreateEvent}
          variant="contained"
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          fullWidth
          disabled={isCreateDisabled}
          sx={{ py: 1.1 }}
        >
          Create Event
        </Button>
      </CardActions>
    </Card>
  );
};

export default CreateEvent;
