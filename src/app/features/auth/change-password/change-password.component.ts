import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="text-4xl mb-3">🔐</div>
          <h2 class="text-2xl font-bold text-gray-900">Changer votre mot de passe</h2>
          <p class="text-gray-500 text-sm mt-1">Vous utilisez le mot de passe par défaut. Veuillez le modifier.</p>
        </div>

        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{{ error() }}</div>
        }
        @if (success()) {
          <div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">Mot de passe modifié avec succès !</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">Mot de passe actuel</label>
            <input type="password" formControlName="current_password" class="input-field" placeholder="Votre mot de passe actuel" />
          </div>
          <div>
            <label class="label">Nouveau mot de passe</label>
            <input type="password" formControlName="new_password" class="input-field" placeholder="5 à 10 chiffres ou lettres" maxlength="10" />
            @if (form.controls.new_password.invalid && form.controls.new_password.touched) {
              <p class="text-red-500 text-xs mt-1">Entre 5 et 10 caractères (chiffres et/ou lettres uniquement)</p>
            }
          </div>
          <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">
            @if (loading()) { Enregistrement... } @else { Confirmer }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');
  success = signal(false);

  form = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth
      .changeAcolytePassword({
        current_password: this.form.value.current_password!,
        new_password: this.form.value.new_password!,
      })
      .subscribe({
        next: () => {
          this.success.set(true);
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        },
        error: (err) => {
          this.error.set(err.error?.detail ?? 'Erreur');
          this.loading.set(false);
        },
      });
  }
}
