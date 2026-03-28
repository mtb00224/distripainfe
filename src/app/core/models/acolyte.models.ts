export interface Acolyte {
  id: number;
  livreur_principal_id: number;
  nom: string;
  email: string;
  permissions: string[];
  is_default_password: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AcolyteCreate {
  nom: string;
  email: string;
  permissions: string[];
}

export interface AcolyteUpdate {
  nom?: string;
  email?: string;
  permissions?: string[];
  is_active?: boolean;
}

export const AVAILABLE_PERMISSIONS = [
  // Clients
  { key: 'read_clients',       label: 'Voir les clients' },
  { key: 'write_clients',      label: 'Ajouter / modifier des clients' },
  // Boulangeries
  { key: 'read_boulangeries',  label: 'Voir les boulangeries' },
  { key: 'write_boulangeries', label: 'Ajouter / modifier des boulangeries' },
  // Zones
  { key: 'read_zones',         label: 'Voir les zones' },
  { key: 'write_zones',        label: 'Ajouter / modifier des zones' },
  // Tournées
  { key: 'read_tournees',      label: 'Voir les tournées' },
  { key: 'create_tournees',    label: 'Créer une nouvelle tournée' },
  { key: 'update_tournees',    label: 'Modifier les chiffres d\'une tournée (pains, boulangerie…)' },
  { key: 'terminer_tournees',  label: 'Clôturer une tournée' },
  // Livraisons
  { key: 'write_livraisons',   label: 'Saisir / modifier les livraisons clients d\'une tournée' },
  // Encaissements
  { key: 'read_encaissements', label: 'Voir les encaissements' },
  { key: 'write_encaissements',label: 'Enregistrer un paiement' },
  // Statistiques
  { key: 'read_stats',         label: 'Accéder aux statistiques' },
];
