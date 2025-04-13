export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  phone: string | null;
  age: number;
  church: string;
  denomination: string | null;
}

export interface Role {
  id: number;
  name: string;
  permission_level: number;
}

export interface RegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age: number;
  church: string;
  denomination?: string;
  role: 'attendee' | 'organizer' | 'admin';
} 