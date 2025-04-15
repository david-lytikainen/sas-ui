import axios from 'axios';
import { AuthResponse, TokenValidationResponse } from '../types/user';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for CORS with credentials
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                // Try to validate the token
                const response = await api.get('/user/validate-token');
                if (response.data && response.data.user) {
                    // Token is valid, retry the original request
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // If token refresh fails, just reject the error
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

// Real Auth API implementation to connect with Flask backend
const realAuthApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/user/signin', { email, password }, { withCredentials: true });
      const { token, user } = response.data;
      
      // Ensure token is properly formatted
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }
      
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
      // For other errors, rethrow with a more specific message
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || error.response.data.error || 'Login failed');
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    birthday: string;
    gender: string;
    role: 'attendee' | 'organizer' | 'admin';
  }): Promise<AuthResponse> => {
    // Map role name to role ID
    let role_id: number;
    switch (userData.role) {
      case 'admin':
        role_id = 3; // Admin role ID
        break;
      case 'organizer':
        role_id = 2; // Organizer role ID
        break;
      case 'attendee':
        role_id = 1; // Attendee role ID
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
      gender: userData.gender, 
      birthday: userData.birthday,
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
      if (!token) {
        console.error('No token provided for validation');
        return null;
      }

      // Remove any existing Bearer prefix if present
      token = token.replace('Bearer ', '');

      // Check if token is properly formatted
      if (!token || token.split('.').length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      console.log('Validating token:', token);
      const response = await api.get('/user/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.user) {
        console.error('Invalid response format:', response.data);
        return null;
      }

      console.log('Token validation response:', response.data);
      return {
        user: response.data.user
      };
    } catch (error: any) {
      console.error('Token validation failed:', error.response?.data || error.message);
      localStorage.removeItem('token');
      return null;
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
  testGetEvents: () => Promise<Event[]>;
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
  },

  testGetEvents: async () => {
    try {
      const token = localStorage.getItem('token'); // Get token from localStorage
  
      const response = await api.get('/events', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
  
      console.log('Test get_events response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error testing get_events:', error);
      throw error;
    }
  }
  
};

// Export the real API implementation
export const authApi = realAuthApi;
export const eventsApi = realEventsApi;

export default api; 