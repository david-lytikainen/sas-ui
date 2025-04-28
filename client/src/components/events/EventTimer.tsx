import React, { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../../services/socketService';
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
import { Socket } from 'socket.io-client';

interface EventTimerProps {
  eventId: number;
  isAdmin: boolean;
  eventStatus?: string;
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
  status?: 'active' | 'paused' | 'inactive';
  message?: string;
  current_round?: number;
}

interface RoundInfo {
  has_timer: boolean;
  status?: 'active' | 'paused' | 'inactive';
  current_round?: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const EventTimer: React.FC<EventTimerProps> = ({ eventId, isAdmin, eventStatus = 'In Progress' }) => {
  const theme = useTheme();
  
  // Only activate timer for active events
  const isEventActive = eventStatus === 'In Progress' || eventStatus === 'Paused';
  
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newDuration, setNewDuration] = useState<number>(180);
  const [timerInitialized, setTimerInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifiedZero, setNotifiedZero] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showTimerEndAlert, setShowTimerEndAlert] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  
  const socketRef = useRef<Socket | null>(null);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const apiRequestInProgressRef = useRef<boolean>(false);

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

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Function to fetch timer status directly via API - with less frequency
  const fetchTimerStatus = useCallback(async (force: boolean = false) => {
    // Don't fetch if event is not active
    if (!isEventActive) {
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent API requests
    if (apiRequestInProgressRef.current && !force) {
      return;
    }
    
    // CRITICAL: Only fetch if forced (initial load or explicit action)
    // Never allow non-forced API calls to prevent polling
    if (!force) {
      return;
    }
    
    // Set a reference that we're fetching data to prevent duplicates
    lastFetchTimeRef.current = Date.now();
    apiRequestInProgressRef.current = true;
    
    try {
      // Only show loading indicator on initial load
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
      
      // Check if there was a valid response
      if (response.data) {
        console.log('Using client-side timer with server sync');
        
        if (isAdmin) {
          setTimerState(response.data);
          
          if (response.data.time_remaining !== undefined) {
            setTimeRemaining(response.data.time_remaining);
            // Reset notification flag if we're not at zero
            if (response.data.time_remaining > 0) {
              setNotifiedZero(false);
            }
          } else if (response.data.timer?.pause_time_remaining) {
            setTimeRemaining(response.data.timer.pause_time_remaining);
          } else if (response.data.timer?.round_duration) {
            setTimeRemaining(response.data.timer.round_duration);
          }
        } else {
          // For regular users, we just need round info
          setRoundInfo({
            has_timer: response.data.has_timer,
            status: response.data.status,
            current_round: response.data.current_round || 
                          (response.data.timer?.current_round)
          });
        }
        
        setError(null);
      } else {
        throw new Error('Invalid response data from timer API');
      }
    } catch (err: any) {
      console.error('Error fetching timer status:', err);
      
      const errorMessage = err.response 
        ? `Error ${err.response.status}: ${err.response.data?.error || err.message}` 
        : `Network error: ${err.message}`;
      
      setError(`Failed to load timer. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      apiRequestInProgressRef.current = false;
    }
  }, [eventId, API_URL, isAdmin, isLoading, isEventActive]);

  // Initialize timer directly via API
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
      
      // Fetch the timer status again after initialization
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

  // Function to directly interact with the backend using REST API as fallback
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

  // Handler function with socket and fallback API
  const handleSocketAction = useCallback(async (
    action: string, 
    socketEvent: string, 
    apiEndpoint: string, 
    apiMethod: string = 'POST',
    data: any = {}
  ) => {
    if (!isEventActive) return;
    
    // Try socket first if available
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(socketEvent, {...data, event_id: eventId});
      return;
    }
    
    // Fallback to REST API
    try {
      await makeApiRequest(apiEndpoint, apiMethod, data);
      // Refresh timer status after API call
      await fetchTimerStatus(true);
    } catch (error) {
      console.error(`Failed to ${action} via API:`, error);
    }
  }, [eventId, makeApiRequest, fetchTimerStatus, isEventActive]);

  const handleStartRound = useCallback(() => {
    handleSocketAction(
      'start round', 
      'timer_start', 
      'start'
    );
  }, [handleSocketAction]);

  const handlePauseRound = useCallback(() => {
    handleSocketAction(
      'pause round', 
      'timer_pause', 
      'pause', 
      'POST',
      { time_remaining: timeRemaining }
    );
  }, [handleSocketAction, timeRemaining]);

  const handleResumeRound = useCallback(() => {
    handleSocketAction(
      'resume round', 
      'timer_resume', 
      'resume'
    );
  }, [handleSocketAction]);

  const handleNextRound = useCallback(() => {
    handleSocketAction(
      'next round', 
      'timer_next', 
      'next'
    );
    setNotifiedZero(false); // Reset notification state for the new round
  }, [handleSocketAction]);

  // Request notification permission
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

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && timerAudioRef.current && !notifiedZero) {
      timerAudioRef.current.play()
        .catch(err => console.error('Error playing notification sound:', err));
      setNotifiedZero(true);
      setShowTimerEndAlert(true);
      
      // Auto-hide the alert after 10 seconds
      setTimeout(() => {
        setShowTimerEndAlert(false);
      }, 10000);
      
      // Visual browser notification
      if ('Notification' in window) {
        if (notificationPermission === 'granted') {
          try {
            // Create and show the notification
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
          // Try to request permission when the sound plays (user interaction)
          requestNotificationPermission().then(permission => {
            if (permission === 'granted') {
              // Permission was just granted, show notification immediately
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

  // Initialize and fetch timer status when component mounts
  useEffect(() => {
    if (isEventActive) {
      fetchTimerStatus(true);
      
      // Initialize socket only for notification purposes
      const socket = socketService.initSocket();
      socketRef.current = socket;
      
      // Join the event room to receive updates
      socketService.joinEventRoom(eventId);
      
      // Listen for timer updates but only to stay in sync with round changes
      const unsubscribe = socketService.subscribeToTimerUpdates((data) => {
        console.log('Timer update received:', data);
        
        // Only update on significant changes like status or round changes
        if (isAdmin) {
          if (data.status !== timerState?.status || 
              data.current_round !== timerState?.current_round) {
            setTimerState(data);
          }
        } else {
          if (data.status !== roundInfo?.status || 
              data.current_round !== roundInfo?.current_round) {
            setRoundInfo({
              has_timer: data.has_timer,
              status: data.status,
              current_round: data.current_round || (data.timer?.current_round)
            });
          }
        }
      });
      
      return () => {
        if (socketRef.current) {
          socketService.leaveEventRoom(eventId);
          unsubscribe();
        }
        
        socketService.disconnectSocket();
        
        if (countdownIntervalRef.current !== null) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    }
  }, [eventId, fetchTimerStatus, isEventActive, isAdmin, timerState?.status, timerState?.current_round, roundInfo?.status, roundInfo?.current_round]);

  // Countdown timer - locally maintained to avoid glitches
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Only run countdown for active timers
    if (timerState?.status === 'active' && timeRemaining > 0 && isEventActive) {
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(prev - 1, 0);
          
          // Play notification when timer reaches zero
          if (newTime === 0 && !notifiedZero) {
            playNotificationSound();
            setShowTimerEndAlert(true);
            
            // Only admins should notify the server when the timer hits zero
            if (isAdmin) {
              // Use direct pause action to avoid circular references in the dependency array
              handleSocketAction(
                'pause round',
                'timer_pause',
                'pause',
                'POST',
                { time_remaining: 0 }
              );
            }
          }
          
          return newTime;
        });
      }, 1000);
    }

    // Cleanup interval on unmount or when timer stops
    return () => {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [timerState?.status, timeRemaining, isAdmin, playNotificationSound, notifiedZero, isEventActive, handleSocketAction]);

  // Initialize timer if admin and no timer exists
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
    handleSocketAction(
      'update duration', 
      'timer_update_duration', 
      'duration', 
      'PATCH',
      { round_duration: newDuration }
    );
    setIsSettingsOpen(false);
  }, [handleSocketAction, newDuration]);

  // Open settings dialog
  const openSettingsDialog = () => {
    if (timerState?.timer?.round_duration) {
      setNewDuration(timerState.timer.round_duration);
    }
    setIsSettingsOpen(true);
  };

  // Toggle sound setting
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Request notification permission on user interaction
  const handleEnableNotifications = () => {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  };

  // Get progress percentage for circular progress
  const getProgressPercentage = () => {
    if (!timerState || !timerState.timer) return 0;
    const totalDuration = timerState.timer.round_duration;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
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

    if (!roundInfo?.has_timer) {
      return null;
    }

    const isActive = roundInfo?.status === 'active';
    
    return (
      <>
        {/* Timer End Alert for attendees - Visible when timer reaches zero */}
        {timeRemaining === 0 && showTimerEndAlert && roundInfo?.status !== 'inactive' && (
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
            display: 'inline-flex',
            alignItems: 'center',
            height: '36px',
            ml: 1,
            mr: 1
          }}
        >
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: '6px',
              bgcolor: theme.palette.background.paper,
              boxShadow: 1,
            }}
          >
            <TimerIcon 
              sx={{ 
                mr: 1, 
                color: theme.palette.primary.main,
                fontSize: '1.1rem'
              }} 
            />
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600,
                mr: 1
              }}
            >
              Round {roundInfo?.current_round || '-'}
            </Typography>
            {isActive && (
              <Typography 
                color="primary"
                variant="body1" 
                sx={{ fontWeight: 700 }}
              >
                {formatTime(timeRemaining)}
              </Typography>
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

    if (!timerState?.has_timer) {
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

    const isActive = timerState.status === 'active';
    const isPaused = timerState.status === 'paused';
    const currentRound = timerState.timer?.current_round || 1;
    const isAlmostDone = timeRemaining <= 10 && isActive;
    
    // Calculate progress percentage for background color
    const progressPercentage = getProgressPercentage();
    
    return (
      <>
        <Box 
          sx={{ 
            width: '100%',
            my: 2
          }}
        >
          {/* Timer End Alert - Visible when timer reaches zero - make it go away after 10 seconds*/}
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
              Timer has ended! Please move to the next round.
            </Alert>
          )}

          <Paper
            elevation={2}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              px: 3,
              py: 2,
              borderRadius: '8px',
              bgcolor: isAlmostDone ? '#fff2f2' : isActive ? '#f9f8ff' : isPaused ? '#fff8ee' : '#f5f5f5',
              border: isAlmostDone ? '1px solid #ffcdd2' : 
                      isActive ? '1px solid #e3e1ff' : 
                      isPaused ? '1px solid #ffe0b2' : 
                      '1px solid #e0e0e0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Progress indicator */}
            {isActive && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  height: '100%',
                  width: `${progressPercentage}%`, 
                  bgcolor: isAlmostDone ? 
                    'rgba(229, 115, 115, 0.1)' : 
                    'rgba(103, 58, 183, 0.05)', 
                  transition: 'width 1s linear',
                  zIndex: 1
                }} 
              />
            )}
            
            {/* Left side - round info */}
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                zIndex: 2
              }}
            >
              <TimerIcon 
                sx={{ 
                  mr: 2, 
                  color: isAlmostDone ? theme.palette.error.main : 
                        isActive ? theme.palette.primary.main : 
                        isPaused ? theme.palette.warning.main : 
                        theme.palette.text.secondary,
                  fontSize: '1.5rem'
                }} 
              />
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    lineHeight: 1.2
                  }}
                >
                  Round {currentRound}
                </Typography>
                <Chip 
                  label={isActive ? 'Active' : isPaused ? 'Paused' : 'Inactive'} 
                  color={isActive ? 'primary' : isPaused ? 'warning' : 'default'}
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
            
            {/* Center - timer */}
            <Typography 
              variant="h3" 
              color={isAlmostDone ? 'error' : isActive ? 'primary' : isPaused ? 'warning.dark' : 'text.secondary'}
              sx={{
                fontWeight: 700, 
                animation: isAlmostDone ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              {formatTime(timeRemaining)}
            </Typography>
            
            {/* Right side - controls */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Sound toggle */}
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
                    <Typography variant="body2" sx={{ ml: 0.5, display: { xs: 'none', sm: 'block' } }}>
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
          
          {/* Timer Controls */}
          <Collapse in={showControls}>
            <Paper 
              elevation={1}
              sx={{ 
                mt: 1, 
                mb: 2,
                p: 2,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                borderRadius: '8px'
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
                <>
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
                    Resume
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
              
              {!isActive && !isPaused && (
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
              )}
            </Paper>
          </Collapse>
        </Box>
      </>
    );
  };

  // Settings dialog with modern styling
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

  // Don't render anything if event is not active and user is not admin
  if (!isEventActive && !isAdmin) {
    return null;
  }

  return (
    <>
      {isAdmin ? renderAdminView() : renderAttendeeView()}
      {renderSettingsDialog()}
      
      {/* Notification permission prompt */}
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
    </>
  );
};

export default EventTimer; 