import { Alert, Box, Button, Collapse, Grid, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { ContentCopy as ContentCopyIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, List as ListIcon } from '@mui/icons-material';
import { Event, ScheduleItem } from '../../types/event';

interface MyScheduleProps {
  event: Event;
  schedule: ScheduleItem[] | undefined;
  expanded: boolean;
  currentRound: number | undefined;
  attendeeSpeedDateSelections: Record<number, { eventId: number, interested: boolean }>;
  attendeeSelectionError: string | null | undefined;
  submitted: boolean;
  saveIndicator: boolean | undefined;
  selectionWindowClosedError: boolean | undefined;
  isSaveDisabled: boolean;
  onToggle: () => void;
  onSelectionChange: (eventSpeedDateId: number, eventId: number, interested: boolean) => void;
  onClearError: () => void;
  onSave: () => void;
  onSubmit: () => void;
  onCopyEmail: (email: string) => void;
  getMatchMessage: (isMatch: boolean) => string;
}

const MySchedule = ({
  event,
  schedule,
  expanded,
  currentRound,
  attendeeSpeedDateSelections,
  attendeeSelectionError,
  submitted,
  saveIndicator,
  selectionWindowClosedError,
  isSaveDisabled,
  onToggle,
  onSelectionChange,
  onClearError,
  onSave,
  onSubmit,
  onCopyEmail,
  getMatchMessage,
}: MyScheduleProps) => {
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

      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
        <Paper elevation={1} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default' }}>
          {schedule && schedule.length > 0 && event.num_rounds ? (
            <>
              {Array.from({ length: Number(event.num_rounds) }, (_, i) => {
                const roundNum = i + 1;
                const item = schedule.find(si => si.round === roundNum);
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
                              <Typography variant="body2" sx={{ color: 'primary.main', mt: 0.5, fontWeight: 'medium' }}>
                                {getMatchMessage(item.match)}
                              </Typography>
                            )}
                            {event.status === 'Completed' && item.match && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Box component="span" onClick={() => onCopyEmail(item.partner_email)} sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', '&:hover': { opacity: 0.8 } }}>
                                  <IconButton size="small" sx={{ p: 0.25, mr: 1, color: 'inherit' }}>
                                    <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                  {item.partner_email}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          {event.status !== 'Completed' && item.event_speed_date_id && (
                            <Box sx={{ display: 'flex', gap: 0.75, ml: 2, position: 'relative', top: '-10px' }}>
                              <Button variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === true ? 'contained' : 'outlined'} size="small" color="success" onClick={() => onSelectionChange(item.event_speed_date_id, event.id, true)} sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }} disabled={submitted}>
                                Yes
                              </Button>
                              <Button variant={attendeeSpeedDateSelections[item.event_speed_date_id]?.interested === false ? 'contained' : 'outlined'} size="small" color="error" onClick={() => onSelectionChange(item.event_speed_date_id, event.id, false)} sx={{ minWidth: '50px', px: 1.5, py: 0.5, fontSize: '0.85rem' }} disabled={submitted}>
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
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={onClearError}>
                  {attendeeSelectionError}
                </Alert>
              )}
              {event.status !== 'Completed' && submitted ? (
                <Typography variant="body2" color="success.main" sx={{ textAlign: 'center', mt: 1.5 }}>
                  Your selections have been submitted. Thank you for attending! 🎉
                </Typography>
              ) : event.status !== 'Completed' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" color="inherit" size="small" onClick={onSave} disabled={isSaveDisabled}>
                      Save Selections
                    </Button>
                    {saveIndicator && (
                      <Typography variant="body2" color="success.main">Saved!</Typography>
                    )}
                  </Box>
                  <Button variant="contained" color="primary" size="small" onClick={onSubmit}>
                    Submit
                  </Button>
                </Box>
              )}
              {selectionWindowClosedError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                  Selection window closed (24 hours after event end).
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">Your schedule will be populated once the event starts.</Typography>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default MySchedule;
