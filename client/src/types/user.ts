export interface User {
  id: string | number;
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
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenValidationResponse {
  user?: User;
} 