import axios from 'axios';
import { AuthResponse, TokenValidationResponse } from '../types/user';
import { Event, ScheduleItem, Timer } from '../types/event';

const getApiBaseUrl = () => {
    const runtimeApiUrl = (globalThis as typeof globalThis & { REACT_APP_API_URL?: string }).REACT_APP_API_URL;
    return (
        runtimeApiUrl ||
        process.env.REACT_APP_API_URL ||
        'http://localhost:5001/api'
    );
};

const API_BASE_URL = getApiBaseUrl();
const getApiErrorMessage = (error: any, fallback: string) => error.response?.data?.message || error.response?.data?.error || fallback;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true // Important for CORS with credentials
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    Promise.reject
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isTokenValidationRequest = originalRequest?.url?.includes('/user/validate-token');

        if (error.response?.status === 401 && !originalRequest._retry && !isTokenValidationRequest) {
            originalRequest._retry = true;

            try {
                if (!localStorage.getItem('token')) {
                    throw new Error('No token found');
                }

                const response = await axiosInstance.get('/user/validate-token');
                if (response.data && response.data.user) {
                    return axiosInstance(originalRequest);
                }
            } catch {
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

const realAuthApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/user/signin', { email, password }, { withCredentials: true });
      const { token, user } = response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }

      return { user, token };
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        throw new Error(getApiErrorMessage(error, 'Invalid email or password'));
      }
      throw new Error(getApiErrorMessage(error, 'Login failed. Please try again.'));
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
    const backendUserData = {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone || '',
      gender: userData.gender, 
      birthday: userData.birthday,
      current_church: userData.current_church || 'Other',
    };
    
    try {
      const response = await axiosInstance.post('/user/signup', backendUserData);
      const { token, user } = response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }

      return { user, token };
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  },

  validateToken: async (token: string): Promise<TokenValidationResponse | null> => {
    try {
      if (!token) {
        return null;
      }

      token = token.replace('Bearer ', '');

      if (!token || token.split('.').length !== 3) {
        return null;
      }

      const response = await axiosInstance.get('/user/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !response.data.user) {
        return null;
      }

      return {
        user: response.data.user
      };
    } catch (error: any) {
      localStorage.removeItem('token');
      return null;
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await axiosInstance.post('/user/forgot-password', { email });
      return response.data;
    } catch {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    try {
      const response = await axiosInstance.post(`/user/reset-password/${token}`, { password });
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Password reset failed. Please try again.'));
    }
  },

  getChurches: async (): Promise<string[]> => {
    try {
      const response = await axiosInstance.get('/user/churches');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  updateProfile: async (userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    birthday: string;
    gender: string;
    current_church?: string;
  }): Promise<AuthResponse['user']> => {
    try {
      const response = await axiosInstance.patch('/user/profile', userData);
      return response.data.user;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to update profile'));
    }
  },

  createConnectOnboarding: async (): Promise<{ url: string }> => {
    try {
      const response = await axiosInstance.post('/user/connect/onboarding');
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to start Stripe Connect onboarding'));
    }
  },

  refreshOrganizerStatus: async (): Promise<AuthResponse['user']> => {
    try {
      const response = await axiosInstance.post('/user/organizer-status/refresh');
      return response.data.user;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to refresh organizer status'));
    }
  },

  getProfileDashboard: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get('/user/profile/dashboard');
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to load profile dashboard'));
    }
  }
};

interface EventsApi {
  getAll: () => Promise<Event[]>;
  getById: (eventId: string) => Promise<Event>;
  createRegistrationCheckout: (eventId: string) => Promise<{ url: string }>;
  completeRegistrationCheckout: (sessionId: string) => Promise<{ message: string; status?: string }>;
  create: (eventData: Omit<Event, 'id' | 'creator_id' | 'created_at' | 'updated_at' | 'registration_deadline'>) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<{ message: string, event: Event }>;
  deleteEvent: (eventId: string) => Promise<{ message: string }>;
  registerForEvent: (eventId: string, body?: { join_waitlist: boolean }) => Promise<{ message: string, waitlist_available?: boolean }>;
  cancelRegistration: (eventId: string) => Promise<{ message: string }>;
  manualCheckInAttendee: (eventId: string, attendeeId: string) => Promise<{ message: string }>;
  updateEventStatus: (eventId: string, status: string) => Promise<{ message: string }>;
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
    status: string
  }[] }>;
  updateAttendeeDetails: (eventId: string, attendeeId: string, data: {
    first_name?: string,
    last_name?: string,
    email?: string,
    gender?: string,
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
      church: string
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
  getEventWaitlist: (eventId: string) => Promise<{ data: any[] }>;
  getTimer: (eventId: string) => Promise<Timer | null>;
  startTimerRound: (eventId: string, roundNumber?: number) => Promise<TimerActionResponse>;
  endTimerRound: (eventId: string) => Promise<EventTimerPayload>;
  pauseTimerRound: (eventId: string, timeRemaining: number) => Promise<TimerActionResponse>;
  resumeTimerRound: (eventId: string) => Promise<TimerActionResponse>;
  nextTimerRound: (eventId: string) => Promise<TimerActionResponse>;
  updateTimerDuration: (eventId: string, data: TimerDurationUpdate) => Promise<TimerActionResponse>;
}

interface EventTimerPayload {
  id: number;
  event_id: number;
  current_round: number;
  final_round: number;
  round_duration: number;
  round_start_time: string | null;
  is_paused: boolean;
  pause_time_remaining: number | null;
  break_duration: number;
}

interface TimerActionResponse {
  timer: EventTimerPayload;
  message: string;
  complete?: boolean;
  error?: string;
}

interface TimerDurationUpdate {
  round_duration?: number;
  break_duration?: number;
}

const realEventsApi: EventsApi = {
  getAll: async () => {
    const response = await axiosInstance.get('/events');
    return response.data;
  },

  getById: async (eventId: string) => {
    try {
      const response = await axiosInstance.get(`/events/${eventId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch event details'));
    }
  },

  createRegistrationCheckout: async (eventId: string) => {
    try {
      const response = await axiosInstance.post(`/events/${eventId}/checkout`);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to start checkout'));
    }
  },

  completeRegistrationCheckout: async (sessionId: string) => {
    try {
      const response = await axiosInstance.post('/events/checkout/complete', {
        session_id: sessionId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to confirm checkout'));
    }
  },

  create: async (eventData) => {
    const eventDataWithTZ = {
      ...eventData,
      starts_at: eventData.starts_at && new Date(eventData.starts_at).toISOString()
    };
    const response = await axiosInstance.post('/events/create', eventDataWithTZ);
    return response.data;
  },

  updateEvent: async (eventId: string, eventData: Partial<Event>): Promise<{ message: string, event: Event }> => {
    const response = await axiosInstance.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/events/${eventId}`);
    return response.data;
  },

  registerForEvent: async (eventId: string, body?: { join_waitlist: boolean }) => {
    const response = await axiosInstance.post(`/events/${eventId}/register`, body);
    return response.data;
  },

  cancelRegistration: async (eventId: string) => {
    const response = await axiosInstance.post(`/events/${eventId}/cancel-registration`);
    return response.data;
  },
  
  manualCheckInAttendee: async (eventId: string, attendeeId: string) => {
    const response = await axiosInstance.post(`/events/${eventId}/attendees/${attendeeId}/check-in`);
    return response.data;
  },

  updateEventStatus: async (eventId: string, status: string) => {
    const response = await axiosInstance.patch(`/events/${eventId}/status`, { status });
    return response.data;
  },
  
  getEventAttendees: async (eventId: string) => {
    const response = await axiosInstance.get(`/events/${eventId}/attendees`);
    return { data: response.data };
  },
  
  updateAttendeeDetails: async (eventId: string, attendeeId: string, data: {
    first_name?: string,
    last_name?: string,
    email?: string,
    gender?: string,
    church?: string
  }) => {
    try {
      const response = await axiosInstance.patch(`/events/${eventId}/attendees/${attendeeId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to update attendee details'));
    }
  },
  
  getSchedule: async (eventId: string) => {
    try {
      const response = await axiosInstance.get(`/events/${eventId}/schedule`);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to retrieve schedule'));
    }
  },
  
  getAllSchedules: async (eventId: string) => {
    try {
      const response = await axiosInstance.get(`/events/${eventId}/all-schedules`);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to retrieve all schedules'));
    }
  },
  
  startEvent: async (eventId: string, numTables?: number, numRounds?: number) => {
    try {
      const payload = {
        num_tables: numTables,
        num_rounds: numRounds
      };
      const response = await axiosInstance.post(`/events/${eventId}/generate/schedules`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to generate schedules'));
    }
  },
  
  resumeEvent: async (eventId: string) => {
    try {
      const response = await axiosInstance.patch(`/events/${eventId}/status`, { status: 'In Progress' });
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to resume event'));
    }
  },
  
  submitSpeedDateSelections: async (
    eventId: string, 
    selections: Array<{ event_speed_date_id: number; interested: boolean }>
  ) => {
    const response = await axiosInstance.post(`/events/${eventId}/submit-selections`, { selections });
    return response.data;
  },
  getEventWaitlist: async (eventId: string) => {
    try {
      const response = await axiosInstance.get(`/events/${eventId}/waitlist`);
      return { data: response.data };
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch waitlist for this event.'));
    }
  },
  getTimer: async (eventId: string) => {
    const response = await axiosInstance.get(`/events/${eventId}/timer`);
    return response.data;
  },
  startTimerRound: async (eventId: string, roundNumber?: number) => {
    const response = await axiosInstance.post(`/events/${eventId}/timer/start`, roundNumber ? { round_number: roundNumber } : {});
    return response.data;
  },
  endTimerRound: async (eventId: string) => {
    const response = await axiosInstance.post(`/events/${eventId}/timer/end`);
    return response.data;
  },
  pauseTimerRound: async (eventId: string, timeRemaining: number) => {
    const response = await axiosInstance.post(`/events/${eventId}/timer/pause`, { time_remaining: timeRemaining });
    return response.data;
  },
  resumeTimerRound: async (eventId: string) => {
    const response = await axiosInstance.post(`/events/${eventId}/timer/resume`);
    return response.data;
  },
  nextTimerRound: async (eventId: string) => {
    const response = await axiosInstance.post(`/events/${eventId}/timer/next`);
    return response.data;
  },
  updateTimerDuration: async (eventId: string, data: TimerDurationUpdate) => {
    const response = await axiosInstance.put(`/events/${eventId}/timer/duration`, data);
    return response.data;
  }
};

export default realAuthApi;
export { realEventsApi as eventsApi };
