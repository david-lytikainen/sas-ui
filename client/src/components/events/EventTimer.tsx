import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Slider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Alert, 
  Paper, 
  Switch, 
  FormControlLabel, 
  Chip, 
  Collapse,
  Tooltip,
  useTheme,
  Snackbar
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  Settings, 
  VolumeUp, 
  VolumeOff, 
  Timer as TimerIcon,
  KeyboardArrowDown,
  NotificationImportant
} from '@mui/icons-material';
import axios from 'axios';
import { ScheduleItem } from '../../types/event';

interface EventTimerProps {
  eventId: number;
  isAdmin: boolean;
  eventStatus?: string;
  userSchedule?: ScheduleItem[];
}

interface TimerState {
  has_timer: boolean;
  timer?: {
    id: number;
    event_id: number;
    current_round: number;
    round_duration: number;
    round_start_time: string | null;
    is_paused: boolean;
    pause_time_remaining: number | null;
  };
  time_remaining?: number;
  status?: 'active' | 'paused' | 'inactive' | 'ended';
  message?: string;
  current_round?: number;
  next_round?: number;
  break_duration?: number;
}

export interface TimerUpdateSSE {
  status: 'active' | 'paused' | 'ended' | 'between_rounds';
  time_remaining: number;
  current_round: number;
  round_duration: number;
  next_round?: number;
  break_duration?: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const EventTimer = ({ 
  eventId, 
  isAdmin, 
  eventStatus = 'In Progress', 
  userSchedule 
}: EventTimerProps): React.ReactElement | null => {
  const theme = useTheme();
  
  // Only activate timer for active events
  const isEventActive = eventStatus === 'In Progress' || eventStatus === 'Paused';
  
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newDuration, setNewDuration] = useState<number>(180);
  const [timerInitialized, setTimerInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timerStatus, setTimerStatus] = useState<'active' | 'paused' | 'inactive' | 'ended' | 'between_rounds'>('inactive');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [nextRoundInfo, setNextRoundInfo] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(180);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifiedZero, setNotifiedZero] = useState<boolean>(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);
  const [notifiedBreakEnd, setNotifiedBreakEnd] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showTimerEndAlert, setShowTimerEndAlert] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  
  const lastFetchTimeRef = useRef<number>(Date.now());
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const breakCountdownIntervalRef = useRef<number | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notifications
  useEffect(() => {
    timerAudioRef.current = new Audio('/sounds/timer-end.mp3');
    timerAudioRef.current.preload = 'auto';
    
    return () => {
      if (timerAudioRef.current) {
        timerAudioRef.current = null;
      }
    };
  }, []);

  // Create audio element for break end notifications
  useEffect(() => {
    // Ensure this path matches where you place the sound file in /public
    breakAudioRef.current = new Audio('/sounds/next-round-start.mp3'); 
    breakAudioRef.current.preload = 'auto';
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchTimerStatus = useCallback(async (force: boolean = false) => {
    if (!isEventActive) {
      setIsLoading(false);
      return;
    }
    
    if (Date.now() - lastFetchTimeRef.current < 1000 && !force) {
      return;
    }
    
    if (!force) {
      return;
    }
    
    lastFetchTimeRef.current = Date.now();
    
    try {
      if (isAdmin && isLoading) {
        setIsLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/events/${eventId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        console.log('Fetched initial timer state via API:', response.data);
        const data = response.data;
        setTimerState(data);
        const fetchedStatus = data.status ?? (data.timer?.is_paused ? 'paused' : (data.timer?.round_start_time ? 'active' : 'inactive'));
        setTimerStatus(fetchedStatus);
        if (fetchedStatus === 'active') {
          setTimeRemaining(data.time_remaining ?? data.timer?.round_duration ?? 0);
        } else if (fetchedStatus === 'paused') {
          setTimeRemaining(data.timer?.pause_time_remaining ?? 0);
        } else if (fetchedStatus === 'between_rounds') {
          setBreakTimeRemaining(data.time_remaining ?? data.break_duration ?? 0);
        } else {
          setTimeRemaining(0);
          setBreakTimeRemaining(0);
        }
        
        setCurrentRound(data.current_round ?? data.timer?.current_round ?? 0);
        setNextRoundInfo(data.next_round ?? null);
        setRoundDuration(data.timer?.round_duration ?? data.round_duration ?? 180);

        if ((data.time_remaining ?? 0) > 0 || fetchedStatus === 'active') {
          setNotifiedZero(false);
        }
        if ((data.time_remaining ?? 0) > 0 || fetchedStatus === 'between_rounds') {
          setNotifiedBreakEnd(false);
        }
        
        if (data.has_timer && !data.status && !data.timer?.is_paused && data.timer?.round_start_time) {
            setTimerStatus('active');
        } else if (!data.has_timer) {
             setTimerStatus('inactive');
        }
        setError(null);
        setTimerInitialized(data.has_timer);
        setIsLoading(false);
      } else {
        throw new Error('Invalid response data from timer API');
      }
    } catch (err: any) {
      console.error('Error fetching timer status:', err);
      
      const errorMessage = err.response 
        ? `Error ${err.response.status}: ${err.response.data?.error || err.message}` 
        : `Network error: ${err.message}`;
      
      setError(`Failed to load timer. ${errorMessage}`);
    }
  }, [eventId, API_URL, isAdmin, isLoading, isEventActive]);

  const initializeTimerViaApi = useCallback(async () => {
    if (!isEventActive) return;
    
    try {
      setIsInitializing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        `${API_URL}/events/${eventId}/timer/initialize`,
        { round_duration: 180 },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTimerInitialized(true);
      
      await fetchTimerStatus(true);
    } catch (err: any) {
      console.error('Error initializing timer:', err);
      
      const errorMessage = err.response 
        ? `Error ${err.response.status}: ${err.response.data?.error || err.message}` 
        : `Network error: ${err.message}`;
      
      setError(`Failed to initialize timer. ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  }, [eventId, API_URL, fetchTimerStatus, isEventActive]);

  const makeApiRequest = useCallback(async (endpoint: string, method: string, data: any = {}) => {
    if (!isEventActive) return null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `${API_URL}/events/${eventId}/timer/${endpoint}`;
      
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (err: any) {
      console.error(`API error in ${endpoint}:`, err);
      const errorMessage = err.response 
        ? `Error ${err.response.status}: ${err.response.data?.error || err.message}` 
        : `Network error: ${err.message}`;
      setError(errorMessage);
      throw err;
    }
  }, [API_URL, eventId, isEventActive]);

  const handleApiAction = useCallback(async (
    action: string, 
    apiEndpoint: string, 
    apiMethod: string = 'POST',
    data: any = {}
  ) => {
    if (!isAdmin || !isEventActive) return;
    
    try {
      await makeApiRequest(apiEndpoint, apiMethod, data);
      await fetchTimerStatus(true);
    } catch (error) {
      console.error(`Failed to ${action} via API:`, error);
    }
  }, [makeApiRequest, fetchTimerStatus, isAdmin, isEventActive]);

  const handleStartRound = useCallback(() => {
    handleApiAction(
      'start round', 
      'start'
    );
  }, [handleApiAction]);

  const handlePauseRound = useCallback(() => {
    handleApiAction(
      'pause round', 
      'pause', 
      'POST',
      { time_remaining: timeRemaining }
    );
  }, [handleApiAction, timeRemaining]);

  const handleResumeRound = useCallback(() => {
    handleApiAction(
      'resume round', 
      'resume'
    );
  }, [handleApiAction]);

  const handleNextRound = useCallback(() => {
    handleApiAction(
      'next round', 
      'next'
    );
    setNotifiedZero(false);
  }, [handleApiAction]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    try {
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      }
      return Notification.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && timerAudioRef.current && !notifiedZero) {
      timerAudioRef.current.play().catch(err => console.error('Error playing ROUND END sound:', err));
      setNotifiedZero(true);
      setShowTimerEndAlert(true);
      
      setTimeout(() => {
        setShowTimerEndAlert(false);
      }, 10000);
      
      if ('Notification' in window) {
        if (notificationPermission === 'granted') {
          try {
            const notification = new Notification('Timer Complete', { 
              body: 'The current round has ended',
              icon: '/logo192.png',
              tag: 'timer-end',
              requireInteraction: true
            });
            
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        } else if (notificationPermission === 'default') {
          requestNotificationPermission().then(permission => {
            if (permission === 'granted') {
              try {
                const notification = new Notification('Timer Complete', { 
                  body: 'The current round has ended',
                  icon: '/logo192.png',
                  tag: 'timer-end'
                });
                
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              } catch (error) {
                console.error('Error creating notification after permission:', error);
              }
            }
          });
        }
      }
    }
  }, [soundEnabled, notifiedZero, notificationPermission, requestNotificationPermission]);

  const playRoundEndSound = playNotificationSound;

  const playBreakEndSound = useCallback(() => {
    if (soundEnabled && breakAudioRef.current && !notifiedBreakEnd) {
      breakAudioRef.current.play().catch(err => console.error('Error playing BREAK END sound:', err));
      setNotifiedBreakEnd(true);
      if ('Notification' in window && notificationPermission === 'granted') {
        try {
          const notification = new Notification('Break Over Soon', { 
            body: `Get ready! Round ${nextRoundInfo || 'next'} is about to start.`,
            icon: '/logo192.png',
            tag: 'break-end'
          });
          notification.onclick = () => { window.focus(); notification.close(); };
        } catch (error) {
          console.error('Error creating break end notification:', error);
        }
      }
    }
  }, [soundEnabled, notifiedBreakEnd, notificationPermission, nextRoundInfo]);

  useEffect(() => {
    if (isEventActive) {
      fetchTimerStatus(true);
      
      return () => {
        if (countdownIntervalRef.current !== null) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    }
  }, [eventId, fetchTimerStatus, isEventActive]);

  useEffect(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (timerStatus === 'active' && isEventActive) {
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if(countdownIntervalRef.current !== null) {
              console.log(`Clearing ROUND interval ID: ${countdownIntervalRef.current} because time reached zero.`);
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            if (!notifiedZero) {
              console.log("Round Timer reached zero, playing sound/notification.");
              playRoundEndSound(); 
              setShowTimerEndAlert(true);
            }
            
            if (isAdmin) {
              console.log("Admin timer reached zero, automatically pausing.");
              handleApiAction(
                'pause round (auto)',
                'pause',
                'POST',
                { time_remaining: 0 }
              );
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      console.log(`Set new ROUND interval ID: ${countdownIntervalRef.current}`);
    } else {
      console.log(`ROUND interval NOT started. Status: ${timerStatus}, Event Active: ${isEventActive}`);
      if (countdownIntervalRef.current !== null) {
        console.log(`Clearing interval ID: ${countdownIntervalRef.current} due to status becoming non-active.`);
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current !== null) {
        console.log(`Cleanup: Clearing ROUND interval ID: ${countdownIntervalRef.current}`);
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [timerStatus, isEventActive, isAdmin, notifiedZero, playRoundEndSound, handleApiAction]);

  useEffect(() => {
    if (breakCountdownIntervalRef.current !== null) {
      console.log(`Clearing BREAK interval ID: ${breakCountdownIntervalRef.current} due to status change or unmount.`);
      window.clearInterval(breakCountdownIntervalRef.current);
      breakCountdownIntervalRef.current = null;
    }

    if (timerStatus === 'between_rounds' && isEventActive) {
      console.log(`Starting new BREAK interval. Status: ${timerStatus}, Event Active: ${isEventActive}`);
      breakCountdownIntervalRef.current = window.setInterval(() => {
        setBreakTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            if(breakCountdownIntervalRef.current !== null) {
                console.log(`Clearing BREAK interval ID: ${breakCountdownIntervalRef.current} because time reached zero.`);
                clearInterval(breakCountdownIntervalRef.current);
                breakCountdownIntervalRef.current = null;
            }
            if (!notifiedBreakEnd) {
              console.log("Break Timer reached zero, playing sound/notification.");
              playBreakEndSound();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      console.log(`Set new BREAK interval ID: ${breakCountdownIntervalRef.current}`);
    } else {
      console.log(`BREAK interval NOT started. Status: ${timerStatus}, Event Active: ${isEventActive}`);
      if (breakCountdownIntervalRef.current !== null) {
          console.log(`Clearing BREAK interval ID: ${breakCountdownIntervalRef.current} due to status change.`);
          window.clearInterval(breakCountdownIntervalRef.current);
          breakCountdownIntervalRef.current = null;
      }
    }

    return () => {
      if (breakCountdownIntervalRef.current !== null) {
        console.log(`Cleanup: Clearing BREAK interval ID: ${breakCountdownIntervalRef.current}`);
        window.clearInterval(breakCountdownIntervalRef.current);
        breakCountdownIntervalRef.current = null;
      }
    };
  }, [timerStatus, isEventActive, notifiedBreakEnd, playBreakEndSound]);

  useEffect(() => {
    const checkAndInitializeTimer = async () => {
      if (isAdmin && timerState && !timerState.has_timer && !timerInitialized && !isInitializing && isEventActive) {
        await initializeTimerViaApi();
      }
    };

    if (timerState !== null) {
      checkAndInitializeTimer();
    }
  }, [isAdmin, timerState, timerInitialized, initializeTimerViaApi, isInitializing, isEventActive]);

  const handleUpdateDuration = useCallback(() => {
    handleApiAction(
      'update duration', 
      'duration', 
      'PUT',
      { round_duration: newDuration }
    );
    setIsSettingsOpen(false);
  }, [handleApiAction, newDuration]);

  const openSettingsDialog = () => {
    if (timerState?.timer?.round_duration) {
      setNewDuration(timerState.timer.round_duration);
    }
    setIsSettingsOpen(true);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleEnableNotifications = () => {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  };

  const getProgressPercentage = () => {
    if (roundDuration <= 0 || typeof timeRemaining !== 'number') return 0;
    const progress = ((roundDuration - timeRemaining) / roundDuration) * 100;
    return Math.min(100, Math.max(0, progress)); // Clamp value between 0-100
  };

  const renderAttendeeView = () => {
    if (!isEventActive) {
      return null;
    }
    
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={1}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return null;
    }

    if (!timerInitialized) {
      return null;
    }

    const isActive = timerStatus === 'active';
    const isBetweenRounds = timerStatus === 'between_rounds';
    const currentRoundSchedule = userSchedule?.find(item => item.round === currentRound);
    
    return (
      <>
        {timeRemaining === 0 && showTimerEndAlert && timerStatus !== 'ended' && (
          <Snackbar
            open={showTimerEndAlert}
            autoHideDuration={6000}
            onClose={() => setShowTimerEndAlert(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setShowTimerEndAlert(false)} 
              severity="info"
              icon={<NotificationImportant />}
              sx={{ width: '100%', fontWeight: 500 }}
            >
              Time's up! This round has ended.
            </Alert>
          </Snackbar>
        )}
        
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            minHeight: '50px',
            p: 1.5,
            ml: 1, mr: 1,
            borderRadius: '6px',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${ isBetweenRounds ? theme.palette.info.light : theme.palette.divider }`,
            boxShadow: 1,
            maxWidth: '100%',
          }}
        >
          <TimerIcon 
            sx={{ 
              mr: 1.5, 
              color: isActive ? theme.palette.primary.main : isBetweenRounds ? theme.palette.info.main : theme.palette.text.secondary,
              fontSize: '1.2rem',
              flexShrink: 0,
            }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {isBetweenRounds ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                  Break Time
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                  Next: Round {nextRoundInfo || '-'} starting soon.
                </Typography>
                <Typography 
                  color="info.main"
                  variant="body2" 
                  sx={{ fontWeight: 700, mt: 0.25 }}
                >
                  {formatTime(breakTimeRemaining)}
                </Typography>
              </Box>
            ) : isActive && currentRoundSchedule ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                  Round {currentRoundSchedule.round}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                  Table {currentRoundSchedule.table} with {currentRoundSchedule.partner_name} (Age: {currentRoundSchedule.partner_age || 'N/A'})
                </Typography>
                {isActive && (
                  <Typography 
                    color="primary"
                    variant="body2" 
                    sx={{ fontWeight: 700, mt: 0.25 }}
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                )}
              </Box>
            ) : currentRound > 0 ? (
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                Round {currentRound} 
                {isActive ? formatTime(timeRemaining) : (timerStatus === 'paused' ? ' (Paused)' : ' (Waiting...)')}
              </Typography>
            ) : timerStatus === 'inactive' ? (
              <Typography variant="body2" color="text.secondary">Waiting for event to start...</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">Waiting for round...</Typography>
            )}
          </Box>
        </Box>
      </>
    );
  };

  const renderAdminView = () => {
    if (!isEventActive) {
      return null;
    }
    
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={1}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return null;
    }

    if (!timerInitialized) {
      return (
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            my: 2
          }}
        >
          <Button
            variant="outlined"
            size="medium"
            color="primary"
            onClick={initializeTimerViaApi}
            disabled={isInitializing}
            startIcon={isInitializing ? <CircularProgress size={16} /> : <TimerIcon />}
            sx={{ 
              py: 1,
              px: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Initialize Timer
          </Button>
        </Box>
      );
    }

    const isActive = timerStatus === 'active';
    const isPaused = timerStatus === 'paused';
    const isBetweenRounds = timerStatus === 'between_rounds';
    const currentRound = timerState?.timer?.current_round || 1;
    const isAlmostDone = timeRemaining <= 10 && isActive;
    
    const progressPercentage = getProgressPercentage();
    
    return (
      <>
        <Box 
          sx={{ 
            width: '100%',
            my: 2
          }}
        >
          {timeRemaining === 0 && showTimerEndAlert && (
            <Alert 
              severity="info" 
              icon={<NotificationImportant />}
              variant="filled"
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowTimerEndAlert(false)}
                  sx={{ ml: 2 }}
                >
                  Dismiss
                </Button>
              }
            >
              {isBetweenRounds ? `Break time: ${formatTime(breakTimeRemaining)}` : 'Prepare for next round.'}
            </Alert>
          )}

          <Paper
            elevation={2}
            sx={{
              display: 'flex',
              width: '100%',
              py: 2,
              borderRadius: '8px',
              bgcolor: isAlmostDone ? theme.palette.error.light + '33' :
                      isActive ? theme.palette.primary.light + '33' :
                      isPaused ? theme.palette.warning.light + '33' :
                      isBetweenRounds ? theme.palette.info.light + '33' :
                      theme.palette.background.default,
              border: `1px solid ${ 
                        isAlmostDone ? theme.palette.error.light :
                        isActive ? theme.palette.primary.light :
                        isPaused ? theme.palette.warning.light :
                        isBetweenRounds ? theme.palette.info.light :
                        theme.palette.divider
                      }`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
              px: { xs: 1, sm: 2, md: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'center' },
              gap: { xs: 3, sm: 0 },
              justifyContent: { xs: 'center', sm: 'space-between' }
            }}
          >
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progressPercentage}%`,
                  bgcolor: isAlmostDone ?
                    theme.palette.error.light + '4D' :
                    theme.palette.primary.light + '4D',
                  transition: 'width 1s linear, background-color 0.3s ease',
                  zIndex: 1
                }}
              />
            )}
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                zIndex: 2
              }}
            >
              <TimerIcon
                sx={{
                  mr: { xs: 0, sm: 2 },
                  mb: { xs: 2, sm: 0 },
                  color: isAlmostDone ? theme.palette.error.main :
                        isActive ? theme.palette.primary.main :
                        isPaused ? theme.palette.warning.main :
                        isBetweenRounds ? theme.palette.info.main :
                        theme.palette.text.secondary,
                  fontSize: '1.5rem'
                }}
              />
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Round {currentRound}
                </Typography>
                <Chip 
                  label={isActive ? 'Active' : isPaused ? 'Paused' : isBetweenRounds ? 'Break' : 'Inactive'} 
                  color={isActive ? 'primary' : isPaused ? 'warning' : isBetweenRounds ? 'info' : 'default'}
                  size="small"
                  sx={{ 
                    fontWeight: 500, 
                    height: '24px',
                    mt: 0.5,
                    '& .MuiChip-label': {
                      px: 0.75,
                      py: 0
                    }
                  }}
                />
              </Box>
            </Box>
            
            <Typography
              variant="h3"
              component="div"
              color={isAlmostDone ? theme.palette.error.main :
                     isActive ? theme.palette.primary.main :
                     isPaused ? theme.palette.warning.main :
                     isBetweenRounds ? theme.palette.info.main :
                     theme.palette.text.secondary}
              sx={{
                fontWeight: 700,
                animation: isAlmostDone ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
                fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem' },
                mb: { xs: 2, sm: 0 }
              }}
            >
              {isActive || isPaused ? formatTime(timeRemaining) : formatTime(breakTimeRemaining)}
            </Typography>
            
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                justifyContent: { xs: 'center', sm: 'flex-end' },
                gap: { xs: 1, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                mt: { xs: 2, sm: 0 }
            }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={soundEnabled}
                    onChange={toggleSound}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center">
                    {soundEnabled ? 
                      <VolumeUp fontSize="small" color="primary" /> : 
                      <VolumeOff fontSize="small" color="disabled" />
                    }
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5, 
                        display: { xs: 'none', sm: 'block' },
                        color: theme.palette.text.primary
                      }}
                    >
                      {soundEnabled ? "Sound On" : "Sound Off"}
                    </Typography>
                  </Box>
                }
                sx={{ mr: 1 }}
              />
              
              <Tooltip title="Settings">
                <IconButton 
                  size="small" 
                  onClick={openSettingsDialog}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main
                    },
                    mr: 1
                  }}
                >
                  <Settings fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={showControls ? "Hide controls" : "Show controls"}>
                <IconButton 
                  onClick={toggleControls}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    transition: 'transform 0.3s',
                    transform: showControls ? 'rotate(180deg)' : 'rotate(0)',
                    '&:hover': {
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  <KeyboardArrowDown />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          <Collapse in={showControls}>
            <Paper 
              elevation={1}
              sx={{ 
                mt: 1, 
                mb: 2,
                p: 2,
                width: '100%',
                borderRadius: '8px'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  '& .MuiButton-root': { 
                     width: { xs: '80%', sm: 'auto' },
                     minWidth: { xs: '150px', sm: 'auto'}
                  }
                }}
              >
                {isActive && (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Pause />}
                      onClick={handlePauseRound}
                      size="medium"
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        py: 1,
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      Pause
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<SkipNext />}
                      onClick={handleNextRound}
                      size="medium"
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        py: 1,
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      Next Round
                    </Button>
                  </>
                )}
                
                {isPaused && (
                  <Box sx={{ display: 'flex', gap: 2 }}> 
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow />}
                      onClick={handleStartRound}
                      size="medium"
                      sx={{ 
                        borderRadius: '8px',
                        textTransform: 'none',
                        py: 1,
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      Start Round
                    </Button>
                  </Box>
                )}
                
                {(isBetweenRounds || (!isActive && !isPaused)) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={handleResumeRound}
                    size="medium"
                    sx={{ 
                      borderRadius: '8px',
                      textTransform: 'none',
                      py: 1,
                      px: 3,
                      fontWeight: 600
                    }}
                  >
                    {isPaused ? 'Resume' : 'Start Round'}
                  </Button>
                )}
                {isBetweenRounds && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<SkipNext />} 
                    onClick={handleNextRound}
                    size="medium"
                    disabled
                    sx={{ 
                      borderRadius: '8px',
                      textTransform: 'none',
                      py: 1,
                      px: 3,
                      fontWeight: 600
                    }}
                  >
                    Next Round
                  </Button>
                )}
              </Box>
            </Paper>
          </Collapse>
        </Box>
      </>
    );
  };

  const renderSettingsDialog = () => {
    return (
      <Dialog 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: '400px',
            width: '100%'
          }
        }}
      >
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
          <Slider
            value={newDuration}
            min={30}
            max={600}
            step={30}
            onChange={(_, value) => setNewDuration(value as number)}
            aria-labelledby="round-duration-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => formatTime(value)}
            sx={{ mb: 2 }}
          />
          <Typography gutterBottom sx={{ mt: 2 }}>Current Duration: {formatTime(roundDuration)}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setIsSettingsOpen(false)}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateDuration} 
            color="primary" 
            variant="contained"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              borderRadius: '8px'
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!isEventActive && !isAdmin) {
    console.log("EventTimer: Not rendering (event inactive and not admin).");
    return null;
  }

  return (
    <Box sx={{ my: 2 }}>
       {isAdmin ? renderAdminView() : renderAttendeeView()}
       {renderSettingsDialog()}
      
       {notificationPermission === 'default' && (
         <Snackbar
           open={true}
           anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
         >
           <Alert 
             severity="info" 
             action={
               <Button color="inherit" size="small" onClick={handleEnableNotifications}>
                 Enable
               </Button>
             }
           >
             Enable browser notifications for timer alerts
           </Alert>
         </Snackbar>
       )}
    </Box>
  );
};

export default EventTimer; 