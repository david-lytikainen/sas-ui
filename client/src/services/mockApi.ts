import * as uuid from 'uuid';

// Types
interface Role {
  id: number;
  name: string;
  permission_level: number;
}

interface User {
  id: string;
  email: string;
  password?: string;
  role_id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  age: number;
  church: string;
  denomination: string | null;
}

interface Event {
  id: string;
  creator_id: string;
  starts_at: string;
  ends_at: string;
  address: string;
  name: string;
  max_capacity: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  price_per_person: number;
  registration_deadline: string;
  description: string;
  updated_at: string;
  created_at: string;
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

// Mock roles
const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
  ORGANIZER: { id: 2, name: 'organizer', permission_level: 50 },
  ATTENDEE: { id: 3, name: 'attendee', permission_level: 10 },
} as const;

// Mock data persistence
const getStoredData = <T>(key: string, defaultValue: T[]): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setStoredData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize with some mock data
const initializeMockData = () => {
  // Force clear existing users to ensure clean state
  localStorage.removeItem('users');
  localStorage.removeItem('roles');
  localStorage.removeItem('token');
  
  // Initialize roles
  setStoredData('roles', Object.values(ROLES));
  
  // Create admin user
  const adminUser: User = {
    id: uuid.v4(),
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role_id: ROLES.ADMIN.id,
    phone: null,
    age: 30,
    church: 'Admin Church',
    denomination: null,
  };
  
  setStoredData('users', [adminUser]);
  
  // Always create a fresh admin token
  const token = btoa(JSON.stringify({ 
    userId: adminUser.id, 
    roleId: ROLES.ADMIN.id,
    roleName: ROLES.ADMIN.name 
  }));
  localStorage.setItem('token', token);
};

// Force initialization on load
initializeMockData();

// Helper function to validate token and get user
const validateTokenAndGetUser = (token: string | null): { userId: string; roleId: number; roleName: string } => {
  if (!token) throw new Error('Unauthorized');
  try {
    const decoded = JSON.parse(atob(token));
    if (!decoded.userId || !decoded.roleId || !decoded.roleName) {
      throw new Error('Invalid token format');
    }
    return decoded;
  } catch {
    throw new Error('Invalid token');
  }
};

// Helper function to get role by ID
const getRoleById = (roleId: number): Role => {
  const roles = getStoredData<Role>('roles', Object.values(ROLES));
  const role = roles.find(r => r.id === roleId);
  if (!role) throw new Error('Invalid role');
  return role;
};

// Mock API implementation
export const mockAuthApi = {
  login: async (email: string, password: string) => {
    const users = getStoredData<User>('users', []);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const role = getRoleById(user.role_id);
    
    // Generate a mock token with role and userId
    const token = btoa(JSON.stringify({ 
      userId: user.id, 
      roleId: user.role_id,
      roleName: role.name 
    }));
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    return { 
      user: {
        ...user,
        password: undefined // Remove password from response
      }, 
      token 
    };
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
    const users = getStoredData<User>('users', []);
    
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    // Map role name to role ID
    let role_id: number;
    switch (userData.role) {
      case 'admin':
        role_id = ROLES.ADMIN.id;
        break;
      case 'organizer':
        role_id = ROLES.ORGANIZER.id;
        break;
      case 'attendee':
        role_id = ROLES.ATTENDEE.id;
        break;
      default:
        throw new Error('Invalid role');
    }

    const newUser: User = {
      id: uuid.v4(),
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role_id,
      phone: userData.phone || null,
      age: userData.age,
      church: userData.church,
      denomination: userData.denomination || null,
    };

    setStoredData('users', [...users, newUser]);
    
    // Generate token for new user
    const token = btoa(JSON.stringify({ 
      userId: newUser.id, 
      roleId: newUser.role_id,
      roleName: userData.role
    }));
    
    return { 
      user: {
        ...newUser,
        password: undefined
      }, 
      token 
    };
  },

  validateToken: async (token: string) => {
    try {
      const decoded = validateTokenAndGetUser(token);
      const users = getStoredData<User>('users', []);
      const user = users.find(u => u.id === decoded.userId);
      
      if (!user) {
        throw new Error('Invalid token');
      }

      return { 
        user: {
          ...user,
          password: undefined // Remove password from response
        }
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  },
};

export const mockEventsApi = {
  getAll: async () => {
    return getStoredData<Event>('events', []);
  },

  getById: async (id: string) => {
    const events = getStoredData<Event>('events', []);
    const event = events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    return event;
  },

  create: async (eventData: Omit<Event, 'id' | 'creator_id' | 'created_at' | 'updated_at'>) => {
    const token = localStorage.getItem('token');
    const { userId, roleId } = validateTokenAndGetUser(token);

    // Check if user has admin role
    if (roleId === ROLES.ADMIN.id) {
      const newEvent = {
        ...eventData,
        id: uuid.v4(),
        creator_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const events = getStoredData<Event>('events', []);
      setStoredData('events', [...events, newEvent]);
      return newEvent;
    }

    // For non-admin users, check if they are organizers
    if (roleId === ROLES.ORGANIZER.id) {
      const newEvent = {
        ...eventData,
        id: uuid.v4(),
        creator_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const events = getStoredData<Event>('events', []);
      setStoredData('events', [...events, newEvent]);
      return newEvent;
    }

    throw new Error('Unauthorized - Only admins and organizers can create events');
  },

  update: async (id: string, eventData: Partial<Event>) => {
    const token = localStorage.getItem('token');
    const { userId, roleName } = validateTokenAndGetUser(token);

    const events = getStoredData<Event>('events', []);
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) throw new Error('Event not found');

    // Allow update if user is admin or the creator of the event
    if (roleName !== 'admin' && events[eventIndex].creator_id !== userId) {
      throw new Error('Unauthorized - You can only edit your own events');
    }

    const updatedEvent = {
      ...events[eventIndex],
      ...eventData,
      updated_at: new Date().toISOString(),
    };

    events[eventIndex] = updatedEvent;
    setStoredData('events', events);
    return updatedEvent;
  },

  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const { userId, roleName } = validateTokenAndGetUser(token);

    const events = getStoredData<Event>('events', []);
    const event = events.find(e => e.id === id);

    if (!event) throw new Error('Event not found');

    // Allow deletion if user is admin or the creator of the event
    if (roleName !== 'admin' && event.creator_id !== userId) {
      throw new Error('Unauthorized - You can only delete your own events');
    }

    setStoredData('events', events.filter(e => e.id !== id));
  },

  getMyEvents: async () => {
    const token = localStorage.getItem('token');
    const { userId, roleName } = validateTokenAndGetUser(token);

    const events = getStoredData<Event>('events', []);
    // If admin, return all events, otherwise return only user's events
    return roleName === 'admin' ? events : events.filter(e => e.creator_id === userId);
  },

  runMatching: async (eventId: string) => {
    // Mock matching algorithm
    return { message: 'Matching completed successfully' };
  },

  getEventMatches: async (eventId: string) => {
    // Mock matches
    return [];
  },

  getCheckedInParticipants: async (eventId: string) => {
    // Mock checked-in participants
    return [];
  },

  getEventParticipants: async (eventId: string) => {
    const participants = getStoredData<EventParticipant>('event_participants', []);
    return participants.filter(p => p.event_id === eventId);
  },

  checkInParticipant: async (eventId: string, participantId: string) => {
    const participants = getStoredData<EventParticipant>('event_participants', []);
    const updatedParticipants = participants.map(p => {
      if (p.id === participantId && p.event_id === eventId) {
        return {
          ...p,
          status: 'checked_in' as const,
          check_in_time: new Date().toISOString(),
        };
      }
      return p;
    });
    setStoredData('event_participants', updatedParticipants);
    return updatedParticipants.find(p => p.id === participantId);
  },

  cancelCheckIn: async (eventId: string, participantId: string) => {
    const participants = getStoredData<EventParticipant>('event_participants', []);
    const updatedParticipants = participants.map(p => {
      if (p.id === participantId && p.event_id === eventId) {
        return {
          ...p,
          status: 'registered' as const,
          check_in_time: undefined,
        };
      }
      return p;
    });
    setStoredData('event_participants', updatedParticipants);
    return updatedParticipants.find(p => p.id === participantId);
  },
}; 