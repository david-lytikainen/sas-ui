import axios, { AxiosError } from 'axios';
import { mockAuthApi, mockEventsApi } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const USE_MOCK_API = true; // Force mock API usage until backend is ready

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.message === 'Network Error') {
      console.error('Network Error - API server may not be running:', API_BASE_URL);
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running.`);
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorData = error.response.data as { message?: string };
      console.error('API Error Response:', errorData);
      throw new Error(errorData.message || 'An error occurred with the request');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
);

// Auth API interfaces and implementations are defined in mockApi.ts
// The real implementation would look like this:
/*
const realAuthApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    age: number;
    church: string;
    denomination?: string;
    role: 'attendee' | 'organizer' | 'admin';
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  validateToken: async (token: string) => {
    const response = await api.get('/auth/validate-token', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};
*/

interface Event {
  id: string;
  creator_id: string;
  starts_at: string;
  ends_at: string;
  address: string;
  name: string;
  max_capacity: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'in_progress';
  price_per_person: number;
  registration_deadline: string;
  description: string;
  updated_at: string;
  created_at: string;
}

interface Match {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  compatibilityScore: number;
  createdAt: string;
}

interface EventParticipant {
  id: string;
  user_id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'registered' | 'checked_in' | 'cancelled';
  registration_date: string;
  check_in_time?: string;
}

interface ScheduleItem {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  startTime: string;
  endTime: string;
  tableNumber: number;
  status: 'upcoming' | 'current' | 'completed' | 'paused';
}

interface Note {
  id: string;
  eventId: string;
  userId: string;
  partnerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface EventsApi {
  getAll: () => Promise<Event[]>;
  getById: (id: string) => Promise<Event>;
  getEvent: (id: string) => Promise<Event>;
  create: (eventData: Omit<Event, 'id' | 'creator_id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  update: (id: string, eventData: Partial<Event>) => Promise<Event>;
  delete: (id: string) => Promise<void>;
  getMyEvents: () => Promise<Event[]>;
  runMatching: (eventId: string) => Promise<any>;
  getEventMatches: (eventId: string) => Promise<Match[]>;
  getEventParticipants: (eventId: string) => Promise<EventParticipant[]>;
  getCheckedInParticipants: (eventId: string) => Promise<EventParticipant[]>;
  checkInParticipant: (eventId: string, participantId: string) => Promise<{ success: boolean }>;
  cancelCheckIn: (eventId: string, participantId: string) => Promise<{ success: boolean }>;
  saveFinalMatches: (eventId: string, matches: Match[]) => Promise<{ success: boolean; matches: Match[] }>;
  scheduleMatchingNotification: (eventId: string, notificationTime: string) => Promise<{ success: boolean; scheduledTime: string }>;
  completeEvent: (eventId: string) => Promise<{ success: boolean }>;
  getEventSchedule: (eventId: string) => Promise<ScheduleItem[]>;
  startEvent: (eventId: string) => Promise<any>;
  saveNote: (eventId: string, partnerId: string, content: string) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<{ message: string }>;
  getEventNotes: (eventId: string) => Promise<Note[]>;
  registerForEvent: (eventId: string) => Promise<EventParticipant>;
  cancelRegistration: (eventId: string) => Promise<{ message: string }>;
  isRegisteredForEvent: (eventId: string) => Promise<boolean>;
}

const realEventsApi: EventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getEvent: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: string, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/events/${id}`);
  },

  getMyEvents: async () => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  runMatching: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/run-matching`);
    return response.data;
  },

  getEventMatches: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/matches`);
    return response.data;
  },

  getEventParticipants: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/participants`);
    return response.data;
  },

  getCheckedInParticipants: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/checked-in-participants`);
    return response.data;
  },

  checkInParticipant: async (eventId: string, participantId: string) => {
    const response = await api.post(`/events/${eventId}/check-in/${participantId}`);
    return response.data;
  },

  cancelCheckIn: async (eventId: string, participantId: string) => {
    const response = await api.post(`/events/${eventId}/cancel-check-in/${participantId}`);
    return response.data;
  },

  saveFinalMatches: async (eventId: string, matches: Match[]) => {
    const response = await api.post(`/events/${eventId}/final-matches`, { matches });
    return response.data;
  },

  scheduleMatchingNotification: async (eventId: string, notificationTime: string) => {
    const response = await api.post(`/events/${eventId}/schedule-matching-notification`, { notificationTime });
    return response.data;
  },

  completeEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/complete`);
    return response.data;
  },

  getEventSchedule: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/schedule`);
    return response.data;
  },

  startEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/start`);
    return response.data;
  },

  saveNote: async (eventId: string, partnerId: string, content: string) => {
    const response = await api.post(`/events/${eventId}/notes`, { partnerId, content });
    return response.data;
  },

  deleteNote: async (noteId: string) => {
    const response = await api.delete(`/events/notes/${noteId}`);
    return response.data;
  },

  getEventNotes: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/notes`);
    return response.data;
  },

  registerForEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  cancelRegistration: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/cancel-registration`);
    return response.data;
  },

  isRegisteredForEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/is-registered`);
    return response.data;
  }
};

// Export the appropriate implementation based on environment
export const authApi = mockAuthApi;

// In a production environment, we would use the real API implementation:
// export const authApi = process.env.NODE_ENV === 'production' ? realAuthApi : mockAuthApi;

export const eventsApi: EventsApi = USE_MOCK_API 
  ? {
    ...mockEventsApi,
    runMatching: mockEventsApi.runMatching || (async () => ({})),
    getEventMatches: mockEventsApi.getEventMatches || (async () => []),
    getEventParticipants: mockEventsApi.getEventParticipants || (async () => [])
  }
  : realEventsApi;

export default api; 