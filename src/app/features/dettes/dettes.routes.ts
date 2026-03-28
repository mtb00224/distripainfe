import { Routes } from '@angular/router';

export const dettesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dettes-list/dettes-list.component').then((m) => m.DettesListComponent),
  },
];
