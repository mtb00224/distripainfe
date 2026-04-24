export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  role: 'livreur' | 'admin_boulangerie';
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}

export type UserRole = 'livreur' | 'acolyte_livreur' | 'admin' | 'admin_boulangerie' | 'staff_boulangerie';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  must_change_password?: boolean;
  admin_boulangerie_id?: number | null;
  boulangerie_active_id?: number | null;
}

export interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  permissions?: string[];
  livreur_id?: number;
  livreur_principal_id?: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

