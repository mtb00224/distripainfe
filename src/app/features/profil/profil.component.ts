import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Mon profil" subtitle="Gérez vos informations personnelles" />

    @if (successMsg()) {
      <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm px-4 py-3 rounded-lg mb-4">{{ successMsg() }}</div>
    }
    @if (error()) {
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div>
    }

    <div class="max-w-lg space-y-4">
      <!-- Profile info -->
      <div class="card">
        <h2 class="section-title mb-4">Informations personnelles</h2>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Prénom *</label>
              <input type="text" formControlName="first_name" class="input-field" placeholder="Prénom" />
            </div>
            <div>
              <label class="label">Nom *</label>
              <input type="text" formControlName="last_name" class="input-field" placeholder="Nom" />
            </div>
          </div>
          <div>
            <label class="label">Téléphone</label>
            <input type="tel" formControlName="phone_number" class="input-field" placeholder="Numéro de téléphone" />
          </div>
          <div>
            <label class="label">Email</label>
            <input type="email" [value]="currentUser()?.email ?? ''" disabled class="input-field opacity-60 cursor-not-allowed" />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <label class="label">Type de compte</label>
            <p class="text-sm text-gray-600 dark:text-gray-300 py-2">
              {{ currentUser()?.role === 'livreur' ? '🚚 Livreur principal' : '👤 Acolyte' }}
            </p>
          </div>
          <button type="submit" class="btn-primary" [disabled]="savingProfile()">
            @if (savingProfile()) { Enregistrement... } @else { Enregistrer }
          </button>
        </form>
      </div>

      <!-- Change password -->
      <div class="card">
        <h2 class="section-title mb-4">Changer le mot de passe</h2>
        <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="space-y-4">
          <div>
            <label class="label">Mot de passe actuel *</label>
            <input type="password" formControlName="current_password" class="input-field" placeholder="Mot de passe actuel" />
          </div>
          <div>
            <label class="label">Nouveau mot de passe * (5-10 caractères)</label>
            <input type="password" formControlName="new_password" class="input-field" placeholder="Nouveau mot de passe" />
            @if (passwordForm.controls.new_password.invalid && passwordForm.controls.new_password.touched) {
              <p class="text-xs text-red-500 mt-1">5 à 10 caractères (lettres et/ou chiffres)</p>
            }
          </div>
          <button type="submit" class="btn-primary" [disabled]="savingPassword() || passwordForm.invalid">
            @if (savingPassword()) { Modification... } @else { Modifier le mot de passe }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ProfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  savingProfile = signal(false);
  savingPassword = signal(false);
  successMsg = signal('');
  error = signal('');

  currentUser = this.auth.currentUser;

  profileForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    phone_number: [''],
  });

  passwordForm = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number ?? '',
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.error.set('');
    this.successMsg.set('');
    this.api.updateProfile({
      first_name: this.profileForm.value.first_name!,
      last_name: this.profileForm.value.last_name!,
      phone_number: this.profileForm.value.phone_number || undefined,
    }).subscribe({
      next: () => {
        // Refresh user data from server
        this.auth.fetchCurrentUser().subscribe();
        this.successMsg.set('Profil mis à jour avec succès');
        this.savingProfile.set(false);
      },
      error: (err) => { this.error.set(err.error?.detail ?? 'Erreur'); this.savingProfile.set(false); },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    this.error.set('');
    this.successMsg.set('');

    const user = this.auth.currentUser();
    const isAcolyte = user?.role === 'acolyte_livreur';

    const obs = isAcolyte
      ? this.auth.changeAcolytePassword({
          current_password: this.passwordForm.value.current_password!,
          new_password: this.passwordForm.value.new_password!,
        })
      : this.api.changeLivreurPassword({
          current_password: this.passwordForm.value.current_password!,
          new_password: this.passwordForm.value.new_password!,
        });

    (obs as any).subscribe({
      next: () => {
        this.successMsg.set('Mot de passe modifié avec succès');
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: (err: any) => { this.error.set(err.error?.detail ?? 'Erreur'); this.savingPassword.set(false); },
    });
  }
}
