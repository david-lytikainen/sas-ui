import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
} as const;

const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { events, deleteEvent } = useEvents();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEventId) {
      await deleteEvent(selectedEventId);
      setDeleteDialogOpen(false);
      setSelectedEventId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const myEvents = events.filter(event => event.creator_id === user?.id);
  const publishedEvents = events.filter(event => event.status === 'published');

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Speed Dating Events
          </Typography>
          {(user?.role_id === ROLES.ORGANIZER.id || user?.role_id === ROLES.ADMIN.id) && (
            <Button
              variant="contained"
              startIcon={<EventIcon />}
              onClick={() => navigate('/events/new')}
            >
              Create Event
            </Button>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Events" />
            {(user?.role_id === ROLES.ORGANIZER.id || user?.role_id === ROLES.ADMIN.id) && (
              <Tab label="My Events" />
            )}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {publishedEvents.map(event => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name}
                      </Typography>
                      <Chip
                        label={event.status.toUpperCase()}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {formatDate(event.starts_at)}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {event.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {event.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price: ${event.price_per_person}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Capacity: {event.max_capacity} people
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/events/${event.id}`)}>
                      View Details
                    </Button>
                    {(user?.role_id === ROLES.ORGANIZER.id && event.creator_id === user.id) || user?.role_id === ROLES.ADMIN.id ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/events/edit/${event.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(event.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Button
                          size="small"
                          onClick={() => navigate(`/events/manage/${event.id}`)}
                          startIcon={<EventIcon />}
                        >
                          Manage Event
                        </Button>
                      </>
                    ) : null}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {myEvents.map(event => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {event.name}
                      </Typography>
                      <Chip
                        label={event.status.toUpperCase()}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {formatDate(event.starts_at)}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {event.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {event.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price: ${event.price_per_person}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Capacity: {event.max_capacity} people
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/events/${event.id}`)}>
                      View Details
                    </Button>
                    {(user?.role_id === ROLES.ORGANIZER.id && event.creator_id === user.id) || user?.role_id === ROLES.ADMIN.id ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/events/edit/${event.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(event.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Button
                          size="small"
                          onClick={() => navigate(`/events/manage/${event.id}`)}
                          startIcon={<EventIcon />}
                        >
                          Manage Event
                        </Button>
                      </>
                    ) : null}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EventList; 