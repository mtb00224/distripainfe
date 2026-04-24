import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/public.guard';
import { catchAllGuard } from './core/auth/catch-all.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { NotFoundComponent } from './shared/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },
  { path: 'change-password', component: ChangePasswordComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'boulangeries',
        loadChildren: () =>
          import('./features/boulangeries/boulangeries.routes').then((m) => m.boulangeriesRoutes),
      },
      {
        path: 'zones',
        loadChildren: () => import('./features/zones/zones.routes').then((m) => m.zonesRoutes),
      },
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.clientsRoutes),
      },
      {
        path: 'tournees',
        loadChildren: () => import('./features/tournees/tournees.routes').then((m) => m.tourneesRoutes),
      },
      {
        path: 'encaissements',
        loadChildren: () =>
          import('./features/encaissements/encaissements.routes').then((m) => m.encaissementsRoutes),
      },
      {
        path: 'acolytes',
        loadChildren: () => import('./features/acolytes/acolytes.routes').then((m) => m.acolytesRoutes),
      },
      {
        path: 'statistiques',
        loadChildren: () =>
          import('./features/statistiques/statistiques.routes').then((m) => m.statistiquesRoutes),
      },
      {
        path: 'portions',
        loadComponent: () =>
          import('./features/portions/portions.component').then((m) => m.PortionsComponent),
      },
      {
        path: 'dettes',
        loadChildren: () =>
          import('./features/dettes/dettes.routes').then((m) => m.dettesRoutes),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./features/profil/profil.component').then((m) => m.ProfilComponent),
      },
      {
        path: 'abonnement',
        loadComponent: () =>
          import('./features/abonnement/abonnement.component').then((m) => m.AbonnementComponent),
      },
    ],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'boulangerie',
    loadChildren: () =>
      import('./features/boulangerie/boulangerie.routes').then((m) => m.boulangerieRoutes),
  },
  { path: '**', canActivate: [catchAllGuard], component: NotFoundComponent },
];
