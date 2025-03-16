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

interface MatchingNotification {
  eventId: string;
  notificationTime: string;
}

// Helper interfaces for functionality
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

// Add this function after the getStoredData and setStoredData functions
const checkAndUpdateEventStatuses = (): Event[] => {
  const events = getStoredData<Event>('events', []);
  const now = new Date();
  let hasUpdates = false;

  const updatedEvents = events.map(event => {
    // Skip events that are already completed or cancelled
    if (event.status === 'completed' || event.status === 'cancelled') {
      return event;
    }

    const endTime = new Date(event.ends_at);
    if (now > endTime && event.status === 'in_progress') {
      hasUpdates = true;
      return {
        ...event,
        status: 'completed' as const,
        updated_at: now.toISOString()
      };
    }

    return event;
  });

  if (hasUpdates) {
    setStoredData('events', updatedEvents);
  }

  return updatedEvents;
};

// Helper function to delay
const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock schedule generation
const generateMockSchedule = (eventId: string, participants: EventParticipant[]): ScheduleItem[] => {
  const checkedInParticipants = participants.filter(p => p.status === 'checked_in');
  const schedule: ScheduleItem[] = [];
  
  // Only generate schedule if we have at least 2 participants
  if (checkedInParticipants.length < 2) {
    return schedule;
  }

  // Get event details for timing
  const events = getStoredData<Event>('events', []);
  const event = events.find(e => e.id === eventId);
  if (!event) return schedule;

  const startTime = new Date(event.starts_at);
  const endTime = new Date(event.ends_at);
  
  // Configure speed dating parameters
  const ROUND_DURATION_MINUTES = 5;
  const BREAK_DURATION_MINUTES = 2;
  const TOTAL_DURATION = endTime.getTime() - startTime.getTime();
  const MAX_ROUNDS = Math.floor(TOTAL_DURATION / ((ROUND_DURATION_MINUTES + BREAK_DURATION_MINUTES) * 60 * 1000));

  // Generate all possible unique pairs
  const pairs: Array<[EventParticipant, EventParticipant]> = [];
  for (let i = 0; i < checkedInParticipants.length; i++) {
    for (let j = i + 1; j < checkedInParticipants.length; j++) {
      pairs.push([checkedInParticipants[i], checkedInParticipants[j]]);
    }
  }

  // Shuffle pairs randomly
  const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);

  // Generate schedule rounds
  for (let round = 0; round < Math.min(MAX_ROUNDS, shuffledPairs.length); round++) {
    const roundStartTime = new Date(startTime.getTime() + round * (ROUND_DURATION_MINUTES + BREAK_DURATION_MINUTES) * 60 * 1000);
    const roundEndTime = new Date(roundStartTime.getTime() + ROUND_DURATION_MINUTES * 60 * 1000);

    const [participant1, participant2] = shuffledPairs[round];
    
    schedule.push({
      id: uuid.v4(),
      eventId,
      participant1Id: participant1.id,
      participant2Id: participant2.id,
      startTime: roundStartTime.toISOString(),
      endTime: roundEndTime.toISOString(),
      tableNumber: (round % Math.ceil(checkedInParticipants.length / 2)) + 1,
      status: 'upcoming'
    });
  }

  return schedule;
};

// Mock matching algorithm
const generateMockMatches = (eventId: string, participants: EventParticipant[]): Match[] => {
  const checkedInParticipants = participants.filter(p => p.status === 'checked_in');
  const matches: Match[] = [];

  // Generate matches between all checked-in participants
  for (let i = 0; i < checkedInParticipants.length; i++) {
    for (let j = i + 1; j < checkedInParticipants.length; j++) {
      const participant1 = checkedInParticipants[i];
      const participant2 = checkedInParticipants[j];
      
      // Generate a random compatibility score between 50 and 100
      const compatibilityScore = Math.floor(Math.random() * 51) + 50;
      
      matches.push({
        id: uuid.v4(),
        eventId,
        participant1Id: participant1.id,
        participant2Id: participant2.id,
        compatibilityScore,
        createdAt: new Date().toISOString()
      });
    }
  }

  return matches;
};

// Initialize with some mock data
export const initializeMockData = () => {
  // Clear existing data
  localStorage.clear();

  // Create roles
  const roles = [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.ATTENDEE];
  setStoredData('roles', roles);

  // Create admin user
  const adminUser = {
    id: uuid.v4(),
    email: 'admin@example.com',
    password: 'admin123', // In a real app, this would be hashed
    first_name: 'Admin',
    last_name: 'User',
    role_id: ROLES.ADMIN.id,
    phone: '(555) 123-4567',
    age: 30,
    church: 'Example Church',
    denomination: 'Non-denominational',
  };
  
  // Create organizer user
  const organizerUser = {
    id: uuid.v4(),
    email: 'organizer@example.com',
    password: 'organizer123', // In a real app, this would be hashed
    first_name: 'Event',
    last_name: 'Organizer',
    role_id: ROLES.ORGANIZER.id,
    phone: '(555) 234-5678',
    age: 35,
    church: 'Example Church',
    denomination: 'Baptist',
  };

  // Create multiple attendee users with diverse backgrounds
  const attendeeUsers = [
    {
      id: uuid.v4(),
      email: 'sarah@example.com',
      password: 'sarah123', // In a real app, this would be hashed
      first_name: 'Sarah',
      last_name: 'Johnson',
      role_id: ROLES.ATTENDEE.id,
      phone: '(555) 345-6789',
      age: 28,
      church: 'Grace Community',
      denomination: 'Methodist',
    },
    {
      id: uuid.v4(),
      email: 'michael@example.com',
      password: 'michael123', // In a real app, this would be hashed
      first_name: 'Michael',
      last_name: 'Chen',
      role_id: ROLES.ATTENDEE.id,
      phone: '(555) 456-7890',
      age: 32,
      church: 'City Church',
      denomination: 'Non-denominational',
    },
    {
      id: uuid.v4(),
      email: 'jessica@example.com',
      password: 'jessica123', // In a real app, this would be hashed
      first_name: 'Jessica',
      last_name: 'Martinez',
      role_id: ROLES.ATTENDEE.id,
      phone: '(555) 567-8901',
      age: 26,
      church: 'Faith Chapel',
      denomination: 'Catholic',
    },
    {
      id: uuid.v4(),
      email: 'david@example.com',
      password: 'david123', // In a real app, this would be hashed
      first_name: 'David',
      last_name: 'Wilson',
      role_id: ROLES.ATTENDEE.id,
      phone: '(555) 678-9012',
      age: 31,
      church: 'Hope Fellowship',
      denomination: 'Presbyterian',
    },
    {
      id: uuid.v4(),
      email: 'emily@example.com',
      password: 'emily123', // In a real app, this would be hashed
      first_name: 'Emily',
      last_name: 'Taylor',
      role_id: ROLES.ATTENDEE.id,
      phone: '(555) 789-0123',
      age: 29,
      church: 'Riverside Church',
      denomination: 'Lutheran',
    }
  ];

  // Create mock events
  const events = [
    {
      id: uuid.v4(),
      creator_id: organizerUser.id,
      name: 'Christian Singles Mixer',
      description: 'Join us for an evening of meaningful connections and fellowship!',
      starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      ends_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
      address: '123 Main St, Example City',
      max_capacity: 20,
      status: 'published',
      price_per_person: 25,
      registration_deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: uuid.v4(),
      creator_id: organizerUser.id,
      name: 'Young Adults Dating Event',
      description: 'A special evening for young Christian professionals to meet and connect.',
      starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      address: '456 Church St, Example City',
      max_capacity: 30,
      status: 'published',
      price_per_person: 30,
      registration_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  // Create mock participants
  const mockParticipants = attendeeUsers.map(user => ({
    id: uuid.v4(),
    user_id: user.id,
    event_id: events[0].id, // All participants for the first event
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    status: 'checked_in' as const, // Explicitly type as const
    registration_date: new Date().toISOString(),
    check_in_time: new Date().toISOString(),
  }));

  // Store all the data
  setStoredData('users', [adminUser, organizerUser, ...attendeeUsers]);
  setStoredData('events', events);
  setStoredData('event_participants', mockParticipants);

  // Create a fresh admin token
  const token = btoa(JSON.stringify({ 
    userId: adminUser.id, 
    roleId: ROLES.ADMIN.id,
    roleName: ROLES.ADMIN.name 
  }));
  localStorage.setItem('token', token);

  // Log the test credentials to the console for easy access
  console.log('Test Credentials:');
  console.log('Admin:', { email: 'admin@example.com', password: 'admin123' });
  console.log('Organizer:', { email: 'organizer@example.com', password: 'organizer123' });
  console.log('Test Attendees:');
  attendeeUsers.forEach(user => {
    console.log(`${user.first_name}:`, { email: user.email, password: user.password });
  });

  // Generate initial schedule for the first event
  const schedule = generateMockSchedule(events[0].id, mockParticipants);
  setStoredData(`schedule_${events[0].id}`, schedule);

  // Generate initial matches
  const matches = generateMockMatches(events[0].id, mockParticipants);
  setStoredData('matches', matches);
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

    // In development, accept any password for testing
    console.log(`Logging in as ${user.first_name} ${user.last_name} (${user.email}) with role ID ${user.role_id}`);

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
        role_name: role.name,
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

  getRoles: async () => {
    const roles = getStoredData<Role>('roles', Object.values(ROLES));
    return roles;
  },
  
  getUsers: async () => {
    const token = localStorage.getItem('token');
    const { roleId } = validateTokenAndGetUser(token);
    
    // Only admins can get the user list
    if (roleId !== ROLES.ADMIN.id) {
      throw new Error('Unauthorized - Only admins can view all users');
    }
    
    const users = getStoredData<User>('users', []);
    
    // Add role_name to each user
    const roles = getStoredData<Role>('roles', Object.values(ROLES));
    return users.map(user => ({
      ...user,
      role_name: roles.find(r => r.id === user.role_id)?.name
    }));
  },
  
  updateUser: async (userId: string, userData: Partial<User>) => {
    const token = localStorage.getItem('token');
    const { roleId } = validateTokenAndGetUser(token);
    
    // Only admins can update users
    if (roleId !== ROLES.ADMIN.id) {
      throw new Error('Unauthorized - Only admins can update users');
    }
    
    const users = getStoredData<User>('users', []);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update the user
    users[userIndex] = { ...users[userIndex], ...userData };
    setStoredData('users', users);
    
    // Add role_name to return value
    const roles = getStoredData<Role>('roles', Object.values(ROLES));
    return {
      ...users[userIndex],
      role_name: roles.find(r => r.id === users[userIndex].role_id)?.name
    };
  },
  
  createUser: async (userData: Partial<User>) => {
    const token = localStorage.getItem('token');
    const { roleId } = validateTokenAndGetUser(token);
    
    // Only admins can create users
    if (roleId !== ROLES.ADMIN.id) {
      throw new Error('Unauthorized - Only admins can create users');
    }
    
    // Ensure required fields
    if (!userData.email || !userData.first_name || !userData.last_name || !userData.role_id) {
      throw new Error('Missing required fields');
    }
    
    const users = getStoredData<User>('users', []);
    
    // Check for duplicate email
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
    
    // Create new user
    const newUser: User = {
      id: uuid.v4(),
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role_id: userData.role_id,
      phone: userData.phone || null,
      age: userData.age || 21,
      church: userData.church || '',
      denomination: userData.denomination || null,
    };
    
    // Save to localStorage
    setStoredData('users', [...users, newUser]);
    
    // Add role_name to return value
    const roles = getStoredData<Role>('roles', Object.values(ROLES));
    return {
      ...newUser,
      role_name: roles.find(r => r.id === newUser.role_id)?.name
    };
  },
  
  deleteUser: async (userId: string) => {
    const token = localStorage.getItem('token');
    const { roleId, userId: currentUserId } = validateTokenAndGetUser(token);
    
    // Only admins can delete users
    if (roleId !== ROLES.ADMIN.id) {
      throw new Error('Unauthorized - Only admins can delete users');
    }
    
    // Prevent deleting yourself
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }
    
    const users = getStoredData<User>('users', []);
    const updatedUsers = users.filter(u => u.id !== userId);
    
    if (updatedUsers.length === users.length) {
      throw new Error('User not found');
    }
    
    setStoredData('users', updatedUsers);
    return { success: true };
  },
};

export const mockEventsApi = {
  getAll: async () => {
    return checkAndUpdateEventStatuses();
  },

  getById: async (id: string) => {
    const events = checkAndUpdateEventStatuses();
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
    const eventParticipants = getStoredData<EventParticipant>('event_participants', []);
    const participants = eventParticipants.filter(p => p.event_id === eventId);
    
    // Generate new matches
    const newMatches = generateMockMatches(eventId, participants);
    
    // Store the new matches
    const existingMatches = getStoredData<Match>('matches', []);
    setStoredData('matches', [...existingMatches, ...newMatches]);
    
    return { message: 'Matching completed successfully' };
  },

  getEventMatches: async (eventId: string) => {
    const matches = getStoredData<Match>('matches', []);
    return matches.filter(match => match.eventId === eventId);
  },

  getCheckedInParticipants: async (eventId: string): Promise<EventParticipant[]> => {
    await delay(500); // Simulate network delay
    const participants = getStoredData<EventParticipant>('event_participants', []);
    return participants.filter(p => p.event_id === eventId && p.status === 'checked_in');
  },

  getEventParticipants: async (eventId: string): Promise<EventParticipant[]> => {
    const participants = getStoredData<EventParticipant>('event_participants', []);
    return participants.filter(p => p.event_id === eventId);
  },

  checkInParticipant: async (eventId: string, participantId: string): Promise<{ success: boolean }> => {
    await delay(500);
    const participants = getStoredData<EventParticipant>('event_participants', []);
    const updatedParticipants = participants.map(p => {
      if (p.id === participantId && p.event_id === eventId) {
        return {
          ...p,
          status: 'checked_in',
          check_in_time: new Date().toISOString(),
        };
      }
      return p;
    });
    setStoredData('event_participants', updatedParticipants);
    return { success: true };
  },

  cancelCheckIn: async (eventId: string, participantId: string): Promise<{ success: boolean }> => {
    await delay(500);
    const participants = getStoredData<EventParticipant>('event_participants', []);
    const updatedParticipants = participants.map(p => {
      if (p.id === participantId && p.event_id === eventId) {
        const { check_in_time, ...rest } = p;
        return {
          ...rest,
          status: 'registered',
        };
      }
      return p;
    });
    setStoredData('event_participants', updatedParticipants);
    return { success: true };
  },

  registerForEvent: async (eventId: string): Promise<EventParticipant> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);

    const events = getStoredData<Event>('events', []);
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    if (event.status !== 'published') {
      throw new Error('This event is not open for registration');
    }

    const participants = getStoredData<EventParticipant>('event_participants', []);
    const existingRegistration = participants.find(
      p => p.event_id === eventId && p.user_id === userId && p.status !== 'cancelled'
    );

    if (existingRegistration) {
      throw new Error('You are already registered for this event');
    }

    const currentParticipantCount = participants.filter(
      p => p.event_id === eventId && p.status !== 'cancelled'
    ).length;

    if (currentParticipantCount >= event.max_capacity) {
      throw new Error('This event is already at full capacity');
    }

    // Get user details from stored users
    const users = getStoredData<User>('users', []);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const newParticipant: EventParticipant = {
      id: uuid.v4(),
      user_id: userId,
      event_id: eventId,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      status: 'registered',
      registration_date: new Date().toISOString(),
    };

    setStoredData('event_participants', [...participants, newParticipant]);
    return newParticipant;
  },

  cancelRegistration: async (eventId: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);

    const participants = getStoredData<EventParticipant>('event_participants', []);
    const registration = participants.find(
      p => p.event_id === eventId && p.user_id === userId && p.status !== 'cancelled'
    );

    if (!registration) {
      throw new Error('You are not registered for this event');
    }

    const updatedParticipants = participants.map(p => {
      if (p.id === registration.id) {
        return {
          ...p,
          status: 'cancelled',
        };
      }
      return p;
    });

    setStoredData('event_participants', updatedParticipants);
    return { message: 'Registration cancelled successfully' };
  },

  isRegisteredForEvent: async (eventId: string): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);

    const participants = getStoredData<EventParticipant>('event_participants', []);
    const registration = participants.find(
      p => p.event_id === eventId && p.user_id === userId && p.status !== 'cancelled'
    );

    return !!registration;
  },

  startEvent: async (eventId: string) => {
    const events = getStoredData<Event>('events', []);
    const eventParticipants = getStoredData<EventParticipant>('event_participants', []);
    
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) throw new Error('Event not found');
    
    const participants = eventParticipants.filter(p => p.event_id === eventId);
    const checkedInCount = participants.filter(p => p.status === 'checked_in').length;
    
    // Validate minimum checked-in count
    const MINIMUM_REQUIRED_PARTICIPANTS = 2;
    if (checkedInCount < MINIMUM_REQUIRED_PARTICIPANTS) {
      throw new Error(`At least ${MINIMUM_REQUIRED_PARTICIPANTS} checked-in participants are required to start the event. Currently have ${checkedInCount}.`);
    }

    // Update event status
    const updatedEvents = [...events];
    updatedEvents[eventIndex] = {
      ...events[eventIndex],
      status: 'in_progress',
      updated_at: new Date().toISOString()
    };
    setStoredData('events', updatedEvents);

    // Generate and store schedule with event-specific key
    const schedule = generateMockSchedule(eventId, participants);
    setStoredData(`schedule_${eventId}`, schedule);

    // Generate and store matches
    const matches = generateMockMatches(eventId, participants);
    setStoredData('matches', getStoredData<Match>('matches', []).concat(matches));

    return { 
      message: 'Event started successfully',
      eventStatus: 'in_progress',
      scheduledRounds: schedule.length,
      participants: checkedInCount
    };
  },

  getEventSchedule: async (eventId: string) => {
    // Get schedule from event-specific key
    return getStoredData<ScheduleItem>(`schedule_${eventId}`, []);
  },

  getEventNotes: async (eventId: string): Promise<Note[]> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);
    const notes = getStoredData<Note>('notes', []);
    return notes.filter(note => note.eventId === eventId && note.userId === userId);
  },

  saveNote: async (eventId: string, partnerId: string, content: string): Promise<Note> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);
    const notes = getStoredData<Note>('notes', []);
    
    const now = new Date().toISOString();
    const newNote: Note = {
      id: uuid.v4(),
      eventId,
      userId,
      partnerId,
      content,
      createdAt: now,
      updatedAt: now
    };
    
    setStoredData('notes', [...notes, newNote]);
    return newNote;
  },

  deleteNote: async (noteId: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const { userId } = validateTokenAndGetUser(token);
    const notes = getStoredData<Note>('notes', []);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    if (note.userId !== userId) {
      throw new Error('You can only delete your own notes');
    }

    setStoredData('notes', notes.filter(n => n.id !== noteId));
    return { message: 'Note deleted successfully' };
  },

  getEvent: async (eventId: string) => {
    const events = checkAndUpdateEventStatuses();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    return event;
  },

  completeEvent: async (eventId: string) => {
    const events = getStoredData<Event>('events', []);
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) throw new Error('Event not found');
    
    // Update event status
    const updatedEvents = [...events];
    updatedEvents[eventIndex] = {
      ...events[eventIndex],
      status: 'completed',
      updated_at: new Date().toISOString()
    };
    
    setStoredData('events', updatedEvents);
    return { success: true };
  },

  saveFinalMatches: async (eventId: string, matches: Match[]): Promise<{ success: boolean; matches: Match[] }> => {
    const storedData = localStorage.getItem('final_matches');
    const storedMatches = storedData ? JSON.parse(storedData) as Match[] : [];
    
    // Remove any existing matches for this event
    const filteredMatches = storedMatches.filter((match) => match.eventId !== eventId);
    
    // Add the new matches with proper typing
    const newMatches: Match[] = matches.map(match => ({
      id: match.id,
      eventId: match.eventId,
      participant1Id: match.participant1Id,
      participant2Id: match.participant2Id,
      compatibilityScore: match.compatibilityScore,
      createdAt: new Date().toISOString()
    }));
    
    const updatedMatches = [...filteredMatches, ...newMatches];
    localStorage.setItem('final_matches', JSON.stringify(updatedMatches));
    return { success: true, matches: updatedMatches };
  },

  scheduleMatchingNotification: async (eventId: string, notificationTime: string): Promise<{ success: boolean; scheduledTime: string }> => {
    const storedData = localStorage.getItem('matching_notifications');
    const notifications = storedData ? JSON.parse(storedData) as MatchingNotification[] : [];
    
    // Remove any existing notification for this event
    const filteredNotifications = notifications.filter((notification) => notification.eventId !== eventId);
    
    // Add the new notification
    const newNotification: MatchingNotification = { eventId, notificationTime };
    const updatedNotifications = [...filteredNotifications, newNotification];
    
    localStorage.setItem('matching_notifications', JSON.stringify(updatedNotifications));
    return { success: true, scheduledTime: notificationTime };
  },
}; 