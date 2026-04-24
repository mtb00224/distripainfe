import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';
import { StaffResponse, StaffRole } from '../../../core/models/admin_boulangerie.models';

@Component({
  selector: 'app-boulangerie-staff',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Gérez les membres de votre équipe</p>
        </div>
        <button (click)="showForm.set(true)" class="btn-primary">+ Ajouter</button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Add form -->
      @if (showForm()) {
        <div class="card max-w-lg">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau membre</h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Prénom *</label>
                <input type="text" formControlName="first_name" class="input-field" />
              </div>
              <div>
                <label class="label">Nom *</label>
                <input type="text" formControlName="last_name" class="input-field" />
              </div>
            </div>
            <div>
              <label class="label">Nom d'utilisateur *</label>
              <input type="text" formControlName="username" class="input-field" />
            </div>
            <div>
              <label class="label">Email</label>
              <input type="email" formControlName="email" class="input-field" />
            </div>
            <div>
              <label class="label">Rôle *</label>
              <select formControlName="role_interne" class="input-field">
                <option value="gerant">Gérant</option>
                <option value="comptable">Comptable</option>
                <option value="vendeur">Vendeur</option>
              </select>
            </div>
            <div class="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ℹ️ Mot de passe par défaut : <strong>00000</strong>. Le membre devra le changer à la première connexion.
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

      <!-- Staff list -->
      @if (loading()) {
        <div class="text-center text-gray-400 py-8">Chargement...</div>
      } @else if (staff().length === 0) {
        <div class="card text-center py-12 text-gray-400">
          <div class="text-4xl mb-3">👥</div>
          <p>Aucun membre dans le staff</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (s of staff(); track s.id) {
            <div class="card">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">👤</span>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ s.first_name }} {{ s.last_name }}</p>
                    <p class="text-sm text-gray-500">{{ s.username }}{{ s.email ? ' · ' + s.email : '' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {{ roleLabel(s.role_interne) }}
                  </span>
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class.bg-green-100]="s.is_active" [class.text-green-700]="s.is_active"
                    [class.bg-gray-100]="!s.is_active" [class.text-gray-500]="!s.is_active">
                    {{ s.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                  <button (click)="toggleActive(s)"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                    {{ s.is_active ? 'Désactiver' : 'Activer' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BoulangerieStaffComponent {
  private fb = inject(FormBuilder);
  private service = inject(AdminBoulangerieService);

  staff = signal<StaffResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  error = signal('');
  success = signal('');

  form = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    username: ['', Validators.required],
    email: [''],
    role_interne: ['gerant' as StaffRole, Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.service.boulangerieActiveId() !== null) this.load();
    });
  }

  load(): void {
    this.service.getStaff().subscribe({
      next: (d) => { this.staff.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.service.addStaff({
      first_name: this.form.value.first_name!,
      last_name: this.form.value.last_name!,
      username: this.form.value.username!,
      email: this.form.value.email || undefined,
      role_interne: this.form.value.role_interne as StaffRole,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.success.set('Membre ajouté avec succès');
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
    this.form.reset({ role_interne: 'gerant' });
  }

  toggleActive(s: StaffResponse): void {
    this.service.updateStaff(s.id, { is_active: !s.is_active }).subscribe({
      next: () => this.load(),
      error: () => {},
    });
  }

  roleLabel(role: StaffRole): string {
    const labels: Record<StaffRole, string> = {
      gerant: 'Gérant',
      comptable: 'Comptable',
      vendeur: 'Vendeur',
    };
    return labels[role] ?? role;
  }
}
