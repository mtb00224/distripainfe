export interface Boulangerie {
  id: number;
  livreur_id: number;
  nom: string;
  contact?: string;
  prix_achat_pain?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BoulangerieCreate {
  nom: string;
  contact?: string;
  prix_achat_pain?: number;
}

export type BoulangerieUpdate = Partial<BoulangerieCreate> & { is_active?: boolean };
