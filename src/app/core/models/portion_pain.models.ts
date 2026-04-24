export interface PortionPain {
  id: number;
  livreur_id: number;
  nom: string;
  prix_fcfa: number;
  valeur_unitaire: number;
  is_active: boolean;
  created_at: string;
}

export interface PortionPainCreate {
  nom: string;
  prix_fcfa: number;
  valeur_unitaire?: number;
}

export interface PortionPainUpdate {
  nom?: string;
  prix_fcfa?: number;
  valeur_unitaire?: number;
  is_active?: boolean;
}
