import { Routes } from '@angular/router';
import { adminBoulangerieGuard } from '../../core/auth/admin-boulangerie.guard';
import { publicGuard } from '../../core/auth/public.guard';
import { BoulangerieLoginComponent } from './boulangerie-login/boulangerie-login.component';
import { BoulangerieRegisterComponent } from './boulangerie-register/boulangerie-register.component';
import { BoulangerieLayoutComponent } from './boulangerie-layout/boulangerie-layout.component';

export const boulangerieRoutes: Routes = [
  { path: 'login', component: BoulangerieLoginComponent, canActivate: [publicGuard] },
  { path: 'register', component: BoulangerieRegisterComponent, canActivate: [publicGuard] },
  {
    path: '',
    component: BoulangerieLayoutComponent,
    canActivate: [adminBoulangerieGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./boulangerie-dashboard/boulangerie-dashboard.component').then(
            (m) => m.BoulangerieDashboardComponent
          ),
      },
      {
        path: 'boulangeries',
        loadComponent: () =>
          import('./boulangerie-boulangeries/boulangerie-boulangeries.component').then(
            (m) => m.BoulangerieBoulangeries
          ),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./boulangerie-staff/boulangerie-staff.component').then(
            (m) => m.BoulangerieStaffComponent
          ),
      },
      {
        path: 'livreurs',
        loadComponent: () =>
          import('./boulangerie-livreurs/boulangerie-livreurs.component').then(
            (m) => m.BoulangerieLivreursComponent
          ),
      },
      {
        path: 'livreurs-internes',
        loadComponent: () =>
          import('./livreurs-internes/livreurs-internes.component').then(
            (m) => m.LivreursInternesComponent
          ),
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./production/production.component').then(
            (m) => m.ProductionComponent
          ),
      },
      {
        path: 'production/:id',
        loadComponent: () =>
          import('./production-detail/production-detail.component').then(
            (m) => m.ProductionDetailComponent
          ),
      },
      {
        path: 'depenses',
        loadComponent: () =>
          import('./depenses/depenses.component').then(
            (m) => m.DepensesComponent
          ),
      },
      {
        path: 'dettes',
        loadComponent: () =>
          import('./dettes/dettes.component').then(
            (m) => m.DettesComponent
          ),
      },
      {
        path: 'vente-ambulatoire',
        loadComponent: () =>
          import('./vente-ambulatoire/vente-ambulatoire.component').then(
            (m) => m.VenteAmbulatorireComponent
          ),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./boulangerie-stats/boulangerie-stats.component').then(
            (m) => m.BoulangerieStatsComponent
          ),
      },
      {
        path: 'parametres',
        loadComponent: () =>
          import('./parametres/parametres.component').then(
            (m) => m.ParametresComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
