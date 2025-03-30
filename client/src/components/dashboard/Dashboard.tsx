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
  People as PeopleIcon,
  Settings as SettingsIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useTheme } from '@mui/material/styles';

interface Participant {
  user_id: string;
  status: string;
}

interface Event {
  id: string;
  status: 'draft' | 'published' | 'in_progress' | 'completed';
  creator_id: string;
  max_capacity: number;
  participants?: Participant[];
}

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
  const theme = useTheme();

  const isAdmin = user?.role_id === 1;
  const isOrganizer = user?.role_id === 2;
  const isAttendee = user?.role_id === 3;

  // Filter events based on user role
  const userEvents = (events as unknown as Event[]).filter(event => {
    if (isAdmin) return true; // Admins see all events
    if (isOrganizer) return event.creator_id === user?.id; // Organizers see their events
    if (isAttendee) return event.participants?.some((p: Participant) => p.user_id === user?.id); // Attendees see events they're in
    return false;
  });

  const activeEventsCount = userEvents.filter(e => e.status === 'published' || e.status === 'in_progress').length;
  const upcomingEventsCount = userEvents.filter(e => e.status === 'published').length;
  const completedEventsCount = userEvents.filter(e => e.status === 'completed').length;

  // Role-specific stats
  const getRoleSpecificStats = () => {
    if (isAdmin) {
      return [
        { label: 'Active Events', value: activeEventsCount },
        { label: 'Total Capacity', value: totalParticipants },
        { label: 'Total Events', value: events.length }
      ];
    }
    if (isOrganizer) {
      return [
        { label: 'My Events', value: userEvents.length },
        { label: 'Active Events', value: activeEventsCount },
        { label: 'Completed Events', value: completedEventsCount }
      ];
    }
    // Attendee stats
    return [
      { label: 'Upcoming Events', value: upcomingEventsCount },
      { label: 'Active Events', value: activeEventsCount },
      { label: 'Past Events', value: completedEventsCount }
    ];
  };

  const totalParticipants = events.reduce((acc, event) => acc + (event.max_capacity || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.first_name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isAdmin && `Managing ${activeEventsCount} active events with ${totalParticipants} total participant capacity.`}
          {isOrganizer && `You have ${activeEventsCount} active events and ${upcomingEventsCount} upcoming events.`}
          {isAttendee && `You have ${upcomingEventsCount} upcoming events to attend.`}
        </Typography>
      </Box>

      {/* Management Section - Only shown to Admin and Organizer */}
      {(isAdmin || isOrganizer) && (
        <>
          <Typography variant="h5" gutterBottom color="primary">
            Management Tools
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Event Creation - Admin & Organizer Only */}
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Create Event"
                description="Create and manage new speed dating events. Set details, location, and participant limits."
                icon={<AddCircleIcon color="primary" />}
                buttonText="Create Event"
                onClick={() => navigate('/events/new')}
              />
            </Grid>

            {/* Event Management - Admin & Organizer Only */}
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Manage Events"
                description="View and manage your existing events. Edit details, track registrations, and analyze results."
                icon={<EventIcon color="primary" />}
                buttonText="Manage Events"
                onClick={() => navigate('/events')}
              />
            </Grid>

            {/* Check-in Management - Admin & Organizer Only */}
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Check-in"
                description="Manage participant check-ins for your events. Track attendance and verify participants."
                icon={<CheckInIcon color="primary" />}
                buttonText="Manage Check-ins"
                onClick={() => navigate('/check-in')}
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      )}

      {/* Attendee Section - Only shown to Attendees */}
      {isAttendee && (
        <>
          <Typography variant="h5" gutterBottom color="primary">
            Event Registration
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Browse Events"
                description="Browse and register for upcoming speed dating events in your area."
                icon={<EventIcon color="primary" />}
                buttonText="Find Events"
                onClick={() => navigate('/events')}
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      )}

      {/* Event Activities Section */}
      <Typography variant="h5" gutterBottom color="primary">
        Event Activities
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Schedule View - All Users */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Schedule"
            description={isAttendee 
              ? "View your event schedules and upcoming matches."
              : "View and manage event schedules. Organize dates and track timing."}
            icon={<ScheduleIcon color="primary" />}
            buttonText="View Schedule"
            onClick={() => navigate('/schedule')}
          />
        </Grid>

        {/* Notes Management - All Users */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Notes"
            description={isAttendee
              ? "Take notes during your dates and review them later."
              : "Access and manage participant notes and feedback from events."}
            icon={<NotesIcon color="primary" />}
            buttonText="View Notes"
            onClick={() => navigate('/notes')}
          />
        </Grid>

        {/* Matches Management - All Users */}
        <Grid item xs={12} md={6} lg={4}>
          <DashboardCard
            title="Matches"
            description={isAttendee
              ? "View your matches and connect with people you liked."
              : "Review and manage matches from your events. Track success rates."}
            icon={<MatchesIcon color="primary" />}
            buttonText="View Matches"
            onClick={() => navigate('/matches')}
          />
        </Grid>
      </Grid>

      {/* System Settings Section - Only displayed for Admin and Organizer */}
      {(isAdmin || isOrganizer) && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" gutterBottom color="primary">
            System Settings
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* User Management - Admin Only */}
            {isAdmin && (
              <Grid item xs={12} md={6} lg={4}>
                <DashboardCard
                  title="Users"
                  description="Manage user accounts, roles, and permissions."
                  icon={<PeopleIcon color="primary" />}
                  buttonText="Manage Users"
                  onClick={() => navigate('/users')}
                  secondaryButton={{
                    text: "Add User",
                    onClick: () => navigate('/users/new')
                  }}
                />
              </Grid>
            )}

            {/* Settings - All Users */}
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Settings"
                description="Configure event settings, notifications, and system preferences."
                icon={<SettingsIcon color="primary" />}
                buttonText="Open Settings"
                onClick={() => navigate('/settings')}
              />
            </Grid>
          </Grid>
        </>
      )}
      
      {/* Settings section for Attendees - simplified */}
      {isAttendee && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" gutterBottom color="primary">
            Your Settings
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6} lg={4}>
              <DashboardCard
                title="Account Settings"
                description="Manage your profile, preferences, and notification settings."
                icon={<SettingsIcon color="primary" />}
                buttonText="Open Settings"
                onClick={() => navigate('/settings')}
              />
            </Grid>
          </Grid>
        </>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Quick Stats */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom color="primary">
          Quick Stats
        </Typography>
        <Grid container spacing={3}>
          {getRoleSpecificStats().map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderTop: `4px solid ${theme.palette.primary.main}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h4" color="primary" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 