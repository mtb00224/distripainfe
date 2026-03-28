export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  email: string;
  password: string;
  telephone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_type: 'livreur' | 'acolyte';
  must_change_password?: boolean;
}

export interface CurrentUser {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  user_type: 'livreur' | 'acolyte';
  permissions?: string[];
  livreur_principal_id?: number;
  is_active: boolean;
  pays?: { id: number; nom: string; code: string; devise_nom: string; devise_code: string } | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
