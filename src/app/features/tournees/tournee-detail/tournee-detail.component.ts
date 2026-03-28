import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Tournee } from '../../../core/models/tournee.models';
import { Client } from '../../../core/models/client.models';
import { LivraisonClient } from '../../../core/models/tournee.models';
import { PortionPain } from '../../../core/models/portion_pain.models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface ClientEntry {
  client: Client;
  selected: boolean;
  nb_pains_livres: number;
  retourLignes: { [portionId: number]: number };
}

interface TerminerClientState {
  clientId: number;
  clientNom: string;
  montantDu: number;
  encaisser: boolean;
  modeDette: boolean;
  montant: number;
  notes: string;
}

@Component({
  selector: 'app-tournee-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, NgClass, FormsModule, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent, PageHeaderComponent],
  templateUrl: './tournee-detail.component.html',
})
export class TourneeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  tournee = signal<Tournee | null>(null);
  livraisons = signal<LivraisonClient[]>([]);
  clients = signal<ClientEntry[]>([]);
  portions = signal<PortionPain[]>([]);
  loading = signal(true);
  saving = signal(false);
  success = signal(false);
  error = signal('');
  showClientEntry = signal(false);

  // Inline edit state — individual livraison
  editingId = signal<number | null>(null);
  editLivres = 0;
  editInlineRetourLignes: { [portionId: number]: number } = {};

  // Edit tournée figures — per-portion boulangerie retour
  showEditChiffres = signal(false);
  boulangerieRetourLignes = signal<{ [portionId: number]: number }>({});

  boulangerieRetourTotal = computed(() =>
    Object.values(this.boulangerieRetourLignes()).reduce((s, v) => s + (v || 0), 0)
  );

  boulangerieRetourValeur = computed(() =>
    this.portions().reduce((s, p) => s + (this.boulangerieRetourLignes()[p.id] || 0) * p.prix_fcfa, 0)
  );

  // Per-client termination
  terminerState = signal<TerminerClientState | null>(null);
  terminerSaving = signal(false);

  // Client search
  searchClients = signal('');
  filteredClients = computed(() => {
    const q = this.searchClients().toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter((e) =>
      e.client.nom.toLowerCase().includes(q) ||
      (e.client.telephone ?? '').toLowerCase().includes(q)
    );
  });

  // Group livraisons by client
  livraisonsParClient = computed(() => {
    const groups = new Map<number, LivraisonClient[]>();
    for (const lv of this.livraisons()) {
      const existing = groups.get(lv.client_id) ?? [];
      existing.push(lv);
      groups.set(lv.client_id, existing);
    }
    return groups;
  });

  clientsAvecLivraisons = computed(() => {
    const groups = this.livraisonsParClient();
    return Array.from(groups.entries()).map(([clientId, livs]) => ({
      clientId,
      clientNom: livs[0]?.client?.nom ?? `Client ${clientId}`,
      clientTelephone: livs[0]?.client?.telephone ?? null,
      clientZoneNom: livs[0]?.client?.zone?.nom ?? null,
      livraisons: livs,
      totalMontant: livs.reduce((s, l) => s + l.montant_du, 0),
      totalLivres: livs.reduce((s, l) => s + l.nb_pains_livres, 0),
      totalRetournes: livs.reduce((s, l) => s + l.nb_pains_retournes, 0),
      isTermine: livs.every((l) => l.is_termine),
    }));
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.api.getTournee(id).subscribe((t) => {
      this.tournee.set(t);
      this.api.getLivraisons(id).subscribe((lv) => this.livraisons.set(lv));
      this.api.getPortions().subscribe((portions) => {
        this.portions.set(portions.filter((p) => p.is_active));
      });
      this.api.getClients().subscribe((clients) => {
        this.clients.set(clients.map((c) => ({
          client: c,
          selected: false,
          nb_pains_livres: 0,
          retourLignes: {},
        })));
        this.loading.set(false);
      });
    });
  }

  toggleClient(entry: ClientEntry): void {
    entry.selected = !entry.selected;
    this.clients.update((list) => [...list]);
  }

  get selectedClients(): ClientEntry[] {
    return this.clients().filter((c) => c.selected);
  }

  getClientRetourTotal(entry: ClientEntry): number {
    return Object.values(entry.retourLignes).reduce((s, v) => s + (v || 0), 0);
  }

  getClientRetourValeur(entry: ClientEntry): number {
    return this.portions().reduce((s, p) => s + (entry.retourLignes[p.id] || 0) * p.prix_fcfa, 0);
  }

  setClientRetourLigne(entry: ClientEntry, portionId: number, qty: number): void {
    entry.retourLignes[portionId] = qty || 0;
    this.clients.update((list) => [...list]);
  }

  saveLivraisons(): void {
    const livraisons = this.selectedClients.map((e) => ({
      client_id: e.client.id,
      nb_pains_livres: e.nb_pains_livres,
      nb_pains_retournes: this.getClientRetourTotal(e),
    }));
    if (!livraisons.length) return;
    this.saving.set(true);
    this.error.set('');
    this.api.setLivraisons(this.tournee()!.id, livraisons).subscribe({
      next: (lv) => {
        this.livraisons.set(lv);
        this.saving.set(false);
        this.success.set(true);
        this.showClientEntry.set(false);
        setTimeout(() => this.success.set(false), 3000);
        this.clients.update((list) => list.map((e) => ({ ...e, selected: false, nb_pains_livres: 0, retourLignes: {} })));
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de l\'enregistrement');
        this.saving.set(false);
      },
    });
  }

  startEdit(lv: LivraisonClient): void {
    this.editingId.set(lv.id);
    this.editLivres = lv.nb_pains_livres;
    this.editInlineRetourLignes = {};
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  getInlineRetourTotal(): number {
    return Object.values(this.editInlineRetourLignes).reduce((s, v) => s + (v || 0), 0);
  }

  setInlineRetourLigne(portionId: number, qty: number): void {
    this.editInlineRetourLignes[portionId] = qty || 0;
  }

  saveEdit(lv: LivraisonClient): void {
    this.saving.set(true);
    this.error.set('');
    this.api.updateLivraison(this.tournee()!.id, lv.id, {
      nb_pains_livres: this.editLivres,
      nb_pains_retournes: this.getInlineRetourTotal(),
    }).subscribe({
      next: (updated) => {
        this.livraisons.update((list) => list.map((l) => l.id === updated.id ? updated : l));
        this.editingId.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la modification');
        this.saving.set(false);
      },
    });
  }

  deleteLivraison(lv: LivraisonClient): void {
    if (!confirm(`Supprimer la livraison de ${lv.client?.nom} ?`)) return;
    this.api.deleteLivraison(this.tournee()!.id, lv.id).subscribe({
      next: () => this.livraisons.update((list) => list.filter((l) => l.id !== lv.id)),
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur lors de la suppression'),
    });
  }

  toggleClientEntry(): void {
    this.showClientEntry.update((v) => !v);
  }

  openEditChiffres(): void {
    const lignes: { [portionId: number]: number } = {};
    for (const p of this.portions()) lignes[p.id] = 0;
    this.boulangerieRetourLignes.set(lignes);
    this.showEditChiffres.set(true);
    // Load existing breakdown
    this.api.getRetourBoulangerie(this.tournee()!.id).subscribe((res) => {
      const updated: { [portionId: number]: number } = {};
      for (const p of this.portions()) updated[p.id] = 0;
      for (const ligne of res.lignes) updated[ligne.portion_pain_id] = ligne.quantite;
      this.boulangerieRetourLignes.set(updated);
    });
  }

  setBoulangerieRetourLigne(portionId: number, qty: number): void {
    this.boulangerieRetourLignes.update((l) => ({ ...l, [portionId]: qty || 0 }));
  }

  saveChiffres(): void {
    this.saving.set(true);
    this.error.set('');
    const lignes = Object.entries(this.boulangerieRetourLignes())
      .filter(([, qty]) => qty > 0)
      .map(([portionId, qty]) => ({ portion_pain_id: +portionId, quantite: qty }));
    this.api.saveRetourBoulangerie(this.tournee()!.id, lignes).subscribe({
      next: (res) => {
        this.tournee.set(res.tournee);
        this.showEditChiffres.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la modification');
        this.saving.set(false);
      },
    });
  }

  terminer(): void {
    this.api.terminerTournee(this.tournee()!.id).subscribe((t) => this.tournee.set(t));
  }

  // Per-client termination
  openTerminerClient(clientId: number, clientNom: string, montantDu: number): void {
    this.terminerState.set({
      clientId,
      clientNom,
      montantDu,
      encaisser: false,
      modeDette: false,
      montant: montantDu,
      notes: '',
    });
  }

  cancelTerminerClient(): void {
    this.terminerState.set(null);
  }

  setTerminerMode(mode: 'none' | 'encaisser' | 'dette'): void {
    const s = this.terminerState();
    if (!s) return;
    if (mode === 'none') {
      this.terminerState.set({ ...s, encaisser: false, modeDette: false });
    } else if (mode === 'encaisser') {
      this.terminerState.set({ ...s, encaisser: true, modeDette: false, montant: s.montantDu });
    } else {
      this.terminerState.set({ ...s, encaisser: false, modeDette: true });
    }
  }

  setTerminerMontant(v: number): void {
    const s = this.terminerState();
    if (s) this.terminerState.set({ ...s, montant: v });
  }

  setTerminerNotes(v: string): void {
    const s = this.terminerState();
    if (s) this.terminerState.set({ ...s, notes: v });
  }

  confirmerTerminerClient(): void {
    const state = this.terminerState();
    if (!state) return;
    this.terminerSaving.set(true);
    this.error.set('');

    const payload: any = { notes: state.notes || undefined };

    if (state.encaisser || state.modeDette) {
      payload.encaisser = true;
      payload.type_encaissement = state.modeDette ? 'dette' : 'complet';
      payload.montant = state.modeDette ? 0 : state.montant;
    }

    this.api.terminerClient(this.tournee()!.id, state.clientId, payload).subscribe({
      next: (t) => {
        this.tournee.set(t);
        this.api.getLivraisons(this.tournee()!.id).subscribe((lv) => this.livraisons.set(lv));
        this.terminerState.set(null);
        this.terminerSaving.set(false);
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la clôture');
        this.terminerSaving.set(false);
      },
    });
  }
}
