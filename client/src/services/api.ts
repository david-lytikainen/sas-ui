import axios, { AxiosError } from 'axios';
import { mockAuthApi, mockEventsApi } from './mockApi';
import { AuthResponse, TokenValidationResponse } from '../types/user';

// Use relative URL with proxy in package.json
const apiBaseUrl = '/api';
const API_BASE_URL = apiBaseUrl;
const USE_MOCK_API = false; // Always use real API

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
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
      const errorData = error.response.data as { message?: string, error?: string };
      console.error('API Error Response:', errorData);
      
      // Use the backend's error message if available
      const errorMessage = errorData.message || errorData.error;
      
      // For authentication errors, provide a friendly message
      if (error.response.status === 401) {
        throw new Error(errorMessage || 'Invalid email or password');
      }
      
      // For bad requests, extract the validation error
      if (error.response.status === 400) {
        throw new Error(errorMessage || 'Please check your input and try again');
      }
      
      // General error with message from backend if available
      throw new Error(errorMessage || `Error ${error.response.status}: ${error.response.statusText}`);
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

// Real Auth API implementation to connect with Flask backend
const realAuthApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/user/signin', { email, password });
      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      return {
        user,
        token
      };
    } catch (error: any) {
      // Handle 401 Unauthorized error specifically
      if (error.response && error.response.status === 401) {
        // Extract the error message from the backend if available
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Invalid email or password';
        throw new Error(errorMessage);
      }
      // For other errors, rethrow
      throw error;
    }
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
  }): Promise<AuthResponse> => {
    // Map role name to role ID
    let role_id: number;
    switch (userData.role) {
      case 'admin':
        role_id = 1; // Admin role ID
        break;
      case 'organizer':
        role_id = 2; // Organizer role ID
        break;
      case 'attendee':
        role_id = 3; // Attendee role ID
        break;
      default:
        throw new Error('Invalid role');
    }
    
    // Prepare data for backend format
    const backendUserData = {
      email: userData.email,
      password: userData.password,
      role_id: role_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone || "",
      gender: "NOT_SPECIFIED", // Must match the enum value exactly (uppercase)
      age: userData.age,
      church_id: null, // This would need to be populated if you have church IDs
      denomination_id: null // This would need to be populated if you have denomination IDs
    };
    
    try {
      console.log('Sending registration data:', backendUserData);
      // Register the user
      const response = await api.post('/user/signup', backendUserData);
      console.log('Registration response:', response.data);
      
      // After signup, log in to get the token
      return await realAuthApi.login(userData.email, userData.password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  validateToken: async (token: string): Promise<TokenValidationResponse | null> => {
    try {
      // Since there's no /user/validate-token endpoint yet, we'll use a simple check
      // Just verify we can access a protected endpoint
      const response = await api.get('/health');
      
      // If we get a successful response, the token is valid
      // For a proper implementation, we should have a dedicated endpoint 
      // that returns the current user's data
      return null; // Return null so the user has to log in explicitly
    } catch (error) {
      // If the request fails, the token is invalid
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      throw new Error('Invalid or expired token');
    }
  },

  // Additional methods to match the mock API structure
  getRoles: async () => {
    // This would call a backend endpoint to get roles
    // For now, return default roles
    return [
      { id: 1, name: 'admin', permission_level: 100 },
      { id: 2, name: 'organizer', permission_level: 50 },
      { id: 3, name: 'attendee', permission_level: 10 },
    ];
  },
  
  getUsers: async () => {
    // This would call a backend endpoint to get users
    // For now, return an empty array
    return [];
  },
  
  updateUser: async (userId: string, userData: any) => {
    // This would call a backend endpoint to update a user
    // For now, return the userData
    return { ...userData, id: userId };
  },
  
  createUser: async (userData: any) => {
    // This would call a backend endpoint to create a user
    // For now, return the userData with a mock ID
    return { ...userData, id: 'new-user-id' };
  },
  
  deleteUser: async (userId: string) => {
    // This would call a backend endpoint to delete a user
    // For now, return success
    return { success: true };
  }
};

// Export the appropriate API implementation
// For development, you can switch between mock and real APIs
// export const authApi = USE_MOCK_API ? mockAuthApi : realAuthApi;
// For production, always use the real API
export const authApi = realAuthApi;

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

export const eventsApi: EventsApi = USE_MOCK_API 
  ? {
    ...mockEventsApi,
    runMatching: mockEventsApi.runMatching || (async () => ({})),
    getEventMatches: mockEventsApi.getEventMatches || (async () => []),
    getEventParticipants: mockEventsApi.getEventParticipants || (async () => [])
  }
  : realEventsApi;

export default api; 