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
  Tooltip,
  useTheme,
  Snackbar
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Settings, 
  Timer as TimerIcon,
  NotificationImportant,
  SkipNext
} from '@mui/icons-material';
import axios from 'axios';
import { ScheduleItem, TimerState } from '../../types/event';

interface EventTimerProps {
  eventId: number;
  isAdmin: boolean;
  eventStatus?: string;
  userSchedule?: ScheduleItem[];
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

  const isEventActive = eventStatus === 'In Progress' || eventStatus === 'Paused';
  
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newDuration, setNewDuration] = useState<number>(180);
  const [newBreakDuration, setNewBreakDuration] = useState<number>(90);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timerStatus, setTimerStatus] = useState<'active' | 'paused' | 'inactive' | 'ended' | 'break_time'>('inactive');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [nextRoundInfo, setNextRoundInfo] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(180);
  const [notifiedZero, setNotifiedZero] = useState<boolean>(false);
  const [showTimerEndAlert, setShowTimerEndAlert] = useState<boolean>(false);
  const [statusBeforePause, setStatusBeforePause] = useState<'active' | 'break_time' | null>(null);
  
  const lastFetchTimeRef = useRef<number>(Date.now());
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const fiveSecondIntervalRef = useRef<number | null>(null);
  
  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      console.log(`Safely clearing timer interval ID: ${timerIntervalRef.current}`);
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      return true;
    }
    return false;
  }, []); 

  // Create audio element for notifications
  useEffect(() => {
    try {
      // Create a basic audio element for timer end sound - no fancy Web Audio API
      timerAudioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAA');
      
      // Make sure it doesn't try to autoplay
      if (timerAudioRef.current) {
        timerAudioRef.current.autoplay = false;
        timerAudioRef.current.preload = 'auto';
      }
    } catch (error) {
      console.error('Error creating timer audio:', error);
      // Create a dummy object that won't throw errors
      timerAudioRef.current = { 
        play: () => Promise.resolve() 
      } as any;
    }
    
    return () => {
      if (timerAudioRef.current) {
        timerAudioRef.current = null;
      }
    };
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const processTimerData = useCallback((data: TimerState) => {
    setTimerState(data);
    
    const fetchedStatus = data.status ?? (data.timer?.is_paused ? 'paused' : (data.timer?.round_start_time ? 'active' : 'inactive'));
    setTimerStatus(fetchedStatus);
  
    if (fetchedStatus === 'active' && data.timer?.round_start_time) {
      let remainingTime: number;
      const startTime = new Date(data.timer.round_start_time).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const roundDuration = data.timer.round_duration || 180;
      remainingTime = Math.max(0, roundDuration - elapsedSeconds);
      
      if (remainingTime === 0 && fetchedStatus === 'active') { //TODO - add final round handling here
        setTimerStatus('break_time');
      } else if (timerIntervalRef.current === null || timerStatus !== 'active') {
        setTimeRemaining(remainingTime);
        setNotifiedZero(false);
      }
    } else if (fetchedStatus === 'paused') {
      const pausedTime = data.timer?.pause_time_remaining ?? 0;
      console.log(`Setting paused timer with remaining time: ${pausedTime}`);
      setTimeRemaining(pausedTime);
    } else {
      setTimeRemaining(0);
    }
    
    setCurrentRound(data.timer?.current_round ?? 0);
    setNextRoundInfo(data.timer?.current_round ? data.timer?.current_round+1 : 0);
    setRoundDuration(data.timer?.round_duration ?? 180);

    // Reset notification flags if needed
    if ((data.time_remaining ?? 0) > 0 || fetchedStatus === 'active') {
      setNotifiedZero(false);
    }
    
    setIsLoading(false);
  }, [timerStatus]);

  // all timer related API requests funnelled here
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

      if (endpoint === 'start' && response.data && response.data.timer) {
        const timerDuration = response.data.timer.round_duration || 180;
        
        if (timerIntervalRef.current !== null) {
          console.log(`Clearing existing interval (ID: ${timerIntervalRef.current}) after start API call`);
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        setTimeRemaining(timerDuration);
        setCurrentRound(response.data.timer.current_round || 1);
      }
      
      return response.data;
    } catch (err: any) {
      console.error(`API error in ${endpoint}:`, err);
    }
  }, [API_URL, eventId, isEventActive]);

  // Funnels all calls into makeApiRequest
  const handleApiAction = useCallback(async (
    action: string, 
    apiEndpoint: string, 
    apiMethod: string = 'POST',
    data: any = {}
  ) => {
    if (!isAdmin || !isEventActive) return Promise.reject("Not admin or event inactive");
    
    try {
      console.log(`Handling explicit API action: ${action} via ${apiEndpoint}`);
      lastFetchTimeRef.current = Date.now();
      
      const result = await makeApiRequest(apiEndpoint, apiMethod, data);
      return result;
    } catch (error: any) {
      console.error(`Error during API action '${action}':`, error);
      
      const errorMessage = error.response 
        ? `Error ${error.response.status}: ${error.response.data?.error || error.message}`
        : `Network error: ${error.message}`;
      
      if (Notification.permission === 'granted') {
        new Notification('Timer Action Failed', {
          body: `Failed to ${action.toLowerCase()}: ${errorMessage}`,
          icon: '/favicon.ico'
        });
      }
      
      throw error;
    }
  }, [isAdmin, isEventActive, makeApiRequest]);

  // Ensure timer interval is cleared when component unmounts
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  // ngOnInit
  useEffect(() => {
    if (isEventActive && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      const token = localStorage.getItem('token');
      if (token) {
        lastFetchTimeRef.current = Date.now();
        axios.get(`${API_URL}/events/${eventId}/timer`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(response => {
          if (response.data) {
            processTimerData(response.data);
          }
        }).catch(err => {
          console.error('Error during initial timer fetch:', err);
        });
      }
    } else if (hasInitializedRef.current) {
      console.log("Component already initialized - skipping repeated init");
    }
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [eventId, isEventActive, API_URL, processTimerData]);

  // called every 5 seconds:
  useEffect(() => {
    if (isEventActive && timerStatus !== 'ended') {
      fiveSecondIntervalRef.current = window.setInterval(() => { 
        const token = localStorage.getItem('token');
        if (token) {
          lastFetchTimeRef.current = Date.now();
          axios.get(`${API_URL}/events/${eventId}/timer`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(response => {
            if (response.data) {
              processTimerData(response.data);
            }
          }).catch(err => {
            console.error('Error during timer fetch:', err);
          });
        }
      }, 5000)
    }
    return () => {
      if (fiveSecondIntervalRef.current) {
        window.clearInterval(fiveSecondIntervalRef.current);
        fiveSecondIntervalRef.current = null;
      }
    };
  }, [isEventActive, API_URL, processTimerData, eventId, timerStatus]);

  const handleStartRound = useCallback(() => {
    console.log("handleStartRound: Triggering API action...");
    
    clearTimerInterval();
    setNotifiedZero(false);
    setTimerStatus('inactive'); 
    
    if (timerStatus === 'break_time') {
      console.log('is this ever hit?\n\n')
      console.log("Starting from break mode - advancing to next round first");
      
      handleApiAction('next round', 'next')
        .then(nextResult => {
          console.log("Successfully advanced to next round:", nextResult);
          
          return handleApiAction('start round', 'start');
        })
        .then((result) => {
          // After successful API calls, set the expected state
          console.log("Start round API success after advancing, setting timer active with result:", result);
          
          const duration = result?.timer?.round_duration || roundDuration || 180;
          console.log(`Setting timer to full duration of ${duration} seconds for new round`);
          
          setTimeRemaining(duration);
          
          setTimeout(() => {
            setTimerStatus('active');
            
            // Play sound notification for new round start
            const actualRound = result?.timer?.current_round; // Get actual round from API
            if (actualRound) {
              console.log(`Updating UI to reflect actual current round: ${actualRound}`);
              setCurrentRound(actualRound);
            } else {
              console.warn("API response for start didn't include current_round!");
              // Fallback - less ideal
              const fallbackRound = currentRound + 1;
              setCurrentRound(fallbackRound);
            }
          }, 50);
        })
        .catch(error => {
          console.error("Error advancing and starting round:", error);
        });
    } else {
      handleApiAction('start round', 'start')
        .then((result) => {
          const duration = result?.timer?.round_duration || roundDuration || 180;
          console.log(`Setting timer to full duration of ${duration} seconds for new round`);
          
          setTimeRemaining(duration); 
          
          setTimeout(() => {
            setTimerStatus('active');
            const actualRound = result?.timer?.current_round;
            if (actualRound) {
              setCurrentRound(actualRound);
            } else {
              const fallbackRound = nextRoundInfo || currentRound;
              setCurrentRound(fallbackRound);
            }
          }, 50);
        })
        .catch(error => {
          console.error("Error starting round:", error);
        });
    }
  }, [handleApiAction, nextRoundInfo, currentRound, roundDuration, clearTimerInterval, timerStatus]);

  const handlePauseRound = useCallback(() => {
    if (timerStatus !== 'active') {
        console.warn("Pause action ignored: Timer status is not active (", timerStatus, ")");
        return; 
    }
    
    console.log(`USER ACTION: Pause button clicked (Status: ${timerStatus}). Pausing with time: ${timeRemaining}`);
    setStatusBeforePause('active');
    
    handleApiAction(
      'Pause Timer', 
      'pause', 
      'POST', 
      { time_remaining: timeRemaining }
    ).then((result) => {
        if (result && !result.error) {
            console.log("Pause API successful, setting status to paused and clearing interval.");
            clearTimerInterval();
            setTimerStatus('paused');
            if(result.timer) {
                setTimeRemaining(result.timer.pause_time_remaining ?? 0);
            }
        }
    }).catch(err => {
        console.error("Pause API call failed:", err);
    });
  }, [handleApiAction, timeRemaining, clearTimerInterval, timerStatus]);

  const playRoundEndSound = useCallback(() => {
    if (timerAudioRef.current) {
      try {
        const playPromise = timerAudioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => console.error('Error playing ROUND END sound:', err));
        }
      } catch (err) {
        console.error('Error playing sound:', err);
      }
      
      setNotifiedZero(true);
      setShowTimerEndAlert(true);
      
      setTimeout(() => {
        setShowTimerEndAlert(false);
      }, 10000);
      
      if ('Notification' in window) {
        if (Notification.permission === 'granted') { 
          try {
            const notification = new Notification('Timer Complete', { 
              body: 'The current round has ended',
              icon: '/favicon.svg',
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
        }
      }
    }
  }, []);

  const handleResumeRound = useCallback(() => {
    if (timerStatus !== 'paused') {
        console.warn("Resume action ignored: Timer status is not paused (", timerStatus, ")");
        return; 
    }
    console.log("USER ACTION: Resume round button clicked (Status is paused)");
    handleApiAction('Resume Timer', 'resume')
        .then((result) => {
            if (result && result.timer) {
                console.log("Resume API successful. Status before pause:", statusBeforePause);
                const pausedTime = result.timer.pause_time_remaining ?? 0;
                
                // Restore the correct state based on what was paused
                if (statusBeforePause === 'break_time') {
                    console.log(`Resuming break timer`);
                    setTimerStatus('break_time');
                } else {
                    const currentRoundDuration = roundDuration; 
                    const timeToSet = Math.min(pausedTime, currentRoundDuration);
                    
                    if (timeToSet <= 0) { //edge case
                        clearTimerInterval();
                        if (!notifiedZero) { 
                            const isFinalRound = currentRound >= result.timer.final_round; 
                            playRoundEndSound();
                            
                            if (isFinalRound) {
                                console.log("Final round ended immediately upon resume. Setting status to 'ended'.");
                                setTimerStatus('ended');
                                setTimeRemaining(0);
                            } else {
                                console.log("Regular round ended immediately upon resume. Transitioning to break state.");
                                setTimerStatus('break_time');
                                setTimeRemaining(0);
                            }
                            setNotifiedZero(true);
                        }
                    } else {
                        console.log(`Resuming round timer. Paused time: ${pausedTime}, Current duration: ${currentRoundDuration}. Setting remaining to: ${timeToSet}`);
                        setTimerStatus('active'); 
                        setTimeRemaining(timeToSet);
                    }
                }
                
                setStatusBeforePause(null);
            } else {
                console.error("Resume API call succeeded but returned unexpected data:", result);
                setStatusBeforePause(null);
            }
        })
        .catch(err => {
            console.error("Resume API call failed:", err);
            setStatusBeforePause(null);
        });
}, [handleApiAction, timerStatus, statusBeforePause, roundDuration, setTimerStatus, setTimeRemaining, clearTimerInterval, currentRound, notifiedZero, playRoundEndSound]);

  const handleNextRound = useCallback(() => {
    clearTimerInterval();

    handleApiAction('End round', 'end')
      .then((result) => {
        if (result && currentRound >= result.final_round) {
          setTimerStatus('ended');
          setTimeRemaining(0);
        } else {
          setTimerStatus('break_time');
          setTimeRemaining(0);
          if (result && result.current_round) {
            setCurrentRound(Number(result.current_round));
          } else {
            setCurrentRound(prev => prev + 1);
          }
        }
      })
      .catch(error => {
        console.error('Error handling next round:', error);
      });
  }, [clearTimerInterval, handleApiAction, currentRound]);

  // sets up the active browser timer
  useEffect(() => {
    if (timerStatus === 'active' && timeRemaining > 0 && timerIntervalRef.current === null) {
      clearTimerInterval();
      
      console.log(`Creating dedicated active timer interval with ${timeRemaining}s remaining`);
      timerIntervalRef.current = window.setInterval(() => { // for each second...
        setTimeRemaining(prevTime => {
          console.log(`Active timer tick: ${prevTime}s remaining`);
          if (prevTime <= 1) {
            clearTimerInterval();
            if (!notifiedZero) {
              const isFinalRound = currentRound >= (timerState?.timer.final_round || 10);
              
              console.log(`Round Timer reached zero. Current Round: ${currentRound}. Is Final: ${isFinalRound}`);
              playRoundEndSound(); 
              
              if (isFinalRound) {
                // --- FINAL ROUND ENDED ---
                console.log("Final round ended. Setting status to 'ended'.");
                setTimerStatus('ended');
                setTimeRemaining(0);
                setNotifiedZero(true);
              } else {
                // --- REGULAR ROUND ENDED ---
                console.log("Regular round ended. Locally transitioning to break state.");
                setTimerStatus('break_time');
                setTimeRemaining(0);
                setNotifiedZero(true);
              }
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }, [
    currentRound,
    timerState?.timer?.break_duration,
    timerStatus, 
    timeRemaining, 
    clearTimerInterval, 
    playRoundEndSound, 
    notifiedZero,
    eventId
  ]);

  // Add a persistent session storage effect to preserve timer state on refresh
  useEffect(() => {
    // If we already have a timer state, try to restore from session storage
    if (!timerState && !isLoading) {
      try {
        // Check for saved state in session storage
        const savedTimerStatus = sessionStorage.getItem(`timer_status_${eventId}`);
        const savedTimeRemaining = sessionStorage.getItem(`time_remaining_${eventId}`);
        
        if (savedTimerStatus) {
          console.log("Restoring timer state from session storage on page refresh");
          
          // Restore timer status if valid
          if (['active', 'paused', 'inactive', 'between_rounds'].includes(savedTimerStatus)) {
            console.log(`Restoring status: ${savedTimerStatus}`);
            setTimerStatus(savedTimerStatus as any);
          }
          
          // Restore timer values if available
          if (savedTimeRemaining) {
            const savedTime = parseInt(savedTimeRemaining, 10);
            if (!isNaN(savedTime) && savedTime > 0) {
              console.log(`Restoring time remaining: ${savedTime}`);
              setTimeRemaining(savedTime);
            }
          }
        }
      } catch (err) {
        console.error("Error restoring timer state:", err);
      }
    }
  }, [eventId, timerState, isLoading]);

  // Save current timer state to session storage
  useEffect(() => {
    if (!isEventActive) return;
    
    try {
      if (timerStatus) {
        sessionStorage.setItem(`timer_status_${eventId}`, timerStatus);
      }
      
      if (timeRemaining > 0) {
        sessionStorage.setItem(`time_remaining_${eventId}`, timeRemaining.toString());
      }
      
      if (timerState) {
        sessionStorage.setItem(`timer_state_${eventId}`, JSON.stringify({
          current_round: currentRound,
          has_timer: true
        }));
      }
    } catch (err) {
      console.error("Error saving timer state to session storage:", err);
    }
  }, [eventId, timerStatus, timeRemaining, currentRound, timerState, isEventActive]);

  const handleUpdateDuration = useCallback(() => {
    // Prepare data object only with values that changed
    const updateData: { round_duration?: number, break_duration?: number } = {};
    let needsUpdate = false;

    // Check if round duration changed from the original
    if (timerState?.timer && newDuration !== timerState.timer.round_duration) {
        updateData.round_duration = newDuration;
        needsUpdate = true;
    }

    // Check if break duration changed from the original
    // Ensure break_duration exists on timer before comparing
    if (timerState?.timer && newBreakDuration !== (timerState.timer.break_duration ?? 90)) { 
        updateData.break_duration = newBreakDuration;
        needsUpdate = true;
    }

    if (needsUpdate) {
        handleApiAction(
          'update durations', 
          'duration', 
          'PUT',
          updateData
        )
        // Add .then() to handle successful API response
        .then(updatedTimerData => {
          if (updatedTimerData && updatedTimerData.timer) {
            console.log("Duration update successful, updating frontend state:", updatedTimerData);
            // Update the main timerState object which drives many parts of the UI
            setTimerState(prevState => {
              // Create a new state object ensuring timer exists
              const newState: TimerState = {
                ...prevState,
                has_timer: true, 
                timer: {
                  ...(prevState?.timer ?? {}), // Safely spread previous timer or empty object
                  ...updatedTimerData.timer, // Merge updated fields from API response
                  round_duration: updatedTimerData.timer.round_duration,
                  break_duration: updatedTimerData.timer.break_duration
                },
                message: updatedTimerData.message || '', // Ensure message is always a string
                status: updatedTimerData.status || 'inactive',
                time_remaining: updatedTimerData.time_remaining || 0
              };
              // Store the updated state in session storage immediately
              try {
                sessionStorage.setItem(`timer_data_${eventId}`, JSON.stringify(newState));
                sessionStorage.setItem(`timer_data_timestamp_${eventId}`, Date.now().toString());
              } catch (err) {
                 console.error("Error saving updated timer state to session storage:", err);
              }
              return newState;
            });
             // Directly update roundDuration state used elsewhere
             setRoundDuration(updatedTimerData.timer.round_duration);
             
             // --- Adjust active timer if duration changed --- 
             if (timerStatus === 'active' && updatedTimerData.timer.round_start_time) {
               const newRoundDuration = updatedTimerData.timer.round_duration;
               const startTime = new Date(updatedTimerData.timer.round_start_time).getTime();
               const now = Date.now();
               const elapsedSeconds = Math.floor((now - startTime) / 1000);
               const newTimeRemaining = Math.max(0, newRoundDuration - elapsedSeconds);
               
               console.log(`Round duration updated while active. New duration: ${newRoundDuration}, Elapsed: ${elapsedSeconds}, New Remaining: ${newTimeRemaining}`);
               
               // Set the new remaining time
               setTimeRemaining(newTimeRemaining);
               
               // Clear the existing interval so the useEffect picks up the change
               // and restarts the countdown correctly.
               clearTimerInterval(); 
             } else if (timerStatus === 'paused') {
                // If paused, update the displayed time based on new duration?
                // For simplicity, let's just update the underlying roundDuration.
                // The new duration will apply when resumed.
                // We already setRoundDuration above.
             }
            // ------------------------------------------------
            
            // Update the display value in the settings dialog immediately for feedback
            
          } else {
            console.warn("Duration update API call succeeded but returned unexpected data:", updatedTimerData);
          }
          // Close dialog only after successful update and state set
          setIsSettingsOpen(false); 
        })
        .catch(error => {
          console.error("Error updating durations via API:", error);
          // Optionally: Show an error message to the user
          // Close dialog even on error? Or leave it open? Closing for now.
          setIsSettingsOpen(false); 
        });
    } else {
        console.log("No duration changes detected, skipping API call.");
        // Close the dialog if no changes were made
        setIsSettingsOpen(false); 
    }
    // Move setIsSettingsOpen(false) inside the .then() and .catch() blocks, 
    // and the 'else' block, so it only closes after action or if no action needed.
    //setIsSettingsOpen(false); // REMOVED FROM HERE
  }, [handleApiAction, newDuration, newBreakDuration, timerState, eventId, clearTimerInterval, timerStatus]);

  const openSettingsDialog = () => {
    // Set initial slider values from current timer state
    if (timerState?.timer?.round_duration) {
      setNewDuration(timerState.timer.round_duration);
    }
    if (timerState?.timer?.break_duration) {
      setNewBreakDuration(timerState.timer.break_duration); // Set initial break duration
    }
    setIsSettingsOpen(true);
  };

  const getProgressPercentage = () => {
    if (roundDuration > 0 && timeRemaining > 0) {
      return (timeRemaining / roundDuration) * 100;
    }
    return 0;
  };

  const renderAttendeeView = () => {
    if (!isEventActive) {
      return null;
    }
    
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={{ xs: 0.25, sm: 0.5 }}> 
          <CircularProgress size={16} /> 
        </Box>
      );
    }

    const isActive = timerStatus === 'active';
    const isBreakTime = timerStatus === 'break_time';
    const isEnded = timerStatus === 'ended'
    const currentRoundSchedule = userSchedule?.find(item => item.round === currentRound);
    
    return (
      <>
        {/* Notification popup */}
        {timeRemaining === 0 && showTimerEndAlert && timerStatus !== 'ended' && (
          <Snackbar
            open={showTimerEndAlert}
            autoHideDuration={6000}
            onClose={() => setShowTimerEndAlert(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{top: {xs: '8px', sm: '24px'} }} 
          >
            <Alert 
              onClose={() => setShowTimerEndAlert(false)} 
              severity="info"
              icon={<NotificationImportant sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem'}}} />}
              sx={{ width: '100%', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem' }, py: {xs: 0.25, sm: 0.5} }}
            >
              Time's up! This round has ended.
            </Alert>
          </Snackbar>
        )}
        
        {/* Attendee timer bar */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            minHeight: { xs: '30px', sm: '36px'},
            p: { xs: 0.5, sm: 1 }, 
            ml: { xs: 0, sm: 0.5 }, 
            mr: { xs: 0, sm: 0.5 }, 
            borderRadius: '4px', 
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${ isBreakTime ? theme.palette.info.light : theme.palette.divider }`,
            boxShadow: '0px 1px 2px rgba(0,0,0,0.1)', 
            maxWidth: '100%',
          }}
        >
          <TimerIcon 
            sx={{ 
              mr: { xs: 0.5, sm: 1 }, 
              color: isActive ? theme.palette.primary.main : isBreakTime ? theme.palette.info.main : theme.palette.text.secondary,
              fontSize: { xs: '0.9rem', sm: '1.1rem' }, 
              flexShrink: 0,
            }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
            {isBreakTime ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> 
                  Break Time - Round {nextRoundInfo || '-'} starting soon.
                </Typography>
              </Box>
            ) : isActive && currentRoundSchedule ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> 
                  Round {currentRound}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block', fontSize: { xs: '0.55rem', sm: '0.7rem' } }}> 
                  {currentRoundSchedule ? 
                    `Table ${currentRoundSchedule.table} with ${currentRoundSchedule.partner_name}` : 
                    'Loading schedule...'
                  }
                </Typography>
                {/* comment out time for attendees for now */}
                {/* {isActive && (
                  <Typography 
                    color="primary"
                    variant="body2" 
                    sx={{ fontWeight: 600, mt: 0, fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
                  >
                    {formatTime(timeRemaining)} is active
                  </Typography>
                )} */}
              </Box>
            ) : isEnded ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.8rem' } }}>Event Finished - Save your selections!</Typography>
            ) : currentRound > 0 ? (
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> 
                {currentRoundSchedule ? `Round ${currentRound}` : 'Break Round - grab a snack :)'} 
                {isActive && currentRoundSchedule ? formatTime(timeRemaining) : (timerStatus === 'paused' && currentRoundSchedule ? ' (Paused)' : '')}
              </Typography>
            ) : timerStatus === 'inactive' ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.8rem' } }}>Waiting for event to start...</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.8rem' } }}>Waiting for round...</Typography>
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
        <Box display="flex" justifyContent="center" p={{ xs: 0.25, sm: 0.5 }}> 
          <CircularProgress size={16} /> 
        </Box>
      );
    }

    const isActive = timerStatus === 'active';
    const isPaused = timerStatus === 'paused';
    const isBreakTime = timerStatus === 'break_time';
    const isEnded = timerStatus === 'ended';
    const isAlmostDone = timeRemaining <= 10 && isActive;
    
    const progressPercentage = getProgressPercentage();
    
    return (
      <>
        <Box 
          sx={{ 
            width: '100%',
            my: { xs: 0.5, sm: 1} // MODIFIED
          }}
        >
          {/* notification */}
          {timeRemaining === 0 && showTimerEndAlert && timerStatus !== 'ended' && (
            <Alert 
              severity="info" 
              icon={<NotificationImportant sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem'}}} />}
              variant="filled"
              sx={{ 
                mb: { xs: 0.5, sm: 1 },
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                py: {xs: 0.25, sm: 0.5}
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowTimerEndAlert(false)}
                  sx={{ ml: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.7rem'} }}
                >
                  Dismiss
                </Button>
              }
            >
              {isBreakTime ? 'Break time - Ready for next round' : 'Prepare for next round.'}
            </Alert>
          )}

          <Paper
            elevation={1}
            sx={{
              display: 'flex',
              width: '100%',
              py: { xs: 0.5, sm: 1 },
              borderRadius: '6px',
              bgcolor: isAlmostDone ? theme.palette.error.light + '22' :
                      isActive ? theme.palette.primary.light + '22' :
                      isPaused ? theme.palette.warning.light + '22' :
                      isBreakTime ? theme.palette.info.light + '22' :
                      theme.palette.background.default,
              border: `1px solid ${ 
                        isAlmostDone ? theme.palette.error.light :
                        isActive ? theme.palette.primary.light :
                        isPaused ? theme.palette.warning.light :
                        isBreakTime ? theme.palette.info.light :
                        theme.palette.divider
                      }`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'background-color 0.3s ease, border-color 0.3s ease',
              px: { xs: 0.75, sm: 1 },
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Optional Progress Bar - Remains the same */}
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progressPercentage}%`,
                  bgcolor: isAlmostDone ?
                    theme.palette.error.light + '33' : // MODIFIED: Lighter alpha
                    theme.palette.primary.light + '33',
                  transition: 'width 1s linear, background-color 0.3s ease',
                  zIndex: 1
                }}
              />
            )}
            
            {/* Box 1: TimerIcon + Round Info + Chip (LEFT) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
                flex: '0 1 auto',
                mr: { xs: 1, sm: 2 }
              }}
            >
              <TimerIcon
                sx={{
                  mr: { xs: 0.5, sm: 1 },
                  color: isAlmostDone ? theme.palette.error.main :
                        isActive ? theme.palette.primary.main :
                        isPaused ? theme.palette.warning.main :
                        isBreakTime ? theme.palette.info.main :
                        theme.palette.text.secondary,
                  fontSize: { xs: '1rem', sm: '1.2rem' }
                }}
              />
              <Box>
                {isEnded ? (
                  <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2, color: theme.palette.text.primary, fontSize: { xs: '0.7rem', sm: '0.9rem'} }}>
                    Finished
                  </Typography>
                ) : (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500,
                      lineHeight: 1.2,
                      color: theme.palette.text.primary,
                      textAlign: 'left',
                      fontSize: { xs: '0.75rem', sm: '0.9rem'}
                    }}
                  >
                    Round {currentRound || '-'}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Box 2 (effectively): Main Time Typography (CENTER) */}
            <Typography
              variant="h3"
              component="div"
              color={isAlmostDone ? theme.palette.error.main :
                     isActive ? theme.palette.primary.main :
                     isPaused ? theme.palette.warning.main :
                     isBreakTime ? theme.palette.info.main :
                     theme.palette.text.secondary}
              sx={{
                fontWeight: 600,
                animation: isAlmostDone ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
                fontSize: isBreakTime
                  ? { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' } 
                  : { xs: '1.5rem', sm: '2rem', md: '2.2rem' },
                my: 0,
                mx: 'auto',
                flex: '0 0 auto',
                zIndex: 2,
                textAlign: 'center',
                minWidth: '50px',
                color: isEnded ? theme.palette.text.secondary : 'inherit',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {isEnded ? '--:--' : (isActive || isPaused ? formatTime(timeRemaining) : (isBreakTime ? 'Break Time' : '--:--'))}
            </Typography>
            
            {/* Box 3: Controls (Switch, Icons) (RIGHT) */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'nowrap',
                justifyContent: 'flex-end',
                gap: { xs: 0, sm: 0 },
                width: 'auto',
                zIndex: 2,
                flex: '0 1 auto'
            }}>
              <Tooltip title="Settings">
                <IconButton 
                  size="small" 
                  onClick={openSettingsDialog}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main
                    },
                    p: {xs: 0.25, sm: 0.5},
                    mr: { xs: 0, sm: 0.25 }
                  }}
                >
                  <Settings sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}/>
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          <Paper 
            elevation={1}
            sx={{ 
              mt: { xs: 0.25, sm: 0.5 },
              mb: { xs: 0.5, sm: 1 },
              p: { xs: 0.75, sm: 1 },
              width: '100%',
              borderRadius: '6px'
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 0.75 },
                flexDirection: { xs: 'row', sm: 'row' },
                flexWrap: 'wrap',
                '& .MuiButton-root': { 
                  flexGrow: 1,
                  minWidth: { xs: '90px', sm: '100px'},
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  py: { xs: 0.4, sm: 0.6 },
                  px: { xs: 0.8, sm: 1 },
                  my: { xs: 0.25, sm: 0}
                }
              }}
            >
              {/* --- ACTIVE OR BETWEEN ROUNDS STATE --- */}
              {(isActive || isBreakTime) && currentRound <= 10 && (
                <>
                  {/* End Round Button: Show only if active */}
                  {isActive && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<SkipNext sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                      onClick={handleNextRound}
                      size="small" 
                      sx={{
                        borderRadius: '4px',
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      End Round
                    </Button>
                  )}
                  {/* Pause Button: Show only if active (not during break) */}
                  {isActive && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Pause sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                      onClick={handlePauseRound}
                      size="small" 
                      sx={{ 
                        borderRadius: '4px',
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      Pause Round
                    </Button>
                  )}
                </>
              )}
               
               {/* --- PAUSED STATE --- */}
               {isPaused && currentRound <= 10 && (
                 <Button
                   variant="contained"
                   color="primary"
                   startIcon={<PlayArrow sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                   onClick={handleResumeRound}
                   size="small" 
                   sx={{
                     borderRadius: '4px',
                     textTransform: 'none',
                     fontWeight: 500
                   }}
                 >
                   Resume Round
                 </Button>
               )}
               
                {/* --- INACTIVE or BETWEEN ROUNDS STATE --- */}
                {(timerStatus === 'inactive' || timerStatus === 'break_time') && currentRound < 10 && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                    onClick={handleStartRound}
                    size="small" 
                    sx={{
                      borderRadius: '4px',
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {timerStatus === 'break_time' ? 
                      'Start Next Round' :  // Always show this text during break
                      'Start Round'}
                  </Button>
                )}

                {/* --- ENDED STATE --- */}
                {isEnded && (
                   <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                     Event Finished
                   </Typography>
                )}
            </Box>
          </Paper>
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
    <Box sx={{ my: 2, transform: 'translateZ(-2500)' }}>
       {isAdmin ? renderAdminView() : renderAttendeeView()}
       {renderSettingsDialog()}
      
    </Box>
  );
};

export default EventTimer; 