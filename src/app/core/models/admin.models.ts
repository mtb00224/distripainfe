export interface AdminTokenResponse {
  access_token: string;
  token_type: string;
}

export interface DeviceBreakdown {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface PlatformBreakdown {
  ios: number;
  android: number;
  windows: number;
  macos: number;
  linux: number;
  other: number;
}

export interface PlatformStats {
  total_livreurs: number;
  active_livreurs: number;
  total_tournees: number;
  total_clients: number;
  total_encaissements_fcfa: number;
  sessions_total: number;
  sessions_30d: number;
  device_breakdown: DeviceBreakdown;
  platform_breakdown: PlatformBreakdown;
}

export interface LivreurPerformance {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  nb_clients: number;
  nb_tournees_total: number;
  nb_tournees_30d: number;
  nb_pains_total: number;
  revenue_total: number;
  revenue_30d: number;
  last_activity: string | null;
  last_device: string | null;
  last_platform: string | null;
  nb_acolytes: number;
}

export interface RecentSession {
  logged_in_at: string;
  device_type: string;
  platform: string;
  browser: string;
}

export interface LivreurDetailStats {
  livreur: LivreurPerformance;
  monthly_revenue: { month: string; revenue: number }[];
  device_breakdown: DeviceBreakdown;
  platform_breakdown: PlatformBreakdown;
  recent_sessions: RecentSession[];
}

export interface TrafficEntry {
  id: number;
  logged_in_at: string;
  user_id: number;
  username: string;
  role: string;
  ip_address: string | null;
  device_type: string;
  platform: string;
  browser: string;
}

export interface TrafficStats {
  total_sessions: number;
  sessions_7d: number;
  unique_ips_7d: number;
  sessions_per_day: { date: string; count: number }[];
}

export interface LivreurPermissions {
  livreur_id: number;
  permissions: string[] | null; // null = full access
}

export interface AdminBoulangerieEntry {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  is_active: boolean;
  nb_boulangeries: number;
  created_at: string | null;
}

export interface BoulangerieEntry {
  id: number;
  nom: string;
  contact: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string | null;
  admin_nom: string | null;
  admin_email: string | null;
}
