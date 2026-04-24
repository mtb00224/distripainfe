import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from '../models/auth.models';
import { AdminBoulangerieService } from './admin-boulangerie.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private adminBoulangerieService = inject(AdminBoulangerieService);

  // Access token en mémoire uniquement — jamais dans localStorage
  private _accessToken = signal<string | null>(null);
  private _currentUser = signal<CurrentUser | null>(null);

  readonly isLoggedIn = computed(() => this._accessToken() !== null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();

  /** Nom complet de l'utilisateur courant. */
  readonly fullName = computed(() => {
    const u = this._currentUser();
    if (!u) return '';
    return `${u.first_name} ${u.last_name}`.trim();
  });

  getToken(): string | null {
    return this._accessToken();
  }

  login(credentials: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res.role === 'admin_boulangerie') {
            this.adminBoulangerieService.setSession(res);
            this.adminBoulangerieService.fetchProfile().subscribe();
            this.router.navigate(['/boulangerie/dashboard']);
          } else {
            this._accessToken.set(res.access_token);
            this.fetchCurrentUser().subscribe();
            if (res.must_change_password) {
              this.router.navigate(['/change-password']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }
        })
      );
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res.role === 'admin_boulangerie') {
            this.adminBoulangerieService.setSession(res);
            this.adminBoulangerieService.fetchProfile().subscribe();
            this.router.navigate(['/boulangerie/dashboard']);
          } else {
            this._accessToken.set(res.access_token);
            this.fetchCurrentUser().subscribe();
            this.router.navigate(['/dashboard']);
          }
        })
      );
  }

  logout() {
    return this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this._clearSession()),
        catchError(() => {
          this._clearSession();
          return EMPTY;
        })
      );
  }

  refreshToken() {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          this._accessToken.set(res.access_token);
        }),
        catchError(() => {
          this._clearSession();
          return EMPTY;
        })
      );
  }

  fetchCurrentUser() {
    return this.http
      .get<CurrentUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((user) => this._currentUser.set(user)));
  }

  setToken(token: string): void {
    this._accessToken.set(token);
  }

  changePassword(payload: ChangePasswordRequest) {
    return this.http.put(`${environment.apiUrl}/auth/me/password`, payload);
  }

  forgotPasswordCheck(email: string) {
    return this.http.post<{ role: string }>(`${environment.apiUrl}/auth/forgot-password/check`, { email });
  }

  forgotPasswordReset(email: string, new_password: string) {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password/reset`, { email, new_password });
  }

  changeAcolytePassword(payload: ChangePasswordRequest) {
    return this.http.put(`${environment.apiUrl}/acolytes/me/password`, payload);
  }

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.role === 'livreur') return true;
    return user.permissions?.includes(permission) ?? false;
  }

  isLivreurPrincipal(): boolean {
    return this._currentUser()?.role === 'livreur';
  }

  isAcolyte(): boolean {
    return this._currentUser()?.role === 'acolyte_livreur';
  }

  private _clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    if (!this.router.url.startsWith('/admin')) {
      this.router.navigate(['/login']);
    }
  }
}
