import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClientWithPending, PendingTournee } from '../../../core/models/encaissement.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-encaissement-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DecimalPipe, NgClass, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Encaissement" subtitle="Enregistrer un paiement ou une dette" />

    @if (error()) {
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
        {{ error() }}
      </div>
    }

    <div class="max-w-2xl space-y-4">

      <!-- ── STEP 1 : Mode ─────────────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title mb-3">Mode</h2>
        <div class="grid grid-cols-2 gap-2">
          <button type="button"
            class="py-2.5 rounded-lg text-sm font-medium transition-colors border"
            [ngClass]="!modeDette()
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-amber-400'"
            (click)="modeDette.set(false)">
            💵 Encaisser un paiement
          </button>
          <button type="button"
            class="py-2.5 rounded-lg text-sm font-medium transition-colors border"
            [ngClass]="modeDette()
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400'"
            (click)="modeDette.set(true)">
            📋 Reporter une dette
          </button>
        </div>
        @if (modeDette()) {
          <p class="mt-2 text-xs text-purple-600 dark:text-purple-400">
            Les tournées sélectionnées seront enregistrées comme dette. Le solde ne sera pas réduit maintenant.
          </p>
        }
      </div>

      <!-- ── STEP 2 : Client ───────────────────────────────────────────────── -->
      <div class="card">
        <h2 class="section-title mb-3">1. Client</h2>
        @if (loadingClients()) {
          <app-loading-spinner />
        } @else if (clientsWithPending().length === 0) {
          <div class="text-center py-4 text-gray-400 text-sm">✅ Tous les clients sont à jour</div>
        } @else {
          <input type="search"
            [ngModel]="searchClients()"
            (ngModelChange)="searchClients.set($event)"
            class="input-field mb-3"
            placeholder="🔍 Rechercher par nom ou téléphone..." />
          @if (filteredClients().length === 0) {
            <p class="text-sm text-gray-400 text-center py-2">Aucun résultat</p>
          } @else {
            <div class="space-y-2">
              @for (c of filteredClients(); track c.client_id) {
                <button type="button"
                  class="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left"
                  [ngClass]="selectedClient()?.client_id === c.client_id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-600'"
                  (click)="selectClient(c)">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="font-semibold text-gray-900 dark:text-gray-100">{{ c.client_nom }}</p>
                      @if (c.zone_nom) {
                        <span class="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          📍 {{ c.zone_nom }}
                        </span>
                      }
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ c.nb_tournees_pending }} tournée(s) non soldée(s)
                      @if (c.telephone) { · {{ c.telephone }} }
                    </p>
                  </div>
                  <div class="text-right ml-2 flex-shrink-0">
                    <p class="text-sm font-bold text-red-500">{{ c.montant_total_pending | number:'1.0-0' }} {{ devise() }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">solde : {{ c.solde_actuel | number:'1.0-0' }}</p>
                  </div>
                </button>
              }
            </div>
          }
        }
      </div>

      <!-- ── STEP 3 : Tournées ─────────────────────────────────────────────── -->
      @if (selectedClient()) {
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title">2. Tournées non soldées</h2>
            @if (pendingTournees().length > 0) {
              <button (click)="selectAll()" class="text-sm text-amber-600 dark:text-amber-400 hover:underline">
                Tout sélectionner
              </button>
            }
          </div>

          @if (loadingTournees()) {
            <app-loading-spinner />
          } @else if (pendingTournees().length === 0) {
            <p class="text-center py-4 text-gray-400 text-sm">✅ Aucune tournée en attente</p>
          } @else {
            <div class="space-y-2">
              @for (t of pendingTournees(); track t.tournee_id) {
                @let isSelected = selectedTourneeIds().has(t.tournee_id);
                <button type="button"
                  class="w-full text-left p-3 rounded-lg border-2 transition-all"
                  [ngClass]="isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-600'"
                  (click)="toggleTournee(t)">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <!-- Checkbox visuel -->
                      <div class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        [ngClass]="isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-gray-400 dark:border-gray-500'">
                        @if (isSelected) {
                          <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {{ t.tournee_date }} — {{ t.tournee_periode }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ t.nb_pains_nets }} pain(s) net(s)
                        </p>
                      </div>
                    </div>
                    <div class="text-right ml-2 flex-shrink-0">
                      @if (t.montant_deja_paye > 0) {
                        <p class="text-xs text-gray-400 dark:text-gray-500 line-through">{{ t.total_montant_du | number:'1.0-0' }} {{ devise() }}</p>
                        <p class="text-xs text-green-600 dark:text-green-400">Payé : {{ t.montant_deja_paye | number:'1.0-0' }}</p>
                      }
                      <p class="font-bold text-sm"
                        [ngClass]="t.dette_id ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'">
                        {{ t.montant_restant | number:'1.0-0' }} {{ devise() }}
                        @if (t.dette_id) { <span class="text-xs font-normal">(dette)</span> }
                      </p>
                    </div>
                  </div>
                </button>
              }
            </div>

            <!-- Récapitulatif sélection -->
            @if (selectedTourneeIds().size > 0) {
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ selectedTourneeIds().size }} tournée(s)
                </span>
                <span class="font-bold text-lg text-red-500 dark:text-red-400">
                  {{ totalRestantSelected() | number:'1.0-0' }} {{ devise() }}
                </span>
              </div>
            }
          }
        </div>

        <!-- ── STEP 4 : Paiement ─────────────────────────────────────────── -->
        @if (selectedTourneeIds().size > 0 && !modeDette()) {
          <div class="card">
            <h2 class="section-title mb-3">3. Montant encaissé</h2>

            <div class="mb-3">
              <label class="label">Montant{{ devise() ? ' (' + devise() + ')' : '' }} *</label>
              <input type="number"
                [(ngModel)]="montantValue"
                class="input-field text-xl font-bold"
                min="0" step="1"
                [placeholder]="totalRestantSelected() | number:'1.0-0'" />
            </div>

            <!-- Indicateur de type -->
            @if (montantValue > 0) {
              @let type = paymentType();
              <div class="flex items-center gap-2 p-3 rounded-lg mb-3"
                [ngClass]="{
                  'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800': type === 'complet',
                  'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800': type === 'partiel'
                }">
                <span>{{ type === 'complet' ? '✅' : '⚠️' }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ type === 'complet' ? 'Paiement complet — tournée(s) soldée(s)' : 'Paiement partiel' }}
                  </p>
                  @if (type === 'partiel') {
                    @let reste = totalRestantSelected() - montantValue;
                    <p class="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                      Reste {{ reste | number:'1.0-0' }} {{ devise() }} → enregistré comme dette
                    </p>
                  }
                </div>
              </div>
            }

            <div class="mb-3">
              <label class="label">Notes</label>
              <textarea [(ngModel)]="notesValue" class="input-field" rows="2" placeholder="Remarque optionnelle"></textarea>
            </div>

            <div class="flex gap-3">
              <button type="button" class="btn-primary"
                [disabled]="loading() || montantValue <= 0"
                (click)="submit()">
                {{ loading() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
              <button type="button" class="btn-secondary" (click)="router.navigate(['/encaissements'])">
                Annuler
              </button>
            </div>
          </div>
        }

        <!-- ── Mode dette : pas de montant, juste confirmer ──────────────── -->
        @if (selectedTourneeIds().size > 0 && modeDette()) {
          <div class="card border-l-4 border-purple-500">
            <h2 class="section-title mb-2">3. Confirmer la dette</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Un montant de
              <span class="font-bold text-purple-600 dark:text-purple-400">
                {{ totalRestantSelected() | number:'1.0-0' }} {{ devise() }}
              </span>
              sera enregistré comme dette pour
              <span class="font-medium">{{ selectedClient()!.client_nom }}</span>.
            </p>
            <div class="mb-3">
              <label class="label">Notes</label>
              <textarea [(ngModel)]="notesValue" class="input-field" rows="2" placeholder="Raison de la dette..."></textarea>
            </div>
            <div class="flex gap-3">
              <button type="button" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [disabled]="loading()"
                (click)="submit()">
                {{ loading() ? 'Enregistrement...' : 'Reporter comme dette' }}
              </button>
              <button type="button" class="btn-secondary" (click)="router.navigate(['/encaissements'])">
                Annuler
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class EncaissementFormComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  devise = computed(() => this.auth.currentUser()?.pays?.devise_code ?? '');

  // State
  loadingClients = signal(true);
  loadingTournees = signal(false);
  loading = signal(false);
  error = signal('');
  modeDette = signal(false);

  clientsWithPending = signal<ClientWithPending[]>([]);
  selectedClient = signal<ClientWithPending | null>(null);
  pendingTournees = signal<PendingTournee[]>([]);
  selectedTourneeIds = signal<Set<number>>(new Set());

  // Form values (plain variables instead of FormGroup for simplicity)
  montantValue = 0;
  notesValue = '';
  searchClients = signal('');

  // Computed
  filteredClients = computed(() => {
    const q = this.searchClients().toLowerCase().trim();
    if (!q) return this.clientsWithPending();
    return this.clientsWithPending().filter((c) =>
      c.client_nom.toLowerCase().includes(q) ||
      (c.telephone ?? '').toLowerCase().includes(q)
    );
  });

  totalRestantSelected = computed(() => {
    const ids = this.selectedTourneeIds();
    return this.pendingTournees()
      .filter((t) => ids.has(t.tournee_id))
      .reduce((sum, t) => sum + t.montant_restant, 0);
  });

  paymentType = computed((): 'complet' | 'partiel' => {
    const montant = this.montantValue;
    const total = this.totalRestantSelected();
    if (!total || montant <= 0) return 'partiel';
    return montant >= total ? 'complet' : 'partiel';
  });

  ngOnInit(): void {
    this.api.getClientsWithPending().subscribe({
      next: (c) => { this.clientsWithPending.set(c); this.loadingClients.set(false); },
      error: () => this.loadingClients.set(false),
    });

    // Support pre-selecting a client from query param
    const clientId = this.route.snapshot.queryParamMap.get('client_id');
    if (clientId) {
      this.api.getClientsWithPending().subscribe((clients) => {
        const found = clients.find((c) => c.client_id === +clientId);
        if (found) this.selectClient(found);
      });
    }
  }

  selectClient(c: ClientWithPending): void {
    if (this.selectedClient()?.client_id === c.client_id) return;
    this.selectedClient.set(c);
    this.selectedTourneeIds.set(new Set());
    this.montantValue = 0;
    this.notesValue = '';
    this.error.set('');
    this.loadingTournees.set(true);
    this.api.getPendingTournees(c.client_id).subscribe({
      next: (t) => { this.pendingTournees.set(t); this.loadingTournees.set(false); },
      error: () => this.loadingTournees.set(false),
    });
  }

  toggleTournee(t: PendingTournee): void {
    this.selectedTourneeIds.update((ids) => {
      const next = new Set(ids);
      next.has(t.tournee_id) ? next.delete(t.tournee_id) : next.add(t.tournee_id);
      return next;
    });
    // Pre-fill montant with total restant of selected tournées
    this.montantValue = this.totalRestantSelected();
  }

  selectAll(): void {
    this.selectedTourneeIds.set(new Set(this.pendingTournees().map((t) => t.tournee_id)));
    this.montantValue = this.totalRestantSelected();
  }

  submit(): void {
    const client = this.selectedClient();
    if (!client) return;

    const ids = this.selectedTourneeIds();
    const allLivraisonIds = this.pendingTournees()
      .filter((t) => ids.has(t.tournee_id))
      .flatMap((t) => t.livraison_ids);

    if (allLivraisonIds.length === 0) {
      this.error.set('Sélectionnez au moins une tournée');
      return;
    }

    if (!this.modeDette() && this.montantValue <= 0) {
      this.error.set('Entrez un montant');
      return;
    }

    const type = this.modeDette() ? 'dette' : this.paymentType();
    const montant = this.modeDette() ? 0 : this.montantValue;

    this.loading.set(true);
    this.error.set('');

    this.api.createEncaissement({
      client_id: client.client_id,
      montant,
      livraisons_soldees: allLivraisonIds,
      type: type as any,
      notes: this.notesValue || undefined,
    }).subscribe({
      next: () => this.router.navigate(['/encaissements']),
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.loading.set(false); },
    });
  }
}
