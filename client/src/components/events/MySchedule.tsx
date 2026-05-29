import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Collapse, Grid, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { ContentCopy as ContentCopyIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, List as ListIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, ScheduleItem } from '../../types/event';

interface MyScheduleProps {
  event: Event;
  currentRound: number | undefined;
}

const getPersistedSelections = (eventId: number): Record<number, boolean> => {
  const selections = localStorage.getItem(`attendeeSelections_${eventId}`);
  return selections ? JSON.parse(selections) : {};
};

const persistSelection = (eventId: number, eventSpeedDateId: number, interested: boolean) => {
  const selections = getPersistedSelections(eventId);
  selections[eventSpeedDateId] = interested;
  localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
};

const persistAllSelectionsForEvent = (eventId: number, selections: Record<number, boolean>) => {
  localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
};

const MySchedule = ({ event, currentRound }: MyScheduleProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [attendeeSpeedDateSelections, setAttendeeSpeedDateSelections] = useState<Record<number, { eventId: number, interested: boolean }>>({});
  const [savedAttendeeSelections, setSavedAttendeeSelections] = useState<Record<number, boolean>>({});
  const [attendeeSelectionError, setAttendeeSelectionError] = useState<string | null>(null);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [selectionWindowClosedError, setSelectionWindowClosedError] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    if (!(event.status === 'In Progress' || event.status === 'Completed')) return;
    if (schedule !== null) return;

    const loadSchedule = async () => {
      try {
        const response = await eventsApi.getSchedule(event.id.toString());
        const nextSchedule = response?.schedule || [];
        setSchedule(nextSchedule);

        const persisted = getPersistedSelections(event.id);
        setSavedAttendeeSelections(persisted);
        const nextSelections: Record<number, { eventId: number, interested: boolean }> = {};
        nextSchedule.forEach(item => {
          if (item.event_speed_date_id && Object.prototype.hasOwnProperty.call(persisted, item.event_speed_date_id)) {
            nextSelections[item.event_speed_date_id] = { eventId: event.id, interested: persisted[item.event_speed_date_id] };
          }
        });
        setAttendeeSpeedDateSelections(nextSelections);
      } catch {
        setSchedule([]);
      }
    };

    loadSchedule();
  }, [event.id, event.status, expanded, schedule]);

  const getCurrentPicks = () => {
    return Object.entries(attendeeSpeedDateSelections)
      .filter(([, sel]) => sel.eventId === event.id)
      .reduce((acc, [id, sel]) => {
        acc[Number(id)] = sel.interested;
        return acc;
      }, {} as Record<number, boolean>);
  };

  const isSaveDisabled = useMemo(() => {
    const current = getCurrentPicks();
    const saved = savedAttendeeSelections;
    const allIds = new Set([...Object.keys(current), ...Object.keys(saved)]);
    for (const id of Array.from(allIds)) {
      if (current[Number(id)] !== saved[Number(id)]) return false;
    }
    return true;
  }, [attendeeSpeedDateSelections, savedAttendeeSelections]);

  const handleSelectionChange = (eventSpeedDateId: number, interested: boolean) => {
    setAttendeeSpeedDateSelections(prev => ({ ...prev, [eventSpeedDateId]: { eventId: event.id, interested } }));
    persistSelection(event.id, eventSpeedDateId, interested);
    setAttendeeSelectionError(null);
  };

  const handleSaveAttendeeSelections = async () => {
    if (!schedule || schedule.length === 0) {
      setAttendeeSelectionError('No schedule found to save selections for this event.');
      return;
    }

    const currentPicks = getCurrentPicks();
    setSavedAttendeeSelections({ ...currentPicks });
    persistAllSelectionsForEvent(event.id, currentPicks);
    setAttendeeSelectionError(null);
    setSaveIndicator(true);

    if (event.status === 'Completed') {
      setTimeout(() => setSaveIndicator(false), 1200);
      return;
    }

    const selectionsToSubmit = schedule.map(item => ({
      event_speed_date_id: item.event_speed_date_id,
      interested: currentPicks[item.event_speed_date_id] === true
    }));

    try {
      await eventsApi.submitSpeedDateSelections(event.id.toString(), selectionsToSubmit);
      setSelectionWindowClosedError(false);
    } catch (error: any) {
      const specificErrorMessage = 'Speed date selections window closed 24 hours after event completion.';
      const backendErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      if (backendErrorMessage === specificErrorMessage) {
        setSelectionWindowClosedError(true);
        setAttendeeSelectionError(null);
      } else {
        setAttendeeSelectionError(backendErrorMessage || 'Failed to save your selections.');
        setSelectionWindowClosedError(false);
      }
    } finally {
      setTimeout(() => setSaveIndicator(false), 1200);
    }
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const getMatchMessage = (speedDate: ScheduleItem) => {
    const isMatch = speedDate.match;
    if (!user?.gender) return isMatch ? 'You matched! Reach out with:' : 'Not a match';
    if (isMatch) return 'You matched! Reach out with:';
    if (!speedDate.user_interested) return 'You said No';
    const messages = {
      Male: [
        'Not a match, head up king 👑',
        'Not a match, stay royal 👑',
        'Not a match, you shining tho 👑',
        'Not a match, no problem 👑',
        'Not a match, still that guy 👑',
        'Not a match, you still the prize 👑',
        'Not a match, but your vibe is elite 👑'
      ],
      Female: [
        'Not a match, head up queen 👸',
        'Not a match, stay royal 👸',
        'Not a match, you shining tho 👸',
        'Not a match, no problem 👸',
        'Not a match, stay glowing 👸',
        'Not a match, royalty never settles 👸',
        'Not a match, but your worth is not up for debate 👸'
      ]
    };
    const genderMessages = messages[user.gender as 'Male' | 'Female'];
    return genderMessages[Math.floor(Math.random() * genderMessages.length)];
  };

  return (
    <>
      <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${theme.palette.divider}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setExpanded(prev => !prev)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">My Schedule</Typography>
        </Box>
        {expanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
        <Paper elevation={1} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default' }}>
          {schedule && schedule.length > 0 && event.num_rounds ? (
            <>
              {Array.from({ length: Number(event.num_rounds) }, (_, i) => {
                const roundNum = i + 1;
                const speedDate = schedule.find(si => si.round === roundNum);
                const isLast = i === Number(event.num_rounds) - 1;
                const isCurrentRound = currentRound === roundNum && event.status === 'In Progress';
                const cardSx = {
                  mb: isLast ? 0 : 1,
                  p: { xs: 0.5, sm: 0.75 },
                  borderLeft: '3px solid',
                  borderColor: isCurrentRound ? theme.palette.success.main : 'primary.dark',
                  borderRadius: '4px',
                  backgroundColor: isCurrentRound ? theme.palette.success.dark + '33' : theme.palette.action.hover,
                  transition: 'all 0.2s ease-in-out',
                  transform: isCurrentRound ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: isCurrentRound ? theme.shadows[2] : 'none'
                };

                if (!speedDate || !speedDate.partner_id) {
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
                }

                return (
                  <Box key={speedDate.event_speed_date_id || `round-${roundNum}`} sx={cardSx}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" component="div" gutterBottom={false} sx={{ fontWeight: 'bold', mb: 0.25 }}>
                          {event.status !== 'Completed' ? `Round ${speedDate.round}` : speedDate.partner_name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            {event.status !== 'Completed' && (
                              <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.1 }}>Table: {speedDate.table}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>Partner: {speedDate.partner_name} </Typography>
                              </>
                            )}
                            {event.status === 'Completed' && (
                              <Typography variant="body2" sx={{ color: 'primary.main', mt: 0.5, fontWeight: 'medium' }}>
                                {getMatchMessage(speedDate)}
                              </Typography>
                            )}
                            {event.status === 'Completed' && speedDate.match && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Box component="span" onClick={() => handleCopyEmail(speedDate.partner_email)} sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', '&:hover': { opacity: 0.8 } }}>
                                  <IconButton size="small" sx={{ p: 0.25, mr: 1, color: 'inherit' }}>
                                    <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                  {speedDate.partner_email}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          {event.status !== 'Completed' && speedDate.event_speed_date_id && (
                            <Box sx={{ display: 'flex', gap: 0.75, ml: 2, position: 'relative', top: '-10px' }}>
                              <Button variant={attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'} size="small" color="success" onClick={() => handleSelectionChange(speedDate.event_speed_date_id, true)} sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}>
                                Yes
                              </Button>
                              <Button variant={attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'} size="small" color="error" onClick={() => handleSelectionChange(speedDate.event_speed_date_id, false)} sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }}>
                                No
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
              {attendeeSelectionError && (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setAttendeeSelectionError(null)}>
                  {attendeeSelectionError}
                </Alert>
              )}
              {event.status !== 'Completed' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" color="inherit" size="small" onClick={handleSaveAttendeeSelections} disabled={isSaveDisabled}>
                      Save Selections
                    </Button>
                    {saveIndicator && <Typography variant="body2" color="success.main">Saved!</Typography>}
                  </Box>
                </Box>
              )}
              {selectionWindowClosedError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                  Selection window closed (24 hours after event end).
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">Your schedule will be populated once event starts.</Typography>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default MySchedule;
