import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type ForgotStep = 'email' | 'password' | 'done';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  // Mot de passe oublié
  showForgot = signal(false);
  forgotStep = signal<ForgotStep>('email');
  forgotEmail = signal('');
  forgotLoading = signal(false);
  forgotError = signal('');
  forgotSuccess = signal(false);
  newPasswordVisible = signal(false);

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
    this.auth
      .login({ email: this.form.value.email!, password: this.form.value.password! })
      .subscribe({
        next: () => {},
        error: (err) => {
          this.error.set(err.error?.detail ?? 'Identifiants incorrects');
          this.loading.set(false);
        },
      });
  }

  openForgot(): void {
    this.showForgot.set(true);
    this.forgotStep.set('email');
    this.forgotEmail.set('');
    this.forgotError.set('');
    this.forgotSuccess.set(false);
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
    this.auth.forgotPasswordCheck(email).subscribe({
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
    this.auth.forgotPasswordReset(this.forgotEmail(), this.forgotPasswordForm.value.new_password!).subscribe({
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
