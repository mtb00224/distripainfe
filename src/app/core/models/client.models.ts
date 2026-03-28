import { Zone } from './zone.models';
import { Pays } from './pays.models';

export interface Client {
  id: number;
  livreur_id: number;
  zone_id?: number;
  zone?: Zone;
  pays_id?: number;
  pays?: Pays;
  nom: string;
  telephone?: string;
  prix_vente_pain?: number;
  solde_actuel: number;
  is_active: boolean;
  created_at: string;
}

export interface ClientCreate {
  nom: string;
  zone_id?: number;
  pays_id?: number;
  telephone?: string;
  prix_vente_pain?: number;
}

export type ClientUpdate = Partial<ClientCreate> & { is_active?: boolean };

export interface ClientSolde {
  client_id: number;
  nom: string;
  solde_actuel: number;
  statut: 'solde' | 'en_attente' | 'partiel' | 'impaye';
}
