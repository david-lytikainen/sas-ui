import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { eventsApi } from '../services/api';
import { Event } from '../types/event';

interface EventContextType {
  events: Event[];
  filteredEvents: Event[];
  loading: boolean;
  error: string | null;
  userRegisteredEvents: number[];
  createEvent: (eventData: Omit<Event, 'id' | 'creator_id' | 'updated_at' | 'created_at' | 'registration_deadline'>) => Promise<void>;
  refreshEvents: () => Promise<void>;
  isRegisteredForEvent: (eventId: number) => boolean;
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
  const [userRegisteredEvents, setUserRegisteredEvents] = useState<number[]>([]);
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
        const response = await eventsApi.getAll();
        const data = response as { 
          events?: Event[]; 
          registrations?: Array<{event_id: number, status: string, pin?: string, registration_date?: string, check_in_date?: string}>
        };
        
        if (data.events) {
          const eventsWithRegistrationStatus = data.events.map(event => {
            const registrationInfo = data.registrations?.find(reg => reg.event_id === event.id);
            return {
              ...event,
              registration: registrationInfo ? {
                status: registrationInfo.status,
                pin: registrationInfo.pin,
                registration_date: registrationInfo.registration_date,
                check_in_date: registrationInfo.check_in_date
              } : event.registration
            };
          });
          setEvents(eventsWithRegistrationStatus);
          
          if (data.registrations) {
            setUserRegisteredEvents(data.registrations.map(reg => reg.event_id));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]); // Add user as a dependency

  const createEvent = async (eventData: Omit<Event, 'id' | 'creator_id' | 'updated_at' | 'created_at' | 'registration_deadline'>) => {
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
    setError(null);
    try {
      const response = await eventsApi.getAll();
      const data = response as { 
        events?: Event[]; 
        registrations?: Array<{event_id: number, status: string, pin?: string, registration_date?: string, check_in_date?: string}>
      };
      
      if (data.events) {
        const eventsWithRegistrationStatus = data.events.map(event => {
          const registrationInfo = data.registrations?.find(reg => reg.event_id === event.id);
          return {
            ...event,
            registration: registrationInfo ? {
              status: registrationInfo.status,
              pin: registrationInfo.pin,
              registration_date: registrationInfo.registration_date,
              check_in_date: registrationInfo.check_in_date
            } : undefined
          };
        });
        setEvents(eventsWithRegistrationStatus);
        
        if (data.registrations) {
          setUserRegisteredEvents(data.registrations.map(reg => reg.event_id));
        } else {
          setUserRegisteredEvents([]);
        }
      } else if (Array.isArray(data)) { 
        const eventsWithoutExplicitRegistration = data.map(event => ({
          ...event,
          registration: undefined
        }));
        setEvents(eventsWithoutExplicitRegistration);
        setUserRegisteredEvents([]);
      } else {
        setEvents([]);
        setUserRegisteredEvents([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh events');
    } finally {
      setLoading(false);
    }
  };
  
  const isRegisteredForEvent = useCallback((eventId: number): boolean => {
    return userRegisteredEvents.includes(eventId);
  }, [userRegisteredEvents]);

  // Memoized filtered events
  const filteredEvents = useMemo(() => {
    if (!user) return [];

    if (!isAdmin()) {
      const checkedInEvent = events.find(event =>
        event.registration?.status === 'Checked In' &&
        event.status === 'In Progress'
      );
      if (checkedInEvent) {
        return [checkedInEvent];
      }
    }

    return events.filter(event => {
      const eventNameLower = event.name.toLowerCase();
      if (eventNameLower.includes('mock event')) {
        return isAdmin() || isOrganizer();
      }
      return true;
    });
  }, [events, user, isAdmin, isOrganizer]);

  return (
    <EventContext.Provider
      value={{
        events,
        filteredEvents,
        loading,
        error,
        userRegisteredEvents,
        createEvent,
        refreshEvents,
        isRegisteredForEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}; 