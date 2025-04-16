import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { SelectChangeEvent } from '@mui/material';
import { Event, EventStatus } from '../../types/event';

interface EventFormData {
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  address: string;
  max_capacity: number;
  price_per_person: string;
  registration_deadline: string;
  status: EventStatus;
}

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { user, isAdmin, isOrganizer } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveCompleted, setSaveCompleted] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    address: '',
    max_capacity: 20,
    price_per_person: '0',
    registration_deadline: new Date().toISOString(),
    status: 'Registration Open'
  });

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (user && !isAdmin() && !isOrganizer()) {
      navigate('/events');
    }
  }, [user, isAdmin, isOrganizer, navigate]);

  // Redirect attendees away from this page
  useEffect(() => {
    if (user?.role_id === ROLES.ATTENDEE.id) {
      navigate('/events');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (field: keyof EventFormData) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString()
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setSaveCompleted(false);

    try {
      if (!user) throw new Error('You must be logged in');
      if (user.role_id !== ROLES.ORGANIZER.id && user.role_id !== ROLES.ADMIN.id) {
        throw new Error('Only organizers can manage events');
      }


      await createEvent({ ...formData });
      setSuccess('Event created successfully!');

      // Set a flag that save was completed
      setSaveCompleted(true);
      
      // Navigate after a short delay to allow the user to see the success message
      setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Event
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={new Date(formData.starts_at)}
                  onChange={handleDateChange('starts_at')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={new Date(formData.ends_at)}
                  onChange={handleDateChange('ends_at')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Capacity"
                  name="max_capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price per Person"
                  name="price_per_person"
                  type="number"
                  value={formData.price_per_person}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Registration Deadline"
                  value={new Date(formData.registration_deadline)}
                  onChange={handleDateChange('registration_deadline')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="Registration Open">Registration Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || saveCompleted}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/events')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EventForm; 