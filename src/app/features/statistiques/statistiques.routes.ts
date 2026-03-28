import { Routes } from '@angular/router';

export const statistiquesRoutes: Routes = [
  { path: '', loadComponent: () => import('./stats-dashboard/stats-dashboard.component').then((m) => m.StatsDashboardComponent) },
];
