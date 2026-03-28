export interface StatsPeriode {
  periode: string;
  total_pains_pris: number;
  total_pains_ecoules: number;
  total_pains_retournes: number;
  total_montant_du: number;
  total_encaisse: number;
  taux_ecoulement: number;
  boulangerie_id?: number;
  nb_tournees: number;
}

export interface StatsClient {
  client_id: number;
  client_nom: string;
  total_livraisons: number;
  total_pains_livres: number;
  montant_total_du: number;
  montant_encaisse: number;
  solde: number;
  statut: string;
}

export type StatsPeriodeType = 'journalier' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
