import React, { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../../services/socketService';
import { Box, Button, Typography, CircularProgress, Slider, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Paper, Switch, FormControlLabel, Chip } from '@mui/material';
import { PlayArrow, Pause, SkipNext, Settings, Refresh, VolumeUp, VolumeOff } from '@mui/icons-material';
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
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notifiedZero, setNotifiedZero] = useState<boolean>(false);
  const [isUsingApiFallback, setIsUsingApiFallback] = useState<boolean>(false);
  
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

  // Function to fetch timer status directly via API - with debouncing
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
    
    // Rate limiting - don't fetch too frequently unless forced
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 120000) { // 2 minutes between regular refreshes 
      return;
    }
    
    lastFetchTimeRef.current = now;
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
        setIsUsingApiFallback(true);
        
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

  // Function to fetch round info only - for regular users
  const fetchRoundInfo = useCallback(async (force: boolean = false) => {
    // Skip if admin, if event is not active, or if request already in progress
    if (isAdmin || !isEventActive || apiRequestInProgressRef.current) return;
    
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 60000) { // Once every 60 seconds
      return;
    }
    
    lastFetchTimeRef.current = now;
    apiRequestInProgressRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/events/${eventId}/round-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setRoundInfo(response.data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching round info:', err);
      const errorMessage = err.response 
        ? `Error ${err.response.status}: ${err.response.data?.error || err.message}` 
        : `Network error: ${err.message}`;
      
      setError(`Failed to load round info. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      apiRequestInProgressRef.current = false;
    }
  }, [eventId, API_URL, isAdmin, isEventActive]);

  // Initialize timer directly via API
  const initializeTimerViaApi = useCallback(async () => {
    if (!isEventActive) return;
    
    try {
      setIsInitializing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && timerAudioRef.current && !notifiedZero) {
      timerAudioRef.current.play()
        .catch(err => console.error('Error playing notification sound:', err));
      setNotifiedZero(true);
      
      // Visual notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete', { 
          body: 'The current round has ended',
          icon: '/logo192.png'
        });
      }
    }
  }, [soundEnabled, notifiedZero]);

  // Initialize socket and join event room when component mounts
  useEffect(() => {
    if (!isEventActive) {
      setIsLoading(false);
      return;
    }
    
    // First, fetch the timer status via API (reliable way to get initial state)
    if (isAdmin) {
      fetchTimerStatus(true);
    } else {
      fetchRoundInfo(true);
    }
    
    // Setup socket connection only for admins
    if (isAdmin) {
      const setupSocket = () => {
        try {
          // Force create a new socket connection
          socketService.disconnectSocket();
          const socket = socketService.initSocket();
          socketRef.current = socket;
          
          // Join the event room
          socket.emit('join', { event_id: eventId });
          
          socket.on('connect', () => {
            setSocketConnected(true);
            setIsUsingApiFallback(false);
            setError(null);
            
            // Re-join room on reconnect
            socket.emit('join', { event_id: eventId });
            
            // Immediately refresh timer data on connection
            fetchTimerStatus(true);
          });

          socket.on('connect_error', (error: Error) => {
            setSocketConnected(false);
            setIsUsingApiFallback(true);
            
            const errorDetail = error instanceof Error ? error.message : 'Unknown error';
            setError(`Connection error: ${errorDetail}. Using client-side timer.`);
            
            // Update the state one time when the socket fails
            fetchTimerStatus(true);
            // We don't set up polling here anymore
          });

          socket.on('disconnect', (reason) => {
            setSocketConnected(false);
            setIsUsingApiFallback(true);
            
            // Update the state one time when the socket disconnects
            fetchTimerStatus(true);
            // We don't set up polling here anymore
          });
          
          // Subscribe to timer updates
          socket.on('timer_update', (data: TimerState) => {
            // Verify we received valid data
            if (data) {
              setTimerState(data);
              setIsUsingApiFallback(false);
              
              if (data.time_remaining !== undefined) {
                setTimeRemaining(data.time_remaining);
                // Reset notification flag if we're not at zero
                if (data.time_remaining > 0) {
                  setNotifiedZero(false);
                }
              } else if (data.timer?.pause_time_remaining) {
                setTimeRemaining(data.timer.pause_time_remaining);
              } else if (data.timer?.round_duration) {
                setTimeRemaining(data.timer.round_duration);
              }
              
              // If we were showing an error, clear it since we got valid data
              if (error) {
                setError(null);
              }
            }
          });
          
          // Listen for errors from server
          socket.on('error', (errorData: any) => {
            console.error('Socket server error:', errorData);
            setError(`Server error: ${errorData.message || 'Unknown error'}`);
          });
          
          setSocketConnected(socket.connected);
        } catch (error) {
          console.error('EventTimer: Error initializing socket:', error);
          setSocketConnected(false);
          setIsUsingApiFallback(true);
          setError('Failed to connect to timer service. Using client-side timer.');
          
          // Update the state one time when the socket fails
          fetchTimerStatus(true);
          // We don't set up polling here anymore
        }
      };
      
      setupSocket();
    } else {
      // For non-admins, a one-time fetch is sufficient
      // Instead of polling, we'll rely on the client-side timer
      setIsUsingApiFallback(true);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave', { event_id: eventId });
        socketRef.current.off('timer_update');
        socketRef.current.off('error');
      }
      
      socketService.disconnectSocket();
      
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [eventId, fetchTimerStatus, fetchRoundInfo, error, isAdmin, isEventActive]);

  // Countdown timer - locally maintained to avoid glitches
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Only run countdown for active timers
    if ((isAdmin || !isAdmin) && timerState?.status === 'active' && timeRemaining > 0 && isEventActive) {
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(prev - 1, 0);
          
          // Play notification when timer reaches zero
          if (newTime === 0 && !notifiedZero) {
            playNotificationSound();
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
  }, [timerState?.status, timeRemaining, isAdmin, playNotificationSound, notifiedZero, isEventActive]);

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

  // Handler function with socket and fallback API
  const handleSocketAction = useCallback(async (
    action: string, 
    socketEvent: string, 
    apiEndpoint: string, 
    apiMethod: string = 'POST',
    data: any = {}
  ) => {
    if (!isEventActive) return;
    
    // Try socket first
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(socketEvent, {...data, event_id: eventId});
      return;
    }
    
    // Fallback to REST API if socket is not available
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

  const openSettingsDialog = () => {
    if (timerState?.timer?.round_duration) {
      setNewDuration(timerState.timer.round_duration);
    }
    setIsSettingsOpen(true);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const renderAttendeeView = () => {
    if (!isEventActive) {
      return (
        <Box p={2} textAlign="center">
          <Typography variant="body1">Timer available when event is in progress</Typography>
        </Box>
      );
    }
    
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={2}>
          <Alert severity="error" variant="outlined">
            Timer unavailable
          </Alert>
        </Box>
      );
    }

    if (!roundInfo?.has_timer) {
      return (
        <Box p={2} textAlign="center">
          <Typography variant="body1">Timer not initialized yet</Typography>
        </Box>
      );
    }

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}
      >
        <Typography variant="h6">
          Round {roundInfo?.current_round || '-'}
        </Typography>
        
        <Box mt={1}>
          <Chip 
            label={roundInfo?.status === 'active' ? 'In Progress' : roundInfo?.status === 'paused' ? 'Paused' : 'Waiting'} 
            color={roundInfo?.status === 'active' ? 'primary' : roundInfo?.status === 'paused' ? 'warning' : 'default'}
          />
        </Box>
        
        <Box display="flex" justifyContent="center" mt={1}>
          <FormControlLabel
            control={
              <Switch 
                checked={soundEnabled}
                onChange={toggleSound}
                size="small"
              />
            }
            label={
              <Box display="flex" alignItems="center">
                {soundEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {soundEnabled ? "Sound On" : "Sound Off"}
                </Typography>
              </Box>
            }
          />
        </Box>
      </Paper>
    );
  };

  const renderAdminView = () => {
    if (!isEventActive) {
      return (
        <Box p={2} textAlign="center">
          <Typography variant="body1">Timer controls available when event is in progress</Typography>
        </Box>
      );
    }
    
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={40} />
        </Box>
      );
    }

    if (error) {
      return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={() => fetchTimerStatus(true)}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Paper>
      );
    }

    if (!timerState?.has_timer) {
      return (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box textAlign="center" mb={2}>
            <Typography variant="h6">Timer not initialized</Typography>
          </Box>
          
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={initializeTimerViaApi}
              disabled={isInitializing}
              startIcon={isInitializing ? <CircularProgress size={20} /> : <Refresh />}
            >
              {isInitializing ? 'Initializing...' : 'Initialize Timer'}
            </Button>
          </Box>
        </Paper>
      );
    }

    const isActive = timerState.status === 'active';
    const isPaused = timerState.status === 'paused';
    const isInactive = timerState.status === 'inactive';
    const currentRound = timerState.timer?.current_round || 1;
    
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Round {currentRound}
          </Typography>
          
          <Box>
            <Chip 
              label={isActive ? 'Active' : isPaused ? 'Paused' : 'Inactive'} 
              color={isActive ? 'primary' : isPaused ? 'warning' : 'default'}
              sx={{ mr: 1 }}
            />
            
            <IconButton 
              size="small" 
              onClick={openSettingsDialog}
              title="Settings"
            >
              <Settings fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          my={2}
          position="relative"
        >
          <Typography 
            variant="h3" 
            color={timeRemaining <= 10 && isActive ? 'error' : 'textPrimary'}
            sx={{
              animation: timeRemaining <= 10 && isActive ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              }
            }}
          >
            {formatTime(timeRemaining)}
          </Typography>
          
          {/* Mute/unmute toggle */}
          <Box position="absolute" right={0} top={0}>
            <IconButton onClick={toggleSound} size="small" title={soundEnabled ? "Mute" : "Unmute"}>
              {soundEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Box>
        </Box>
        
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          flexWrap="wrap"
          gap={1}
          mt={2}
        >
          {/* Timer control buttons */}
          {isInactive && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleStartRound}
              sx={{ minWidth: 120 }}
            >
              Start Round
            </Button>
          )}
          
          {isActive && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Pause />}
              onClick={handlePauseRound}
              sx={{ minWidth: 120 }}
            >
              Pause
            </Button>
          )}
          
          {isPaused && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleResumeRound}
              sx={{ minWidth: 120 }}
            >
              Resume
            </Button>
          )}
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SkipNext />}
            onClick={handleNextRound}
            sx={{ minWidth: 120 }}
          >
            Next Round
          </Button>
        </Box>
        
        {/* Socket connection status */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Chip 
            size="small"
            label={socketConnected ? "Real-time connected" : "Using API fallback"} 
            color={socketConnected ? "success" : "default"}
            variant="outlined"
          />
        </Box>

        {isUsingApiFallback && (
          <Box mt={1} mb={2} display="flex" justifyContent="center">
            <Chip 
              label="Using API fallback" 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          </Box>
        )}
      </Paper>
    );
  };

  // Settings dialog
  const renderSettingsDialog = () => {
    return (
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogContent>
          <Typography id="round-duration-slider" gutterBottom>
            Round Duration: {formatTime(newDuration)}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateDuration} 
            color="primary" 
            variant="contained"
          >
            Save
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
    </>
  );
};

export default EventTimer; 