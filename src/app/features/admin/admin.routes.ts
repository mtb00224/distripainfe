import { Routes } from '@angular/router';
import { adminAuthGuard } from '../../core/auth/admin-auth.guard';
import { publicGuard } from '../../core/auth/public.guard';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  { path: 'login', component: AdminLoginComponent, canActivate: [publicGuard] },
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
        path: 'boulangeries',
        loadComponent: () =>
          import('./admin-boulangeries/admin-boulangeries.component').then((m) => m.AdminBoulangeriesComponent),
      },
      {
        path: 'boulangeries/gerant/:id',
        loadComponent: () =>
          import('./admin-gerant-detail/admin-gerant-detail.component').then((m) => m.AdminGerantDetailComponent),
      },
      {
        path: 'boulangeries/detail/:id',
        loadComponent: () =>
          import('./admin-boulangerie-detail/admin-boulangerie-detail.component').then((m) => m.AdminBoulangerieDetailComponent),
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
