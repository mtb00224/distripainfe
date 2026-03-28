import { Routes } from '@angular/router';
import { adminAuthGuard } from '../../core/auth/admin-auth.guard';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'livreurs',
        loadComponent: () =>
          import('./admin-livreurs/admin-livreurs.component').then((m) => m.AdminLivreursComponent),
      },
      {
        path: 'livreurs/:id',
        loadComponent: () =>
          import('./admin-livreur-detail/admin-livreur-detail.component').then(
            (m) => m.AdminLivreurDetailComponent
          ),
      },
      {
        path: 'traffic',
        loadComponent: () =>
          import('./admin-traffic/admin-traffic.component').then((m) => m.AdminTrafficComponent),
      },
      {
        path: 'pays',
        loadComponent: () =>
          import('./admin-pays/admin-pays.component').then((m) => m.AdminPaysComponent),
      },
      {
        path: 'formules',
        loadComponent: () =>
          import('./admin-formules/admin-formules.component').then((m) => m.AdminFormulesComponent),
      },
      {
        path: 'abonnements',
        loadComponent: () =>
          import('./admin-abonnements/admin-abonnements.component').then((m) => m.AdminAbonnementsComponent),
      },
      {
        path: 'moyens-paiement',
        loadComponent: () =>
          import('./admin-moyens-paiement/admin-moyens-paiement.component').then(
            (m) => m.AdminMoyensPaiementComponent
          ),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./admin-livreur-permissions/admin-livreur-permissions.component').then(
            (m) => m.AdminLivreurPermissionsComponent
          ),
      },
    ],
  },
];
