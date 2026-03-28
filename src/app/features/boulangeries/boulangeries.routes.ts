import { Routes } from '@angular/router';

export const boulangeriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./boulangeries-list/boulangeries-list.component').then(
        (m) => m.BoulangeriesListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./boulangerie-form/boulangerie-form.component').then(
        (m) => m.BoulangerieFormComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./boulangerie-form/boulangerie-form.component').then(
        (m) => m.BoulangerieFormComponent
      ),
  },
];
