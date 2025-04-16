import axios from 'axios';
import { AuthResponse, TokenValidationResponse, User } from '../types/user';
import { Event } from '../types/event';

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

interface EventsApi {
  getAll: () => Promise<Event[]>;
  create: (eventData: Omit<Event, 'id' | 'creator_id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  registerForEvent: (eventId: string) => Promise<User>;
  cancelRegistration: (eventId: string) => Promise<{ message: string }>;
  testGetEvents: () => Promise<Event[]>;
}

const realEventsApi: EventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    console.log('getting events please...',response)
    return response.data;
  },

  create: async (eventData) => {
    const response = await api.post('/events', eventData);
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