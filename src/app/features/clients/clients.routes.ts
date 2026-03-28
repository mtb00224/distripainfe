import { Routes } from '@angular/router';

export const clientsRoutes: Routes = [
  { path: '', loadComponent: () => import('./clients-list/clients-list.component').then((m) => m.ClientsListComponent) },
  { path: 'new', loadComponent: () => import('./client-form/client-form.component').then((m) => m.ClientFormComponent) },
  { path: ':id', loadComponent: () => import('./client-detail/client-detail.component').then((m) => m.ClientDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./client-form/client-form.component').then((m) => m.ClientFormComponent) },
];
