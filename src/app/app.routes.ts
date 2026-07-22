import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'counter',
    loadComponent: () => import('./counter/counter').then((m) => m.Counter),
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound),
  },
];
