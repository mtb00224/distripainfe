import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminBoulangerieService } from '../../../core/services/admin-boulangerie.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Informations du compte et sécurité</p>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error() }}</div>
      }
      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{{ success() }}</div>
      }

      <!-- Profil utilisateur -->
      @if (profile()) {
        @let p = profile()!;
        <section class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mon profil</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Prénom</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ p.first_name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Nom</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ p.last_name }}</p>
            </div>
            @if (p.email) {
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                <p class="font-medium text-gray-900 dark:text-gray-100">{{ p.email }}</p>
              </div>
            }
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Rôle</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                Admin Boulangerie
              </span>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Boulangeries</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ p.boulangeries.length }} établissement{{ p.boulangeries.length > 1 ? 's' : '' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Statut abonnement</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Actif
              </span>
            </div>
          </div>

          <!-- Boulangeries -->
          @if (p.boulangeries.length > 0) {
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Mes boulangeries</p>
              <div class="flex flex-wrap gap-2">
                @for (b of p.boulangeries; track b.id) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    [class.bg-amber-100]="b.is_active"
                    [class.text-amber-800]="b.is_active"
                    [class.bg-gray-100]="!b.is_active"
                    [class.text-gray-500]="!b.is_active">
                    🏪 {{ b.nom }}
                    @if (!b.is_active) { <span class="text-gray-400">(fermée)</span> }
                  </span>
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- Sécurité -->
      <section class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Sécurité</h2>
        <p class="text-xs text-gray-400 mb-4">Modifiez votre mot de passe</p>

        @if (!showPasswordForm()) {
          <button (click)="showPasswordForm.set(true)" class="btn-secondary text-sm">
            Changer le mot de passe
          </button>
        } @else {
          <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordChange()" class="space-y-4 max-w-sm">
            <div>
              <label class="label">Mot de passe actuel *</label>
              <input type="password" formControlName="old_password" class="input-field" autocomplete="current-password" />
            </div>
            <div>
              <label class="label">Nouveau mot de passe *</label>
              <input type="password" formControlName="new_password" class="input-field" autocomplete="new-password" />
              <p class="text-xs text-gray-400 mt-1">Minimum 5 caractères</p>
            </div>
            <div>
              <label class="label">Confirmer le nouveau mot de passe *</label>
              <input type="password" formControlName="confirm_password" class="input-field" autocomplete="new-password" />
              @if (passwordForm.errors?.['mismatch'] && passwordForm.get('confirm_password')?.touched) {
                <p class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              }
            </div>
            <div class="flex gap-3">
              <button type="submit" class="btn-primary text-sm" [disabled]="savingPassword()">
                @if (savingPassword()) { Enregistrement... } @else { Mettre à jour }
              </button>
              <button type="button" class="btn-secondary text-sm" (click)="cancelPasswordForm()">Annuler</button>
            </div>
          </form>
        }
      </section>

      <!-- Zone de danger -->
      <section class="card border-red-200 dark:border-red-800">
        <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Zone de danger</h2>
        <p class="text-xs text-gray-400 mb-4">Ces actions sont irréversibles. Procédez avec précaution.</p>
        <button (click)="service.logout()"
          class="text-sm text-red-600 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors">
          Se déconnecter
        </button>
      </section>
    </div>
  `,
})
export class ParametresComponent {
  private fb = inject(FormBuilder);
  service = inject(AdminBoulangerieService);

  profile = this.service.profile;

  showPasswordForm = signal(false);
  savingPassword = signal(false);
  error = signal('');
  success = signal('');

  passwordForm = this.fb.group(
    {
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(5)]],
      confirm_password: ['', Validators.required],
    },
    { validators: this._matchPasswords }
  );

  private _matchPasswords(group: any) {
    const np = group.get('new_password')?.value;
    const cp = group.get('confirm_password')?.value;
    return np === cp ? null : { mismatch: true };
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    this.error.set('');
    const v = this.passwordForm.value;
    this.service.changePassword({
      old_password: v.old_password!,
      new_password: v.new_password!,
    }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.cancelPasswordForm();
        this.success.set('Mot de passe mis à jour avec succès');
        setTimeout(() => this.success.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur lors du changement de mot de passe');
        this.savingPassword.set(false);
      },
    });
  }

  cancelPasswordForm(): void {
    this.showPasswordForm.set(false);
    this.passwordForm.reset();
  }
}
