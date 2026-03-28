import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boulangerie, BoulangerieCreate, BoulangerieUpdate } from '../models/boulangerie.models';
import { Zone, ZoneCreate, ZoneUpdate } from '../models/zone.models';
import { Client, ClientCreate, ClientSolde, ClientUpdate } from '../models/client.models';
import { Tournee, TourneeCreate, LivraisonClient, LivraisonCreate, RetourBoulangerieResponse } from '../models/tournee.models';
import { Encaissement, EncaissementCreate, PendingLivraison, PendingTournee, ClientWithPending } from '../models/encaissement.models';
import { Abonnement, AbonnementCreate, FormulaAbonnement, MoyenPaiement, PaiementAbonnementCreate, PaiementAbonnement } from '../models/abonnement.models';
import { Pays } from '../models/pays.models';
import { Dette, DetteCreate, ReglementCreate } from '../models/dette.models';
import { Acolyte, AcolyteCreate, AcolyteUpdate } from '../models/acolyte.models';
import { StatsPeriode, StatsClient } from '../models/stats.models';
import { PortionPain, PortionPainCreate, PortionPainUpdate } from '../models/portion_pain.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Boulangeries ─────────────────────────────────────────────────────────
  getBoulangeries(includeInactive = false): Observable<Boulangerie[]> {
    return this.http.get<Boulangerie[]>(`${this.base}/boulangeries`, {
      params: { include_inactive: includeInactive },
    });
  }
  createBoulangerie(payload: BoulangerieCreate): Observable<Boulangerie> {
    return this.http.post<Boulangerie>(`${this.base}/boulangeries`, payload);
  }
  updateBoulangerie(id: number, payload: BoulangerieUpdate): Observable<Boulangerie> {
    return this.http.put<Boulangerie>(`${this.base}/boulangeries/${id}`, payload);
  }
  deleteBoulangerie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/boulangeries/${id}`);
  }

  // ── Zones ─────────────────────────────────────────────────────────────────
  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.base}/zones`);
  }
  createZone(payload: ZoneCreate): Observable<Zone> {
    return this.http.post<Zone>(`${this.base}/zones`, payload);
  }
  updateZone(id: number, payload: ZoneUpdate): Observable<Zone> {
    return this.http.put<Zone>(`${this.base}/zones/${id}`, payload);
  }
  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/zones/${id}`);
  }

  // ── Clients ───────────────────────────────────────────────────────────────
  getClients(params?: { zone_id?: number; search?: string; include_inactive?: boolean }): Observable<Client[]> {
    let httpParams = new HttpParams();
    if (params?.zone_id) httpParams = httpParams.set('zone_id', params.zone_id);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.include_inactive) httpParams = httpParams.set('include_inactive', true);
    return this.http.get<Client[]>(`${this.base}/clients`, { params: httpParams });
  }
  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.base}/clients/${id}`);
  }
  createClient(payload: ClientCreate): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, payload);
  }
  updateClient(id: number, payload: ClientUpdate): Observable<Client> {
    return this.http.put<Client>(`${this.base}/clients/${id}`, payload);
  }
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clients/${id}`);
  }
  getClientSolde(id: number): Observable<ClientSolde> {
    return this.http.get<ClientSolde>(`${this.base}/clients/${id}/solde`);
  }
  getClientHistorique(id: number): Observable<any> {
    return this.http.get(`${this.base}/clients/${id}/historique`);
  }

  // ── Tournees ──────────────────────────────────────────────────────────────
  getTournees(params?: { date?: string; periode?: string; boulangerie_id?: number }): Observable<Tournee[]> {
    let httpParams = new HttpParams();
    if (params?.date) httpParams = httpParams.set('date', params.date);
    if (params?.periode) httpParams = httpParams.set('periode', params.periode);
    if (params?.boulangerie_id) httpParams = httpParams.set('boulangerie_id', params.boulangerie_id);
    return this.http.get<Tournee[]>(`${this.base}/tournees`, { params: httpParams });
  }
  getTournee(id: number): Observable<Tournee> {
    return this.http.get<Tournee>(`${this.base}/tournees/${id}`);
  }
  createTournee(payload: TourneeCreate): Observable<Tournee> {
    return this.http.post<Tournee>(`${this.base}/tournees`, payload);
  }
  updateTournee(id: number, payload: Partial<TourneeCreate>): Observable<Tournee> {
    return this.http.put<Tournee>(`${this.base}/tournees/${id}`, payload);
  }
  terminerTournee(id: number): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.base}/tournees/${id}/terminer`, {});
  }
  getLivraisons(tourneeId: number): Observable<LivraisonClient[]> {
    return this.http.get<LivraisonClient[]>(`${this.base}/tournees/${tourneeId}/livraisons`);
  }
  setLivraisons(tourneeId: number, livraisons: LivraisonCreate[]): Observable<LivraisonClient[]> {
    return this.http.post<LivraisonClient[]>(`${this.base}/tournees/${tourneeId}/livraisons`, { livraisons });
  }
  updateLivraison(tourneeId: number, livraisonId: number, payload: { nb_pains_livres?: number; nb_pains_retournes?: number }): Observable<LivraisonClient> {
    return this.http.put<LivraisonClient>(`${this.base}/tournees/${tourneeId}/livraisons/${livraisonId}`, payload);
  }
  deleteLivraison(tourneeId: number, livraisonId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tournees/${tourneeId}/livraisons/${livraisonId}`);
  }
  terminerClient(tourneeId: number, clientId: number, payload: {
    notes?: string;
    encaisser?: boolean;
    montant?: number;
    type_encaissement?: string;
  }): Observable<Tournee> {
    return this.http.patch<Tournee>(`${this.base}/tournees/${tourneeId}/clients/${clientId}/terminer`, payload);
  }
  getRetourBoulangerie(tourneeId: number): Observable<RetourBoulangerieResponse> {
    return this.http.get<RetourBoulangerieResponse>(`${this.base}/tournees/${tourneeId}/retour-boulangerie`);
  }
  saveRetourBoulangerie(tourneeId: number, lignes: { portion_pain_id: number; quantite: number }[]): Observable<RetourBoulangerieResponse> {
    return this.http.post<RetourBoulangerieResponse>(`${this.base}/tournees/${tourneeId}/retour-boulangerie`, { lignes });
  }

  // ── Encaissements ─────────────────────────────────────────────────────────
  getEncaissements(params?: { client_id?: number; date_debut?: string; date_fin?: string }): Observable<Encaissement[]> {
    let httpParams = new HttpParams();
    if (params?.client_id) httpParams = httpParams.set('client_id', params.client_id);
    if (params?.date_debut) httpParams = httpParams.set('date_debut', params.date_debut);
    if (params?.date_fin) httpParams = httpParams.set('date_fin', params.date_fin);
    return this.http.get<Encaissement[]>(`${this.base}/encaissements`, { params: httpParams });
  }
  createEncaissement(payload: EncaissementCreate): Observable<Encaissement> {
    return this.http.post<Encaissement>(`${this.base}/encaissements`, payload);
  }
  getPendingLivraisons(clientId?: number): Observable<PendingLivraison[]> {
    let httpParams = new HttpParams();
    if (clientId) httpParams = httpParams.set('client_id', clientId);
    return this.http.get<PendingLivraison[]>(`${this.base}/encaissements/pending`, { params: httpParams });
  }

  getClientsWithPending(): Observable<ClientWithPending[]> {
    return this.http.get<ClientWithPending[]>(`${this.base}/encaissements/clients-with-pending`);
  }

  getPendingTournees(clientId: number): Observable<PendingTournee[]> {
    return this.http.get<PendingTournee[]>(`${this.base}/encaissements/pending-tournees`, {
      params: new HttpParams().set('client_id', clientId),
    });
  }

  // ── Acolytes ──────────────────────────────────────────────────────────────
  getAcolytes(): Observable<Acolyte[]> {
    return this.http.get<Acolyte[]>(`${this.base}/acolytes`);
  }
  createAcolyte(payload: AcolyteCreate): Observable<Acolyte> {
    return this.http.post<Acolyte>(`${this.base}/acolytes`, payload);
  }
  updateAcolyte(id: number, payload: AcolyteUpdate): Observable<Acolyte> {
    return this.http.put<Acolyte>(`${this.base}/acolytes/${id}`, payload);
  }
  deleteAcolyte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/acolytes/${id}`);
  }

  // ── Portions ──────────────────────────────────────────────────────────────
  getPortions(): Observable<PortionPain[]> {
    return this.http.get<PortionPain[]>(`${this.base}/portions`);
  }
  createPortion(payload: PortionPainCreate): Observable<PortionPain> {
    return this.http.post<PortionPain>(`${this.base}/portions`, payload);
  }
  updatePortion(id: number, payload: PortionPainUpdate): Observable<PortionPain> {
    return this.http.put<PortionPain>(`${this.base}/portions/${id}`, payload);
  }
  deletePortion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/portions/${id}`);
  }

  // ── Pays (livreur — active only) ──────────────────────────────────────────
  getPaysActifs(): Observable<Pays[]> {
    return this.http.get<Pays[]>(`${this.base}/abonnements/pays`);
  }

  // ── Abonnements (livreur) ─────────────────────────────────────────────────
  getFormules(): Observable<FormulaAbonnement[]> {
    return this.http.get<FormulaAbonnement[]>(`${this.base}/abonnements/formules`);
  }
  getMoyensPaiement(): Observable<MoyenPaiement[]> {
    return this.http.get<MoyenPaiement[]>(`${this.base}/abonnements/moyens-paiement`);
  }
  getCurrentAbonnement(): Observable<Abonnement | null> {
    return this.http.get<Abonnement | null>(`${this.base}/abonnements/current`);
  }
  getAbonnementHistory(): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(`${this.base}/abonnements/history`);
  }
  createAbonnement(payload: AbonnementCreate): Observable<Abonnement> {
    return this.http.post<Abonnement>(`${this.base}/abonnements`, payload);
  }
  declarerPaiement(abonnementId: number, payload: PaiementAbonnementCreate): Observable<PaiementAbonnement> {
    return this.http.post<PaiementAbonnement>(`${this.base}/abonnements/${abonnementId}/paiement`, payload);
  }

  // ── Profil ────────────────────────────────────────────────────────────────
  updateProfile(payload: { nom?: string; telephone?: string }): Observable<any> {
    return this.http.patch(`${this.base}/auth/me`, payload);
  }
  changeLivreurPassword(payload: { current_password: string; new_password: string }): Observable<void> {
    return this.http.put<void>(`${this.base}/auth/me/password`, payload);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsJournalier(date: string, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('date', date);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/journalier`, { params: p });
  }
  statsMensuel(mois: number, annee: number, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('mois', mois).set('annee', annee);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/mensuel`, { params: p });
  }
  statsAnnuel(annee: number, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('annee', annee);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/annuel`, { params: p });
  }
  statsTrimestriel(trimestre: number, annee: number, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('trimestre', trimestre).set('annee', annee);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/trimestriel`, { params: p });
  }
  statsSemestriel(semestre: number, annee: number, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('semestre', semestre).set('annee', annee);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/semestriel`, { params: p });
  }
  statsHebdomadaire(semaine: number, annee: number, boulangerieId?: number): Observable<StatsPeriode> {
    let p = new HttpParams().set('semaine', semaine).set('annee', annee);
    if (boulangerieId) p = p.set('boulangerie_id', boulangerieId);
    return this.http.get<StatsPeriode>(`${this.base}/stats/hebdomadaire`, { params: p });
  }
  statsClient(clientId: number, dateDebut?: string, dateFin?: string): Observable<StatsClient> {
    let p = new HttpParams();
    if (dateDebut) p = p.set('date_debut', dateDebut);
    if (dateFin) p = p.set('date_fin', dateFin);
    return this.http.get<StatsClient>(`${this.base}/stats/client/${clientId}`, { params: p });
  }

  // ── Dettes ────────────────────────────────────────────────────────────────
  getDettes(params?: { client_id?: number; statut?: string }): Observable<Dette[]> {
    let p = new HttpParams();
    if (params?.client_id) p = p.set('client_id', params.client_id);
    if (params?.statut) p = p.set('statut', params.statut);
    return this.http.get<Dette[]>(`${this.base}/dettes`, { params: p });
  }
  createDette(payload: DetteCreate): Observable<Dette> {
    return this.http.post<Dette>(`${this.base}/dettes`, payload);
  }
  deleteDette(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/dettes/${id}`);
  }
  solderDette(id: number, payload: ReglementCreate): Observable<Dette> {
    return this.http.post<Dette>(`${this.base}/dettes/${id}/solder`, payload);
  }
  solderDettePartiel(id: number, payload: ReglementCreate): Observable<Dette> {
    return this.http.post<Dette>(`${this.base}/dettes/${id}/solder-partiel`, payload);
  }
}
