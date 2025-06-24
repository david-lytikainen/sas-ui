import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Event as EventIcon,
  HowToReg as SignUpIcon,
  Cancel as CancelIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckInIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { Event, EventStatus, ScheduleItem } from '../../types/event';
import EventTimer from './EventTimer';
import EventControls from './EventControls';
import UserSchedule from './UserSchedule';

interface EventCardProps {
  event: Event;
  isRegisteredForEvent: (eventId: number) => boolean;
  canManageEvent: boolean;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: EventStatus) => 'success' | 'primary' | 'info' | 'error' | 'default';
  isRegistrationClosed: (event: Event) => boolean;
  
  // Action handlers
  onSignUpClick: (eventId: number) => void;
  onCancelClick: (eventId: number) => void;
  onCheckInClick: (event: Event) => void;
  
  // Event controls handlers
  expandedEventControls: number | null;
  setExpandedEventControls: (eventId: number | null) => void;
  onViewRegisteredUsers: (eventId: number) => void;
  onViewPins: (eventId: number) => void;
  onViewWaitlist: (event: Event) => void;
  onStartEvent: (event: Event) => void;
  onEndEvent: (event: Event) => void;
  onViewAllSchedules: (eventId: number) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: number) => void;
  
  // User schedule props
  userSchedule?: ScheduleItem[];
  expandedUserSchedules: Record<number, boolean>;
  onToggleUserSchedule: (eventId: number) => void;
  currentRounds: Record<number, number>;
  onCurrentRoundUpdate: (eventId: number, round: number) => void;
  attendeeSpeedDateSelections: Record<number, { eventId: number, interested: boolean }>;
  onAttendeeSelectionChange: (eventSpeedDateId: number, eventId: number, interested: boolean) => void;
  onSaveAttendeeSelections: (eventId: number) => Promise<boolean>;
  submittedEventIds: Set<number>;
  attendeeSelectionError: Record<number, string | null>;
  selectionWindowClosedError: Record<number, boolean>;
  saveIndicator: Record<number, boolean>;
  isSaveDisabled: (eventId: number) => boolean;
  onSubmitClick: (eventId: number) => void;
  onCopyEmail: (email: string) => void;
  getMatchMessage: (isMatch: boolean) => string;
  user: any;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegisteredForEvent,
  canManageEvent,
  formatDate,
  getStatusColor,
  isRegistrationClosed,
  
  // Action handlers
  onSignUpClick,
  onCancelClick,
  onCheckInClick,
  
  // Event controls handlers
  expandedEventControls,
  setExpandedEventControls,
  onViewRegisteredUsers,
  onViewPins,
  onViewWaitlist,
  onStartEvent,
  onEndEvent,
  onViewAllSchedules,
  onEditEvent,
  onDeleteEvent,
  
  // User schedule props
  userSchedule,
  expandedUserSchedules,
  onToggleUserSchedule,
  currentRounds,
  onCurrentRoundUpdate,
  attendeeSpeedDateSelections,
  onAttendeeSelectionChange,
  onSaveAttendeeSelections,
  submittedEventIds,
  attendeeSelectionError,
  selectionWindowClosedError,
  saveIndicator,
  isSaveDisabled,
  onSubmitClick,
  onCopyEmail,
  getMatchMessage,
  user,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const renderActionButtons = () => {
    const isUserRegistered = isRegisteredForEvent(event.id);
    const registrationStatus = event.registration?.status;

    // Handle Waitlisted status first
    if (registrationStatus === 'Waitlisted') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', width: '100%' }}>
          <Chip label="Waitlisted" color="warning" size="small" sx={{ alignSelf: 'flex-start' }} />
          <Button 
            size="small" 
            variant="outlined" 
            color="error" 
            onClick={() => onCancelClick(event.id)} 
            startIcon={<CancelIcon />} 
            sx={{ alignSelf: 'flex-start' }}
          >
            Leave Waitlist
          </Button>
        </Box>
      );
    }
    
    // If registered (and not waitlisted) and event is not completed or in progress
    if (isUserRegistered && registrationStatus !== 'Waitlisted' && event.status !== 'Completed' && event.status !== 'In Progress') {
      const chipLabel = registrationStatus === 'Checked In' ? 'Checked In' : 'Registered';
      const chipColor = registrationStatus === 'Checked In' ? 'success' : 'info';
      const chipIcon = registrationStatus === 'Checked In' ? <CheckInIcon /> : undefined;
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', width: '100%' }}>
          <Chip label={chipLabel} color={chipColor} icon={chipIcon} size="small" sx={{ alignSelf: 'flex-start' }} />
          {registrationStatus !== 'Checked In' && (
            <Button 
              size="small" 
              variant="outlined" 
              color="error" 
              onClick={() => onCancelClick(event.id)} 
              startIcon={<CancelIcon />} 
              sx={{ alignSelf: 'flex-start' }}
            >
              Cancel Registration
            </Button>
          )}
        </Box>
      );
    }

    // Standard Sign Up / Join Waitlist button logic refined
    const isUserNotRegisteredOrWaitlisted = !isUserRegistered && registrationStatus !== 'Waitlisted';

    if (event.status === 'Registration Open' && isUserNotRegisteredOrWaitlisted) {
      return (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SignUpIcon />} 
          onClick={() => onSignUpClick(event.id)}
          disabled={isRegistrationClosed(event)}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: {xs: 'stretch', sm: 'flex-start'} }}
        >
          Sign Up
        </Button>
      );
    }
    
    // @ts-expect-error TODO: Revisit TS error here
    if ((event.status as EventStatus) === 'Waitlist Open' && isUserNotRegisteredOrWaitlisted) {
      return (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SignUpIcon />} 
          onClick={() => onSignUpClick(event.id)}
          disabled={isRegistrationClosed(event)}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: {xs: 'stretch', sm: 'flex-start'} }}
        >
          Join Waitlist
        </Button>
      );
    }

    // Fallback for other statuses e.g. 'In Progress' where user is not checked in
    if (event.status === 'In Progress' && registrationStatus !== 'Checked In') {
        return <Chip label="Event In Progress" color="default" size="small" sx={{ alignSelf: 'flex-start' }} />;
    }

    return null; 
  };

  const renderCheckInButton = () => {
    const isUserRegistered = isRegisteredForEvent(event.id);
    const registrationStatus = event.registration?.status;
    const canCheckIn = isUserRegistered && registrationStatus !== 'Checked In' && (event.status === 'Registration Open' || event.status === 'In Progress');
    
    if (canCheckIn) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckInIcon />}
          sx={{ ml: 1, px: 2, py: 0.5, fontWeight: 600, fontSize: isMobile ? '0.8rem' : '1rem', borderRadius: 2, boxShadow: 1 }}
          onClick={() => onCheckInClick(event)}
        >
          Check-In
        </Button>
      );
    }
    return null;
  };

  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: theme.shadows[2],
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
      }
    }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 2 }, flexWrap: 'wrap', gap: 1}}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              lineHeight: 1.2
            }}
          >
            {event.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={event.status}
              color={getStatusColor(event.status)}
              sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            />
            {renderCheckInButton()}
          </Box>
        </Box>

        {event.status !== 'In Progress' && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                  mb: { xs: 1, sm: 2 }, 
                  fontSize: isMobile ? '0.85rem' : '1rem'
              }}
            >
              {event.description}
            </Typography>
          </Box>
        )}
        
        {(event.status === 'In Progress') && (
          <Box sx={{ mb: { xs: 1, sm: 3 } }}> 
            <Divider sx={{ mb: { xs: 0.5, sm: 2 } }} /> 
            <Box 
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1.25rem' },
                  mb: { xs: 0.5, sm: 2}
                }}
              >
                Round Timer
              </Typography>
              {canManageEvent && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontWeight: 500, fontSize:  { xs: '0.675rem', sm: '1rem' }}}
                >
                  Rounds: {event.num_rounds}, Tables: {event.num_tables}
                </Typography>
              )}
              {!canManageEvent && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500, fontSize:  { xs: '0.675rem', sm: '1rem' }}}
                >
                  Rounds: {event.num_rounds}
                </Typography>
              )}
            </Box>
            <EventTimer 
              eventId={event.id} 
              isAdmin={canManageEvent} 
              eventStatus={event.status} 
              userSchedule={userSchedule}
              onRoundChange={(round) => {
                onCurrentRoundUpdate(event.id, round);
              }}
            />
          </Box>
        )}
        
        {event.status !== 'In Progress' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}> 
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: isMobile ? '0.75rem' : '0.875rem' 
              }}
            >
              <EventIcon fontSize="small" />
              {formatDate(event.starts_at)}
            </Typography>
            {typeof event.registered_attendee_count === 'number' && event.max_capacity && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: isMobile ? '0.75rem' : '0.875rem' 
                }}
              >
                <PeopleIcon fontSize="small" />
                {`${event.registered_attendee_count}/${event.max_capacity} spots filled`}
              </Typography>
            )}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: isMobile ? '0.75rem' : '0.875rem' 
              }}
            >
              <AttachMoneyIcon fontSize="small" />
              ${parseFloat(event.price_per_person).toFixed(2)} per person
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: isMobile ? '0.75rem' : '0.875rem' 
              }}
            >
              <LocationOnIcon fontSize="small" />
              {event.address}
            </Typography>
          </Box>
        )}
        
        {/* Event admin controls */}
        <EventControls
          event={event}
          canManageEvent={canManageEvent}
          expandedEventControls={expandedEventControls}
          setExpandedEventControls={setExpandedEventControls}
          onViewRegisteredUsers={onViewRegisteredUsers}
          onViewPins={onViewPins}
          onViewWaitlist={onViewWaitlist}
          onStartEvent={onStartEvent}
          onEndEvent={onEndEvent}
          onViewAllSchedules={onViewAllSchedules}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
        />

        {/* My Schedule */}
        {isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In' && userSchedule && (
          <UserSchedule
            event={event}
            userSchedule={userSchedule}
            expanded={expandedUserSchedules[event.id] || false}
            onToggle={() => onToggleUserSchedule(event.id)}
            currentRound={currentRounds[event.id]}
            attendeeSpeedDateSelections={attendeeSpeedDateSelections}
            onSelectionChange={onAttendeeSelectionChange}
            onSaveSelections={onSaveAttendeeSelections}
            submittedEventIds={submittedEventIds}
            attendeeSelectionError={attendeeSelectionError}
            selectionWindowClosedError={selectionWindowClosedError}
            saveIndicator={saveIndicator}
            isSaveDisabled={isSaveDisabled}
            onSubmitClick={onSubmitClick}
            onCopyEmail={onCopyEmail}
            getMatchMessage={getMatchMessage}
            user={user}
          />
        )}
      </CardContent>
      <CardActions sx={{ 
        p: { xs: 1, sm: 2 }, 
        pt: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 1,
        justifyContent: 'flex-start' 
      }}>
        {renderActionButtons()}
      </CardActions>
    </Card>
  );
};

export default EventCard; 