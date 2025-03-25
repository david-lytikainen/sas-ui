import axios from 'axios';

// Use relative URL with proxy in package.json
const apiBaseUrl = '/api';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error.message);
    
    // Handle specific error codes
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        // You might want to redirect to login page here
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authApi = {
  // Authentication endpoints
  login: async (email, password) => {
    const response = await api.post('/user/signin', { email, password });
    const { access_token, user } = response.data;
    
    // Ensure the user object has all required fields even if the API doesn't return them
    const fullUser = {
      id: user?.id || '',
      email: user?.email || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      role_id: user?.role_id || 3, // Default to attendee role
      phone: user?.phone || null,
      age: user?.age || 0,
      church: user?.church || '',
      denomination: user?.denomination || null
    };
    
    // Store token
    localStorage.setItem('token', access_token);
    return { user: fullUser, token: access_token };
  },

  register: async (userData) => {
    // Map role name to role ID
    let role_id;
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
      gender: "not_specified", // Default value as it's required by backend
      age: userData.age,
      church_id: null, // This would need to be populated if you have church IDs
      denomination_id: null // This would need to be populated if you have denomination IDs
    };
    
    // Register the user
    await api.post('/user/signup', backendUserData);
    
    // After signup, log in to get the token
    return await authApi.login(userData.email, userData.password);
  },

  validateToken: async (token) => {
    // This would typically call a backend endpoint to validate the token
    // For now, we'll just return a mock user object with all required fields
    // that matches the User type in AuthContext
    return {
      user: {
        id: "current-user",
        email: "current@example.com",
        first_name: "Current",
        last_name: "User",
        role_id: 3, // Default to attendee
        phone: "",
        age: 30,
        church: "Default Church",
        denomination: null
      }
    };
  },

  // Additional auth methods to match the mock API structure
  getRoles: async () => {
    return [
      { id: 1, name: 'admin', permission_level: 100 },
      { id: 2, name: 'organizer', permission_level: 50 },
      { id: 3, name: 'attendee', permission_level: 10 },
    ];
  },
  
  getUsers: async () => {
    return [];
  },
  
  updateUser: async (userId, userData) => {
    return { ...userData, id: userId };
  },
  
  createUser: async (userData) => {
    return { ...userData, id: 'new-user-id' };
  },
  
  deleteUser: async (userId) => {
    return { success: true };
  }
};

// Events API methods
export const eventsApi = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/events/${id}`);
  },

  getMyEvents: async () => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  runMatching: async (eventId) => {
    const response = await api.post(`/events/${eventId}/run-matching`);
    return response.data;
  },

  getEventMatches: async (eventId) => {
    const response = await api.get(`/events/${eventId}/matches`);
    return response.data;
  },

  getEventParticipants: async (eventId) => {
    const response = await api.get(`/events/${eventId}/participants`);
    return response.data;
  },

  getCheckedInParticipants: async (eventId) => {
    const response = await api.get(`/events/${eventId}/checked-in`);
    return response.data;
  },

  checkInParticipant: async (eventId, participantId) => {
    const response = await api.post(`/events/${eventId}/check-in/${participantId}`);
    return response.data;
  },

  cancelCheckIn: async (eventId, participantId) => {
    const response = await api.delete(`/events/${eventId}/check-in/${participantId}`);
    return response.data;
  },

  saveFinalMatches: async (eventId, matches) => {
    const response = await api.post(`/events/${eventId}/final-matches`, { matches });
    return response.data;
  },

  scheduleMatchingNotification: async (eventId, notificationTime) => {
    const response = await api.post(`/events/${eventId}/schedule-notification`, { notification_time: notificationTime });
    return response.data;
  },

  completeEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/complete`);
    return response.data;
  },

  getEventSchedule: async (eventId) => {
    const response = await api.get(`/events/${eventId}/schedule`);
    return response.data;
  },

  startEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/start`);
    return response.data;
  },

  saveNote: async (eventId, partnerId, content) => {
    const response = await api.post(`/events/${eventId}/notes`, { partner_id: partnerId, content });
    return response.data;
  },

  deleteNote: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },

  getEventNotes: async (eventId) => {
    const response = await api.get(`/events/${eventId}/notes`);
    return response.data;
  },

  registerForEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  cancelRegistration: async (eventId) => {
    const response = await api.delete(`/events/${eventId}/registration`);
    return response.data;
  },

  isRegisteredForEvent: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/is-registered`);
      return response.data.registered;
    } catch (error) {
      return false;
    }
  }
};

// API service object with all methods
const apiService = {
  // Health check to verify API connection
  checkHealth: () => api.get('/health'),
  
  // Token management
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  
  getAuthToken: () => localStorage.getItem('token'),
  
  isAuthenticated: () => !!localStorage.getItem('token'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // You can add additional cleanup here if needed
  },
  
  // User data management
  saveUserData: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },
  
  getUserData: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Generic API methods
  get: (endpoint) => api.get(endpoint),
  post: (endpoint, data) => api.post(endpoint, data),
  put: (endpoint, data) => api.put(endpoint, data),
  delete: (endpoint) => api.delete(endpoint),
  
  // Example methods - replace these with your actual API endpoints
  fetchData: (endpoint) => api.get(`/${endpoint}`),
  postData: (endpoint, data) => api.post(`/${endpoint}`, data),
  updateData: (endpoint, id, data) => api.put(`/${endpoint}/${id}`, data),
  deleteData: (endpoint, id) => api.delete(`/${endpoint}/${id}`),
};

export default apiService; 