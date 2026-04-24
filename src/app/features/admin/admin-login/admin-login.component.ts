import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';

type ForgotStep = 'email' | 'password' | 'done';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="text-4xl mb-3">🔐</div>
          <h1 class="text-2xl font-bold text-white">Administration</h1>
          <p class="text-gray-400 text-sm mt-1">DistriPain Platform</p>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          @if (!showForgot()) {
            <!-- ── Connexion ── -->
            @if (error()) {
              <div class="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
                {{ error() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="admin@distripain.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
                <input
                  type="password"
                  formControlName="password"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                [disabled]="loading() || form.invalid"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                @if (loading()) { Connexion... } @else { Se connecter }
              </button>
            </form>

            <button (click)="openForgot()"
              class="mt-4 w-full text-center text-sm text-gray-500 hover:text-indigo-400 transition-colors">
              Mot de passe oublié ?
            </button>

          } @else {
            <!-- ── Mot de passe oublié ── -->

            @if (forgotError()) {
              <div class="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
                {{ forgotError() }}
              </div>
            }

            <!-- Étape email -->
            @if (forgotStep() === 'email') {
              <div class="mb-4">
                <h2 class="text-white font-semibold">Mot de passe oublié</h2>
                <p class="text-gray-400 text-sm mt-1">Entrez votre email administrateur.</p>
              </div>
              <form [formGroup]="forgotEmailForm" (ngSubmit)="submitForgotEmail()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" formControlName="email"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="admin@distripain.com" />
                </div>
                <div class="flex gap-3">
                  <button type="submit" [disabled]="forgotLoading()"
                    class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                    @if (forgotLoading()) { Vérification... } @else { Vérifier }
                  </button>
                  <button type="button" (click)="closeForgot()"
                    class="px-4 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                </div>
              </form>
            }

            <!-- Étape nouveau mot de passe -->
            @if (forgotStep() === 'password') {
              <div class="mb-4">
                <h2 class="text-white font-semibold">Nouveau mot de passe</h2>
                <p class="text-gray-400 text-sm mt-1">Compte : <strong class="text-gray-200">{{ forgotEmail() }}</strong></p>
              </div>
              <form [formGroup]="forgotPasswordForm" (ngSubmit)="submitForgotPassword()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Nouveau mot de passe *</label>
                  <input type="password" formControlName="new_password"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autocomplete="new-password" />
                  <p class="text-xs text-gray-500 mt-1">Minimum 5 caractères</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Confirmer *</label>
                  <input type="password" formControlName="confirm_password"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autocomplete="new-password" />
                  @if (forgotPasswordForm.errors?.['mismatch'] && forgotPasswordForm.get('confirm_password')?.touched) {
                    <p class="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                  }
                </div>
                <div class="flex gap-3">
                  <button type="submit" [disabled]="forgotLoading()"
                    class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                    @if (forgotLoading()) { Enregistrement... } @else { Réinitialiser }
                  </button>
                  <button type="button" (click)="closeForgot()"
                    class="px-4 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                    Annuler
                  </button>
                </div>
              </form>
            }

            <!-- Succès -->
            @if (forgotStep() === 'done') {
              <div class="text-center py-4">
                <div class="text-4xl mb-3">✅</div>
                <h2 class="text-white font-semibold mb-2">Mot de passe mis à jour</h2>
                <p class="text-gray-400 text-sm mb-5">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                <button (click)="closeForgot()"
                  class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                  Retour à la connexion
                </button>
              </div>
            }

          }
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private adminApi = inject(AdminApiService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  // Forgot password
  showForgot = signal(false);
  forgotStep = signal<ForgotStep>('email');
  forgotEmail = signal('');
  forgotLoading = signal(false);
  forgotError = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  forgotEmailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  forgotPasswordForm = this.fb.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(5)]],
      confirm_password: ['', Validators.required],
    },
    { validators: (g: any) => g.get('new_password')?.value === g.get('confirm_password')?.value ? null : { mismatch: true } }
  );

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.adminApi.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: (res) => {
        this.adminApi.setToken(res.access_token);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Erreur de connexion');
        this.loading.set(false);
      },
    });
  }

  openForgot(): void {
    this.showForgot.set(true);
    this.forgotStep.set('email');
    this.forgotEmail.set('');
    this.forgotError.set('');
    this.forgotEmailForm.reset();
    this.forgotPasswordForm.reset();
  }

  closeForgot(): void {
    this.showForgot.set(false);
  }

  submitForgotEmail(): void {
    if (this.forgotEmailForm.invalid) return;
    this.forgotLoading.set(true);
    this.forgotError.set('');
    const email = this.forgotEmailForm.value.email!;
    this.adminApi.forgotPasswordCheck(email).subscribe({
      next: () => {
        this.forgotEmail.set(email);
        this.forgotStep.set('password');
        this.forgotLoading.set(false);
      },
      error: (err) => {
        this.forgotError.set(err.error?.detail ?? 'Email introuvable');
        this.forgotLoading.set(false);
      },
    });
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) return;
    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.adminApi.forgotPasswordReset(this.forgotEmail(), this.forgotPasswordForm.value.new_password!).subscribe({
      next: () => {
        this.forgotStep.set('done');
        this.forgotLoading.set(false);
      },
      error: (err) => {
        this.forgotError.set(err.error?.detail ?? 'Erreur lors de la réinitialisation');
        this.forgotLoading.set(false);
      },
    });
  }
}
