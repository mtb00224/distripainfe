export interface FormulaAbonnement {
  id: number;
  pays_id?: number | null;
  pays?: { id: number; nom: string; code: string; devise_nom: string; devise_code: string } | null;
  nom: string;
  duree_mois: number;
  prix: number;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FormulaAbonnementCreate {
  pays_id?: number | null;
  nom: string;
  duree_mois: number;
  prix: number;
  description?: string;
}

export type FormulaAbonnementUpdate = Partial<FormulaAbonnementCreate> & { is_active?: boolean };

export interface PaiementAbonnement {
  id: number;
  abonnement_id: number;
  livreur_id: number;
  livreur_nom: string;
  montant: number;
  moyen: string;
  reference?: string | null;
  statut: 'en_attente' | 'valide' | 'rejete';
  notes_admin?: string | null;
  date_paiement: string;
  date_validation?: string | null;
  created_at: string;
}

export interface Abonnement {
  id: number;
  livreur_id: number;
  livreur_nom: string;
  formule_id: number;
  formule: FormulaAbonnement;
  date_debut: string;
  date_fin: string;
  statut: 'en_attente' | 'actif' | 'expire' | 'suspendu';
  created_at: string;
  paiements: PaiementAbonnement[];
}

export interface AbonnementCreate {
  formule_id: number;
  date_debut: string;
}

export interface PaiementAbonnementCreate {
  montant: number;
  moyen: string;
  reference?: string;
}

export interface MoyenPaiement {
  id: number;
  pays_id?: number | null;
  pays?: { id: number; nom: string; code: string; devise_nom: string; devise_code: string } | null;
  nom: string;
  numero: string;
  instructions?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MoyenPaiementCreate {
  pays_id?: number | null;
  nom: string;
  numero: string;
  instructions?: string;
}

export type MoyenPaiementUpdate = Partial<MoyenPaiementCreate> & { is_active?: boolean };
