import { useState, useCallback } from 'react';
import { eventsApi } from '../../services/api';
import { Event, ScheduleItem } from '../../types/event';

export interface SpeedDateManagerState {
  expandedUserSchedules: Record<number, boolean>;
  attendeeSpeedDateSelections: Record<number, { eventId: number, interested: boolean }>;
  attendeeSelectionError: Record<number, string | null>;
  submittedEventIds: Set<number>;
  selectionWindowClosedError: Record<number, boolean>;
  savedAttendeeSelections: Record<number, Record<number, boolean>>;
  saveIndicator: Record<number, boolean>;
}

export interface SpeedDateManagerActions {
  toggleUserScheduleInline: (eventId: number) => void;
  handleAttendeeSelectionChange: (eventSpeedDateId: number, eventId: number, interested: boolean) => void;
  getCurrentPicksForEvent: (eventId: number) => Record<number, boolean>;
  isSaveDisabled: (eventId: number) => boolean;
  handleSaveAttendeeSelections: (eventId: number, filteredEvents: Event[], userSchedules: Record<number, ScheduleItem[]>) => Promise<boolean>;
  handleSubmitClick: (eventId: number) => void;
  handleSubmitConfirm: (eventToSubmitId: number | null) => Promise<void>;
  getPersistedSelections: (eventId: number) => Record<number, boolean>;
  persistSelection: (eventId: number, eventSpeedDateId: number, interested: boolean) => void;
  persistAllSelectionsForEvent: (eventId: number, selections: Record<number, boolean>) => void;
}

export const useSpeedDateManager = (
  setSubmitConfirmOpen: (open: boolean) => void,
  setEventToSubmitId: (id: number | null) => void
): [SpeedDateManagerState, SpeedDateManagerActions] => {
  const [expandedUserSchedules, setExpandedUserSchedules] = useState<Record<number, boolean>>({});
  const [attendeeSpeedDateSelections, setAttendeeSpeedDateSelections] = useState<Record<number, { eventId: number, interested: boolean }>>({});
  const [attendeeSelectionError, setAttendeeSelectionError] = useState<Record<number, string | null>>({});
  const [submittedEventIds, setSubmittedEventIds] = useState<Set<number>>(new Set());
  const [selectionWindowClosedError, setSelectionWindowClosedError] = useState<Record<number, boolean>>({});
  const [savedAttendeeSelections, setSavedAttendeeSelections] = useState<Record<number, Record<number, boolean>>>({});
  const [saveIndicator, setSaveIndicator] = useState<Record<number, boolean>>({});

  // Helper functions for localStorage
  const getPersistedSelections = useCallback((eventId: number): Record<number, boolean> => {
    const selections = localStorage.getItem(`attendeeSelections_${eventId}`);
    return selections ? JSON.parse(selections) : {};
  }, []);

  const persistSelection = useCallback((eventId: number, eventSpeedDateId: number, interested: boolean) => {
    const selections = getPersistedSelections(eventId);
    selections[eventSpeedDateId] = interested;
    localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
  }, [getPersistedSelections]);
  
  const persistAllSelectionsForEvent = useCallback((eventId: number, selections: Record<number, boolean>) => {
    localStorage.setItem(`attendeeSelections_${eventId}`, JSON.stringify(selections));
  }, []);

  const toggleUserScheduleInline = useCallback((eventId: number) => {
    setExpandedUserSchedules(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  }, []);

  const handleAttendeeSelectionChange = useCallback((eventSpeedDateId: number, eventId: number, interested: boolean) => {
    setAttendeeSpeedDateSelections(prev => ({
      ...prev,
      [eventSpeedDateId]: { eventId, interested }
    }));
    persistSelection(eventId, eventSpeedDateId, interested);
    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
  }, [persistSelection]);

  const getCurrentPicksForEvent = useCallback((eventId: number) => {
    return Object.entries(attendeeSpeedDateSelections)
      .filter(([_, sel]) => sel.eventId === eventId)
      .reduce((acc, [id, sel]) => {
        acc[Number(id)] = sel.interested;
        return acc;
      }, {} as Record<number, boolean>);
  }, [attendeeSpeedDateSelections]);

  const isSaveDisabled = useCallback((eventId: number) => {
    const current = getCurrentPicksForEvent(eventId);
    const saved = savedAttendeeSelections[eventId] || {};
    const allIds = new Set([...Object.keys(current), ...Object.keys(saved)]);
    for (const id of Array.from(allIds)) {
      if (current[Number(id)] !== saved[Number(id)]) return false;
    }
    return true;
  }, [getCurrentPicksForEvent, savedAttendeeSelections]);

  const handleSaveAttendeeSelections = useCallback(async (
    eventId: number, 
    filteredEvents: Event[], 
    userSchedules: Record<number, ScheduleItem[]>
  ): Promise<boolean> => {
    const event = filteredEvents.find(e => e.id === eventId);
    if (!event) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'Event details not found. Cannot save selections.' }));
      return false;
    }

    const currentPicks = getCurrentPicksForEvent(eventId);
    setSavedAttendeeSelections(prev => ({ ...prev, [eventId]: { ...currentPicks } }));
    persistAllSelectionsForEvent(eventId, currentPicks);

    setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null }));
    const schedule = userSchedules[eventId] || [];
    
    const selectionsToSubmit = schedule.map(item => ({
      event_speed_date_id: item.event_speed_date_id,
      interested: currentPicks[item.event_speed_date_id] === true
    }));

    if (schedule.length === 0) {
      setAttendeeSelectionError(prev => ({ ...prev, [eventId]: 'No schedule found to save selections for this event.' }));
      return false;
    }
    setSaveIndicator(prev => ({ ...prev, [eventId]: true }));

    if (event.status !== 'Completed') {
      try {
        await eventsApi.submitSpeedDateSelections(eventId.toString(), selectionsToSubmit);
        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
        setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: false }));
        return true;
      } catch (error: any) {
        const specificErrorMessage = 'Speed date selections window closed 24 hours after event completion.';
        const backendErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        
        if (backendErrorMessage === specificErrorMessage) {
          setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: true }));
          setAttendeeSelectionError(prev => ({ ...prev, [eventId]: null })); 
        } else {
          setAttendeeSelectionError(prev => ({
            ...prev,
            [eventId]: backendErrorMessage || 'Failed to save your selections.'
          }));
          setSelectionWindowClosedError(prev => ({ ...prev, [eventId]: false }));
        }

        setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
        return false;
      }
    } else {
      setTimeout(() => setSaveIndicator(prev => ({ ...prev, [eventId]: false })), 1200);
      return true;
    }
  }, [getCurrentPicksForEvent, persistAllSelectionsForEvent]);

  const handleSubmitClick = useCallback((eventId: number) => {
    setEventToSubmitId(eventId);
    setSubmitConfirmOpen(true);
  }, [setEventToSubmitId, setSubmitConfirmOpen]);

  const handleSubmitConfirm = useCallback(async (eventToSubmitId: number | null) => {
    if (eventToSubmitId === null) return;

    try {
      await eventsApi.submitSpeedDateSelections(eventToSubmitId.toString(), []);
      setSubmittedEventIds(prev => new Set(Array.from(prev).concat([eventToSubmitId])));
      setSubmitConfirmOpen(false);
      setEventToSubmitId(null);
    } catch (error: any) {
      setAttendeeSelectionError(prev => ({
        ...prev,
        [eventToSubmitId]: error.response?.data?.message || error.message || 'Failed to submit selections'
      }));
      setSubmitConfirmOpen(false);
      setEventToSubmitId(null);
    }
  }, [setSubmitConfirmOpen, setEventToSubmitId]);

  const state: SpeedDateManagerState = {
    expandedUserSchedules,
    attendeeSpeedDateSelections,
    attendeeSelectionError,
    submittedEventIds,
    selectionWindowClosedError,
    savedAttendeeSelections,
    saveIndicator,
  };

  const actions: SpeedDateManagerActions = {
    toggleUserScheduleInline,
    handleAttendeeSelectionChange,
    getCurrentPicksForEvent,
    isSaveDisabled,
    handleSaveAttendeeSelections,
    handleSubmitClick,
    handleSubmitConfirm,
    getPersistedSelections,
    persistSelection,
    persistAllSelectionsForEvent,
  };

  return [state, actions];
}; 