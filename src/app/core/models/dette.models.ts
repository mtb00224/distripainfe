export interface ReglementDette {
  id: number;
  dette_id: number;
  livreur_id: number;
  montant: number;
  date_reglement: string;
  notes: string | null;
  created_at: string;
}

export interface Dette {
  id: number;
  livreur_id: number;
  client_id: number;
  client_nom: string;
  zone_nom?: string | null;
  encaissement_id: number | null;
  livraison_ids: number[];
  montant_initial: number;
  montant_restant: number;
  statut: 'en_cours' | 'soldee_partiellement' | 'soldee_totalement';
  notes: string | null;
  created_at: string;
  reglements: ReglementDette[];
}

export interface DetteCreate {
  client_id: number;
  montant_initial: number;
  livraison_ids?: number[];
  notes?: string;
}

export interface ReglementCreate {
  montant: number;
  notes?: string;
}
