import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const postIdGuard: CanActivateFn = (route) => {
  const id = route.paramMap.get('id');
  if (id !== null && /^\d+$/.test(id)) {
    return true;
  }
  return inject(Router).parseUrl('/posts');
};
