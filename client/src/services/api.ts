import axios, { AxiosError } from 'axios';
import { mockAuthApi, mockEventsApi } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const USE_MOCK_API = true; // Toggle this to switch between mock and real API

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

// Real API implementations
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

const realEventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData: {
    name: string;
    description: string;
    starts_at: string;
    ends_at: string;
    address: string;
    max_capacity: number;
    price_per_person: number;
    registration_deadline: string;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
  }) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: string, eventData: Partial<{
    name: string;
    description: string;
    starts_at: string;
    ends_at: string;
    address: string;
    max_capacity: number;
    price_per_person: number;
    registration_deadline: string;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
  }>) => {
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

  getCheckedInParticipants: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/checked-in`);
    return response.data;
  },

  checkInParticipant: async (eventId: string, userId: string) => {
    const response = await api.post(`/events/${eventId}/check-in/${userId}`);
    return response.data;
  },
};

// Export the appropriate implementation based on USE_MOCK_API flag
export const authApi = USE_MOCK_API ? mockAuthApi : realAuthApi;
export const eventsApi = USE_MOCK_API ? mockEventsApi : realEventsApi;

export default api; 