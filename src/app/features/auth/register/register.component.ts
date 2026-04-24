import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal('');
  selectedRole = signal<'livreur' | 'admin_boulangerie'>('livreur');

  form = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone_number: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth
      .register({
        role: this.selectedRole(),
        first_name: this.form.value.first_name!,
        last_name: this.form.value.last_name!,
        username: this.form.value.username!,
        email: this.form.value.email!,
        password: this.form.value.password!,
        phone_number: this.form.value.phone_number || undefined,
      })
      .subscribe({
        next: () => {},
        error: (err) => {
          this.error.set(err.error?.detail ?? 'Erreur lors de l\'inscription');
          this.loading.set(false);
        },
      });
  }
}
