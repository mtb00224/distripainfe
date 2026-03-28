import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminTokenResponse,
  LivreurDetailStats,
  LivreurPerformance,
  LivreurPermissions,
  PlatformStats,
  TrafficEntry,
  TrafficStats,
} from '../models/admin.models';
import { Pays, PaysCreate, PaysUpdate } from '../models/pays.models';
import {
  Abonnement,
  FormulaAbonnement,
  FormulaAbonnementCreate,
  FormulaAbonnementUpdate,
  MoyenPaiement,
  MoyenPaiementCreate,
  MoyenPaiementUpdate,
} from '../models/abonnement.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  private _token: string | null = null;

  setToken(token: string): void {
    this._token = token;
    localStorage.setItem('admin_token', token);
  }

  loadToken(): void {
    this._token = localStorage.getItem('admin_token');
  }

  clearToken(): void {
    this._token = null;
    localStorage.removeItem('admin_token');
  }

  getToken(): string | null {
    return this._token;
  }

  isLoggedIn(): boolean {
    return !!this._token;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this._token}` });
  }

  login(email: string, password: string): Observable<AdminTokenResponse> {
    return this.http.post<AdminTokenResponse>(`${this.base}/auth/login`, { email, password });
  }

  setup(email: string, password: string, nom: string, setup_key: string): Observable<AdminTokenResponse> {
    return this.http.post<AdminTokenResponse>(`${this.base}/auth/setup`, { email, password, nom, setup_key });
  }

  getStats(): Observable<PlatformStats> {
    return this.http.get<PlatformStats>(`${this.base}/stats`, { headers: this.headers() });
  }

  getLivreurs(): Observable<LivreurPerformance[]> {
    return this.http.get<LivreurPerformance[]>(`${this.base}/livreurs`, { headers: this.headers() });
  }

  getLivreurDetail(id: number): Observable<LivreurDetailStats> {
    return this.http.get<LivreurDetailStats>(`${this.base}/livreurs/${id}`, { headers: this.headers() });
  }

  toggleLivreur(id: number, is_active: boolean): Observable<LivreurPerformance> {
    return this.http.patch<LivreurPerformance>(`${this.base}/livreurs/${id}`, { is_active }, { headers: this.headers() });
  }

  getTrafficStats(): Observable<TrafficStats> {
    return this.http.get<TrafficStats>(`${this.base}/traffic/stats`, { headers: this.headers() });
  }

  getTraffic(limit = 100, offset = 0, livreurId?: number): Observable<TrafficEntry[]> {
    let url = `${this.base}/traffic?limit=${limit}&offset=${offset}`;
    if (livreurId) url += `&livreur_id=${livreurId}`;
    return this.http.get<TrafficEntry[]>(url, { headers: this.headers() });
  }

  deleteTrafficSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/traffic/${id}`, { headers: this.headers() });
  }

  // ── Pays ──────────────────────────────────────────────────────────────────
  getPays(): Observable<Pays[]> {
    return this.http.get<Pays[]>(`${this.base}/pays`, { headers: this.headers() });
  }
  createPays(payload: PaysCreate): Observable<Pays> {
    return this.http.post<Pays>(`${this.base}/pays`, payload, { headers: this.headers() });
  }
  updatePays(id: number, payload: PaysUpdate): Observable<Pays> {
    return this.http.put<Pays>(`${this.base}/pays/${id}`, payload, { headers: this.headers() });
  }
  deletePays(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pays/${id}`, { headers: this.headers() });
  }

  // ── Formules abonnement ───────────────────────────────────────────────────
  getFormules(): Observable<FormulaAbonnement[]> {
    return this.http.get<FormulaAbonnement[]>(`${this.base}/formules-abonnement`, { headers: this.headers() });
  }
  createFormule(payload: FormulaAbonnementCreate): Observable<FormulaAbonnement> {
    return this.http.post<FormulaAbonnement>(`${this.base}/formules-abonnement`, payload, { headers: this.headers() });
  }
  updateFormule(id: number, payload: FormulaAbonnementUpdate): Observable<FormulaAbonnement> {
    return this.http.put<FormulaAbonnement>(`${this.base}/formules-abonnement/${id}`, payload, { headers: this.headers() });
  }
  deleteFormule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/formules-abonnement/${id}`, { headers: this.headers() });
  }

  // ── Abonnements ───────────────────────────────────────────────────────────
  getAbonnements(livreurId?: number): Observable<Abonnement[]> {
    const url = livreurId ? `${this.base}/abonnements?livreur_id=${livreurId}` : `${this.base}/abonnements`;
    return this.http.get<Abonnement[]>(url, { headers: this.headers() });
  }
  validerPaiement(abonnementId: number, paiementId: number, statut: 'valide' | 'rejete', notes?: string): Observable<Abonnement> {
    return this.http.post<Abonnement>(
      `${this.base}/abonnements/${abonnementId}/paiements/${paiementId}/valider`,
      { statut, notes_admin: notes },
      { headers: this.headers() },
    );
  }

  // ── Moyens de paiement ────────────────────────────────────────────────────
  getMoyensPaiement(): Observable<MoyenPaiement[]> {
    return this.http.get<MoyenPaiement[]>(`${this.base}/moyens-paiement`, { headers: this.headers() });
  }
  createMoyenPaiement(payload: MoyenPaiementCreate): Observable<MoyenPaiement> {
    return this.http.post<MoyenPaiement>(`${this.base}/moyens-paiement`, payload, { headers: this.headers() });
  }
  updateMoyenPaiement(id: number, payload: MoyenPaiementUpdate): Observable<MoyenPaiement> {
    return this.http.put<MoyenPaiement>(`${this.base}/moyens-paiement/${id}`, payload, { headers: this.headers() });
  }
  deleteMoyenPaiement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/moyens-paiement/${id}`, { headers: this.headers() });
  }

  // ── Permissions livreur ───────────────────────────────────────────────────
  getLivreurPermissions(id: number): Observable<LivreurPermissions> {
    return this.http.get<LivreurPermissions>(`${this.base}/livreurs/${id}/permissions`, { headers: this.headers() });
  }
  updateLivreurPermissions(id: number, permissions: string[] | null): Observable<LivreurPermissions> {
    return this.http.put<LivreurPermissions>(
      `${this.base}/livreurs/${id}/permissions`,
      { permissions },
      { headers: this.headers() },
    );
  }
}
