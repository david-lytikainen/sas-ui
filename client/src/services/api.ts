import axios from 'axios';
import { AuthResponse, TokenValidationResponse} from '../types/user';
import { Event, ScheduleItem } from '../types/event';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    current_church?: string;
  }): Promise<AuthResponse> => {
    // Prepare data for backend format
    const backendUserData = {
      email: userData.email,
      password: userData.password,
      role_id: 1,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone || "",
      gender: userData.gender, 
      birthday: userData.birthday,
      current_church: userData.current_church || 'Other',
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
    try {
      const response = await api.patch(`/user/users/${userId}`, userData);
      return response.data.user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
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

interface EventsApi {
  getAll: () => Promise<Event[]>;
  getById: (eventId: string) => Promise<Event>;
  create: (eventData: Omit<Event, 'id' | 'creator_id' | 'created_at' | 'updated_at' | 'registration_deadline'>) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<{ message: string, event: Event }>;
  deleteEvent: (eventId: string) => Promise<{ message: string }>;
  registerForEvent: (eventId: string, body?: { join_waitlist: boolean }) => Promise<{ message: string, waitlist_available?: boolean }>;
  cancelRegistration: (eventId: string) => Promise<{ message: string }>;
  checkIn: (eventId: string, pin: string) => Promise<{ message: string }>;
  testGetEvents: () => Promise<Event[]>;
  updateEventStatus: (eventId: string, status: string) => Promise<{ message: string }>;
  getEventAttendeePins: (eventId: string) => Promise<{ data: {name: string, email: string, pin: string, status: string}[] }>;
  getEventAttendees: (eventId: string) => Promise<{ data: {
    id: number,
    name: string,
    email: string,
    first_name: string,
    last_name: string,
    birthday: string,
    age: number,
    gender: string,
    phone: string,
    registration_date: string,
    check_in_date: string | null,
    status: string,
    pin: string
  }[] }>;
  updateAttendeeDetails: (eventId: string, attendeeId: string, data: {
    pin?: string,
    first_name?: string,
    last_name?: string,
    email?: string,
    phone?: string,
    gender?: string,
    birthday?: string,
    church?: string
  }) => Promise<{ 
    message: string, 
    updated_fields: string[],
    attendee?: {
      id: number,
      name: string,
      email: string,
      first_name: string,
      last_name: string,
      birthday: string | null,
      age: number,
      gender: string | null,
      phone: string,
      church: string,
      pin: string
    }
  }>;
  getSchedule: (eventId: string) => Promise<{ 
    schedule: Array<ScheduleItem> 
  }>;
  getAllSchedules: (eventId: string) => Promise<{ 
    schedules: Record<number, Array<ScheduleItem>> 
  }>;
  startEvent: (eventId: string, numTables?: number, numRounds?: number) => Promise<{ message: string }>;
  resumeEvent: (eventId: string) => Promise<{ message: string }>;
  submitSpeedDateSelections: (
    eventId: string, 
    selections: Array<{ event_speed_date_id: number; interested: boolean }>
  ) => Promise<any>;
  getMyMatches: (eventId: string) => Promise<{ matches: Match[] }>;
  getAllMatchesForEvent: (eventId: string) => Promise<{ matches: MatchPair[] }>;
}

interface MatchPair {
  user1_name: string;
  user1_email: string;
  user2_name: string;
  user2_email: string;
}

interface Match {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
}

const realEventsApi: EventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    console.log('getting events please...',response)
    return response.data;
  },

  getById: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching event with ID ${eventId}:`, error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch event details');
    }
  },

  create: async (eventData) => {
    const eventDataWithTZ = {
      ...eventData,
      starts_at: eventData.starts_at && new Date(eventData.starts_at).toISOString()
    };
    const response = await api.post('/events/create', eventDataWithTZ);
    return response.data;
  },

  updateEvent: async (eventId: string, eventData: Partial<Event>): Promise<{ message: string, event: Event }> => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  registerForEvent: async (eventId: string, body?: { join_waitlist: boolean }) => {
    const response = await api.post(`/events/${eventId}/register`, body);
    return response.data;
  },

  cancelRegistration: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/cancel-registration`);
    return response.data;
  },
  
  checkIn: async (eventId: string, pin: string) => {
    const response = await api.post(`/events/${eventId}/check-in`, { pin });
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
  },
  
  updateEventStatus: async (eventId: string, status: string) => {
    const response = await api.patch(`/events/${eventId}/status`, { status });
    return response.data;
  },
  
  getEventAttendeePins: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/attendee-pins`);
    return { data: response.data };
  },
  
  getEventAttendees: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/attendees`);
    return { data: response.data };
  },
  
  updateAttendeeDetails: async (eventId: string, attendeeId: string, data: {
    pin?: string,
    first_name?: string,
    last_name?: string,
    email?: string,
    phone?: string,
    gender?: string,
    birthday?: string,
    church?: string
  }) => {
    try {
      const response = await api.patch(`/events/${eventId}/attendees/${attendeeId}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update attendee details');
    }
  },
  
  getSchedule: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}/schedule`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to retrieve schedule');
    }
  },
  
  getAllSchedules: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}/all-schedules`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to retrieve all schedules');
    }
  },
  
  startEvent: async (eventId: string, numTables?: number, numRounds?: number) => {
    try {
      const payload = {
        num_tables: numTables,
        num_rounds: numRounds
      };
      const response = await api.post(`/events/${eventId}/start`, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to start event');
    }
  },
  
  resumeEvent: async (eventId: string) => {
    try {
      // Use the updateEventStatus method to set the event back to "In Progress"
      const response = await api.patch(`/events/${eventId}/status`, { status: 'In Progress' });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to resume event');
    }
  },
  
  submitSpeedDateSelections: async (
    eventId: string, 
    selections: Array<{ event_speed_date_id: number; interested: boolean }>
  ) => {
    const response = await api.post(`/events/${eventId}/speed-date-selections`, { selections });
    return response.data;
  },
  getMyMatches: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}/my-matches`);
      return response.data; 
    } catch (error: any) {
      console.error(`Error fetching matches for event ${eventId}:`, error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch your matches for this event.');
    }
  },
  getAllMatchesForEvent: async (eventId: string) => {
    try {
      const response = await api.get(`/events/${eventId}/all-matches`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching all matches for event ${eventId}:`, error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch all matches for this event.');
    }
  }
};

// Export the real API implementation
export const authApi = realAuthApi;
export const eventsApi = realEventsApi;

export default api; 