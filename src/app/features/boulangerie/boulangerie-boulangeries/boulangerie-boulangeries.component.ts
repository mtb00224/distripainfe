import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { BoulangerieResponse } from '../../../core/models/admin_boulangerie.models';

@Component({
  selector: 'app-boulangerie-boulangeries',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes boulangeries</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Gérez vos établissements</p>
        </div>
        <button (click)="openCreate()" class="btn-primary">+ Nouvelle boulangerie</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Create / Edit form -->
      @if (showForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {{ editingId() ? 'Modifier la boulangerie' : 'Nouvelle boulangerie' }}
          </h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="label">Nom *</label>
              <input type="text" formControlName="nom" class="input-field" placeholder="Boulangerie du Soleil" />
            </div>
            <div>
              <label class="label">Contact</label>
              <input type="text" formControlName="contact" class="input-field" placeholder="+221 77 000 00 00" />
            </div>
            <div>
              <label class="label">Adresse</label>
              <input type="text" formControlName="address" class="input-field" placeholder="Dakar, Plateau" />
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

      <!-- List -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (boulangeries().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🥖</div>
          <p>Aucune boulangerie créée</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (b of boulangeries(); track b.id) {
            <div class="card">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ b.nom }}</p>
                    @if (isActive(b)) {
                      <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Active</span>
                    }
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      [class.bg-green-100]="b.is_active" [class.text-green-700]="b.is_active"
                      [class.bg-gray-100]="!b.is_active" [class.text-gray-500]="!b.is_active">
                      {{ b.is_active ? 'Ouverte' : 'Fermée' }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 space-x-3">
                    @if (b.address) { <span>📍 {{ b.address }}</span> }
                    @if (b.contact) { <span>📞 {{ b.contact }}</span> }
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  @if (!isActive(b)) {
                    <button (click)="switchTo(b)" class="text-xs text-amber-600 hover:underline">Activer</button>
                  }
                  <button (click)="openEdit(b)" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">Modifier</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BoulangerieBoulangeries implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  boulangeries = signal<BoulangerieResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  error = signal('');
  success = signal('');

  form = this.fb.group({
    nom: ['', Validators.required],
    contact: [''],
    address: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getBoulangeries(true).subscribe({
      next: (d) => { this.boulangeries.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isActive(b: BoulangerieResponse): boolean {
    return b.id === this.service.boulangerieActiveId();
  }

  switchTo(b: BoulangerieResponse): void {
    this.service.switchBoulangerie(b.id).subscribe({
      next: () => { this.success.set(`Boulangerie active : ${b.nom}`); setTimeout(() => this.success.set(''), 3000); },
      error: () => {},
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(b: BoulangerieResponse): void {
    this.editingId.set(b.id);
    this.form.patchValue({
      nom: b.nom,
      contact: b.contact ?? '',
      address: b.address ?? '',
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
    const payload = {
      nom: this.form.value.nom!,
      contact: this.form.value.contact || undefined,
      address: this.form.value.address || undefined,
    };
    const id = this.editingId();
    const action = id
      ? this.service.updateBoulangerie(id, payload)
      : this.service.createBoulangerie(payload);
    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.success.set(id ? 'Boulangerie mise à jour' : 'Boulangerie créée');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur');
        this.saving.set(false);
      },
    });
  }
}
