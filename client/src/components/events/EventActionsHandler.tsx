import { useState, useCallback } from 'react';
import { eventsApi } from '../../services/api';
import { Event } from '../../types/event';

export interface EventActionsState {
  // Sign up states
  signUpDialogOpen: boolean;
  signUpEventId: string | null;

  // Cancel states
  cancelDialogOpen: boolean;
  cancelEventId: string | null;

  // Check-in states
  globalCheckInDialogOpen: boolean;
  selectedEventForCheckIn: Event | null;
  checkInPin: string;
  checkInError: string | null;

  // Waitlist states
  waitlistDialogOpen: boolean;
  eventForWaitlist: Event | null;
  waitlistReason: string;

  // Error state
  errorMessage: string | null;
}

export interface EventActionsHandlers {
  // Sign up handlers
  handleSignUpClick: (eventId: number, filteredEvents: Event[], isRegistrationClosed: (event: Event) => boolean) => void;
  handleSignUpConfirm: (refreshEvents: () => Promise<void>) => Promise<void>;
  setSignUpDialogOpen: (open: boolean) => void;

  // Cancel handlers
  handleCancelClick: (eventId: number) => void;
  handleCancelConfirm: (refreshEvents: () => Promise<void>) => Promise<void>;
  setCancelDialogOpen: (open: boolean) => void;

  // Check-in handlers
  handleCheckInClick: (event: Event) => void;
  handleGlobalCheckInConfirm: (refreshEvents: () => Promise<void>) => Promise<void>;
  setGlobalCheckInDialogOpen: (open: boolean) => void;
  setCheckInPin: (pin: string) => void;

  // Waitlist handlers
  handleJoinWaitlistConfirm: (refreshEvents: () => Promise<void>) => Promise<void>;
  setWaitlistDialogOpen: (open: boolean) => void;
  setEventForWaitlist: (event: Event | null) => void;

  // Error handlers
  setErrorMessage: (message: string | null) => void;
}

export const useEventActionsHandler = (): [EventActionsState, EventActionsHandlers] => {
  // Sign up states
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);

  // Cancel states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);

  // Check-in states
  const [globalCheckInDialogOpen, setGlobalCheckInDialogOpen] = useState(false);
  const [selectedEventForCheckIn, setSelectedEventForCheckIn] = useState<Event | null>(null);
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Waitlist states
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [eventForWaitlist, setEventForWaitlist] = useState<Event | null>(null);
  const [waitlistReason, setWaitlistReason] = useState<string>('');

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Event handlers
  const handleSignUpClick = useCallback((
    eventId: number, 
    filteredEvents: Event[], 
    isRegistrationClosed: (event: Event) => boolean
  ) => {
    console.log('🔵 Sign-up clicked for event ID:', eventId);
    const event = filteredEvents.find(e => e.id === eventId);
    console.log('🔵 Found event:', event);
    
    if (!event) {
      console.error('❌ Event not found with ID:', eventId, 'in filtered events:', filteredEvents);
      return;
    }
    
    const registrationClosed = isRegistrationClosed(event);
    console.log('🔵 Registration closed check:', registrationClosed);
    
    if (registrationClosed) {
      if (typeof event.registered_attendee_count === 'number' && event.max_capacity && 
          event.registered_attendee_count >= parseInt(event.max_capacity)) {
        console.log('🔵 Event is full, showing waitlist dialog');
        setEventForWaitlist(event);
        setWaitlistReason('This event is at full capacity');
        setWaitlistDialogOpen(true);
      } else {
        console.log('🔵 Registration closed for other reason');
        setErrorMessage('Registration is no longer available for this event.');
      }
      return;
    }
    
    console.log('🔵 Opening sign-up dialog for event ID:', eventId.toString());
    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  }, []);

  const handleSignUpConfirm = useCallback(async (refreshEvents: () => Promise<void>) => {
    console.log('🟢 Sign-up confirm clicked for event ID:', signUpEventId);
    if (!signUpEventId) {
      console.error('❌ No sign-up event ID available');
      return;
    }
        
    try {
      console.log('🟢 Making API call to register for event:', signUpEventId);
      const result = await eventsApi.registerForEvent(signUpEventId);
      console.log('✅ Registration successful:', result);
      
      await refreshEvents();
      console.log('✅ Events refreshed after registration');
      
      setSignUpDialogOpen(false);
      setSignUpEventId(null);
      console.log('✅ Sign-up dialog closed');
    } catch (error: any) {
      console.error('❌ Error signing up for event:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      if (error.response?.status === 409) {
        // This would need filteredEvents context to work properly
        // For now, just show the error message
        setErrorMessage(error.response?.data?.message || 'Event is at capacity');
      } else {
        setErrorMessage(error.response?.data?.message || error.message || 'Failed to sign up for event');
      }
      
      setSignUpDialogOpen(false); 
      setSignUpEventId(null);
    }
  }, [signUpEventId]);

  const handleJoinWaitlistConfirm = useCallback(async (refreshEvents: () => Promise<void>) => {
    if (!eventForWaitlist) return;

    try {
      await eventsApi.registerForEvent(eventForWaitlist.id.toString(), { join_waitlist: true });
      await refreshEvents();
      setWaitlistDialogOpen(false);
      setEventForWaitlist(null);
    } catch (error: any) {
      console.error('Error joining waitlist:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to join waitlist');
      setWaitlistDialogOpen(false);
      setEventForWaitlist(null);
    }
  }, [eventForWaitlist]);

  const handleCancelClick = useCallback((eventId: number) => {
    setCancelEventId(eventId.toString());
    setCancelDialogOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async (refreshEvents: () => Promise<void>) => {
    if (!cancelEventId) return;

    try {
      await eventsApi.cancelRegistration(cancelEventId);
      await refreshEvents();
      setCancelDialogOpen(false);
      setCancelEventId(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to cancel registration');
    }
  }, [cancelEventId]);

  const handleCheckInClick = useCallback((event: Event) => {
    setSelectedEventForCheckIn(event);
    setCheckInPin('');
    setCheckInError(null);
    setGlobalCheckInDialogOpen(true);
  }, []);
  
  const handleGlobalCheckInConfirm = useCallback(async (refreshEvents: () => Promise<void>) => {
    if (!selectedEventForCheckIn || !checkInPin) return;
    
    try {
      await eventsApi.checkIn(selectedEventForCheckIn.id.toString(), checkInPin);
      await refreshEvents();
      setGlobalCheckInDialogOpen(false);
      setSelectedEventForCheckIn(null);
      setCheckInPin('');
      setCheckInError(null);
    } catch (error: any) {
      setCheckInError(error.response?.data?.message || error.message || 'Invalid PIN or check-in failed');
    }
  }, [selectedEventForCheckIn, checkInPin]);

  const state: EventActionsState = {
    signUpDialogOpen,
    signUpEventId,
    cancelDialogOpen,
    cancelEventId,
    globalCheckInDialogOpen,
    selectedEventForCheckIn,
    checkInPin,
    checkInError,
    waitlistDialogOpen,
    eventForWaitlist,
    waitlistReason,
    errorMessage,
  };

  const handlers: EventActionsHandlers = {
    handleSignUpClick,
    handleSignUpConfirm,
    setSignUpDialogOpen,
    handleCancelClick,
    handleCancelConfirm,
    setCancelDialogOpen,
    handleCheckInClick,
    handleGlobalCheckInConfirm,
    setGlobalCheckInDialogOpen,
    setCheckInPin,
    handleJoinWaitlistConfirm,
    setWaitlistDialogOpen,
    setEventForWaitlist,
    setErrorMessage,
  };

  return [state, handlers];
}; 