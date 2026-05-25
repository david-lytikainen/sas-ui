import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Slider, Tooltip, Typography, useTheme } from '@mui/material';
import { Pause, PlayArrow, Settings, SkipNext, Timer as TimerIcon } from '@mui/icons-material';
import { eventsApi } from '../../services/api';
import { ScheduleItem, Timer } from '../../types/event';

type TimerStatus = 'active' | 'paused' | 'inactive' | 'ended' | 'break_time';

interface EventTimerProps {
  eventId: number;
  isAdmin: boolean;
  eventStatus?: string;
  userSchedule?: ScheduleItem[];
  onRoundChange?: (round: number) => void;
}

const TIMER_POLL_MS = 5000;
const DEFAULT_ROUND_DURATION = 210;
const DEFAULT_BREAK_DURATION = 90;
const BREAK_MESSAGES = [
  "Grab a snack! 🍎",
  "Take a break! 🛋️",
  "Time to stretch your legs! 🤸‍♂️",
  "Enjoy a quick rest! 😌",
  "Refill your drink and relax! 🥤",
  "Chat with someone new! 💬",
  "Take a breather, next round soon! 🌬️",
  "Perfect time for a bathroom break! 🚻",
];

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const getTimerStatus = (timer: Timer | null): TimerStatus => {
  if (!timer) return 'inactive';
  if (timer.is_paused) return 'paused';
  if (!timer.round_start_time) return 'inactive';

  const startedAt = new Date(timer.round_start_time).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const roundEnded = elapsedSeconds >= timer.round_duration;

  if (roundEnded && timer.current_round >= timer.final_round) return 'ended';
  if (roundEnded) return 'break_time';
  return 'active';
};

const getTimerSeconds = (timer: Timer | null): number => {
  if (!timer) return 0;

  const status = getTimerStatus(timer);
  if (status === 'paused') return timer.pause_time_remaining ?? 0;
  if (!timer.round_start_time) return 0;

  const startedAt = new Date(timer.round_start_time).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

  if (status === 'active') {
    return Math.max(0, timer.round_duration - elapsedSeconds);
  }

  if (status === 'break_time') {
    const breakElapsedSeconds = elapsedSeconds - timer.round_duration;
    return Math.max(0, timer.break_duration - breakElapsedSeconds);
  }

  return 0;
};

const getBreakMessage = (currentRound: number): string => {
  if (currentRound <= 0) return BREAK_MESSAGES[0];
  return BREAK_MESSAGES[currentRound % BREAK_MESSAGES.length];
};

const EventTimer = ({ eventId, isAdmin, eventStatus = 'In Progress', userSchedule, onRoundChange }: EventTimerProps): React.ReactElement | null => {
  const theme = useTheme();
  const isEventActive = eventStatus === 'In Progress' || eventStatus === 'Paused';
  const eventIdString = eventId.toString();
  const [timer, setTimer] = useState<Timer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newDuration, setNewDuration] = useState(DEFAULT_ROUND_DURATION);

  const timerStatus = getTimerStatus(timer);
  const currentRound = timer?.current_round ?? 0;
  const roundDuration = timer?.round_duration ?? DEFAULT_ROUND_DURATION;
  const breakDuration = timer?.break_duration ?? DEFAULT_BREAK_DURATION;
  const currentRoundSchedule = userSchedule?.find(item => item.round === currentRound);

  const isActive = timerStatus === 'active';
  const isPaused = timerStatus === 'paused';
  const isBreakTime = timerStatus === 'break_time';
  const isEnded = timerStatus === 'ended';
  const isInactive = timerStatus === 'inactive';
  const isAlmostDone = isActive && timeRemaining <= 10;

  const fetchTimer = useCallback(async () => {
    if (!isEventActive) return;

    try {
      const nextTimer = await eventsApi.getTimer(eventIdString);
      setTimer(nextTimer);
      setTimeRemaining(getTimerSeconds(nextTimer));
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load timer');
    } finally {
      setIsLoading(false);
    }
  }, [eventIdString, isEventActive]);

  useEffect(() => {
    onRoundChange?.(currentRound);
  }, [currentRound, onRoundChange]);

  useEffect(() => {
    fetchTimer();
    const pollId = window.setInterval(fetchTimer, TIMER_POLL_MS);
    return () => window.clearInterval(pollId);
  }, [fetchTimer]);

  useEffect(() => {
    if (!isActive && !isBreakTime) return;
    if (timeRemaining <= 0) return;

    const tickId = window.setInterval(() => {
      setTimeRemaining(previousSeconds => Math.max(0, previousSeconds - 1));
    }, 1000);

    return () => window.clearInterval(tickId);
  }, [isActive, isBreakTime, timeRemaining]);

  const runTimerAction = async (action: () => Promise<unknown>) => {
    try {
      setErrorMessage(null);
      await action();
      await fetchTimer();
    } catch (error: any) {
      setErrorMessage(error.message || 'Timer action failed');
    }
  };

  const handleStartRound = () => {
    runTimerAction(async () => {
      if (isBreakTime) {
        await eventsApi.nextTimerRound(eventIdString);
      }
      await eventsApi.startTimerRound(eventIdString);
    });
  };

  const handleEndRound = () => {
    runTimerAction(() => eventsApi.endTimerRound(eventIdString));
  };

  const handlePauseRound = () => {
    if (!isActive) return;
    runTimerAction(() => eventsApi.pauseTimerRound(eventIdString, timeRemaining));
  };

  const handleResumeRound = () => {
    if (!isPaused) return;
    runTimerAction(() => eventsApi.resumeTimerRound(eventIdString));
  };

  const handleUpdateDuration = () => {
    if (newDuration === roundDuration) {
      setIsSettingsOpen(false);
      return;
    }

    runTimerAction(() => eventsApi.updateTimerDuration(eventIdString, { round_duration: newDuration }));
    setIsSettingsOpen(false);
  };

  const openSettingsDialog = () => {
    setNewDuration(roundDuration);
    setIsSettingsOpen(true);
  };

  const panelColors = useMemo(() => {
    if (isAlmostDone) return { background: theme.palette.error.light + '22', border: theme.palette.error.light, icon: theme.palette.error.main };
    if (isActive) return { background: theme.palette.primary.light + '22', border: theme.palette.primary.light, icon: theme.palette.primary.main };
    if (isPaused) return { background: theme.palette.warning.light + '22', border: theme.palette.warning.light, icon: theme.palette.warning.main };
    if (isBreakTime) return { background: theme.palette.info.light + '22', border: theme.palette.info.light, icon: theme.palette.info.main };
    return { background: theme.palette.background.default, border: theme.palette.divider, icon: theme.palette.text.secondary };
  }, [isActive, isAlmostDone, isBreakTime, isPaused, theme]);

  const progressPercentage = useMemo(() => {
    if (!isActive || roundDuration <= 0) return 0;
    return (timeRemaining / roundDuration) * 100;
  }, [isActive, roundDuration, timeRemaining]);

  const getAdminTitle = () => {
    if (isEnded) return 'Finished';
    if (isBreakTime) return 'Break';
    return `Round ${currentRound || '-'}`;
  };

  const getMainTime = () => {
    if (isEnded) return '--:--';
    if (isActive || isPaused || isBreakTime) return formatTime(timeRemaining);
    return '--:--';
  };

  const getStartLabel = () => {
    if (!isBreakTime) return 'Start Round';
    return `Start Round ${currentRound + 1}`;
  };

  const getAttendeeMessage = () => {
    if (isEnded) return 'Event Finished - Submit your selections!';
    if (isInactive) return 'Event will be starting shortly!';
    if (isPaused && currentRoundSchedule) return `Round ${currentRound} paused`;
    if (isBreakTime) return `Get to your table for Round ${currentRound + 1}!`;
    if (currentRoundSchedule) return `Table ${currentRoundSchedule.table} with ${currentRoundSchedule.partner_name}`;
    if (currentRound > 0) return 'You are on break this round';
    return 'Waiting for round...';
  };



  const renderLoading = () => (
    <Box display="flex" justifyContent="center" p={{ xs: 0.25, sm: 0.5 }}>
      <CircularProgress size={16} />
    </Box>
  );

  const renderAttendeeView = () => {
    if (isLoading) return renderLoading();

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', minHeight: { xs: '40px', sm: '48px' }, p: { xs: 1.2, sm: 1.5 }, my: 1, borderRadius: '4px', bgcolor: theme.palette.background.paper, border: `1px solid ${panelColors.border}`, boxShadow: '0px 1px 2px rgba(0,0,0,0.1)' }}>
          <TimerIcon sx={{ mr: 1, color: panelColors.icon, fontSize: { xs: '1.1rem', sm: '1.3rem' }, flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {getAdminTitle()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
              {getAttendeeMessage()}
            </Typography>
          </Box>
          {(isActive || isBreakTime || isPaused) && (
            <Typography color="primary" variant="body2" sx={{ fontWeight: 700, ml: 1 }}>
              {getMainTime()}
            </Typography>
          )}
        </Box>
      </>
    );
  };

  const renderAdminControls = () => {
    if (isEnded) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          Event Finished
        </Typography>
      );
    }

    return (
      <>
        {isActive && (
          <Button variant="outlined" color="primary" startIcon={<SkipNext />} onClick={handleEndRound} size="small">
            End Round
          </Button>
        )}
        {isActive && (
          <Button variant="contained" color="warning" startIcon={<Pause />} onClick={handlePauseRound} size="small">
            Pause Round
          </Button>
        )}
        {isPaused && (
          <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={handleResumeRound} size="small">
            Resume Round
          </Button>
        )}
        {(isInactive || isBreakTime) && (
          <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={handleStartRound} size="small">
            {getStartLabel()}
          </Button>
        )}
      </>
    );
  };

  const renderAdminView = () => {
    if (isLoading) return renderLoading();

    return (
      <Box sx={{ width: '100%', my: { xs: 0.5, sm: 1 } }}>
        {errorMessage && <Alert severity="error" sx={{ mb: 1 }}>{errorMessage}</Alert>}
        <Paper elevation={1} sx={{ display: 'flex', width: '100%', py: { xs: 2, sm: 2.5 }, borderRadius: '6px', bgcolor: panelColors.background, border: `1px solid ${panelColors.border}`, position: 'relative', overflow: 'hidden', px: { xs: 1, sm: 1.5 }, alignItems: 'center', justifyContent: 'center' }}>
          {isActive && <Box sx={{ position: 'absolute', inset: 0, width: `${progressPercentage}%`, bgcolor: theme.palette.primary.light + '33', transition: 'width 1s linear', zIndex: 1 }} />}
          <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 2, position: 'absolute', left: { xs: 1, sm: 1.5 } }}>
            <TimerIcon sx={{ mr: 1, color: panelColors.icon, fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
              {getAdminTitle()}
            </Typography>
          </Box>
          <Typography variant="h3" component="div" color={panelColors.icon} sx={{ fontWeight: 600, fontSize: { xs: '2rem', sm: '2.1rem' }, zIndex: 2, textAlign: 'center' }}>
            {getMainTime()}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', zIndex: 2, position: 'absolute', right: { xs: 1, sm: 1.5 } }}>
            {!isActive && !isPaused && (
              <Tooltip title="Settings">
                <IconButton size="small" onClick={openSettingsDialog}>
                  <Settings />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Paper>
        <Paper elevation={1} sx={{ mt: 0.5, p: 1, width: '100%', borderRadius: '6px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', '& .MuiButton-root': { minWidth: { xs: '90px', sm: '100px' }, textTransform: 'none', fontWeight: 500 } }}>
            {renderAdminControls()}
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderSettingsDialog = () => (
    <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} PaperProps={{ sx: { borderRadius: 2, maxWidth: '400px', width: '100%' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center">
          <Settings sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Timer Settings</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Typography id="round-duration-slider" gutterBottom fontWeight={500}>
          Round Duration: <span style={{ color: theme.palette.primary.main }}>{formatTime(newDuration)}</span>
        </Typography>
        <Slider value={newDuration} min={30} max={600} step={30} onChange={(_, value) => setNewDuration(value as number)} aria-labelledby="round-duration-slider" valueLabelDisplay="auto" valueLabelFormat={(value) => formatTime(value)} sx={{ mb: 2 }} />
        <Typography gutterBottom sx={{ mt: 2 }}>Break Duration: {formatTime(breakDuration)}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setIsSettingsOpen(false)} sx={{ textTransform: 'none', fontWeight: 500 }}>Cancel</Button>
        <Button onClick={handleUpdateDuration} color="primary" variant="contained" sx={{ textTransform: 'none', fontWeight: 600, px: 2, borderRadius: '8px' }}>Save Settings</Button>
      </DialogActions>
    </Dialog>
  );

  if (!isEventActive && !isAdmin) return null;

  return (
    <Box sx={{ my: 2 }}>
      {isAdmin ? renderAdminView() : renderAttendeeView()}
      {renderSettingsDialog()}
    </Box>
  );
};

export default EventTimer;
