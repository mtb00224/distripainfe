import { Client } from './client.models';

export type EncaissementType = 'complet' | 'partiel' | 'avance' | 'dette';

export interface Encaissement {
  id: number;
  livreur_id: number;
  client_id: number;
  client?: Client;
  montant: number;
  date_encaissement: string;
  livraisons_soldees: number[];
  type: EncaissementType;
  notes?: string;
  created_at: string;
}

export interface EncaissementCreate {
  client_id: number;
  montant: number;
  livraisons_soldees: number[];
  type: EncaissementType;
  notes?: string;
  date_encaissement?: string;
}

export interface PendingLivraison {
  client_id: number;
  client_nom: string;
  livraison_id: number;
  tournee_id: number;
  tournee_date: string;
  tournee_periode: string;
  montant_du: number;
  nb_pains_livres: number;
  nb_pains_retournes: number;
}

export interface PendingTournee {
  tournee_id: number;
  tournee_date: string;
  tournee_periode: string;
  livraison_ids: number[];
  total_montant_du: number;
  montant_deja_paye: number;
  montant_restant: number;
  dette_id: number | null;
  nb_pains_nets: number;
}

export interface ClientWithPending {
  client_id: number;
  client_nom: string;
  zone_nom?: string | null;
  telephone?: string | null;
  solde_actuel: number;
  nb_tournees_pending: number;
  montant_total_pending: number;
}
