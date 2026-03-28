import { Routes } from '@angular/router';

export const encaissementsRoutes: Routes = [
  { path: '', loadComponent: () => import('./encaissements-list/encaissements-list.component').then((m) => m.EncaissementsListComponent) },
  { path: 'new', loadComponent: () => import('./encaissement-form/encaissement-form.component').then((m) => m.EncaissementFormComponent) },
];
