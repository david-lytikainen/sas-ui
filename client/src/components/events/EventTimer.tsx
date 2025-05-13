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
  Settings, 
  VolumeUp, 
  VolumeOff, 
  Timer as TimerIcon,
  KeyboardArrowDown,
  NotificationImportant,
  SkipNext
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
    break_duration?: number;
  };
  time_remaining?: number;
  status?: 'active' | 'paused' | 'inactive' | 'ended';
  message?: string;
  current_round?: number;
  next_round?: number;
  break_duration?: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const AUTO_POLLING_COMPLETELY_DISABLED = true;

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
  const [newBreakDuration, setNewBreakDuration] = useState<number>(90);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timerStatus, setTimerStatus] = useState<'active' | 'paused' | 'inactive' | 'ended' | 'between_rounds'>('inactive');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [nextRoundInfo, setNextRoundInfo] = useState<number | null>(null);
  const [roundDuration, setRoundDuration] = useState<number>(180);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [notifiedZero, setNotifiedZero] = useState<boolean>(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);
  const [notifiedBreakEnd, setNotifiedBreakEnd] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showTimerEndAlert, setShowTimerEndAlert] = useState<boolean>(false);
  // State to remember status before pausing
  const [statusBeforePause, setStatusBeforePause] = useState<'active' | 'between_rounds' | null>(null);
  
  const lastFetchTimeRef = useRef<number>(Date.now());
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);
  const newRoundAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create a transition ref instead of a state to prevent re-renders
  const isInTransitionRef = useRef<boolean>(false);
  
  // Remove any refs or code related to SSE
  const isApiCallInProgressRef = useRef<boolean>(false);
  
  // Add tracking refs to prevent remounting issues
  const hasInitializedRef = useRef<boolean>(false);
  const recentlyFetchedRef = useRef<boolean>(false);
  
  // Make clearTimerInterval more stable with empty dependency array
  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      console.log(`Safely clearing timer interval ID: ${timerIntervalRef.current}`);
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      return true;
    }
    return false;
  }, []); // Empty dependency array for stability

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

  // Create audio element for break end notifications
  useEffect(() => {
    try {
      // Create basic audio elements for other sounds
      breakAudioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAA');
      newRoundAudioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAA');
      
      // Prevent autoplay
      if (breakAudioRef.current) {
        breakAudioRef.current.autoplay = false;
        breakAudioRef.current.preload = 'auto';
      }
      
      if (newRoundAudioRef.current) {
        newRoundAudioRef.current.autoplay = false;
        newRoundAudioRef.current.preload = 'auto';
      }
    } catch (error) {
      console.error('Error creating round audio elements:', error);
      // Create dummy objects that won't throw errors
      breakAudioRef.current = { 
        play: () => Promise.resolve() 
      } as any;
      
      newRoundAudioRef.current = { 
        play: () => Promise.resolve() 
      } as any;
    }
  }, []);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Move this function earlier in the code, before it's referenced
  const playNewRoundStartNotification = useCallback((roundNumber: number) => {
    console.log(`Attempting to play new round start notification for round ${roundNumber}`);
    if (soundEnabled && newRoundAudioRef.current) {
      try {
        const playPromise = newRoundAudioRef.current.play();
        
        // Check if play() returned a promise (modern browsers)
        if (playPromise !== undefined) {
          playPromise.catch(err => console.error('Error playing NEW ROUND START sound:', err));
        }
      } catch (err) {
        console.error('Error playing new round sound:', err);
      }
    }
    
    // Directly check Notification.permission here
    if ('Notification' in window && Notification.permission === 'granted') { 
      try {
        const notification = new Notification(`Round ${roundNumber} Started!`, {
          body: `The timer for round ${roundNumber} is now active.`,
          icon: '/favicon.svg',
          tag: 'new-round-start'
        });
        notification.onclick = () => { window.focus(); notification.close(); };
      } catch (error) {
        console.error('Error creating new round start notification:', error);
      }
    }
  }, [soundEnabled]);

  // Extract the processing logic to a separate function to reuse with cached data
  const processTimerData = useCallback((data: any) => {
    setTimerState(data);
    
    // CRITICAL: Don't process responses too frequently, can cause component remounting
    if (recentlyFetchedRef.current) {
      console.log("Ignoring rapid subsequent fetch to prevent remounting");
      return;
    }
    
    // Set a short lockout to prevent processing multiple responses in quick succession
    recentlyFetchedRef.current = true;
    setTimeout(() => {
      recentlyFetchedRef.current = false;
    }, 1000);
    
    // Determine the timer status based on the response
    const fetchedStatus = data.status ?? (data.timer?.is_paused ? 'paused' : (data.timer?.round_start_time ? 'active' : 'inactive'));
    
    // Log status transition if it's changing
    if (fetchedStatus !== timerStatus) {
      console.log(`Timer status changing from '${timerStatus}' to '${fetchedStatus}' based on API response`);
    }

    // CRITICAL FIX: Don't change from between_rounds to active if the time is zero or not set
    // This prevents the loop between states
    if (fetchedStatus === 'active' && (data.time_remaining === 0 || data.time_remaining === undefined)) {
      console.log("API reported active state with zero time");
      
      // If we're already in between_rounds state, KEEP this state instead of switching to active with 0 time
      // This prevents the flipping back and forth between states
      if (timerStatus === 'between_rounds' && breakTimeRemaining > 0) {
        console.log("Staying in break state since active timer has 0 time");
        
        // CRITICAL: Don't change any state here - keep current state completely intact
        // Just update round info in case it changed
        setCurrentRound(data.current_round ?? data.timer?.current_round ?? currentRound);
        setNextRoundInfo(data.next_round ?? nextRoundInfo);
        
        // Early return to prevent any further state changes
        return;
      } else {
        // ATTENDEE FIX: For attendees who just loaded the page, don't set to 1 second
        // as it will immediately transition to break. Instead, get the duration from the timer
        // or use a reasonable default like 30 seconds.
        const defaultDuration = data.timer?.round_duration || 180;
        const newTimeRemaining = isAdmin ? 1 : Math.max(30, defaultDuration / 3); // Admin: 1s, Attendee: at least 30s
        
        console.log(`Setting ${isAdmin ? 'admin' : 'attendee'} timer with time remaining: ${newTimeRemaining}s`);
        
        // Only update the status if it's different
        if (timerStatus !== fetchedStatus) {
          setTimerStatus(fetchedStatus);
        }
        
        // CRITICAL FIX: Only update time if we don't have a running timer
        if (timerIntervalRef.current === null) {
          // Set time remaining to prevent immediate transition
          setTimeRemaining(newTimeRemaining);
          
          // CRITICAL: Reset notification flags for new timers
          setNotifiedZero(false);
          setNotifiedBreakEnd(false);
        } else {
          console.log("Keeping local timer state since interval is running");
        }
      }
    } else {
      // Normal status update
      
      // CRITICAL FIX: only update status if we don't have a running local timer,
      // or if we're transitioning to a different status
      const shouldUpdateState = 
        timerIntervalRef.current === null || 
        timerStatus !== fetchedStatus ||
        fetchedStatus === 'inactive' || 
        fetchedStatus === 'paused';
        
      if (shouldUpdateState) {
        setTimerStatus(fetchedStatus);
      
        // Extract and set correct time values based on status
        if (fetchedStatus === 'active') {
          // For active timer, use time_remaining from response or fall back to round_duration
          // ATTENDEE FIX: Ensure attendees don't get zero time (use at least 5 seconds)
          const reportedRemainingTime = data.time_remaining !== undefined ? data.time_remaining : data.timer?.round_duration ?? 180;
          const remainingTime = Math.max(isAdmin ? 1 : 5, reportedRemainingTime);
          
          console.log(`Setting active timer with remaining time: ${remainingTime}`);
          
          // CRITICAL FIX: Only update time if we don't have a running timer
          if (timerIntervalRef.current === null || timerStatus !== 'active') {
            setTimeRemaining(remainingTime);
            
            // Reset notification flags for newly active timers
            setNotifiedZero(false);
          } else {
            console.log("Keeping local timer state since interval is running");
          }
        } else if (fetchedStatus === 'paused') {
          // For paused timer, use pause_time_remaining from the timer object
          const pausedTime = data.timer?.pause_time_remaining ?? 0;
          console.log(`Setting paused timer with remaining time: ${pausedTime}`);
          setTimeRemaining(pausedTime);
        } else if (fetchedStatus === 'between_rounds') {
          // For break timer, use time_remaining or break_duration  
          const breakTime = data.time_remaining ?? data.break_duration ?? 90;
          console.log(`Setting break timer with remaining time: ${breakTime}`);
          
          // CRITICAL FIX: Only update if we don't have a running timer
          if (timerIntervalRef.current === null || timerStatus !== 'between_rounds') {
            setBreakTimeRemaining(breakTime);
          } else {
            console.log("Keeping local break timer state since interval is running");
          }
        } else {
          // For inactive state, reset both timers
          console.log('Setting timer to inactive state');
          setTimeRemaining(0);
          setBreakTimeRemaining(0);
        }
      } else {
        console.log(`Not updating timer state from API since local timer is running`);
      }
    }
    
    // Update round information
    setCurrentRound(data.current_round ?? data.timer?.current_round ?? 0);
    setNextRoundInfo(data.next_round ?? null);
    setRoundDuration(data.timer?.round_duration ?? data.round_duration ?? 180);

    // Reset notification flags if needed
    if ((data.time_remaining ?? 0) > 0 || fetchedStatus === 'active') {
      setNotifiedZero(false);
    }
    if ((data.time_remaining ?? 0) > 0 || fetchedStatus === 'between_rounds') {
      setNotifiedBreakEnd(false);
    }
    
    // Additional check for active timer when status is missing
    if (data.has_timer && !data.status && !data.timer?.is_paused && data.timer?.round_start_time) {
        console.log('Timer has no explicit status but has start time - setting to active');
        setTimerStatus('active');
    } else if (!data.has_timer) {
         setTimerStatus('inactive');
    }
    
    setIsLoading(false);
  }, [timerStatus, breakTimeRemaining, isAdmin, currentRound, nextRoundInfo]);

  const fetchTimerStatus = useCallback(async (force: boolean = false) => {
    if (!isEventActive) {
      setIsLoading(false);
      return;
    }
    
    // ABSOLUTE BAN: Block ALL automatic polling
    if (AUTO_POLLING_COMPLETELY_DISABLED && !force) {
      console.log("🛑 BLOCKED automatic poll attempt - polling is completely disabled");
      return;
    }
    
    // CRITICAL: Prevent multiple simultaneous API calls
    if (isApiCallInProgressRef.current) {
      console.log("Skipping fetchTimerStatus - API call already in progress");
      return;
    }
    
    // CRITICAL FAILSAFE: Throttle API calls to prevent flooding
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 2000) { // Don't allow more than one call every 2 seconds
      console.log(`Throttling API call - last call was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    // Don't poll automatically at all, only fetch on demand with force=true
    if (!force) {
      console.log("Skipping automatic poll - will only fetch on explicit actions");
      return;
    }
    
    lastFetchTimeRef.current = now;
    console.log(`💯 ALLOWED timer fetch at ${new Date(now).toISOString()} - explicit user action`);
    
    try {
      // Mark API call as in progress
      isApiCallInProgressRef.current = true;
      
      if (isAdmin && isLoading) {
        setIsLoading(true);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check if we have cached timer data and it's recent enough (within 30 seconds)
      const cachedTimerData = sessionStorage.getItem(`timer_data_${eventId}`);
      const cachedTimestamp = sessionStorage.getItem(`timer_data_timestamp_${eventId}`);
      
      // Only use cached data if we're not forcing a refresh and the cache is less than 30 seconds old
      if (!force && cachedTimerData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // Use cached data if it's recent (within 30 seconds) and we're not in a critical state
        if (now - timestamp < 30000 && timerStatus !== 'inactive') {
          console.log('Using cached timer data from sessionStorage instead of API call');
          const data = JSON.parse(cachedTimerData);
          processTimerData(data);
          isApiCallInProgressRef.current = false;
          return;
        }
      }

      console.log("Making API call to fetch timer status...");
      const response = await axios.get(`${API_URL}/events/${eventId}/timer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        console.log('Fetched timer state via API:', response.data);
        const data = response.data;
        
        // Save response data to session storage for future use
        try {
          sessionStorage.setItem(`timer_data_${eventId}`, JSON.stringify(data));
          sessionStorage.setItem(`timer_data_timestamp_${eventId}`, Date.now().toString());
        } catch (err) {
          console.error('Error saving timer data to session storage:', err);
        }
        
        // Process the timer data
        processTimerData(data);
      } else {
        throw new Error('Invalid response data from timer API');
      }
    } catch (err: any) {
      console.error('Error fetching timer status:', err);
      
    } finally {
      // Mark API call as complete
      isApiCallInProgressRef.current = false;
    }
  }, [API_URL, eventId, isAdmin, isLoading, isEventActive, timerStatus, processTimerData]);

  const makeApiRequest = useCallback(async (endpoint: string, method: string, data: any = {}) => {
    if (!isEventActive) return null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `${API_URL}/events/${eventId}/timer/${endpoint}`;
      
      // Reduce log verbosity in production
      if (process.env.NODE_ENV === 'development') {
        console.log(`Making API request to ${endpoint} with method ${method}`, data);
      }
      
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Reduce log verbosity in production
      if (process.env.NODE_ENV === 'development') {
        console.log(`API response from ${endpoint}:`, response.data);
      }

      // If this is a start round request, explicitly set timeRemaining to prevent immediate transition
      if (endpoint === 'start' && response.data && response.data.timer) {
        const timerDuration = response.data.timer.round_duration || 180;
        console.log(`Start round response received - setting timeRemaining to ${timerDuration}`);
        
        // Clear any existing interval to prevent race conditions
        if (timerIntervalRef.current !== null) {
          console.log(`Clearing existing interval (ID: ${timerIntervalRef.current}) after start API call`);
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Set time values immediately based on response
        setTimeRemaining(timerDuration);
        setCurrentRound(response.data.timer.current_round || 1);
      }
      
      return response.data;
    } catch (err: any) {
      console.error(`API error in ${endpoint}:`, err);
    }
  }, [API_URL, eventId, isEventActive]);

  const handleApiAction = useCallback(async (
    action: string, 
    apiEndpoint: string, 
    apiMethod: string = 'POST',
    data: any = {}
  ) => {
    if (!isAdmin || !isEventActive) return Promise.reject("Not admin or event inactive");
    
    try {
      // CRITICAL: Timer API calls should ONLY happen on explicit user actions
      // DO NOT add automatic polling or background fetching
      console.log(`Handling explicit API action: ${action} via ${apiEndpoint}`);
      
      // CRITICAL TIMING SAFETY: Don't make multiple rapid API calls
      const now = Date.now();
      const elapsedSinceLastCall = now - lastFetchTimeRef.current;
      if (elapsedSinceLastCall < 1000 && !apiEndpoint.includes("/next")) {
        console.log(`Throttling API action - last action was only ${elapsedSinceLastCall}ms ago`);
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedSinceLastCall));
      }
      
      // Record timestamp of this API call
      lastFetchTimeRef.current = Date.now();
      
      // For some actions, update local UI state immediately for responsiveness
      if (apiEndpoint.includes("/pause")) {
        console.log("Pre-updating to paused state for UI responsiveness");
        setTimerStatus("paused");
        clearTimerInterval();
      } else if (apiEndpoint.includes("/resume")) {
        console.log("Pre-updating to active state for UI responsiveness");
        setTimerStatus("active");
      } else if (apiEndpoint.includes("/next") && !timerStatus.includes("between")) {
        console.log("Pre-updating to between_rounds for UI responsiveness");
        setTimerStatus("between_rounds");
        clearTimerInterval();
      }
      
      const result = await makeApiRequest(apiEndpoint, apiMethod, data);
      console.log(`Action '${action}' triggered successfully via API.`);
      
      // Update session storage with the result to keep local state in sync
      if (result) {
        try {
          sessionStorage.setItem(`timer_data_${eventId}`, JSON.stringify(result));
          sessionStorage.setItem(`timer_data_timestamp_${eventId}`, Date.now().toString());
          
          // Don't call processTimerData here - we'll do an explicit fetch after instead
          // This prevents state flickering as the component processes multiple state updates
        } catch (err) {
          console.error('Error saving action result to session storage:', err);
        }
      }
      
      return result;
    } catch (error: any) {
      console.error(`Error during API action '${action}':`, error);
      
      const errorMessage = error.response 
        ? `Error ${error.response.status}: ${error.response.data?.error || error.message}`
        : `Network error: ${error.message}`;
      
      
      // Show a notification for critical errors
      if (Notification.permission === 'granted') {
        new Notification('Timer Action Failed', {
          body: `Failed to ${action.toLowerCase()}: ${errorMessage}`,
          icon: '/favicon.ico'
        });
      }
      
      throw error;
    }
  }, [isAdmin, isEventActive, eventId, makeApiRequest, clearTimerInterval, timerStatus]);

  // Ensure timer interval is cleared when component unmounts
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  // Modify the useEffect hook that handles initial loading to add a stronger check
  useEffect(() => {
    if (isEventActive && !hasInitializedRef.current) {
      // Set flag to prevent duplicate initialization
      hasInitializedRef.current = true;
      console.log("Initial component mount - will only run ONCE");
      
      // Force fetch timer status ONLY ONCE on initial mount
      // CRITICAL: DO NOT ADD ANY POLLING HERE - polling has been completely disabled
      console.log("Making initial (and only automatic) timer status fetch");
      
      // Initial fetch with a slight delay to allow component to fully mount
      setTimeout(() => {
        if (isEventActive) {
          console.log("Executing initial timer fetch with delay for stability");
          // This is the ONLY automatic API call - everything else is on demand
          const token = localStorage.getItem('token');
          if (token) {
            // CRITICAL: Store timestamp to prevent any other calls for 5 seconds
            lastFetchTimeRef.current = Date.now();
            
            // Simplified direct fetch to avoid dependency cycles
            axios.get(`${API_URL}/events/${eventId}/timer`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }).then(response => {
              if (response.data) {
                console.log('Initial fetch complete - saving to session storage');
                try {
                  sessionStorage.setItem(`timer_data_${eventId}`, JSON.stringify(response.data));
                  sessionStorage.setItem(`timer_data_timestamp_${eventId}`, Date.now().toString());
                } catch (err) {
                  console.error('Error saving initial data to storage:', err);
                }
                processTimerData(response.data);
              }
            }).catch(err => {
              console.error('Error during initial timer fetch:', err);
            });
          }
        }
      }, 500);
      
      // IMPORTANT: There is NO setInterval for polling - all updates happen via:
      // 1. Local client-side timer counting down
      // 2. API calls on explicit user actions (pause/resume/next)
      console.log("No automatic polling - using local timer state and explicit refreshes only");
    } else if (hasInitializedRef.current) {
      console.log("Component already initialized - skipping repeated init");
    }
    
    // Clean up function only runs on final unmount, not on state changes
    return () => {
      if (timerIntervalRef.current !== null) {
        console.log(`Final component unmount: Clearing timer interval ID: ${timerIntervalRef.current}`);
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [eventId, isEventActive, API_URL, processTimerData]); // Do NOT include fetchTimerStatus here to avoid cycles

  // Fix the handleStartRound function to properly set round duration when starting a new round after break
  const handleStartRound = useCallback(() => {
    console.log("handleStartRound: Triggering API action...");
    console.log("EXPLICIT USER ACTION: This is one of the only places timer API is called");
    
    // Clear any existing interval
    clearTimerInterval();
    
    // CRITICAL FIX: More aggressive state reset to prevent carry-over state issues
    setBreakTimeRemaining(0);  // Reset break time immediately
    setNotifiedZero(false);    // Reset notification flags
    setNotifiedBreakEnd(false);
    
    // If we're starting from 'between_rounds', we need to prevent transition issues
    // Temporarily set status to something that won't create an interval
    setTimerStatus('inactive'); 
    
    // Fix for "Start Next Round" during break - need to advance to next round first
    if (timerStatus === 'between_rounds') {
      console.log("Starting from break mode - advancing to next round first");
      
      // First call the next endpoint to advance to the next round
      handleApiAction('next round', 'next')
        .then(nextResult => {
          console.log("Successfully advanced to next round:", nextResult);
          
          // Then start the new round
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
              setCurrentRound(actualRound); // Set the state based on API response
              playNewRoundStartNotification(actualRound);
            } else {
              console.warn("API response for start didn't include current_round!");
              // Fallback - less ideal
              const fallbackRound = currentRound + 1;
              setCurrentRound(fallbackRound);
              playNewRoundStartNotification(fallbackRound);
            }
          }, 50);
        })
        .catch(error => {
          console.error("Error advancing and starting round:", error);
          fetchTimerStatus(true);
        });
    } else {
      // Regular start round (not from break state)
      handleApiAction('start round', 'start')
        .then((result) => {
          // After successful API call, set the expected state
          console.log("Start round API success, setting timer active with result:", result);
          
          // CRITICAL FIX: Use the full round duration from the API response for a new round
          // This is critical to prevent immediate transition back to break state
          const duration = result?.timer?.round_duration || roundDuration || 180;
          console.log(`Setting timer to full duration of ${duration} seconds for new round`);
          
          // CRITICAL FIX: Ensure we use the full duration, not just a fraction of it
          setTimeRemaining(duration); // Use full round duration
          
          // CRITICAL FIX: Short timeout to ensure state updates are processed before changing status
          setTimeout(() => {
            setTimerStatus('active');
            
            // Play sound notification for new round start
            const actualRound = result?.timer?.current_round; // Get actual round from API
            if (actualRound) {
              console.log(`Updating UI to reflect actual current round: ${actualRound}`);
              setCurrentRound(actualRound); // Set the state based on API response
              playNewRoundStartNotification(actualRound);
            } else {
              console.warn("API response for start didn't include current_round!");
              // Fallback - less ideal
              const fallbackRound = nextRoundInfo || currentRound;
              setCurrentRound(fallbackRound);
              playNewRoundStartNotification(fallbackRound);
            }
          }, 50); // Short delay to ensure other state updates have completed
        })
        .catch(error => {
          console.error("Error starting round:", error);
          // On error, force fetch the current status from API to ensure we're in sync
          fetchTimerStatus(true);
        });
    }
  }, [handleApiAction, nextRoundInfo, currentRound, playNewRoundStartNotification, roundDuration, fetchTimerStatus, clearTimerInterval, timerStatus]);

  const handlePauseRound = useCallback(() => {
    // Add guard clause: Only attempt pause if status is not already paused
    if (timerStatus === 'paused') {
        console.warn("Pause action ignored: Timer status is already paused.");
        return; 
    }
    // Guard against pausing when ended
    if (timerStatus === 'ended') {
        console.warn("Pause action ignored: Timer status is ended.");
        return; 
    }
    
    // Determine which time to send based on current status
    const timeToPause = (timerStatus === 'between_rounds') ? breakTimeRemaining : timeRemaining;
    console.log(`USER ACTION: Pause button clicked (Status: ${timerStatus}). Pausing with time: ${timeToPause}`);
    
    // Remember the status before pausing
    if (timerStatus === 'active' || timerStatus === 'between_rounds') {
      setStatusBeforePause(timerStatus);
    }
    
    handleApiAction(
      'Pause Timer', 
      'pause', 
      'POST', 
      { time_remaining: timeToPause } // Send the correct remaining time
    ).then((result) => {
        if (result && !result.error) {
            console.log("Pause API successful, setting status to paused and clearing interval.");
            clearTimerInterval(); // Ensure interval stops
            setTimerStatus('paused'); // Set state immediately
            // Optionally update other state based on result if needed
            if(result.timer) {
                setTimeRemaining(result.timer.pause_time_remaining ?? 0);
            }
        }
    }).catch(err => {
        // Error is already logged in handleApiAction/makeApiRequest
        console.error("Pause API call failed:", err); 
        // Optionally fetch status again on error to re-sync
        // fetchTimerStatus(true);
    });
  }, [handleApiAction, timeRemaining, breakTimeRemaining, clearTimerInterval, setTimerStatus, timerStatus]); // Added breakTimeRemaining and timerStatus dependencies

  const playRoundEndSound = useCallback(() => {
    if (soundEnabled && timerAudioRef.current) {
      try {
        const playPromise = timerAudioRef.current.play();
        
        // Check if play() returned a promise (modern browsers)
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
        // Directly check Notification.permission here
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
  }, [soundEnabled]); // Removed notificationPermission and requestNotificationPermission from dependencies

  
  const handleResumeRound = useCallback(() => {
    // Add guard clause: Only attempt resume if status is actually paused
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
                if (statusBeforePause === 'between_rounds') {
                    console.log(`Resuming break timer with ${pausedTime}s remaining.`);
                    setTimerStatus('between_rounds');
                    setBreakTimeRemaining(pausedTime);
                } else { // Assumes it was 'active' if not 'between_rounds'
                    const currentRoundDuration = roundDuration; 
                    const timeToSet = Math.min(pausedTime, currentRoundDuration);
                    
                    if (timeToSet <= 0) {
                      // --- RESUMING WITH ZERO TIME --- 
                      console.log(`Resuming round timer with ${timeToSet}s remaining. Immediately transitioning...`);
                      // Manually trigger end-of-round logic (similar to useEffect)
                      clearTimerInterval(); // Ensure no stray interval
                      if (!notifiedZero) { 
                          const isFinalRound = currentRound >= 10; 
                          playRoundEndSound(); // Play sound
                          
                          if (isFinalRound) {
                            console.log("Final round ended immediately upon resume. Setting status to 'ended'.");
                            setTimerStatus('ended');
                            setTimeRemaining(0);
                            setBreakTimeRemaining(0);
                          } else {
                            console.log("Regular round ended immediately upon resume. Transitioning to break state.");
                            setTimerStatus('between_rounds');
                            const actualBreakDuration = timerState?.timer?.break_duration ?? 90;
                            setBreakTimeRemaining(actualBreakDuration);
                            setTimeRemaining(0);
                            setNotifiedBreakEnd(false); 
                          }
                          setNotifiedZero(true); // Mark as notified
                      }
                    } else {
                       // --- RESUMING WITH TIME LEFT --- 
                       console.log(`Resuming round timer. Paused time: ${pausedTime}, Current duration: ${currentRoundDuration}. Setting remaining to: ${timeToSet}`);
                       setTimerStatus('active'); 
                       setTimeRemaining(timeToSet);
                    }
                }
                
                // Reset the pre-pause status memory
                setStatusBeforePause(null);
                 
                 // The relevant useEffect hook will now pick up the correct status 
                 // and remaining time to restart the interval.
            } else {
               console.error("Resume API call succeeded but returned unexpected data:", result);
               setStatusBeforePause(null); // Reset on error too
            }
        }).catch(err => {
            console.error("Resume API call failed:", err);
            setStatusBeforePause(null); // Reset on error too
            // Optionally fetch status again on error to re-sync
            // fetchTimerStatus(true);
        });

  }, [handleApiAction, timerStatus, statusBeforePause, roundDuration, setTimerStatus, setTimeRemaining, setBreakTimeRemaining, clearTimerInterval, currentRound, notifiedZero, playRoundEndSound, timerState?.timer?.break_duration]); // Added missing dependencies

  const handleNextRound = useCallback(() => {
    console.log("USER ACTION: Next round button clicked");
    
    // CRITICAL FIX: More aggressive state reset to prevent carry-over state issues
    setBreakTimeRemaining(0);  // Reset break time immediately
    setNotifiedZero(false);    // Reset notification flags
    setNotifiedBreakEnd(false);
    
    // Clear any existing timer interval to prevent duplicates
    clearTimerInterval();
    
    // If we're between rounds, we need to call a different endpoint
    if (timerStatus === 'between_rounds') {
      console.log('Starting next round after break period');
      
      // First call the next endpoint to advance the round
      handleApiAction('Advance to next round', 'next')
        .then(() => {
          console.log('Successfully advanced to next round');
          
          // After advancing the round, explicitly start it
          return handleApiAction('Start next round', 'start');
        })
        .then(() => {
          console.log('Successfully started the next round');
          
          // Force a timer status refresh to get the new round state
          fetchTimerStatus(true);
        })
        .catch(error => {
          console.error('Error handling next round after break:', error);
        });
    } else {
      // For all other states, just call the API next endpoint
      console.log('Ending current round and starting break period');
      
      handleApiAction('End current round', 'next') // Pass only suffix
        .then((result) => { // Capture the result
          console.log('Successfully ended round, checking completion status and current round:', result);
          
          // Check if the API indicated completion
          if (result && result.complete) {
            console.log("API confirms all rounds completed. Setting state to 'ended'.");
            clearTimerInterval();
            setTimerStatus('ended');
            setTimeRemaining(0);
            setBreakTimeRemaining(0);
            // Persist ended state
             try {
               sessionStorage.setItem(`timer_status_${eventId}`, 'ended');
               sessionStorage.setItem(`time_remaining_${eventId}`, '0');
               sessionStorage.setItem(`break_time_remaining_${eventId}`, '0');
             } catch (err) {
               console.error("Error saving ended state:", err);
             }
          } else {
            // If not complete, update round number explicitly and fetch full status
            if (result && result.timer && typeof result.timer.current_round === 'number') {
              const newRound = result.timer.current_round;
              console.log(`Explicitly setting current round to ${newRound} after next round call.`);
              setCurrentRound(newRound);
            } else {
              console.warn("Next round API response didn't contain expected timer.current_round.");
              // Fallback: Increment locally? Risky.
               setCurrentRound(prev => prev + 1); 
            }
            
            // Fetch updated status (will confirm break state, etc.)
            console.log('Round advanced, fetching updated status.');
            fetchTimerStatus(true); 
          }
        })
        .catch(error => {
          console.error('Error handling next round:', error);
        });
    }
  }, [timerStatus, clearTimerInterval, handleApiAction, fetchTimerStatus, eventId]);

  

  const playBreakEndSound = useCallback(() => {
    if (soundEnabled && breakAudioRef.current) {
      try {
        const playPromise = breakAudioRef.current.play();
        
        // Check if play() returned a promise (modern browsers)
        if (playPromise !== undefined) {
          playPromise.catch(err => console.error('Error playing BREAK END sound:', err));
        }
      } catch (err) {
        console.error('Error playing break end sound:', err);
      }
      
      setNotifiedBreakEnd(true);
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Break Over Soon', { 
            body: `Get ready! Round ${nextRoundInfo || 'next'} is about to start.`,
            icon: '/favicon.svg',
            tag: 'break-end'
          });
          notification.onclick = () => { window.focus(); notification.close(); };
        } catch (error) {
          console.error('Error creating break end notification:', error);
        }
      }
    }
  }, [soundEnabled, nextRoundInfo]); // Ensure notificationPermission is removed from dependencies

  // Replace the state transition effect with a simpler one
  useEffect(() => {
    // Only log when the timer status changes to an active state
    if (timerStatus === 'active' || timerStatus === 'between_rounds') {
      console.log(`Timer status is now ${timerStatus} - tracking transition`);
      
      // Use a ref to track transition state instead of a state variable to prevent re-renders
      isInTransitionRef.current = true;
      
      // Clear transition flag after a delay without causing re-renders
      const transitionTimeout = setTimeout(() => {
        isInTransitionRef.current = false;
      }, 1000);
      
      return () => {
        clearTimeout(transitionTimeout);
      };
    }
  }, [timerStatus]);

  // Add a debug function to log important timer state when needed
  const logTimerDebug = useCallback(() => {
    console.log(`---- TIMER DEBUG ----`);
    console.log(`Status: ${timerStatus}, Interval: ${timerIntervalRef.current ? 'Active' : 'None'}`);
    console.log(`Time Remaining: ${timeRemaining}, Break Time: ${breakTimeRemaining}`);
    console.log(`Is in transition: ${isInTransitionRef.current}`);
    console.log(`-------------------`);
  }, [timerStatus, timeRemaining, breakTimeRemaining]);

  // Fix the break timer issue by ensuring we watch breakTimeRemaining as a dependency
  useEffect(() => {
    // Force debug log when break timer is active but not moving
    if (timerStatus === 'between_rounds' && breakTimeRemaining > 0 && timerIntervalRef.current === null) {
      logTimerDebug();
      console.log("Break timer detected with no interval - fixing...");
      
      // Clear any existing interval to prevent duplicates
      clearTimerInterval();
      
      // Create a new interval specifically for the break timer
      console.log(`Creating dedicated break timer interval with ${breakTimeRemaining}s remaining`);
      timerIntervalRef.current = window.setInterval(() => {
        setBreakTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearTimerInterval();
            if (!notifiedBreakEnd) {
              console.log("Break Timer reached zero, playing sound/notification.");
              playBreakEndSound();
              setNotifiedBreakEnd(true);
              console.log("Break timer reached zero - waiting for admin to start next round");
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      console.log(`Started break timer interval ID: ${timerIntervalRef.current}`);
    }
  }, [
    timerStatus, 
    breakTimeRemaining, 
    clearTimerInterval, 
    playBreakEndSound, 
    notifiedBreakEnd,
    logTimerDebug
  ]);

  // Add a dedicated effect for active timer state (similar to the break timer fix)
  useEffect(() => {
    // Force debug log when active timer is detected but not moving
    if (timerStatus === 'active' && timeRemaining > 0 && timerIntervalRef.current === null) {
      logTimerDebug();
      console.log("Active timer detected with no interval - fixing...");
      
      // Clear any existing interval to prevent duplicates
      clearTimerInterval();
      
      // Create a new interval specifically for the active timer
      console.log(`Creating dedicated active timer interval with ${timeRemaining}s remaining`);
      timerIntervalRef.current = window.setInterval(() => {
        setTimeRemaining(prevTime => {
          console.log(`Active timer tick: ${prevTime}s remaining`); // Debug logging
          if (prevTime <= 1) {
            clearTimerInterval();
            if (!notifiedZero) {
              // Check if this is the final round (e.g., round 10)
              const isFinalRound = currentRound >= 10; // Assuming 10 is max
              
              console.log(`Round Timer reached zero. Current Round: ${currentRound}. Is Final: ${isFinalRound}`);
              playRoundEndSound(); // Play sound regardless
              
              if (isFinalRound) {
                // --- FINAL ROUND ENDED ---
                console.log("Final round ended. Setting status to 'ended'.");
                setTimerStatus('ended');
                setTimeRemaining(0);
                setBreakTimeRemaining(0);
                setNotifiedZero(true); 
                // Persist ended state
                try {
                  sessionStorage.setItem(`timer_status_${eventId}`, 'ended');
                  sessionStorage.setItem(`time_remaining_${eventId}`, '0');
                  sessionStorage.setItem(`break_time_remaining_${eventId}`, '0');
                } catch (err) {
                   console.error("Error saving ended state:", err);
                }
              } else {
                // --- REGULAR ROUND ENDED ---
                console.log("Regular round ended. Locally transitioning to break state.");
                setTimerStatus('between_rounds');
                // Use configured break duration or default
                const actualBreakDuration = timerState?.timer?.break_duration ?? 90; 
                setBreakTimeRemaining(actualBreakDuration); 
                setTimeRemaining(0);
                setNotifiedZero(true);
                setNotifiedBreakEnd(false); // Reset break end flag

                // Save the new state to session storage
                try {
                  const existingData = sessionStorage.getItem(`timer_data_${eventId}`);
                  if (existingData) {
                    const updatedData = {
                      ...JSON.parse(existingData),
                      status: 'between_rounds',
                      time_remaining: 0,
                      break_duration: actualBreakDuration
                    };
                    sessionStorage.setItem(`timer_data_${eventId}`, JSON.stringify(updatedData));
                    sessionStorage.setItem(`timer_data_timestamp_${eventId}`, Date.now().toString());
                  }
                } catch (err) {
                  console.error('Error updating session storage after timer end:', err);
                }
              }
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      console.log(`Started active timer interval ID: ${timerIntervalRef.current}`);
    }
  }, [
    currentRound,
    timerState?.timer?.break_duration,
    timerStatus, 
    timeRemaining, 
    clearTimerInterval, 
    playRoundEndSound, 
    notifiedZero,
    logTimerDebug,
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
        const savedBreakTimeRemaining = sessionStorage.getItem(`break_time_remaining_${eventId}`);
        
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
          
          if (savedBreakTimeRemaining) {
            const savedBreakTime = parseInt(savedBreakTimeRemaining, 10);
            if (!isNaN(savedBreakTime) && savedBreakTime > 0) {
              console.log(`Restoring break time remaining: ${savedBreakTime}`);
              setBreakTimeRemaining(savedBreakTime);
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
      // Only save non-zero values to prevent issues
      if (timerStatus) {
        sessionStorage.setItem(`timer_status_${eventId}`, timerStatus);
      }
      
      if (timeRemaining > 0) {
        sessionStorage.setItem(`time_remaining_${eventId}`, timeRemaining.toString());
      }
      
      if (breakTimeRemaining > 0) {
        sessionStorage.setItem(`break_time_remaining_${eventId}`, breakTimeRemaining.toString());
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
  }, [eventId, timerStatus, timeRemaining, breakTimeRemaining, currentRound, timerState, isEventActive]);

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
              const newState = {
                ...prevState,
                has_timer: true, // Ensure has_timer is true if we have timer data
                timer: {
                  ...(prevState?.timer ?? {}), // Safely spread previous timer or empty object
                  ...updatedTimerData.timer // Merge updated fields from API response
                } as TimerState['timer'], // Assert type after merging
                // Also update derived state if needed, based on the API response
                round_duration: updatedTimerData.timer.round_duration,
                break_duration: updatedTimerData.timer.break_duration,
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
  }, [handleApiAction, newDuration, newBreakDuration, timerState, eventId, clearTimerInterval, timerStatus]); // Added eventId dependency

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

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };


  const getProgressPercentage = () => {
    if (timerStatus === 'between_rounds' && timerState?.break_duration) {
      return (breakTimeRemaining / timerState.break_duration) * 100;
    }
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
        <Box display="flex" justifyContent="center" p={{ xs: 0.25, sm: 0.5 }}> {/* MODIFIED */}
          <CircularProgress size={16} /> {/* MODIFIED */}
        </Box>
      );
    }

    const isActive = timerStatus === 'active';
    const isBetweenRounds = timerStatus === 'between_rounds';
    const currentRoundSchedule = userSchedule?.find(item => item.round === currentRound);
    
    return (
      <>
        {/* Only show the alert if the timer ended BUT the event isn't fully finished */}
        {timeRemaining === 0 && showTimerEndAlert && timerStatus !== 'ended' && (
          <Snackbar
            open={showTimerEndAlert}
            autoHideDuration={6000}
            onClose={() => setShowTimerEndAlert(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{top: {xs: '8px', sm: '24px'} }} // Adjust position slightly for smaller view
          >
            <Alert 
              onClose={() => setShowTimerEndAlert(false)} 
              severity="info"
              icon={<NotificationImportant sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem'}}} />} // MODIFIED
              sx={{ width: '100%', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem' }, py: {xs: 0.25, sm: 0.5} }} // MODIFIED
            >
              Time's up! This round has ended.
            </Alert>
          </Snackbar>
        )}
        
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            minHeight: { xs: '30px', sm: '36px'}, // MODIFIED
            p: { xs: 0.5, sm: 1 }, // MODIFIED
            ml: { xs: 0, sm: 0.5 }, // MODIFIED
            mr: { xs: 0, sm: 0.5 }, // MODIFIED
            borderRadius: '4px', // MODIFIED sleeker border
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${ isBetweenRounds ? theme.palette.info.light : theme.palette.divider }`,
            boxShadow: '0px 1px 2px rgba(0,0,0,0.1)', // MODIFIED softer shadow
            maxWidth: '100%',
          }}
        >
          <TimerIcon 
            sx={{ 
              mr: { xs: 0.5, sm: 1 }, // MODIFIED
              color: isActive ? theme.palette.primary.main : isBetweenRounds ? theme.palette.info.main : theme.palette.text.secondary,
              fontSize: { xs: '0.9rem', sm: '1.1rem' }, // MODIFIED
              flexShrink: 0,
            }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
            {isBetweenRounds ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> {/* MODIFIED */}
                  Break Time
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block', fontSize: { xs: '0.55rem', sm: '0.7rem' } }}> {/* MODIFIED */}
                  Next: Round {nextRoundInfo || '-'} starting soon.
                </Typography>
                <Typography 
                  color="info.main"
                  variant="body2" 
                  sx={{ fontWeight: 600, mt: 0, fontSize: { xs: '0.7rem', sm: '0.8rem' } }} // MODIFIED
                >
                  {formatTime(breakTimeRemaining)}
                </Typography>
              </Box>
            ) : isActive && currentRoundSchedule ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> {/* MODIFIED */}
                  Round {currentRound}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block', fontSize: { xs: '0.55rem', sm: '0.7rem' } }}> {/* MODIFIED */}
                  {currentRoundSchedule ? 
                    `Table ${currentRoundSchedule.table} with ${currentRoundSchedule.partner_name}` : // Removed age for brevity
                    'Loading schedule...'
                  }
                </Typography>
                {isActive && (
                  <Typography 
                    color="primary"
                    variant="body2" 
                    sx={{ fontWeight: 600, mt: 0, fontSize: { xs: '0.7rem', sm: '0.8rem' } }} // MODIFIED
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                )}
              </Box>
            ) : currentRound > 0 ? (
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: { xs: '0.65rem', sm: '0.8rem' } }}> {/* MODIFIED */}
                Round {currentRound} 
                {isActive ? formatTime(timeRemaining) : (timerStatus === 'paused' ? ' (Paused)' : ' (Waiting...)')}
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
        <Box display="flex" justifyContent="center" p={{ xs: 0.25, sm: 0.5 }}> {/* MODIFIED */}
          <CircularProgress size={16} /> {/* MODIFIED */}
        </Box>
      );
    }

    const isActive = timerStatus === 'active';
    const isPaused = timerStatus === 'paused';
    const isBetweenRounds = timerStatus === 'between_rounds';
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
          {/* Only show the alert if the timer ended BUT the event isn't fully finished */}
          {timeRemaining === 0 && showTimerEndAlert && timerStatus !== 'ended' && (
            <Alert 
              severity="info" 
              icon={<NotificationImportant sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem'}}} />} // MODIFIED
              variant="filled"
              sx={{ 
                mb: { xs: 0.5, sm: 1 }, // MODIFIED
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: { xs: '0.7rem', sm: '0.8rem' }, // MODIFIED
                py: {xs: 0.25, sm: 0.5} // MODIFIED
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowTimerEndAlert(false)}
                  sx={{ ml: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.7rem'} }} // MODIFIED
                >
                  Dismiss
                </Button>
              }
            >
              {isBetweenRounds ? `Break time: ${formatTime(breakTimeRemaining)}` : 'Prepare for next round.'}
            </Alert>
          )}

          <Paper
            elevation={1} // MODIFIED: Softer elevation
            sx={{
              display: 'flex',
              width: '100%',
              py: { xs: 0.5, sm: 1 }, // MODIFIED
              borderRadius: '6px', // MODIFIED
              bgcolor: isAlmostDone ? theme.palette.error.light + '22' : // MODIFIED: Lighter alpha
                      isActive ? theme.palette.primary.light + '22' :
                      isPaused ? theme.palette.warning.light + '22' :
                      isBetweenRounds ? theme.palette.info.light + '22' :
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
              px: { xs: 0.75, sm: 1 }, // MODIFIED
              // flexDirection: { xs: 'column', sm: 'row' }, // REMOVED - Default to row now
              flexDirection: 'row', // MODIFIED - Always row
              alignItems: 'center', // Keep items vertically centered
              // gap: { xs: 1, sm: 0 }, // REMOVED - Use space-between/margins
              justifyContent: 'space-between' // MODIFIED - Distribute items
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
                // flexGrow: { xs: 1, sm: 0 }, // Let it take natural width
                // mr: { xs: 0, sm: 'auto'} // Add right margin to push others away on sm+
                flex: '0 1 auto', // Don't grow, shrink if needed, basis is auto
                mr: { xs: 1, sm: 2 } // Add margin to separate from center time
              }}
            >
              <TimerIcon
                sx={{
                  mr: { xs: 0.5, sm: 1 }, // MODIFIED
                  // mb: { xs: 0.5, sm: 0 }, // REMOVED mb - align in row now
                  color: isAlmostDone ? theme.palette.error.main :
                        isActive ? theme.palette.primary.main :
                        isPaused ? theme.palette.warning.main :
                        isBetweenRounds ? theme.palette.info.main :
                        theme.palette.text.secondary,
                  fontSize: { xs: '1rem', sm: '1.2rem' } // MODIFIED
                }}
              />
              <Box>
                {isEnded ? (
                  <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2, color: theme.palette.text.primary, fontSize: { xs: '0.7rem', sm: '0.9rem'} }}> {/* MODIFIED */}
                    Finished
                  </Typography>
                ) : (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500, // MODIFIED
                      lineHeight: 1.2,
                      color: theme.palette.text.primary,
                      textAlign: 'left', // MODIFIED: Align left
                      fontSize: { xs: '0.75rem', sm: '0.9rem'} // MODIFIED
                    }}
                  >
                    Round {currentRound || '-'}
                  </Typography>
                )}
                <Chip 
                  label={isActive ? 'Active' : isPaused ? 'Paused' : isBetweenRounds ? 'Break' : 'Inactive'} 
                  color={isActive ? 'primary' : isPaused ? 'warning' : isBetweenRounds ? 'info' : 'default'}
                  size="small"
                  sx={{ 
                    fontWeight: 500, 
                    height: { xs: '16px', sm: '18px' }, // MODIFIED
                    mt: 0, // MODIFIED
                    fontSize: { xs: '0.55rem', sm: '0.6rem' }, // MODIFIED
                    '& .MuiChip-label': {
                      px: { xs: 0.4, sm: 0.6 }, // MODIFIED
                      py: 0
                    }
                  }}
                />
              </Box>
            </Box>
            
            {/* Box 2 (effectively): Main Time Typography (CENTER) */}
            <Typography
              variant="h3"
              component="div"
              color={isAlmostDone ? theme.palette.error.main :
                     isActive ? theme.palette.primary.main :
                     isPaused ? theme.palette.warning.main :
                     isBetweenRounds ? theme.palette.info.main :
                     theme.palette.text.secondary}
              sx={{
                fontWeight: 600, // MODIFIED
                animation: isAlmostDone ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.2rem' }, // MODIFIED
                my: 0, // MODIFIED: Remove vertical margin
                mx: 'auto', // MODIFIED: Center horizontally
                flex: '0 0 auto', // MODIFIED: Don't grow or shrink
                zIndex: 2,
                textAlign: 'center',
                minWidth: '50px', // Ensure some minimum width for time
                color: isEnded ? theme.palette.text.secondary : 'inherit'
              }}
            >
              {isEnded ? '--:--' : (isActive || isPaused ? formatTime(timeRemaining) : formatTime(breakTimeRemaining))}
            </Typography>
            
            {/* Box 3: Controls (Switch, Icons) (RIGHT) */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'nowrap', // MODIFIED: Prevent wrapping of icon buttons
                justifyContent: 'flex-end', // Align controls to the end
                gap: { xs: 0, sm: 0 }, // MODIFIED: Reduced gap, use padding on items
                width: 'auto', // Take necessary width
                // mt: { xs: 0.5, sm: 0 }, // REMOVED - aligned in row
                zIndex: 2,
                flex: '0 1 auto' // Don't grow, shrink if needed, basis is auto
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
                      <VolumeUp sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} color="primary" /> : // MODIFIED
                      <VolumeOff sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} color="disabled" /> // MODIFIED
                    }
                    <Typography 
                      variant="caption" // MODIFIED
                      sx={{ 
                        ml: 0.1, // MODIFIED
                        display: { xs: 'none', sm: 'block' },
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.65rem', sm: '0.7rem'} // MODIFIED
                      }}
                    >
                      {soundEnabled ? "On" : "Off"} {/* MODIFIED: Shorter text */}
                    </Typography>
                  </Box>
                }
                sx={{ mr: { xs: 0, sm: 0.25 }, ml: {xs: -1, sm: 0} }} // MODIFIED: Adjust spacing, slight negative margin on xs for switch
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
                    p: {xs: 0.25, sm: 0.5}, // MODIFIED
                    mr: { xs: 0, sm: 0.25 } // MODIFIED
                  }}
                >
                  <Settings sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}/> {/* MODIFIED */}
                </IconButton>
              </Tooltip>
              
              <Tooltip title={showControls ? "Hide controls" : "Show controls"}>
                <IconButton 
                  onClick={toggleControls}
                  size="small" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    transition: 'transform 0.3s',
                    transform: showControls ? 'rotate(180deg)' : 'rotate(0)',
                    '&:hover': {
                      color: theme.palette.primary.main
                    },
                    p: {xs: 0.25, sm: 0.5} // MODIFIED
                  }}
                >
                  <KeyboardArrowDown sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} /> {/* MODIFIED */}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          <Collapse in={showControls}>
            <Paper 
              elevation={1}
              sx={{ 
                mt: { xs: 0.25, sm: 0.5 }, // MODIFIED
                mb: { xs: 0.5, sm: 1 }, // MODIFIED
                p: { xs: 0.75, sm: 1 }, // MODIFIED
                width: '100%',
                borderRadius: '6px' // MODIFIED
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 0.75 }, // MODIFIED
                  flexDirection: { xs: 'row', sm: 'row' }, // MODIFIED: Default to row, wrap if needed by buttons
                  flexWrap: 'wrap', // MODIFIED: Allow buttons to wrap
                  '& .MuiButton-root': { 
                     // width: { xs: 'auto', sm: 'auto' }, // Allow buttons to size naturally
                     flexGrow: 1, // Allow buttons to grow and fill space if wrapping
                     minWidth: { xs: '90px', sm: '100px'}, // MODIFIED minimum width
                     fontSize: { xs: '0.65rem', sm: '0.7rem' }, // MODIFIED
                     py: { xs: 0.4, sm: 0.6 }, // MODIFIED
                     px: { xs: 0.8, sm: 1 }, // MODIFIED
                     my: { xs: 0.25, sm: 0} // Add small vertical margin when stacked
                  }
                }}
              >
                {/* --- ACTIVE OR BETWEEN ROUNDS STATE --- */}
                {(isActive || isBetweenRounds) && currentRound <= 10 && (
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
                          borderRadius: '4px', // MODIFIED
                          textTransform: 'none',
                          fontWeight: 500 // MODIFIED
                        }}
                      >
                        End Round
                      </Button>
                    )}
                    {/* Pause Button: Show if active or between rounds (and not ended) */}
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Pause sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                      onClick={handlePauseRound}
                      size="small" 
                      sx={{ 
                        borderRadius: '4px', // MODIFIED
                        textTransform: 'none',
                        fontWeight: 500 // MODIFIED
                      }}
                    >
                      Pause {isBetweenRounds ? 'Break' : 'Round'}
                    </Button>
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
                       borderRadius: '4px', // MODIFIED
                       textTransform: 'none',
                       fontWeight: 500 // MODIFIED
                     }}
                   >
                     Resume Round
                   </Button>
                 )}
                 
                  {/* --- INACTIVE or BETWEEN ROUNDS STATE --- */}
                  {(timerStatus === 'inactive' || timerStatus === 'between_rounds') && currentRound < 10 && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem'}}}/>}
                      onClick={handleStartRound}
                      size="small" 
                      sx={{
                        borderRadius: '4px', // MODIFIED
                        textTransform: 'none',
                        fontWeight: 500 // MODIFIED
                      }}
                    >
                      {timerStatus === 'between_rounds' ? 
                        (breakTimeRemaining <= 0 ? 'Start Next' : `Next (${formatTime(breakTimeRemaining)})`) :  // MODIFIED: Shorter text
                        'Start Round'}
                    </Button>
                  )}

                  {/* --- ENDED STATE --- */}
                  {isEnded && (
                     <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}> {/* MODIFIED */}
                       Event Finished
                     </Typography>
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
        <DialogContent sx={{ pt: 1, pb: 1 }}>
          <Typography id="break-duration-slider" gutterBottom fontWeight={500}>
            Break Duration: <span style={{ color: theme.palette.primary.main }}>{formatTime(newBreakDuration)}</span>
          </Typography>
          <Slider
            value={newBreakDuration}
            min={15} // Min break 15s
            max={300} // Max break 5min
            step={15}
            onChange={(_, value) => setNewBreakDuration(value as number)}
            aria-labelledby="break-duration-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => formatTime(value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption">
             Current Break: {formatTime(timerState?.timer?.break_duration ?? 90)}
          </Typography>
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