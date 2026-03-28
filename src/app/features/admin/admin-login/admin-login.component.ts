import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';

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

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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
}
