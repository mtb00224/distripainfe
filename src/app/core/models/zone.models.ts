export interface Zone {
  id: number;
  livreur_id: number;
  nom: string;
  description?: string;
  created_at: string;
}

export interface ZoneCreate {
  nom: string;
  description?: string;
}

export type ZoneUpdate = Partial<ZoneCreate>;
