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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Access token stored in memory only — never in localStorage
  private _accessToken = signal<string | null>(null);
  private _currentUser = signal<CurrentUser | null>(null);

  readonly isLoggedIn = computed(() => this._accessToken() !== null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();

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
          this._accessToken.set(res.access_token);
          this.fetchCurrentUser().subscribe();
          if (res.must_change_password) {
            this.router.navigate(['/change-password']);
          } else {
            this.router.navigate(['/dashboard']);
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
          this._accessToken.set(res.access_token);
          this.fetchCurrentUser().subscribe();
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

  changeAcolytePassword(payload: ChangePasswordRequest) {
    return this.http.put(
      `${environment.apiUrl}/acolytes/me/password`,
      payload
    );
  }

  hasPermission(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.user_type === 'livreur') return true;
    return user.permissions?.includes(permission) ?? false;
  }

  isLivreurPrincipal(): boolean {
    return this._currentUser()?.user_type === 'livreur';
  }

  private _clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    // Don't redirect if already on admin pages (separate auth flow)
    if (!this.router.url.startsWith('/admin')) {
      this.router.navigate(['/login']);
    }
  }
}
