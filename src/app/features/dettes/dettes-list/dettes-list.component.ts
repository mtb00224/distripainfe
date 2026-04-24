import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Dette } from '../../../core/models/dette.models';
import { Client } from '../../../core/models/client.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dettes-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, FormsModule, ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Dettes" subtitle="Suivi des impayés et règlements" />

    <!-- Filtres + Bouton créer -->
    <div class="flex flex-wrap gap-3 mb-4 items-center">
      <input type="search"
        [ngModel]="searchQuery()"
        (ngModelChange)="searchQuery.set($event)"
        class="input-field flex-1 min-w-40"
        placeholder="🔍 Nom ou téléphone..." />
      <select [formControl]="fb.control(null)" (change)="onClientFilter($event)"
        class="input-field sm:w-48">
        <option [value]="null">Tous les clients</option>
        @for (c of clients(); track c.id) {
          <option [value]="c.id">{{ c.nom }}{{ c.zone?.nom ? ' (' + c.zone!.nom + ')' : '' }}</option>
        }
      </select>
      <select (change)="onStatutFilter($event)" class="input-field sm:w-40">
        <option value="">Tous statuts</option>
        <option value="en_cours">En cours</option>
        <option value="soldee_partiellement">Part. soldée</option>
        <option value="soldee_totalement">Soldée</option>
      </select>
      <div class="ml-auto flex gap-2">
        <button (click)="showCreateForm.set(!showCreateForm())"
          class="btn-primary">
          {{ showCreateForm() ? 'Annuler' : '+ Nouvelle dette' }}
        </button>
      </div>
    </div>

    <!-- Formulaire création manuelle -->
    @if (showCreateForm()) {
      <div class="card mb-4 border-l-4 border-amber-500">
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3">Enregistrer une dette</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Client *</label>
            <select [formControl]="createClientCtrl" class="input-field">
              <option [value]="null">Choisir un client</option>
              @for (c of clients(); track c.id) {
                <option [value]="c.id">{{ c.nom }}{{ c.zone?.nom ? ' (' + c.zone!.nom + ')' : '' }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Montant *</label>
            <input type="number" [formControl]="createMontantCtrl" class="input-field" placeholder="0" min="1" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Notes</label>
            <input type="text" [formControl]="createNotesCtrl" class="input-field" placeholder="Raison de la dette..." />
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button (click)="createDette()" [disabled]="createLoading()"
            class="btn-primary">
            {{ createLoading() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          @if (createError()) {
            <p class="text-red-500 text-sm self-center">{{ createError() }}</p>
          }
        </div>
      </div>
    }

    <!-- Stats rapides -->
    @if (!loading()) {
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="card text-center py-3">
          <p class="text-2xl font-bold text-red-500">{{ nbEnCours() }}</p>
          <p class="text-xs text-gray-500">En cours</p>
        </div>
        <div class="card text-center py-3">
          <p class="text-2xl font-bold text-amber-500">{{ totalRestant() | number:'1.0-0' }}</p>
          <p class="text-xs text-gray-500">restant</p>
        </div>
        <div class="card text-center py-3">
          <p class="text-2xl font-bold text-green-500">{{ nbSoldees() }}</p>
          <p class="text-xs text-gray-500">Soldées</p>
        </div>
      </div>
    }

    @if (loading()) { <app-loading-spinner /> }
    @else {
      <div class="space-y-3">
        @for (d of filteredDettes(); track d.id) {
          <div class="card">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p class="font-semibold text-gray-900 dark:text-gray-100">{{ d.client_nom }}</p>
                  @if (d.zone_nom) {
                    <span class="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      📍 {{ d.zone_nom }}
                    </span>
                  }
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [ngClass]="{
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': d.statut === 'en_cours',
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300': d.statut === 'soldee_partiellement',
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300': d.statut === 'soldee_totalement'
                    }">
                    {{ statutLabel(d.statut) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">Créée le {{ d.created_at | date:'dd/MM/yyyy' }}</p>
                @if (d.notes) {
                  <p class="text-xs text-gray-400 italic mt-0.5">{{ d.notes }}</p>
                }
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">
                  Initial : <span class="font-medium">{{ d.montant_initial | number:'1.0-0' }} {{ getClientDevise(d.client_id) }}</span>
                </p>
                @if (d.statut !== 'soldee_totalement') {
                  <p class="text-lg font-bold text-red-500">
                    Restant : {{ d.montant_restant | number:'1.0-0' }} {{ getClientDevise(d.client_id) }}
                  </p>
                } @else {
                  <p class="text-sm font-bold text-green-500">Soldée ✓</p>
                }
              </div>
            </div>

            <!-- Réglements -->
            @if (d.reglements.length > 0) {
              <div class="border-t border-gray-100 dark:border-gray-700 pt-2 mb-3">
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Réglements</p>
                <div class="space-y-1">
                  @for (r of d.reglements; track r.id) {
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">{{ r.date_reglement | date:'dd/MM/yyyy' }}
                        @if (r.notes) { <span class="italic text-gray-400"> — {{ r.notes }}</span> }
                      </span>
                      <span class="text-green-600 font-medium">+ {{ r.montant | number:'1.0-0' }} {{ getClientDevise(d.client_id) }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Actions -->
            @if (d.statut !== 'soldee_totalement') {
              <div class="flex gap-2 flex-wrap border-t border-gray-100 dark:border-gray-700 pt-3">
                <!-- Solder totalement -->
                <button (click)="solderTotal(d)"
                  class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">
                  ✓ Solder ({{ d.montant_restant | number:'1.0-0' }} {{ getClientDevise(d.client_id) }})
                </button>
                <!-- Solder partiellement -->
                @if (expandedPartiel() === d.id) {
                  <div class="flex items-center gap-2">
                    <input type="number"
                      [(ngModel)]="partielMontant"
                      [ngModelOptions]="{standalone: true}"
                      class="input-field w-28 text-sm py-1"
                      placeholder="Montant" min="1" [max]="d.montant_restant" />
                    <input type="text"
                      [(ngModel)]="partielNotes"
                      [ngModelOptions]="{standalone: true}"
                      class="input-field w-32 text-sm py-1"
                      placeholder="Notes" />
                    <button (click)="solderPartiel(d)"
                      class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg transition-colors">
                      OK
                    </button>
                    <button (click)="expandedPartiel.set(null)"
                      class="text-gray-400 hover:text-gray-600 text-xs">Annuler</button>
                  </div>
                } @else {
                  <button (click)="expandedPartiel.set(d.id); partielMontant = 0; partielNotes = ''"
                    class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg transition-colors">
                    Solde partiel
                  </button>
                }
              </div>
            }

            <!-- Supprimer -->
            <div class="flex justify-end mt-2">
              <button (click)="deleteDette(d)"
                class="text-xs text-red-400 hover:text-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        }

        @if (dettes().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <div class="text-4xl mb-3">✅</div>
            <p>Aucune dette trouvée</p>
          </div>
        }
      </div>
    }
  `,
})
export class DettesListComponent implements OnInit {
  private api = inject(ApiService);
  fb = inject(FormBuilder);

  getClientDevise(_clientId: number): string {
    return 'FCFA';
  }

  dettes = signal<Dette[]>([]);
  clients = signal<Client[]>([]);
  loading = signal(true);
  showCreateForm = signal(false);
  expandedPartiel = signal<number | null>(null);
  partielMontant = 0;
  partielNotes = '';
  searchQuery = signal('');

  createClientCtrl = this.fb.control<number | null>(null);
  createMontantCtrl = this.fb.control<number>(0);
  createNotesCtrl = this.fb.control<string>('');
  createLoading = signal(false);
  createError = signal('');

  private _clientFilter: number | null = null;
  private _statutFilter = '';

  filteredDettes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.dettes();
    return this.dettes().filter((d) =>
      d.client_nom.toLowerCase().includes(q) ||
      (d.zone_nom ?? '').toLowerCase().includes(q)
    );
  });

  nbEnCours = computed(() => this.dettes().filter((d) => d.statut !== 'soldee_totalement').length);
  nbSoldees = computed(() => this.dettes().filter((d) => d.statut === 'soldee_totalement').length);
  totalRestant = computed(() =>
    this.dettes().filter((d) => d.statut !== 'soldee_totalement').reduce((s, d) => s + d.montant_restant, 0)
  );

  ngOnInit(): void {
    this.api.getClients().subscribe((c) => this.clients.set(c));
    this._loadDettes();
  }

  private _loadDettes(): void {
    this.loading.set(true);
    this.api.getDettes({
      client_id: this._clientFilter ?? undefined,
      statut: this._statutFilter || undefined,
    }).subscribe({
      next: (d) => { this.dettes.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onClientFilter(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this._clientFilter = v ? +v : null;
    this._loadDettes();
  }

  onStatutFilter(e: Event): void {
    this._statutFilter = (e.target as HTMLSelectElement).value;
    this._loadDettes();
  }

  createDette(): void {
    const clientId = this.createClientCtrl.value;
    const montant = this.createMontantCtrl.value;
    if (!clientId || !montant || montant <= 0) {
      this.createError.set('Client et montant requis');
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    this.api.createDette({
      client_id: clientId,
      montant_initial: montant,
      notes: this.createNotesCtrl.value || undefined,
    }).subscribe({
      next: (d) => {
        this.dettes.update((list) => [d, ...list]);
        this.showCreateForm.set(false);
        this.createClientCtrl.reset();
        this.createMontantCtrl.reset(0);
        this.createNotesCtrl.reset('');
        this.createLoading.set(false);
      },
      error: (err) => {
        this.createError.set(err.error?.detail ?? 'Erreur');
        this.createLoading.set(false);
      },
    });
  }

  solderTotal(dette: Dette): void {
    if (!confirm(`Solder totalement ${dette.montant_restant} ${this.getClientDevise(dette.client_id)} pour ${dette.client_nom} ?`)) return;
    this.api.solderDette(dette.id, { montant: dette.montant_restant }).subscribe({
      next: (updated) => this.dettes.update((list) => list.map((d) => d.id === updated.id ? updated : d)),
    });
  }

  solderPartiel(dette: Dette): void {
    if (!this.partielMontant || this.partielMontant <= 0) return;
    this.api.solderDettePartiel(dette.id, {
      montant: this.partielMontant,
      notes: this.partielNotes || undefined,
    }).subscribe({
      next: (updated) => {
        this.dettes.update((list) => list.map((d) => d.id === updated.id ? updated : d));
        this.expandedPartiel.set(null);
      },
      error: (err) => alert(err.error?.detail ?? 'Erreur'),
    });
  }

  deleteDette(dette: Dette): void {
    if (!confirm(`Supprimer cette dette de ${dette.montant_initial} ${this.getClientDevise(dette.client_id)} pour ${dette.client_nom} ?`)) return;
    this.api.deleteDette(dette.id).subscribe({
      next: () => this.dettes.update((list) => list.filter((d) => d.id !== dette.id)),
      error: (err) => alert(err.error?.detail ?? 'Impossible de supprimer'),
    });
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      en_cours: '🔴 En cours',
      soldee_partiellement: '🟡 Part. soldée',
      soldee_totalement: '🟢 Soldée',
    };
    return map[statut] ?? statut;
  }

  sumRestant(list: Dette[]): number {
    return list.reduce((s, d) => s + d.montant_restant, 0);
  }
}
