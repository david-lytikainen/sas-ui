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
  faith_importance: number | null;
  traditional_roles_importance: number | null;
  boundaries_importance: number | null;
  looks_importance: number | null;
  wants_kids: number | null;
  age_gap: number | null;
}

export type ProfilePreferences = Pick<User, 'faith_importance' | 'traditional_roles_importance' | 'boundaries_importance' | 'looks_importance' | 'wants_kids' | 'age_gap'>;

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenValidationResponse {
  user?: User;
} 
