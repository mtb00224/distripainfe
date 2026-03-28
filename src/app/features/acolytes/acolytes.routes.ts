import { Routes } from '@angular/router';
import { livreurOnlyGuard } from '../../core/auth/livreur-only.guard';

export const acolytesRoutes: Routes = [
  { path: '', canActivate: [livreurOnlyGuard], loadComponent: () => import('./acolytes-list/acolytes-list.component').then((m) => m.AcolytesListComponent) },
  { path: 'new', canActivate: [livreurOnlyGuard], loadComponent: () => import('./acolyte-form/acolyte-form.component').then((m) => m.AcolyteFormComponent) },
  { path: ':id/edit', canActivate: [livreurOnlyGuard], loadComponent: () => import('./acolyte-form/acolyte-form.component').then((m) => m.AcolyteFormComponent) },
];
