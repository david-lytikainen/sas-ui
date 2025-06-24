import React from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  List as ListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Stop as EndIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { Event } from '../../types/event';

interface EventControlsProps {
  event: Event;
  canManageEvent: boolean;
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
}

const EventControls: React.FC<EventControlsProps> = ({
  event,
  canManageEvent,
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
}) => {
  const theme = useTheme();

  if (!canManageEvent) return null;

  const isExpanded = expandedEventControls === event.id;

  return (
    <>
      <Box 
        sx={{ 
          mt: 1, 
          pt: 1, 
          borderTop: `1px dashed ${theme.palette.divider}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setExpandedEventControls(expandedEventControls === event.id ? null : event.id)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">
            Event Controls
          </Typography>
        </Box>
        {isExpanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ListIcon />}
            onClick={() => onViewRegisteredUsers(event.id)}
            fullWidth
            color="primary"
            sx={{ borderRadius: 1 }}
          >
            View Registered Users
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<ViewIcon />}
            onClick={() => onViewPins(event.id)}
            fullWidth
            sx={{ borderRadius: 1 }}
          >
            View Pins
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<ListIcon />}
            onClick={() => onViewWaitlist(event)}
            fullWidth
            sx={{ borderRadius: 1 }}
          >
            View Waitlist
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStartEvent(event)}
            fullWidth
            disabled={event.status === 'In Progress' || event.status === 'Completed'}
            sx={{ borderRadius: 1 }}
          >
            Generate Schedules
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<EndIcon />}
            onClick={() => onEndEvent(event)}
            fullWidth
            disabled={event.status !== 'In Progress'}
            sx={{ borderRadius: 1 }}
          >
            End
          </Button>

          {(event.status === 'In Progress' || event.status === 'Completed') && (
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ViewIcon />}
              onClick={() => onViewAllSchedules(event.id)}
              fullWidth
              sx={{ borderRadius: 1 }}
            >
              View All Schedules
            </Button>
          )}

          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => onEditEvent(event)}
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                Edit Event
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                color="primary"
                startIcon={<DeleteIcon />}
                onClick={() => onDeleteEvent(event.id)}
                fullWidth
                sx={{ borderRadius: 1, whiteSpace: 'nowrap' }}
                disabled={event.status === 'In Progress' || event.status === 'Completed'}
              >
                Delete Event
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </>
  );
};

export default EventControls; 