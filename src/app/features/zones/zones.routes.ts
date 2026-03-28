import { Routes } from '@angular/router';

export const zonesRoutes: Routes = [
  { path: '', loadComponent: () => import('./zones-list/zones-list.component').then((m) => m.ZonesListComponent) },
  { path: 'new', loadComponent: () => import('./zone-form/zone-form.component').then((m) => m.ZoneFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./zone-form/zone-form.component').then((m) => m.ZoneFormComponent) },
];
