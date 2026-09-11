export interface User {
  id: string;
  role_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  age: number;
  birthday: string;
  created_event_count?: number;
  has_started_stripe_setup?: boolean;
  stripe_connect_onboarding_complete?: boolean | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenValidationResponse {
  user?: User;
} 
