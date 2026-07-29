import { Routes } from '@angular/router';
import { postIdGuard } from './posts/post-detail/post-id.guard';

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
    path: 'feedback',
    title: 'Feedback · Angular Deep Dive',
    loadComponent: () => import('./feedback/feedback').then((m) => m.Feedback),
  },
  {
    path: 'posts',
    title: 'Posts · Angular Deep Dive',
    loadComponent: () => import('./posts/posts').then((m) => m.Posts),
  },
  {
    path: 'posts/:id',
    title: 'Post · Angular Deep Dive',
    canActivate: [postIdGuard],
    loadComponent: () => import('./posts/post-detail/post-detail').then((m) => m.PostDetail),
  },
  {
    path: '**',
    title: 'Page not found · Angular Deep Dive',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound),
  },
];
