export interface Pays {
  id: number;
  nom: string;
  code: string;
  devise_nom: string;
  devise_code: string;
  is_active: boolean;
  created_at: string;
}

export interface PaysCreate {
  nom: string;
  code: string;
  devise_nom: string;
  devise_code: string;
}

export type PaysUpdate = Partial<PaysCreate> & { is_active?: boolean };
