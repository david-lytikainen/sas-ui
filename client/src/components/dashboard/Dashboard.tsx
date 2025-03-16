import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CardActions,
  Stack,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  HowToReg as CheckInIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Favorite as MatchesIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';

const DashboardCard = ({ 
  title, 
  description, 
  icon, 
  buttonText, 
  onClick,
  secondaryButton = null
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  onClick: () => void;
  secondaryButton?: { text: string; onClick: () => void } | null;
}) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        {icon}
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
    <CardActions>
      <Stack direction="row" spacing={1} width="100%">
        <Button
          variant="contained"
          size="small"
          onClick={onClick}
          startIcon={icon}
          fullWidth
        >
          {buttonText}
        </Button>
        {secondaryButton && (
          <Button
            variant="outlined"
            size="small"
            onClick={secondaryButton.onClick}
            fullWidth
          >
            {secondaryButton.text}
          </Button>
        )}
      </Stack>
    </CardActions>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events } = useEvents();

  const isAdmin = user?.role_id === 10;
  const isOrganizer = user?.role_id === 20;
  const isAttendee = user?.role_id === 30;

  const activeEventsCount = events.filter(e => e.status === 'published' || e.status === 'in_progress').length;
  const totalParticipants = events.reduce((acc, event) => acc + (event.max_capacity || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.first_name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You have {activeEventsCount} active events and {totalParticipants} total participant capacity.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Events Management */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Events"
            description="Manage your speed dating events, view registrations, and monitor event status."
            icon={<EventIcon color="primary" />}
            buttonText="View Events"
            onClick={() => navigate('/events')}
            secondaryButton={{
              text: "Create Event",
              onClick: () => navigate('/events/new')
            }}
          />
        </Grid>

        {/* Check-in Management */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Check-in"
            description="Manage participant check-ins for your events. Track attendance and verify participants."
            icon={<CheckInIcon color="primary" />}
            buttonText="Manage Check-ins"
            onClick={() => navigate('/check-in')}
          />
        </Grid>

        {/* Schedule Management */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Schedule"
            description="View and manage event schedules. Organize dates and track timing."
            icon={<ScheduleIcon color="primary" />}
            buttonText="View Schedules"
            onClick={() => navigate('/schedule')}
          />
        </Grid>

        {/* Notes Management */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Notes"
            description="Access and manage participant notes and feedback from events."
            icon={<NotesIcon color="primary" />}
            buttonText="View Notes"
            onClick={() => navigate('/notes')}
          />
        </Grid>

        {/* Matches Management */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Matches"
            description="Review and manage matches from your events. Track success rates."
            icon={<MatchesIcon color="primary" />}
            buttonText="View Matches"
            onClick={() => navigate('/matches')}
          />
        </Grid>

        {/* User Management - Admin Only */}
        {isAdmin && (
          <Grid item xs={12} md={6} lg={4}>
            <DashboardCard
              title="Users"
              description="Manage user accounts, roles, and permissions."
              icon={<PeopleIcon color="primary" />}
              buttonText="Manage Users"
              onClick={() => navigate('/users')}
            />
          </Grid>
        )}
      </Grid>

      {/* Quick Stats */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">{activeEventsCount}</Typography>
              <Typography color="text.secondary">Active Events</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">{totalParticipants}</Typography>
              <Typography color="text.secondary">Total Capacity</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">{events.length}</Typography>
              <Typography color="text.secondary">Total Events</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 