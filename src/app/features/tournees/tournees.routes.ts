import { Routes } from '@angular/router';

export const tourneesRoutes: Routes = [
  { path: '', loadComponent: () => import('./tournees-list/tournees-list.component').then((m) => m.TourneesListComponent) },
  { path: 'new', loadComponent: () => import('./tournee-form/tournee-form.component').then((m) => m.TourneeFormComponent) },
  { path: ':id', loadComponent: () => import('./tournee-detail/tournee-detail.component').then((m) => m.TourneeDetailComponent) },
];
