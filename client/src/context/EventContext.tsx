import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { eventsApi } from '../services/api';

export interface Event {
  id: string;
  creator_id: string;
  starts_at: string;
  ends_at: string;
  address: string;
  name: string;
  max_capacity: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  price_per_person: number;
  registration_deadline: string;
  description: string;
  updated_at: string;
  created_at: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: Omit<Event, 'id' | 'creator_id' | 'updated_at' | 'created_at'>) => Promise<void>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId: string) => Event | undefined;
  getMyEvents: () => Promise<Event[]>;
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

  const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('You must be logged in to update an event');
      
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      if (event.creator_id !== user.id && !isAdmin()) {
        throw new Error('You can only edit your own events');
      }

      const updatedEvent = await eventsApi.update(eventId, eventData);
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('You must be logged in to delete an event');
      
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      if (event.creator_id !== user.id && !isAdmin()) {
        throw new Error('You can only delete your own events');
      }

      await eventsApi.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getEventById = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  const getMyEvents = async () => {
    try {
      return await eventsApi.getMyEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your events');
      return [];
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
        updateEvent,
        deleteEvent,
        getEventById,
        getMyEvents,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}; 