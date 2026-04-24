import { Component, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { ProduitAmbulateur } from '../../../core/models/production.models';

@Component({
  selector: 'app-vente-ambulatoire',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Vente ambulatoire</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Catalogue des produits vendus en ambulatoire</p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nouveau produit</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Formulaire création / édition -->
      @if (showForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {{ editingId() ? 'Modifier le produit' : 'Nouveau produit ambulatoire' }}
          </h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="label">Nom du produit *</label>
              <input type="text" formControlName="nom" class="input-field" placeholder="Ex: Baguette, Pain de mie..." />
            </div>
            <div>
              <label class="label">Description</label>
              <input type="text" formControlName="description" class="input-field" placeholder="Description optionnelle" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Unité</label>
                <input type="text" formControlName="unite" class="input-field" placeholder="pièce, kg, sachet..." />
              </div>
              <div>
                <label class="label">Prix unitaire (FCFA) *</label>
                <input type="number" formControlName="prix_unitaire" class="input-field" min="0" step="1" placeholder="Ex: 150" />
              </div>
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Enregistrer }
              </button>
              <button type="button" class="btn-secondary" (click)="cancelForm()">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Liste des produits -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (produits().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🛒</div>
          <p>Aucun produit ambulatoire configuré</p>
          <p class="text-sm mt-2">Ajoutez vos produits pour définir votre catalogue ambulatoire</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (p of produits(); track p.id) {
            <div class="card">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl flex-shrink-0">
                    🛒
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ p.nom }}</p>
                    <div class="flex gap-3 text-xs text-gray-400 mt-0.5">
                      @if (p.description) { <span>{{ p.description }}</span> }
                      @if (p.unite) {
                        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ p.unite }}</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-4 flex-shrink-0">
                  <div class="text-right">
                    <p class="font-bold text-amber-600">{{ p.prix_unitaire | number:'1.0-0' }} FCFA</p>
                    <p class="text-xs text-gray-400">/ {{ p.unite || 'unité' }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button (click)="openEdit(p)" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                      Modifier
                    </button>
                    <button (click)="delete(p)" class="text-xs text-red-400 hover:text-red-600">
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class VenteAmbulatorireComponent {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  produits = signal<ProduitAmbulateur[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  error = signal('');
  success = signal('');

  form = this.fb.group({
    nom: ['', Validators.required],
    description: [''],
    unite: [''],
    prix_unitaire: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      if (this.service.boulangerieActiveId() !== null) this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getProduitsAmbulateurs().subscribe({
      next: (d) => { this.produits.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(p: ProduitAmbulateur): void {
    this.editingId.set(p.id);
    this.form.patchValue({
      nom: p.nom,
      description: p.description ?? '',
      unite: p.unite ?? '',
      prix_unitaire: p.prix_unitaire,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.value;
    const payload = {
      nom: v.nom!,
      description: v.description || undefined,
      unite: v.unite || undefined,
      prix_unitaire: v.prix_unitaire!,
    };
    const id = this.editingId();
    const action = id
      ? this.service.updateProduitAmbulateur(id, payload)
      : this.service.createProduitAmbulateur(payload);
    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.success.set(id ? 'Produit mis à jour' : 'Produit ajouté');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }

  delete(p: ProduitAmbulateur): void {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return;
    this.service.deleteProduitAmbulateur(p.id).subscribe({
      next: () => {
        this.success.set('Produit supprimé');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => this.error.set(err.error?.detail ?? 'Erreur'),
    });
  }
}
