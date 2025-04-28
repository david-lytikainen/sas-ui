import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Grid, 
  Chip, 
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event as EventType } from '../../types/event';
import EventTimer from './EventTimer';

interface Schedule {
  round: number;
  table: number;
  partner_id: number;
  partner_name: string;
  partner_age: number;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isOrganizer } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // Use the direct getById method to fetch the event
        if (id) {
          const foundEvent = await eventsApi.getById(id);
          console.log('Found event:', foundEvent);
          setEvent(foundEvent);
        } else {
          setError('Invalid event ID');
        }
      } catch (err) {
        console.error('Failed to load event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!event || event.status !== 'In Progress') return;
      
      try {
        setLoadingSchedule(true);
        const response = await eventsApi.getSchedule(event.id.toString());
        setSchedule(response.schedule);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [event]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registration Open':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'error';
      case 'Paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const canManageEvent = (eventItem: EventType): boolean => {
    if (isAdmin()) return true;
    if (isOrganizer() && user && eventItem.creator_id === Number(user.id)) return true;
    return false;
  };
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" color="error">
            {error || 'Event not found'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                {event.name}
              </Typography>
              <Chip 
                label={event.status} 
                color={getStatusColor(event.status) as any}
                sx={{ fontWeight: 'bold' }} 
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TimeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Date & Time" 
                  secondary={formatDate(event.starts_at)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Location" 
                  secondary={event.address} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Capacity" 
                  secondary={`${event.max_capacity} people`} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MoneyIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Price" 
                  secondary={`$${parseFloat(event.price_per_person).toFixed(2)} per person`} 
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <InfoIcon sx={{ mr: 1 }} />
                  About This Event
                </Typography>
                <Typography variant="body1">
                  {event.description || 'No description provided.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Event Controls Section for Admins */}
      {canManageEvent(event) && (event.status === 'In Progress' || event.status === 'Paused') && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box 
            onClick={() => setControlsOpen(!controlsOpen)} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer', 
              justifyContent: 'space-between' 
            }}
          >
            <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} /> Event Controls
            </Typography>
            {controlsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={controlsOpen}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => navigate(`/admin/events/${event.id}/attendees`)}
                    sx={{ mb: 2 }}
                  >
                    Manage Attendees
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => navigate(`/events/${event.id}/pins`)}
                    sx={{ mb: 2 }}
                  >
                    View Pins
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => navigate(`/events/${event.id}/schedules`)}
                  >
                    View All Schedules
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Round Timer Control
                  </Typography>
                  <EventTimer 
                    eventId={event.id} 
                    isAdmin={true} 
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Show the timer for non-admin attendees */}
      {!canManageEvent(event) && (event.status === 'In Progress' || event.status === 'Paused') && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Round Timer
          </Typography>
          <EventTimer 
            eventId={event.id} 
            isAdmin={false} 
          />
        </Box>
      )}

      {/* Show the schedule if the event is in progress and the user has one */}
      {(event.status === 'In Progress' || event.status === 'Paused') && !loadingSchedule && schedule.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Schedule
          </Typography>
          <Grid container spacing={2}>
            {schedule.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={`round-${item.round}`}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Round {item.round}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Table:</strong> {item.table}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Partner:</strong> {item.partner_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Partner Age:</strong> {item.partner_age}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {(event.status === 'In Progress' || event.status === 'Paused') && !loadingSchedule && schedule.length === 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Schedule
          </Typography>
          <Typography variant="body1">
            No schedule available yet. Please check in with the event organizer.
          </Typography>
        </Paper>
      )}

      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/events')}
        >
          Back to Events
        </Button>
      </Box>
    </Container>
  );
};

export default EventDetail; 