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

interface ScheduleItem {
  round: number;
  table: number;
  partner_id: number;
  partner_name: string;
  partner_age: number;
  event_speed_date_id: number;
}

type Selections = {
  [key: number]: boolean | null;
};

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isOrganizer } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);

  const [selections, setSelections] = useState<Selections>({});
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // Use the direct getById method to fetch the event
        if (id) {
          const foundEvent = await eventsApi.getById(id);
          console.log('Found event:', foundEvent);
          // Ensure registered_attendee_count defaults to 0 if not a number
          if (foundEvent && typeof foundEvent.registered_attendee_count !== 'number') {
            foundEvent.registered_attendee_count = 0;
          }
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
        const scheduleWithDetails: ScheduleItem[] = response.schedule.map((item: any) => ({
          ...item,
          partner_age: item.partner_age ?? 'N/A',
          event_speed_date_id: item.event_speed_date_id
        }));
        setSchedule(scheduleWithDetails);

        const initialSelections: Selections = {};
        scheduleWithDetails.forEach((dateItem) => {
          if (dateItem.event_speed_date_id) {
            initialSelections[dateItem.event_speed_date_id] = null;
          }
        });
        setSelections(initialSelections);

      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [event, user]);

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

  const handleSelectionChange = (eventSpeedDateId: number, interested: boolean) => {
    setSelections(prevSelections => ({
      ...prevSelections,
      [eventSpeedDateId]: interested,
    }));
  };

  const handleSubmitSelections = async () => {
    if (!event || !user) {
        setError("Cannot submit selections: Event data or user data is missing.");
        return;
    }
    setLoadingSubmit(true);
    setError(null);

    const payload = Object.entries(selections)
      .filter(([, interested]) => interested !== null)
      .map(([eventSpeedDateIdStr, interested]) => ({
        event_speed_date_id: parseInt(eventSpeedDateIdStr),
        interested: interested as boolean,
      }));

    if (payload.length === 0) {
      setError("No selections made to submit.");
      setLoadingSubmit(false);
      return;
    }

    try {
      await eventsApi.submitSpeedDateSelections(event.id.toString(), payload);
      alert('Your choices have been submitted successfully!');
    } catch (err: any) {
      console.error('Failed to submit selections:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit your choices. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingSubmit(false);
    }
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
              {/* Add Spots Filled Display START */} 
              {typeof event.registered_attendee_count === 'number' && event.max_capacity && (
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Spots Filled" 
                    secondary={`${event.registered_attendee_count}/${event.max_capacity}`} 
                  />
                </ListItem>
              )}
              {/* Add Spots Filled Display END */}
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
      {canManageEvent(event) && (event.status === 'In Progress') && (
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
                    key={`admin-timer-${event.id}`}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Show the schedule if the event is in progress and the user has one */}
      {(event.status === 'In Progress') && !loadingSchedule && schedule.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Schedule
          </Typography>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <Grid container spacing={2}>
            {schedule.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.event_speed_date_id || `round-${item.round}`}>
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
                    {item.event_speed_date_id && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                        <Button
                          variant={selections[item.event_speed_date_id] === true ? "contained" : "outlined"}
                          color="success"
                          onClick={() => handleSelectionChange(item.event_speed_date_id, true)}
                          disabled={loadingSubmit}
                          size="small"
                        >
                          Yes
                        </Button>
                        <Button
                          variant={selections[item.event_speed_date_id] === false ? "contained" : "outlined"}
                          color="error"
                          onClick={() => handleSelectionChange(item.event_speed_date_id, false)}
                          disabled={loadingSubmit}
                          size="small"
                        >
                          No
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {schedule.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitSelections}
                disabled={
                  loadingSubmit || 
                  schedule.some(item => item.event_speed_date_id ? selections[item.event_speed_date_id] === null : false)
                }
              >
                {loadingSubmit ? <CircularProgress size={24} color="inherit" /> : 'Submit My Choices'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {(event.status === 'In Progress') && !loadingSchedule && schedule.length === 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Your Schedule
          </Typography>
          <Typography variant="body1">
            No schedule available yet. Please check in with the event organizer.
          </Typography>
        </Paper>
      )}

      {!canManageEvent(event) && (event.status === 'In Progress') && (
        <Box mb={4} mt={3}> {/* Added mt={3} for some spacing above the timer */}
          <Typography variant="h5" gutterBottom align="center"> {/* Optional: align center */}
            Round Timer
          </Typography>
          <EventTimer 
            eventId={event.id} 
            isAdmin={false}
            eventStatus={event.status} // Pass eventStatus to the timer
            userSchedule={schedule} // Pass userSchedule to the timer
            key={`attendee-timer-${event.id}`}
          />
        </Box>
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