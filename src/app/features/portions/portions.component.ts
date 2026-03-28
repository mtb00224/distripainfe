import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PortionPain } from '../../core/models/portion_pain.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-portions',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Portions de pain" subtitle="Configurez les tranches de pain vendues par vos clients" />

    @if (error()) {
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div>
    }

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="max-w-lg space-y-4">
        <!-- Add form -->
        <div class="card">
          <h2 class="section-title mb-4">{{ editingId() ? 'Modifier la portion' : 'Ajouter une portion' }}</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
            <div>
              <label class="label">Nom de la portion *</label>
              <input type="text" formControlName="nom" class="input-field" placeholder="Ex: Morceau 50" />
            </div>
            <div>
              <label class="label">Prix{{ devise() ? ' (' + devise() + ')' : '' }} *</label>
              <input type="number" formControlName="prix_fcfa" class="input-field" min="1" placeholder="Ex: 50" />
            </div>
            <div class="flex gap-2">
              <button type="submit" class="btn-primary" [disabled]="saving() || form.invalid">
                @if (saving()) { Enregistrement... } @else { {{ editingId() ? 'Modifier' : 'Ajouter' }} }
              </button>
              @if (editingId()) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Annuler</button>
              }
            </div>
          </form>
        </div>

        <!-- List -->
        <div class="card">
          <h2 class="section-title mb-3">Portions configurées</h2>
          <div class="space-y-2">
            @for (p of portions(); track p.id) {
              <div class="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div>
                  <p class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ p.nom }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ p.prix_fcfa }} {{ devise() }}</p>
                </div>
                <div class="flex gap-2">
                  <button (click)="startEdit(p)" class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded">✏️</button>
                  <button (click)="confirmDelete(p)" class="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded">🗑️</button>
                </div>
              </div>
            }
            @if (portions().length === 0) {
              <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-4">Aucune portion configurée</p>
            }
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [visible]="showConfirm()"
      title="Supprimer la portion"
      [message]="'Supprimer ' + (toDelete()?.nom ?? '') + ' ?'"
      (confirm)="doDelete()"
      (cancel)="showConfirm.set(false)"
    />
  `,
})
export class PortionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  devise = computed(() => this.auth.currentUser()?.pays?.devise_code ?? '');

  portions = signal<PortionPain[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editingId = signal<number | null>(null);
  showConfirm = signal(false);
  toDelete = signal<PortionPain | null>(null);

  form = this.fb.group({
    nom: ['', Validators.required],
    prix_fcfa: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPortions().subscribe({
      next: (p) => { this.portions.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEdit(p: PortionPain): void {
    this.editingId.set(p.id);
    this.form.patchValue({ nom: p.nom, prix_fcfa: p.prix_fcfa });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const payload = { nom: this.form.value.nom!, prix_fcfa: this.form.value.prix_fcfa! };

    const obs = this.editingId()
      ? this.api.updatePortion(this.editingId()!, payload)
      : this.api.createPortion(payload);

    obs.subscribe({
      next: () => { this.form.reset(); this.editingId.set(null); this.saving.set(false); this.load(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.saving.set(false); },
    });
  }

  confirmDelete(p: PortionPain): void { this.toDelete.set(p); this.showConfirm.set(true); }
  doDelete(): void {
    this.api.deletePortion(this.toDelete()!.id).subscribe({
      next: () => { this.showConfirm.set(false); this.load(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.showConfirm.set(false); },
    });
  }
}
