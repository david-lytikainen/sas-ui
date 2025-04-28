import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Initialize socket connection
export const initSocket = (): Socket => {
  if (socket && socket.connected) return socket;

  // Disconnect if there's an existing socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = getToken();
  if (!token) {
    console.error('No authentication token found for socket connection');
    throw new Error('Authentication required to connect to socket');
  }

  try {
    console.log(`Connecting to socket at ${API_URL}`);
    
    // Create socket instance with proper configuration
    socket = io(API_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true
    });

    // Debug socket connection
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      // Attempt to reconnect if the disconnection was not initiated by the client
      if (reason === 'io server disconnect' && socket) {
        socket.connect();
      }
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket connection:', error);
    throw error;
  }
};

// Get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Debug function to check socket state
export const debugSocketState = (): void => {
  if (!socket) {
    console.log('Socket state: Not initialized');
    return;
  }
  
  console.log('Socket state:', {
    id: socket.id,
    connected: socket.connected,
    disconnected: socket.disconnected,
    active: socket.active
  });
};

// Join event room
export const joinEventRoom = (eventId: number): void => {
  if (!socket) return;
  socket.emit('join', { event_id: eventId });
};

// Leave event room
export const leaveEventRoom = (eventId: number): void => {
  if (!socket) return;
  socket.emit('leave', { event_id: eventId });
};

// Timer control functions
export const startRound = (eventId: number, roundNumber?: number): void => {
  if (!socket) return;
  socket.emit('timer_start', { event_id: eventId, round_number: roundNumber });
};

export const pauseRound = (eventId: number, timeRemaining: number): void => {
  if (!socket) return;
  socket.emit('timer_pause', { event_id: eventId, time_remaining: timeRemaining });
};

export const resumeRound = (eventId: number): void => {
  if (!socket) return;
  socket.emit('timer_resume', { event_id: eventId });
};

export const nextRound = (eventId: number, maxRounds?: number): void => {
  if (!socket) return;
  socket.emit('timer_next', { event_id: eventId, max_rounds: maxRounds });
};

export const updateRoundDuration = (eventId: number, roundDuration: number): void => {
  if (!socket) return;
  socket.emit('timer_update_duration', { event_id: eventId, round_duration: roundDuration });
};

// Function to subscribe to timer updates
export const subscribeToTimerUpdates = (callback: (data: any) => void): (() => void) => {
  if (!socket) {
    // Return a no-op function if socket is null
    return () => {};
  }
  
  socket.on('timer_update', callback);
  
  // Return unsubscribe function
  return () => {
    if (socket) {
      socket.off('timer_update', callback);
    }
  };
};

const socketService = {
  initSocket,
  disconnectSocket,
  getSocket,
  debugSocketState,
  joinEventRoom,
  leaveEventRoom,
  startRound,
  pauseRound,
  resumeRound,
  nextRound,
  updateRoundDuration,
  subscribeToTimerUpdates
};

export default socketService; 