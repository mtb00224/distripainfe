import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminBoulangerieService } from '../services/admin-boulangerie.service';
import { AdminApiService } from '../services/admin-api.service';

/**
 * Utilisé sur /login, /register, /change-password.
 * Si l'utilisateur est déjà connecté, le renvoie vers son espace.
 */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const adminB = inject(AdminBoulangerieService);
  const adminApi = inject(AdminApiService);
  const router = inject(Router);

  adminApi.loadToken();

  if (auth.isLoggedIn()) return router.createUrlTree(['/dashboard']);
  if (adminB.isLoggedIn()) return router.createUrlTree(['/boulangerie/dashboard']);
  if (adminApi.isLoggedIn()) return router.createUrlTree(['/admin']);
  return true; // pas connecté → accès autorisé à la page publique
};
