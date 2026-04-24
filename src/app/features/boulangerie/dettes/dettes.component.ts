import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import {
  DetteBoulangerie,
  DetteBoulangerieType,
  DetteBoulangerieStatut,
  LivreurInterne,
} from '../../../core/models/production.models';

type TabId = 'livreur_doit' | 'boulangerie_doit';

@Component({
  selector: 'app-dettes',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- En-tête -->
      <div class="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dettes</h1>
          @if (boulangerieName()) {
            <p class="text-sm text-gray-500 mt-0.5">{{ boulangerieName() }}</p>
          }
        </div>
        <button (click)="openCreate()" class="btn-primary text-sm">+ Nouvelle dette</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Onglets -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-6">
          <button
            (click)="activeTab.set('livreur_doit')"
            class="pb-3 text-sm font-medium border-b-2 transition-colors"
            [class.border-amber-500]="activeTab() === 'livreur_doit'"
            [class.text-amber-600]="activeTab() === 'livreur_doit'"
            [class.border-transparent]="activeTab() !== 'livreur_doit'"
            [class.text-gray-500]="activeTab() !== 'livreur_doit'">
            Dettes livreurs
            @if (countLivreurDoit() > 0) {
              <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {{ countLivreurDoit() }}
              </span>
            }
          </button>
          <button
            (click)="activeTab.set('boulangerie_doit')"
            class="pb-3 text-sm font-medium border-b-2 transition-colors"
            [class.border-blue-500]="activeTab() === 'boulangerie_doit'"
            [class.text-blue-600]="activeTab() === 'boulangerie_doit'"
            [class.border-transparent]="activeTab() !== 'boulangerie_doit'"
            [class.text-gray-500]="activeTab() !== 'boulangerie_doit'">
            Dettes boulangerie
            @if (countBoulangerieDoit() > 0) {
              <span class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {{ countBoulangerieDoit() }}
              </span>
            }
          </button>
        </nav>
      </div>

      <!-- Résumé -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @if (activeTab() === 'livreur_doit') {
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-amber-600">{{ totalRestantLivreurs() | number:'1.0-0' }}</div>
            <div class="text-xs text-gray-500 mt-1">Total restant dû (FCFA)</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-gray-500">{{ countLivreurDoit() }}</div>
            <div class="text-xs text-gray-500 mt-1">Dettes en cours</div>
          </div>
        } @else {
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ totalRestantBoulangerie() | number:'1.0-0' }}</div>
            <div class="text-xs text-gray-500 mt-1">Total à payer (FCFA)</div>
          </div>
          <div class="card p-4 text-center">
            <div class="text-2xl font-bold text-gray-500">{{ countBoulangerieDoit() }}</div>
            <div class="text-xs text-gray-500 mt-1">Dettes en cours</div>
          </div>
        }
      </div>

      <!-- Filtre statut -->
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm text-gray-500">Afficher :</span>
        @for (s of statutOptions; track s.value) {
          <button
            (click)="filterStatut.set(s.value)"
            class="text-xs px-3 py-1.5 rounded-full border transition-colors"
            [class.bg-amber-500]="filterStatut() === s.value && activeTab() === 'livreur_doit'"
            [class.text-white]="filterStatut() === s.value"
            [class.border-amber-500]="filterStatut() === s.value && activeTab() === 'livreur_doit'"
            [class.bg-blue-500]="filterStatut() === s.value && activeTab() === 'boulangerie_doit'"
            [class.border-blue-500]="filterStatut() === s.value && activeTab() === 'boulangerie_doit'"
            [class.border-gray-300]="filterStatut() !== s.value"
            [class.text-gray-600]="filterStatut() !== s.value">
            {{ s.label }}
          </button>
        }
      </div>

      <!-- Liste -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (filteredDettes().length === 0) {
        <div class="card text-center py-10 text-gray-400">
          <p class="text-lg">Aucune dette</p>
          <p class="text-sm mt-1">
            @if (activeTab() === 'livreur_doit') {
              Aucun livreur ne doit d'argent à la boulangerie.
            } @else {
              La boulangerie n'a aucune dette envers ses livreurs.
            }
          </p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (d of filteredDettes(); track d.id) {
            <div class="card">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-gray-900 dark:text-gray-100">
                      {{ d.livreur_prenom }} {{ d.livreur_nom }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-yellow-100]="d.statut === 'en_attente'"
                      [class.text-yellow-700]="d.statut === 'en_attente'"
                      [class.bg-orange-100]="d.statut === 'partiellement_regle'"
                      [class.text-orange-700]="d.statut === 'partiellement_regle'"
                      [class.bg-green-100]="d.statut === 'regle'"
                      [class.text-green-700]="d.statut === 'regle'"
                      [class.bg-gray-100]="d.statut === 'annule'"
                      [class.text-gray-500]="d.statut === 'annule'">
                      {{ statutLabel(d.statut) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ d.motif }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ d.created_at | date:'dd/MM/yyyy' }}</p>
                </div>

                <div class="text-right shrink-0">
                  <div class="text-xl font-bold"
                    [class.text-amber-600]="activeTab() === 'livreur_doit'"
                    [class.text-blue-600]="activeTab() === 'boulangerie_doit'">
                    {{ d.montant_restant | number:'1.0-0' }} FCFA
                  </div>
                  @if (d.montant_restant !== d.montant_initial) {
                    <div class="text-xs text-gray-400">sur {{ d.montant_initial | number:'1.0-0' }} initial</div>
                  }
                </div>
              </div>

              <!-- Règlements existants -->
              @if (d.reglements.length > 0) {
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p class="text-xs font-medium text-gray-500 mb-2">Historique des versements :</p>
                  <div class="space-y-1">
                    @for (r of d.reglements; track r.id) {
                      <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{{ r.created_at | date:'dd/MM/yyyy' }} {{ r.notes ? '— ' + r.notes : '' }}</span>
                        <span class="font-medium text-green-600">+{{ r.montant | number:'1.0-0' }} FCFA</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Actions -->
              @if (d.statut !== 'regle' && d.statut !== 'annule') {
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
                  <button (click)="openReglement(d)" class="btn-secondary text-xs">
                    Ajouter un versement
                  </button>
                  <button (click)="marquerRegle(d)" class="text-xs text-green-600 hover:underline">
                    Marquer comme soldé
                  </button>
                  <button (click)="annuler(d)" class="text-xs text-gray-400 hover:underline">
                    Annuler
                  </button>
                  <button (click)="deleteDette(d)" class="text-xs text-red-500 hover:underline ml-auto">
                    Supprimer
                  </button>
                </div>
              } @else {
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button (click)="deleteDette(d)" class="text-xs text-red-500 hover:underline">
                    Supprimer
                  </button>
                </div>
              }

              <!-- Form versement inline -->
              @if (reglementDetteId() === d.id) {
                <div class="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
                  <form [formGroup]="reglementForm" (ngSubmit)="submitReglement(d)" class="flex flex-wrap items-end gap-3">
                    <div>
                      <label class="label text-xs">Montant versé (max {{ d.montant_restant | number:'1.0-0' }})</label>
                      <input type="number" formControlName="montant" class="input-field w-36" step="1" min="1" [max]="d.montant_restant" />
                    </div>
                    <div>
                      <label class="label text-xs">Notes (optionnel)</label>
                      <input type="text" formControlName="notes" class="input-field w-48" placeholder="Ex: paiement espèces" />
                    </div>
                    <div class="flex gap-2">
                      <button type="submit" class="btn-primary text-xs" [disabled]="savingReglement()">
                        @if (savingReglement()) { ... } @else { Valider }
                      </button>
                      <button type="button" class="btn-secondary text-xs" (click)="reglementDetteId.set(null)">Annuler</button>
                    </div>
                  </form>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal création dette -->
    @if (showCreateForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvelle dette</h2>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="space-y-4">
            <div>
              <label class="label">Type *</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors"
                  [class.border-amber-500]="createForm.value.type === 'livreur_doit'"
                  [class.bg-amber-50]="createForm.value.type === 'livreur_doit'">
                  <input type="radio" formControlName="type" value="livreur_doit" class="accent-amber-500" />
                  <div>
                    <p class="text-sm font-medium">Le livreur doit</p>
                    <p class="text-xs text-gray-400">à la boulangerie</p>
                  </div>
                </label>
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors"
                  [class.border-blue-500]="createForm.value.type === 'boulangerie_doit'"
                  [class.bg-blue-50]="createForm.value.type === 'boulangerie_doit'">
                  <input type="radio" formControlName="type" value="boulangerie_doit" class="accent-blue-500" />
                  <div>
                    <p class="text-sm font-medium">La boulangerie doit</p>
                    <p class="text-xs text-gray-400">au livreur</p>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label class="label">Livreur *</label>
              <select formControlName="livreur_interne_id" class="input-field">
                <option value="">— Sélectionner —</option>
                @for (l of livreursInternes(); track l.id) {
                  <option [value]="l.id">{{ l.prenom }} {{ l.nom }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">Motif *</label>
              <input type="text" formControlName="motif" class="input-field" placeholder="Ex: avance sur pains non payés" />
            </div>
            <div>
              <label class="label">Montant (FCFA) *</label>
              <input type="number" formControlName="montant" class="input-field" step="1" min="1" />
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Créer }
              </button>
              <button type="button" class="btn-secondary" (click)="showCreateForm.set(false)">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class DettesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  dettes = signal<DetteBoulangerie[]>([]);
  livreursInternes = signal<LivreurInterne[]>([]);
  loading = signal(false);
  saving = signal(false);
  savingReglement = signal(false);
  error = signal('');
  success = signal('');

  activeTab = signal<TabId>('livreur_doit');
  filterStatut = signal<DetteBoulangerieStatut | 'all'>('en_attente');
  showCreateForm = signal(false);
  reglementDetteId = signal<number | null>(null);

  statutOptions: { value: DetteBoulangerieStatut | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'partiellement_regle', label: 'Partiel' },
    { value: 'regle', label: 'Soldés' },
    { value: 'annule', label: 'Annulés' },
  ];

  boulangerieName = computed(() => this.service.boulangerieActive()?.nom ?? '');

  dettesLivreurDoit = computed(() => this.dettes().filter((d) => d.type === 'livreur_doit'));
  dettesBoulangerieDoit = computed(() => this.dettes().filter((d) => d.type === 'boulangerie_doit'));

  countLivreurDoit = computed(() =>
    this.dettesLivreurDoit().filter((d) => d.statut === 'en_attente' || d.statut === 'partiellement_regle').length
  );
  countBoulangerieDoit = computed(() =>
    this.dettesBoulangerieDoit().filter((d) => d.statut === 'en_attente' || d.statut === 'partiellement_regle').length
  );

  totalRestantLivreurs = computed(() =>
    this.dettesLivreurDoit()
      .filter((d) => d.statut !== 'annule')
      .reduce((s, d) => s + d.montant_restant, 0)
  );
  totalRestantBoulangerie = computed(() =>
    this.dettesBoulangerieDoit()
      .filter((d) => d.statut !== 'annule')
      .reduce((s, d) => s + d.montant_restant, 0)
  );

  filteredDettes = computed(() => {
    const tab = this.activeTab();
    const statut = this.filterStatut();
    const list = tab === 'livreur_doit' ? this.dettesLivreurDoit() : this.dettesBoulangerieDoit();
    return statut === 'all' ? list : list.filter((d) => d.statut === statut);
  });

  createForm = this.fb.group({
    type: ['livreur_doit' as DetteBoulangerieType, Validators.required],
    livreur_interne_id: ['', Validators.required],
    motif: ['', Validators.required],
    montant: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  reglementForm = this.fb.group({
    montant: [null as number | null, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const bid = this.service.boulangerieActiveId();
      if (bid !== null) {
        this.load();
        this.loadLivreurs();
      }
    });
  }

  ngOnInit(): void {
    if (this.service.boulangerieActiveId() === null) {
      this.load();
      this.loadLivreurs();
    }
  }

  load(): void {
    this.loading.set(true);
    this.service.getDettes().subscribe({
      next: (data) => { this.dettes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadLivreurs(): void {
    this.service.getLivreursInternes().subscribe({
      next: (data) => this.livreursInternes.set(data.filter((l) => l.is_active)),
      error: () => {},
    });
  }

  openCreate(): void {
    this.createForm.reset({ type: this.activeTab() as DetteBoulangerieType });
    this.showCreateForm.set(true);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.saving.set(true);
    const v = this.createForm.value;
    this.service.createDette({
      livreur_interne_id: Number(v.livreur_interne_id),
      type: v.type as DetteBoulangerieType,
      motif: v.motif!,
      montant: v.montant!,
    }).subscribe({
      next: (d) => {
        this.dettes.update((list) => [d, ...list]);
        this.showCreateForm.set(false);
        this.saving.set(false);
        this.activeTab.set(d.type as TabId);
        this.flash('Dette créée');
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      },
    });
  }

  openReglement(d: DetteBoulangerie): void {
    this.reglementDetteId.set(d.id);
    this.reglementForm.reset();
  }

  submitReglement(d: DetteBoulangerie): void {
    if (this.reglementForm.invalid) return;
    this.savingReglement.set(true);
    const v = this.reglementForm.value;
    this.service.addReglementDette(d.id, {
      montant: v.montant!,
      notes: v.notes || undefined,
    }).subscribe({
      next: (updated) => {
        this.dettes.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.reglementDetteId.set(null);
        this.savingReglement.set(false);
        this.flash('Versement enregistré');
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.savingReglement.set(false);
      },
    });
  }

  marquerRegle(d: DetteBoulangerie): void {
    if (!confirm('Marquer cette dette comme soldée ?')) return;
    this.service.updateDette(d.id, { statut: 'regle' }).subscribe({
      next: (updated) => {
        this.dettes.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.flash('Dette soldée');
      },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  annuler(d: DetteBoulangerie): void {
    if (!confirm('Annuler cette dette ?')) return;
    this.service.updateDette(d.id, { statut: 'annule' }).subscribe({
      next: (updated) => {
        this.dettes.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.flash('Dette annulée');
      },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  deleteDette(d: DetteBoulangerie): void {
    if (!confirm('Supprimer définitivement cette dette et tout son historique ?')) return;
    this.service.deleteDette(d.id).subscribe({
      next: () => {
        this.dettes.update((list) => list.filter((x) => x.id !== d.id));
        this.flash('Dette supprimée');
      },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  statutLabel(s: DetteBoulangerieStatut): string {
    const m: Record<DetteBoulangerieStatut, string> = {
      en_attente: 'En attente',
      partiellement_regle: 'Partiel',
      regle: 'Soldé',
      annule: 'Annulé',
    };
    return m[s] ?? s;
  }

  private flash(msg: string): void {
    this.success.set(msg);
    this.error.set('');
    setTimeout(() => this.success.set(''), 3000);
  }
}
