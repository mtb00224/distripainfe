import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminBoulangerieService } from '../services/admin-boulangerie.service';

export const adminBoulangerieGuard: CanActivateFn = () => {
  const service = inject(AdminBoulangerieService);
  const router = inject(Router);

  if (service.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/boulangerie/login']);
};
