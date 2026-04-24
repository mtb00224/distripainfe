// =====================
// Boulangeries
// =====================
export interface BoulangerieResponse {
  id: number;
  nom: string;
  contact?: string;
  address?: string;
  prix_vente_pain?: number;
  is_active: boolean;
  created_at: string;
}

export interface BoulangerieCreate {
  nom: string;
  contact?: string;
  address?: string;
  prix_vente_pain?: number;
}

export interface BoulangerieUpdate {
  nom?: string;
  contact?: string;
  address?: string;
  prix_vente_pain?: number;
  is_active?: boolean;
}

// =====================
// Staff
// =====================
export type StaffRole = 'gerant' | 'comptable' | 'vendeur';

export interface StaffResponse {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  role_interne: StaffRole;
  boulangerie_id: number;
  is_active: boolean;
}

export interface StaffCreate {
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  phone_number?: string;
  role_interne: StaffRole;
}

export interface StaffUpdate {
  role_interne?: StaffRole;
  is_active?: boolean;
}

// =====================
// Livreurs liés
// =====================
export interface LivreurLinkResponse {
  livreur_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  prix_achat_pain?: number;
  contact_local?: string;
  is_active: boolean;
}

export interface LivreurLinkRequest {
  identifier: string;
  prix_achat_pain?: number;
  contact_local?: string;
}

export interface LivreurContratUpdate {
  prix_achat_pain?: number;
  contact_local?: string;
  is_active?: boolean;
}

// =====================
// Profil AdminBoulangerie
// =====================
export interface AdminBoulangerieProfile {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  boulangeries: BoulangerieResponse[];
}
