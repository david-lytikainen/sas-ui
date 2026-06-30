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
  church_id?: number | null;
  denomination_id?: number | null;
  current_church?: string;
  created_event_count?: number;
  stripe_customer_id?: string | null;
  stripe_connected_account_id?: string | null;
  stripe_connect_onboarding_complete?: boolean | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenValidationResponse {
  user?: User;
} 
