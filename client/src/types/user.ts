export interface User {
  id: string | number;
  email: string;
  role_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  age?: number;
  church_id?: number | null;
  denomination_id?: number | null;
  created_at?: string;
  updated_at?: string;
  church?: string;
  denomination?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenValidationResponse {
  user?: User;
} 