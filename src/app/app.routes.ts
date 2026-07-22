import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home · Angular Deep Dive',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'counter',
    title: 'Counter · Angular Deep Dive',
    loadComponent: () => import('./counter/counter').then((m) => m.Counter),
  },
  {
    path: '**',
    title: 'Page not found · Angular Deep Dive',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound),
  },
];
