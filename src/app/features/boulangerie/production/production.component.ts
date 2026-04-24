import { Component, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { SessionProduction, PeriodeJournee } from '../../../core/models/production.models';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Journal de production</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Suivi des sessions de production pain</p>
        </div>
        <button (click)="showForm.set(true)" class="btn-primary">+ Nouvelle session</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Formulaire nouvelle session -->
      @if (showForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvelle session de production</h2>
          <form [formGroup]="form" (ngSubmit)="submitSession()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Date *</label>
                <input type="date" formControlName="date" class="input-field" />
              </div>
              <div>
                <label class="label">Période *</label>
                <select formControlName="periode" class="input-field">
                  <option value="matin">Matin</option>
                  <option value="soir">Soir</option>
                </select>
              </div>
            </div>
            <div>
              <label class="label">Nombre de pains produits *</label>
              <input type="number" formControlName="nb_pains_produits" class="input-field" min="0" placeholder="Ex: 500" />
            </div>
            <div>
              <label class="label">Pains ambulatoire</label>
              <input type="number" formControlName="nb_pains_ambulatoire" class="input-field" min="0" placeholder="0" />
              <p class="text-xs text-gray-400 mt-1">Le montant est calculé automatiquement selon le prix de vente de la boulangerie.</p>
            </div>
            <div>
              <label class="label">Notes</label>
              <textarea formControlName="notes" class="input-field" rows="2" placeholder="Observations..."></textarea>
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Créer la session }
              </button>
              <button type="button" class="btn-secondary" (click)="cancelForm()">Annuler</button>
            </div>
          </form>
        </div>
      }

      <!-- Liste des sessions -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (sessions().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">🥖</div>
          <p>Aucune session de production enregistrée</p>
          <p class="text-sm mt-2">Créez votre première session pour commencer</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (s of sessions(); track s.id) {
            <div class="card hover:border-amber-200 dark:hover:border-amber-700 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-semibold text-gray-900 dark:text-gray-100">{{ formatDate(s.date) }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-amber-100]="s.periode === 'matin'"
                      [class.text-amber-700]="s.periode === 'matin'"
                      [class.bg-indigo-100]="s.periode === 'soir'"
                      [class.text-indigo-700]="s.periode === 'soir'">
                      {{ s.periode === 'matin' ? '🌅 Matin' : '🌙 Soir' }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-green-100]="s.statut === 'ouverte'"
                      [class.text-green-700]="s.statut === 'ouverte'"
                      [class.bg-gray-100]="s.statut === 'cloturee'"
                      [class.text-gray-600]="s.statut === 'cloturee'">
                      {{ s.statut === 'ouverte' ? 'Ouverte' : 'Clôturée' }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span class="text-gray-400 text-xs block">Produits</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ s.nb_pains_produits }}</span>
                    </div>
                    <div>
                      <span class="text-gray-400 text-xs block">Distribués</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ s.nb_pains_distribues }}</span>
                    </div>
                    <div>
                      <span class="text-gray-400 text-xs block">Vendus</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ s.nb_pains_vendus_total }}</span>
                    </div>
                    <div>
                      <span class="text-gray-400 text-xs block">Encaissé</span>
                      <span class="font-medium text-amber-600">{{ s.montant_encaisse_total | number:'1.0-0' }} FCFA</span>
                    </div>
                  </div>
                </div>
                <a [routerLink]="['/boulangerie/production', s.id]"
                  class="btn-secondary text-sm flex-shrink-0">
                  Détail →
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProductionComponent {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  sessions = signal<SessionProduction[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  error = signal('');
  success = signal('');

  form = this.fb.group({
    date: [new Date().toISOString().split('T')[0], Validators.required],
    periode: ['matin' as PeriodeJournee, Validators.required],
    nb_pains_produits: [null as number | null, [Validators.required, Validators.min(0)]],
    nb_pains_ambulatoire: [null as number | null],
    notes: [''],
  });

  constructor() {
    effect(() => {
      if (this.service.boulangerieActiveId() !== null) this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getSessions().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.sessions.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitSession(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const v = this.form.value;
    this.service.createSession({
      date: v.date!,
      periode: v.periode as PeriodeJournee,
      nb_pains_produits: v.nb_pains_produits!,
      nb_pains_ambulatoire: v.nb_pains_ambulatoire ?? undefined,
      notes: v.notes || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.success.set('Session créée avec succès');
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      },
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.form.reset({
      date: new Date().toISOString().split('T')[0],
      periode: 'matin',
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
}
