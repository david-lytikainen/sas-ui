import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// --- Debug Log --- 
console.log('REACT_APP_API_URL value:', process.env.REACT_APP_API_URL);
// -----------------

// Define base API URL and a potential separate WebSocket URL
// Assumption: REST API is at /api, WebSocket is at the root.
const BASE_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api'; // Keep for REST calls if needed
// Extract base URL (scheme + hostname + port) for WebSocket connection
const WS_URL = (() => {
  try {
    const url = new URL(BASE_API_URL);
    // Construct URL without the path (like /api)
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    console.error("Failed to parse API URL for WebSocket connection, defaulting to http://localhost:5001", e);
    return 'http://localhost:5001'; // Fallback
  }
})();

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

var connectionAttempts = 0;
var MAX_RETRIES = 5;
// Initialize socket connection
export const initSocket = (): Socket => {
  if (socket && socket.connected) {
    console.log('Reusing existing socket connection', socket.id);
    return socket;
  }

  // Disconnect if there's an existing socket
  if (socket) {
    console.log('Disconnecting existing socket before reconnecting');
    socket.disconnect();
    socket = null;
  }

  const token = getToken();
  if (!token) {
    console.error('No authentication token found for socket connection');
    throw new Error('Authentication required to connect to socket');
  }

  try {
    console.log(`Connecting to socket at ${WS_URL} (path: /socket.io/)`);
    
    // Create socket instance with proper configuration based on GitHub solution
    socket = io(WS_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      // Temporarily prioritize websocket
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      path: '/socket.io/',
      withCredentials: true
    });

    // Debug socket connection
    socket.on('connect', () => {
      console.log('Socket connected successfully', socket?.id || 'unknown');
      connectionAttempts = 0; // Reset retry counter on successful connection
    });

    // Create a new function to handle connection errors
    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error.message);
      connectionAttempts++;
      
      if (connectionAttempts < MAX_RETRIES) {
        console.log(`Will retry connection attempt ${connectionAttempts}/${MAX_RETRIES} in 3 seconds...`);
        
        // Try with different auth method on retry
        setTimeout(() => {
          if (socket) {
            socket.disconnect();
            socket = null;
          }
          
          try {
            console.log(`Retrying socket connection to ${WS_URL} with alternative auth...`);
            socket = io(WS_URL, {
              extraHeaders: {
                Authorization: `Bearer ${token}`
              },
              reconnectionAttempts: 3,
              reconnectionDelay: 3000,
              timeout: 30000,
              // Temporarily prioritize websocket on retry too
              transports: ['websocket', 'polling'],
              query: { token }, // Use query parameter as alternative
              path: '/socket.io/',
              withCredentials: true
            });
            
            socket.on('connect', () => {
              console.log('Socket connected successfully on retry', socket?.id);
              connectionAttempts = 0;
            });
            
            socket.on('connect_error', handleConnectError);
            socket.on('error', (err) => console.error('Socket error on retry:', err));
            socket.on('disconnect', (reason) => {
              console.log(`Socket disconnected on retry: ${reason}`);
            });
          } catch (retryError) {
            console.error('Failed on retry socket connection:', retryError);
          }
        }, 3000);
      } else {
        console.error(`Maximum connection attempts (${MAX_RETRIES}) reached. Using fallback methods.`);
      }
    };

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      // Attempt to reconnect if the disconnection was not initiated by the client
      if (reason === 'io server disconnect' && socket) {
        console.log('Server initiated disconnect, manually reconnecting...');
        socket.connect();
      }
    });
    
    // Attach the error handler
    socket.on('connect_error', handleConnectError);
    
    // Debug the socket state 
    debugSocketState();

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