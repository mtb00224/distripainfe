import { Component, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { Depense, CategorieDepense } from '../../../core/models/production.models';

@Component({
  selector: 'app-depenses',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dépenses</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Suivi des sorties d'argent de la boulangerie</p>
        </div>
        <button (click)="showForm.set(true)" class="btn-primary">+ Nouvelle dépense</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Formulaire -->
      @if (showForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Enregistrer une dépense</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Date</label>
                <input type="datetime-local" formControlName="date_enregistrement" class="input-field" />
              </div>
              <div>
                <label class="label">Catégorie *</label>
                <select formControlName="categorie_id" class="input-field">
                  <option value="">-- Choisir --</option>
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.nom }}</option>
                  }
                </select>
              </div>
            </div>
            <div>
              <label class="label">Motif *</label>
              <input type="text" formControlName="motif" class="input-field" placeholder="Ex: Achat farine 50kg" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Quantité</label>
                <input type="number" formControlName="quantite" class="input-field" min="0" step="0.01" placeholder="1" />
              </div>
              <div>
                <label class="label">Prix unitaire (FCFA) *</label>
                <input type="number" formControlName="prix_unitaire" class="input-field" min="0" step="1" placeholder="Ex: 25000" />
              </div>
            </div>
            @if (form.value.quantite && form.value.prix_unitaire) {
              <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2 text-sm">
                <span class="text-gray-500">Total : </span>
                <span class="font-bold text-amber-700 dark:text-amber-300">
                  {{ (form.value.quantite || 0) * (form.value.prix_unitaire || 0) | number:'1.0-0' }} FCFA
                </span>
              </div>
            }
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Enregistrer }
              </button>
              <button type="button" class="btn-secondary" (click)="cancelForm()">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Filtres dates -->
      <div class="card flex flex-wrap gap-3 items-end">
        <div>
          <label class="label">Du</label>
          <input type="date" [(ngModel)]="filterDebut" class="input-field" />
        </div>
        <div>
          <label class="label">Au</label>
          <input type="date" [(ngModel)]="filterFin" class="input-field" />
        </div>
        <button (click)="load()" class="btn-secondary">Filtrer</button>
        <button (click)="clearFilter()" class="text-sm text-gray-400 hover:text-gray-600">Effacer</button>
        @if (depenses().length > 0) {
          <div class="ml-auto text-sm">
            Total période : <span class="font-bold text-amber-600">{{ totalPeriode() | number:'1.0-0' }} FCFA</span>
          </div>
        }
      </div>

      <!-- Liste -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (depenses().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">💸</div>
          <p>Aucune dépense enregistrée</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (d of depenses(); track d.id) {
            <div class="card">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">💸</div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ d.motif }}</p>
                    <div class="flex gap-3 text-xs text-gray-400 mt-0.5">
                      <span class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ d.categorie_nom }}</span>
                      <span>{{ formatDate(d.date_enregistrement) }}</span>
                      @if (d.quantite !== 1) {
                        <span>{{ d.quantite }} × {{ d.prix_unitaire | number:'1.0-0' }}</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="font-bold text-red-600">-{{ d.montant_total | number:'1.0-0' }} FCFA</span>
                  <button (click)="delete(d)" class="text-xs text-red-400 hover:text-red-600">Suppr.</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DepensesComponent {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  depenses = signal<Depense[]>([]);
  categories = signal<CategorieDepense[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  error = signal('');
  success = signal('');

  filterDebut = '';
  filterFin = '';

  form = this.fb.group({
    categorie_id: [null as number | null, Validators.required],
    motif: ['', Validators.required],
    quantite: [1 as number | null],
    prix_unitaire: [null as number | null, [Validators.required, Validators.min(1)]],
    date_enregistrement: [this.nowLocal()],
  });

  constructor() {
    this.service.getCategories().subscribe({ next: (c) => this.categories.set(c) });
    effect(() => {
      if (this.service.boulangerieActiveId() !== null) this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterDebut) params.date_debut = this.filterDebut;
    if (this.filterFin) params.date_fin = this.filterFin;
    this.service.getDepenses(params).subscribe({
      next: (d) => { this.depenses.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilter(): void {
    this.filterDebut = '';
    this.filterFin = '';
    this.load();
  }

  totalPeriode(): number {
    return this.depenses().reduce((sum, d) => sum + d.montant_total, 0);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.value;
    this.service.createDepense({
      categorie_id: v.categorie_id!,
      motif: v.motif!,
      quantite: v.quantite ?? 1,
      prix_unitaire: v.prix_unitaire!,
      date_enregistrement: v.date_enregistrement ? new Date(v.date_enregistrement).toISOString() : undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.success.set('Dépense enregistrée');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.form.reset({ quantite: 1, date_enregistrement: this.nowLocal() });
  }

  delete(d: Depense): void {
    if (!confirm(`Supprimer "${d.motif}" (${d.montant_total} FCFA) ?`)) return;
    this.service.deleteDepense(d.id).subscribe({
      next: () => { this.success.set('Dépense supprimée'); this.load(); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private nowLocal(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}
