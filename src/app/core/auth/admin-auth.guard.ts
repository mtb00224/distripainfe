import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminApiService } from '../services/admin-api.service';

export const adminAuthGuard: CanActivateFn = () => {
  const admin = inject(AdminApiService);
  const router = inject(Router);

  admin.loadToken();
  if (admin.isLoggedIn()) return true;

  router.navigate(['/admin/login']);
  return false;
};
