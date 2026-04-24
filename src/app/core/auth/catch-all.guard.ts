import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminBoulangerieService } from '../services/admin-boulangerie.service';
import { AdminApiService } from '../services/admin-api.service';

/**
 * Utilisé sur la route `**`.
 * Redirige vers le bon espace si l'utilisateur est connecté,
 * sinon vers /login.
 */
export const catchAllGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const adminB = inject(AdminBoulangerieService);
  const adminApi = inject(AdminApiService);
  const router = inject(Router);

  adminApi.loadToken(); // le token admin système est dans localStorage

  if (auth.isLoggedIn()) return router.createUrlTree(['/dashboard']);
  if (adminB.isLoggedIn()) return router.createUrlTree(['/boulangerie/dashboard']);
  if (adminApi.isLoggedIn()) return router.createUrlTree(['/admin']);
  return router.createUrlTree(['/login']);
};
