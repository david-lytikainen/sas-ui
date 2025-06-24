import { Event, EventStatus } from '../../types/event';

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    return 'Invalid date';
  }
};

export const isRegistrationClosed = (event: Event) => {
  if (event.status === 'Cancelled' || event.status === 'Completed') {
    return true;
  }
  
  if (typeof event.registered_attendee_count === 'number' && event.max_capacity) {
    return event.registered_attendee_count >= parseInt(event.max_capacity);
  }
  
  return false;
};

export const getStatusColor = (status: EventStatus): 'success' | 'primary' | 'info' | 'error' | 'default' => {
  switch (status) {
    case 'Registration Open':
      return 'success';
    case 'In Progress':
      return 'primary';
    case 'Completed':
      return 'info';
    case 'Cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const sortEvents = (events: Event[]) => {
  return [...events].sort((a, b) => {
    const statusOrder: Record<EventStatus, number> = {
      'In Progress': 1,
      'Registration Open': 2,
      'Completed': 3,
      'Cancelled': 4
    };
    
    const statusCompare = statusOrder[a.status] - statusOrder[b.status];
    if (statusCompare !== 0) return statusCompare;
    
    if (a.starts_at < b.starts_at) return 1;
    if (a.starts_at > b.starts_at) return -1;
    
    return a.id - b.id;
  });
};

export const canManageEvent = (event: Event, isAdmin: () => boolean, isOrganizer: () => boolean, userId?: string) => {
  return isAdmin() || (isOrganizer() && event.creator_id === Number(userId));
};

export const getMatchMessage = (isMatch: boolean, userGender?: string) => {
  if (isMatch) {
    return 'Match! 🎉';
  }
  
  const messages = {
    Male: [
      'Not a match, head up king 👑',
      'Not a match, stay royal 👑',
      'Not a match, you shining tho 👑',
      'Not a match, no problem 👑',
      'Not a match, still that guy 👑',
      'Not a match, you still the prize 👑',
      'Not a match, but your vibe is elite 👑'
    ],
    Female: [
      'Not a match, head up queen 👸',
      'Not a match, stay royal 👸',
      'Not a match, you shining tho 👸',
      'Not a match, no problem 👸',
      'Not a match, stay glowing 👸',
      'Not a match, royalty never settles 👸',
      'Not a match, but your worth is not up for debate 👸'
    ]
  };
  
  const genderMessages = messages[userGender as 'Male' | 'Female'];
  return genderMessages ? genderMessages[Math.floor(Math.random() * genderMessages.length)] : 'Not a match';
};

export const handleCopyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email);
  } catch (err) {
    console.error('Failed to copy email:', err);
  }
}; 