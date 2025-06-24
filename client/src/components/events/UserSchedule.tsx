import React from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  Paper,
  Grid,
  Alert,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  List as ListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { Event, ScheduleItem } from '../../types/event';

interface UserScheduleProps {
  event: Event;
  userSchedule: ScheduleItem[];
  expanded: boolean;
  onToggle: () => void;
  currentRound?: number;
  attendeeSpeedDateSelections: Record<number, { eventId: number, interested: boolean }>;
  onSelectionChange: (eventSpeedDateId: number, eventId: number, interested: boolean) => void;
  onSaveSelections: (eventId: number) => Promise<boolean>;
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

const UserSchedule: React.FC<UserScheduleProps> = ({
  event,
  userSchedule,
  expanded,
  onToggle,
  currentRound,
  attendeeSpeedDateSelections,
  onSelectionChange,
  onSaveSelections,
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
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">
            My Schedule
          </Typography>
        </Box>
        {expanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%'}}>
        <Paper elevation={1} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default' }}>
          {userSchedule && userSchedule.length > 0 && event.num_rounds ? (
            <>
              {Array.from({ length: Number(event.num_rounds) }, (_, i) => {
                const roundNum = i + 1;
                const item = userSchedule.find(si => si.round === roundNum);
                const isLast = i === Number(event.num_rounds) - 1;
                const isCurrentRound = currentRound === roundNum && event.status === 'In Progress';
                const cardSx = {
                  mb: isLast ? 0 : 1,
                  p: { xs: 0.5, sm: 0.75 },
                  borderLeft: '3px solid',
                  borderColor: isCurrentRound ? theme.palette.success.main : theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
                  borderRadius: '4px',
                  backgroundColor: isCurrentRound ? (theme.palette.mode === 'dark' ? theme.palette.success.dark + '33' : theme.palette.success.light + '33') : theme.palette.action.hover,
                  transition: 'all 0.2s ease-in-out',
                  transform: isCurrentRound ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isCurrentRound ? theme.shadows[2] : 'none'
                };
                
                if (!item || !item.partner_id) {
                  // Break round card
                  return event.status !== 'Completed' && (
                    <Box key={`break-round-${roundNum}`} sx={cardSx}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}>
                            Round {roundNum} — Break Round
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                } else {
                  // Normal round card
                  return (
                    <Box key={item.event_speed_date_id || `round-${roundNum}`} sx={cardSx}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}>
                            {event.status !== 'Completed' ? `Round ${item.round}` : item.partner_name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              {event.status !== 'Completed' && (
                                <>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.1 }}>
                                    Table: {item.table}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>
                                    Partner: {item.partner_name} (Age: {item.partner_age || 'N/A'})
                                  </Typography>
                                </>
                              )}
                              {event.status === 'Completed' && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'primary.main',
                                    mt: 0.5,
                                    fontWeight: 'medium'
                                  }}
                                >
                                  {getMatchMessage(item.match)}
                                </Typography>
                              )}
                              {event.status === 'Completed' && item.match && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Box 
                                    component="span" 
                                    onClick={() => onCopyEmail(item.partner_email)}
                                    sx={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      color: 'text.secondary',
                                      '&:hover': { opacity: 0.8 }
                                    }}
                                  >
                                    <IconButton 
                                      size="small" 
                                      sx={{ 
                                        p: 0.25,
                                        mr: 1,
                                        color: 'inherit'
                                      }}
                                    >
                                      <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                                    </IconButton>
                                    {item.partner_email}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                            {event.status !== 'Completed' && item.event_speed_date_id && (
                              <Box sx={{
                                display: 'flex',
                                gap: 0.75,
                                ml: 2,
                                position: 'relative',
                                top: '-10px'
                              }}>
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'}
                                  size="small"
                                  color="success"
                                  onClick={() => onSelectionChange(item.event_speed_date_id, event.id, true)}
                                  sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  disabled={submittedEventIds.has(event.id)}
                                >
                                  Yes
                                </Button>
                                <Button
                                  variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'}
                                  size="small"
                                  color="error"
                                  onClick={() => onSelectionChange(item.event_speed_date_id, event.id, false)}
                                  sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}
                                  disabled={submittedEventIds.has(event.id)}
                                >
                                  No
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                }
              })}
              {attendeeSelectionError[event.id] && (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => {}}>
                  {attendeeSelectionError[event.id]}
                </Alert>
              )}
              {(event.status !== 'Completed' && submittedEventIds.has(event.id)) ? (
                  <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', mt: 1.5 }}>
                      Your selections have been submitted. Thank you for attending! 🎉
                  </Typography>
              ) : event.status !== 'Completed' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={() => onSaveSelections(event.id)}
                      disabled={isSaveDisabled(event.id)}
                      >
                      Save Selections
                      </Button>
                      {saveIndicator[event.id] && (
                      <Typography variant="body2" color="success.main">Saved!</Typography>
                      )}
                  </Box>
                  <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => onSubmitClick(event.id)}
                  >
                      Submit
                  </Button>
                  </Box>
              )}
              {selectionWindowClosedError[event.id] && (
                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                  Selection window closed (24 hours after event end).
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Your schedule will be populated once the event starts.
            </Typography>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default UserSchedule; 