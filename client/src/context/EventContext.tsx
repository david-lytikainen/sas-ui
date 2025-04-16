import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { eventsApi } from '../services/api';
import { Event } from '../types/event';

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: Omit<Event, 'id' | 'creator_id' | 'updated_at' | 'created_at'>) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin, isOrganizer } = useAuth();

  // Load events from API on mount
  useEffect(() => {
    const fetchEvents = async () => {
      // Only fetch events if user is authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await eventsApi.getAll();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]); // Add user as a dependency

  const createEvent = async (eventData: Omit<Event, 'id' | 'creator_id' | 'updated_at' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('You must be logged in to create an event');
      if (!isAdmin() && !isOrganizer()) {
        throw new Error('Only administrators and organizers can create events');
      }

      const newEvent = await eventsApi.create(eventData);
      setEvents(prev => [...prev, newEvent]);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        error,
        createEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}; 