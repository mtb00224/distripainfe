export type PeriodeJournee = 'matin' | 'soir';

// =====================
// Vente ambulatoire
// =====================

export interface ProduitAmbulateur {
  id: number;
  boulangerie_id: number;
  nom: string;
  description?: string;
  unite?: string;
  prix_unitaire: number;
  is_active: boolean;
}

export interface ProduitAmbulateurCreate {
  nom: string;
  description?: string;
  unite?: string;
  prix_unitaire: number;
}

export interface ProduitAmbulateurUpdate {
  nom?: string;
  description?: string;
  unite?: string;
  prix_unitaire?: number;
  is_active?: boolean;
}

// =====================
// Dettes boulangerie
// =====================

export type DetteBoulangerieType = 'livreur_doit' | 'boulangerie_doit';
export type DetteBoulangerieStatut = 'en_attente' | 'partiellement_regle' | 'regle' | 'annule';

export interface ReglementDette {
  id: number;
  montant: number;
  notes?: string;
  created_at: string;
}

export interface DetteBoulangerie {
  id: number;
  boulangerie_id: number;
  livreur_interne_id: number;
  livreur_prenom: string;
  livreur_nom: string;
  type: DetteBoulangerieType;
  motif: string;
  montant_initial: number;
  montant_restant: number;
  statut: DetteBoulangerieStatut;
  created_at: string;
  reglements: ReglementDette[];
}

export interface DetteBoulangerieCreate {
  livreur_interne_id: number;
  type: DetteBoulangerieType;
  motif: string;
  montant: number;
}

export interface DetteBoulangerieUpdate {
  motif?: string;
  statut?: DetteBoulangerieStatut;
}

export interface ReglementDetteCreate {
  montant: number;
  notes?: string;
}
export type StatutSession = 'ouverte' | 'cloturee';
export type ModeReglement = 'cash' | 'compte_interne' | 'virement' | 'credit';
export type StatutDistribution = 'en_attente' | 'solde' | 'annule';

export interface LivreurInternePortionPain {
  id: number;
  livreur_interne_id: number;
  nom: string;
  prix_achat: number;
  equivalent_pains: number;
  is_active: boolean;
}

export interface LivreurInternePortionCreate {
  nom: string;
  prix_achat: number;
  equivalent_pains: number;
}

export interface LivreurInternePortionUpdate {
  nom?: string;
  prix_achat?: number;
  equivalent_pains?: number;
  is_active?: boolean;
}

export interface ClientPortionPain {
  id: number;
  client_id: number;
  livreur_id: number;
  nom: string;
  prix_fcfa: number;
  valeur_unitaire: number;
  is_active: boolean;
}

export interface ClientPortionCreate {
  nom: string;
  prix_fcfa: number;
  valeur_unitaire?: number;
}

export interface LivreurInterneCreate {
  prenom: string;
  nom: string;
  telephone?: string;
  prix_achat_pain?: number;
  boulangerie_ids: number[];
}

export interface PortionPainBoulangerie {
  id: number;
  nom: string;
  equivalent_pains: number;
  ordre: number;
}

export interface PortionPainBoulangerieCreate {
  nom: string;
  equivalent_pains: number;
  ordre?: number;
}

export interface PortionPainBoulangerieUpdate {
  nom?: string;
  equivalent_pains?: number;
  ordre?: number;
}

export interface LivreurInterneUpdate {
  prenom?: string;
  nom?: string;
  telephone?: string;
  prix_achat_pain?: number;
  is_active?: boolean;
}

export interface LivreurInterne {
  id: number;
  boulangerie_id: number;
  prenom: string;
  nom: string;
  telephone?: string;
  prix_achat_pain?: number;
  user_id?: number;
  is_active: boolean;
  created_at: string;
  solde_compte?: number;
}

export interface CompteInterne {
  id: number;
  livreur_interne_id: number;
  solde_actuel: number;
  updated_at: string;
}

export interface RetraitCreate {
  montant: number;
  notes?: string;
}

export interface DistributionCreate {
  livreur_interne_id: number;
  nb_pains_donnes: number;
  prix_par_pain?: number;
}

export interface RetourLigneBoulangerie {
  portion_id: number;
  quantite: number;
}

export interface DistributionUpdate {
  nb_pains_retournes?: number;
  montant_encaisse?: number;
  mode_reglement?: ModeReglement;
  statut?: StatutDistribution;
  notes?: string;
  lignes_retour?: RetourLigneBoulangerie[];
}

export interface Distribution {
  id: number;
  session_id: number;
  livreur_interne_id: number;
  nb_pains_donnes: number;
  prix_par_pain: number;
  nb_pains_retournes: number;
  montant_encaisse: number;
  mode_reglement: ModeReglement;
  statut: StatutDistribution;
  notes?: string;
  created_at: string;
  updated_at: string;
  nb_pains_vendus: number;
  montant_theorique: number;
  ecart: number;
  livreur_prenom?: string;
  livreur_nom?: string;
}

export interface SessionProductionCreate {
  date: string;
  periode: PeriodeJournee;
  nb_pains_produits: number;
  nb_pains_ambulatoire?: number;
  notes?: string;
}

export interface SessionProductionUpdate {
  nb_pains_produits?: number;
  nb_pains_ambulatoire?: number;
  notes?: string;
}

export interface SessionProduction {
  id: number;
  boulangerie_id: number;
  date: string;
  periode: PeriodeJournee;
  nb_pains_produits: number;
  nb_pains_ambulatoire: number;
  montant_ambulatoire: number;
  statut: StatutSession;
  notes?: string;
  created_at: string;
  nb_pains_distribues: number;
  nb_pains_retournes_total: number;
  nb_pains_vendus_total: number;
  montant_encaisse_total: number;
  nb_pains_non_distribues: number;
  distributions: Distribution[];
}

export interface CategorieDepense {
  id: number;
  nom: string;
  description?: string;
}

export interface DepenseCreate {
  categorie_id: number;
  motif: string;
  quantite?: number;
  prix_unitaire: number;
  date_enregistrement?: string;
}

export interface Depense {
  id: number;
  boulangerie_id: number;
  categorie_id: number;
  categorie_nom: string;
  motif: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  date_enregistrement: string;
  created_by_id: number;
}

export interface StatsBoulangerie {
  boulangerie_id?: number | null;
  boulangerie_nom?: string | null;
  date_debut?: string;
  date_fin?: string;
  nb_sessions_total: number;
  nb_sessions_cloturees: number;
  nb_pains_produits: number;
  nb_pains_ambulatoire: number;
  nb_pains_distribues: number;
  nb_pains_vendus: number;
  montant_ambulatoire: number;
  montant_encaisse: number;
  total_depenses: number;
  benefice_net: number;
}

export interface GlobalStatsBoulangerie {
  date_debut?: string;
  date_fin?: string;
  boulangeries: StatsBoulangerie[];
  total: StatsBoulangerie;
}

export interface FournisseurCreate {
  nom: string;
  contact?: string;
  address?: string;
  prix_achat_pain?: number;
  contact_local?: string;
}

export interface FournisseurLinkRequest {
  boulangerie_id: number;
  prix_achat_pain?: number;
  contact_local?: string;
}

export interface FournisseurContratUpdate {
  prix_achat_pain?: number;
  contact_local?: string;
  is_active?: boolean;
}

export interface Fournisseur {
  id: number;
  nom: string;
  contact?: string;
  address?: string;
  is_active_boulangerie: boolean;
  prix_achat_pain?: number;
  contact_local?: string;
  lien_actif: boolean;
  is_managed: boolean;
}
