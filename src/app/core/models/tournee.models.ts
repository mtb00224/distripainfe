import { Boulangerie } from './boulangerie.models';
import { Client } from './client.models';

export type TourneePeriode = 'matin' | 'soir';
export type TourneeStatut = 'en_cours' | 'terminee' | 'annulee';

export interface Tournee {
  id: number;
  livreur_id: number;
  boulangerie_id: number;
  boulangerie?: Boulangerie;
  date: string;
  periode: TourneePeriode;
  nb_pains_pris: number;
  nb_pains_ecoules: number;
  nb_pains_retournes: number;
  statut: TourneeStatut;
  notes?: string;
  created_at: string;
}

export interface TourneeCreate {
  boulangerie_id: number;
  date: string;
  periode: TourneePeriode;
  nb_pains_pris: number;
  nb_pains_ecoules?: number;
  notes?: string;
}

export interface LivraisonClient {
  id: number;
  tournee_id: number;
  client_id: number;
  client?: Client;
  livreur_id: number;
  nb_pains_livres: number;
  nb_pains_retournes: number;
  prix_unitaire: number;
  montant_du: number;
  is_paid: boolean;
  is_termine: boolean;
  created_at: string;
}

export interface LivraisonCreate {
  client_id: number;
  nb_pains_livres: number;
  nb_pains_retournes?: number;
}

export interface RetourLigne {
  portion_pain_id: number;
  portion_nom: string;
  prix_fcfa: number;
  quantite: number;
}

export interface RetourBoulangerieResponse {
  nb_retournes: number;
  valeur_retour: number;
  lignes: RetourLigne[];
  tournee: Tournee;
}
