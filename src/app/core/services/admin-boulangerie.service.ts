import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth.models';
import {
  AdminBoulangerieProfile,
  BoulangerieCreate,
  BoulangerieResponse,
  BoulangerieUpdate,
  LivreurContratUpdate,
  LivreurLinkRequest,
  LivreurLinkResponse,
  StaffCreate,
  StaffResponse,
  StaffUpdate,
} from '../models/admin_boulangerie.models';
import {
  LivreurInterne,
  LivreurInterneCreate,
  LivreurInterneUpdate,
  LivreurInternePortionPain,
  LivreurInternePortionCreate,
  LivreurInternePortionUpdate,
  ClientPortionPain,
  ClientPortionCreate,
  CompteInterne,
  RetraitCreate,
  SessionProduction,
  SessionProductionCreate,
  SessionProductionUpdate,
  Distribution,
  DistributionCreate,
  DistributionUpdate,
  CategorieDepense,
  DepenseCreate,
  Depense,
  StatsBoulangerie,
  GlobalStatsBoulangerie,
  PortionPainBoulangerie,
  PortionPainBoulangerieCreate,
  PortionPainBoulangerieUpdate,
  DetteBoulangerie,
  DetteBoulangerieCreate,
  DetteBoulangerieUpdate,
  DetteBoulangerieType,
  DetteBoulangerieStatut,
  ReglementDetteCreate,
  ProduitAmbulateur,
  ProduitAmbulateurCreate,
  ProduitAmbulateurUpdate,
} from '../models/production.models';

const BASE = `${environment.apiUrl}/admin-boulangerie`;
const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AdminBoulangerieService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(null);
  private _adminBoulangerieId = signal<number | null>(null);
  private _boulangerieActiveId = signal<number | null>(null);
  private _profile = signal<AdminBoulangerieProfile | null>(null);

  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly token = this._token.asReadonly();
  readonly boulangerieActiveId = this._boulangerieActiveId.asReadonly();
  readonly profile = this._profile.asReadonly();

  /** Boulangerie active (trouvée dans le profil). */
  readonly boulangerieActive = computed(() => {
    const id = this._boulangerieActiveId();
    const profile = this._profile();
    if (!id || !profile) return null;
    return profile.boulangeries.find((b) => b.id === id) ?? null;
  });

  getToken(): string | null {
    return this._token();
  }

  // =====================
  // Auth
  // =====================

  logout(): void {
    this._token.set(null);
    this._adminBoulangerieId.set(null);
    this._boulangerieActiveId.set(null);
    this._profile.set(null);
    this.router.navigate(['/boulangerie/login']);
  }

  /** Change la boulangerie active et renouvelle le token. */
  switchBoulangerie(boulangerieId: number) {
    return this.http
      .post<AuthResponse>(`${BASE}/auth/switch/${boulangerieId}`, {}, {
        headers: { Authorization: `Bearer ${this._token()}` },
      })
      .pipe(
        tap((res) => {
          this.setSession(res);
        })
      );
  }

  // =====================
  // Profil
  // =====================

  fetchProfile() {
    return this.http
      .get<AdminBoulangerieProfile>(`${BASE}/me`, {
        headers: { Authorization: `Bearer ${this._token()}` },
      })
      .pipe(tap((p) => this._profile.set(p)));
  }

  // =====================
  // Boulangeries
  // =====================

  getBoulangeries(includeInactive = false) {
    return this.http.get<BoulangerieResponse[]>(`${BASE}/boulangeries`, {
      params: { include_inactive: includeInactive },
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createBoulangerie(payload: BoulangerieCreate) {
    return this.http
      .post<BoulangerieResponse>(`${BASE}/boulangeries`, payload, {
        headers: { Authorization: `Bearer ${this._token()}` },
      })
      .pipe(tap(() => this.fetchProfile().subscribe()));
  }

  updateBoulangerie(id: number, payload: BoulangerieUpdate) {
    return this.http
      .put<BoulangerieResponse>(`${BASE}/boulangeries/${id}`, payload, {
        headers: { Authorization: `Bearer ${this._token()}` },
      })
      .pipe(tap(() => this.fetchProfile().subscribe()));
  }

  deactivateBoulangerie(id: number) {
    return this.http
      .delete(`${BASE}/boulangeries/${id}`, {
        headers: { Authorization: `Bearer ${this._token()}` },
      })
      .pipe(tap(() => this.fetchProfile().subscribe()));
  }

  // =====================
  // Staff
  // =====================

  getStaff() {
    return this.http.get<StaffResponse[]>(`${BASE}/staff`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  addStaff(payload: StaffCreate) {
    return this.http.post<StaffResponse>(`${BASE}/staff`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateStaff(id: number, payload: StaffUpdate) {
    return this.http.put<StaffResponse>(`${BASE}/staff/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  removeStaff(id: number) {
    return this.http.delete(`${BASE}/staff/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Livreurs liés
  // =====================

  getLivreurs() {
    return this.http.get<LivreurLinkResponse[]>(`${BASE}/livreurs`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  linkLivreur(payload: LivreurLinkRequest) {
    return this.http.post<LivreurLinkResponse>(`${BASE}/livreurs/link`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateContratLivreur(livreurId: number, payload: LivreurContratUpdate) {
    return this.http.put<LivreurLinkResponse>(
      `${BASE}/livreurs/${livreurId}/contrat`,
      payload,
      { headers: { Authorization: `Bearer ${this._token()}` } }
    );
  }

  unlinkLivreur(livreurId: number) {
    return this.http.delete(`${BASE}/livreurs/${livreurId}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Livreurs internes
  // =====================

  getLivreursInternes(includeInactive = false) {
    return this.http.get<LivreurInterne[]>(`${BASE}/livreurs-internes`, {
      params: { include_inactive: includeInactive },
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createLivreurInterne(payload: LivreurInterneCreate) {
    return this.http.post<LivreurInterne[]>(`${BASE}/livreurs-internes`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateLivreurInterne(id: number, payload: LivreurInterneUpdate) {
    return this.http.put<LivreurInterne>(`${BASE}/livreurs-internes/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deactivateLivreurInterne(id: number) {
    return this.http.delete(`${BASE}/livreurs-internes/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  getCompteInterne(livreurInterneId: number) {
    return this.http.get<CompteInterne>(`${BASE}/livreurs-internes/${livreurInterneId}/compte`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  retraitCompteInterne(livreurInterneId: number, payload: RetraitCreate) {
    return this.http.post(`${BASE}/livreurs-internes/${livreurInterneId}/compte/retrait`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Production
  // =====================

  getSessions(params?: { boulangerie_id?: number; date_debut?: string; date_fin?: string }) {
    return this.http.get<SessionProduction[]>(`${BASE}/production`, {
      params: params as any,
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createSession(payload: SessionProductionCreate) {
    return this.http.post<SessionProduction>(`${BASE}/production`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  getSession(id: number) {
    return this.http.get<SessionProduction>(`${BASE}/production/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateSession(id: number, payload: SessionProductionUpdate) {
    return this.http.put<SessionProduction>(`${BASE}/production/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  cloturerSession(id: number) {
    return this.http.post<SessionProduction>(`${BASE}/production/${id}/cloturer`, {}, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  addDistribution(sessionId: number, payload: DistributionCreate) {
    return this.http.post<Distribution>(`${BASE}/production/${sessionId}/distributions`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateDistribution(sessionId: number, distId: number, payload: DistributionUpdate) {
    return this.http.put<Distribution>(`${BASE}/production/${sessionId}/distributions/${distId}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deleteDistribution(sessionId: number, distId: number) {
    return this.http.delete(`${BASE}/production/${sessionId}/distributions/${distId}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Dépenses
  // =====================

  getCategories() {
    return this.http.get<CategorieDepense[]>(`${BASE}/depenses/categories`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  getDepenses(params?: { date_debut?: string; date_fin?: string }) {
    return this.http.get<Depense[]>(`${BASE}/depenses`, {
      params: params as any,
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createDepense(payload: DepenseCreate) {
    return this.http.post<Depense>(`${BASE}/depenses`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deleteDepense(id: number) {
    return this.http.delete(`${BASE}/depenses/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Statistiques
  // =====================

  getStats(params?: { date_debut?: string; date_fin?: string }) {
    return this.http.get<StatsBoulangerie>(`${BASE}/stats`, {
      params: params as any,
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  getGlobalStats(params?: { date_debut?: string; date_fin?: string }) {
    return this.http.get<GlobalStatsBoulangerie>(`${BASE}/stats/global`, {
      params: params as any,
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Portions livreur interne
  // =====================

  getLivreurInternePortions(livreurInterneId: number) {
    return this.http.get<LivreurInternePortionPain[]>(`${BASE}/livreurs-internes/${livreurInterneId}/portions`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createLivreurInternePortion(livreurInterneId: number, payload: LivreurInternePortionCreate) {
    return this.http.post<LivreurInternePortionPain>(`${BASE}/livreurs-internes/${livreurInterneId}/portions`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateLivreurInternePortion(livreurInterneId: number, portionId: number, payload: LivreurInternePortionUpdate) {
    return this.http.put<LivreurInternePortionPain>(`${BASE}/livreurs-internes/${livreurInterneId}/portions/${portionId}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deleteLivreurInternePortion(livreurInterneId: number, portionId: number) {
    return this.http.delete(`${BASE}/livreurs-internes/${livreurInterneId}/portions/${portionId}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Portions client (via API livreur — pas admin boulangerie)
  // =====================

  getClientPortions(clientId: number, token: string) {
    return this.http.get<ClientPortionPain[]>(`${API}/clients/${clientId}/portions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // =====================
  // Portions de pain (admin boulangerie global)
  // =====================

  getPortions() {
    return this.http.get<PortionPainBoulangerie[]>(`${BASE}/portions-pain`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createPortion(payload: PortionPainBoulangerieCreate) {
    return this.http.post<PortionPainBoulangerie>(`${BASE}/portions-pain`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updatePortion(id: number, payload: PortionPainBoulangerieUpdate) {
    return this.http.put<PortionPainBoulangerie>(`${BASE}/portions-pain/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deletePortion(id: number) {
    return this.http.delete(`${BASE}/portions-pain/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Dettes boulangerie
  // =====================

  getDettes(params?: { type?: DetteBoulangerieType; statut?: DetteBoulangerieStatut }) {
    return this.http.get<DetteBoulangerie[]>(`${BASE}/dettes`, {
      params: params as any,
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createDette(payload: DetteBoulangerieCreate) {
    return this.http.post<DetteBoulangerie>(`${BASE}/dettes`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateDette(id: number, payload: DetteBoulangerieUpdate) {
    return this.http.put<DetteBoulangerie>(`${BASE}/dettes/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deleteDette(id: number) {
    return this.http.delete(`${BASE}/dettes/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  addReglementDette(detteId: number, payload: ReglementDetteCreate) {
    return this.http.post<DetteBoulangerie>(`${BASE}/dettes/${detteId}/reglements`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Vente ambulatoire
  // =====================

  getProduitsAmbulateurs(includeInactive = false) {
    return this.http.get<ProduitAmbulateur[]>(`${BASE}/vente-ambulatoire`, {
      params: { include_inactive: includeInactive },
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  createProduitAmbulateur(payload: ProduitAmbulateurCreate) {
    return this.http.post<ProduitAmbulateur>(`${BASE}/vente-ambulatoire`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  updateProduitAmbulateur(id: number, payload: ProduitAmbulateurUpdate) {
    return this.http.put<ProduitAmbulateur>(`${BASE}/vente-ambulatoire/${id}`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  deleteProduitAmbulateur(id: number) {
    return this.http.delete(`${BASE}/vente-ambulatoire/${id}`, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Sécurité
  // =====================

  changePassword(payload: { old_password: string; new_password: string }) {
    return this.http.put(`${BASE}/auth/change-password`, payload, {
      headers: { Authorization: `Bearer ${this._token()}` },
    });
  }

  // =====================
  // Helpers
  // =====================

  setSession(res: AuthResponse): void {
    this._token.set(res.access_token);
    this._adminBoulangerieId.set(res.admin_boulangerie_id ?? null);
    this._boulangerieActiveId.set(res.boulangerie_active_id ?? null);
  }
}
