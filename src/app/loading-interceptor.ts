import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

import { HttpLoading } from './http-loading';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const httpLoading = inject(HttpLoading);

  httpLoading.start();

  return next(req).pipe(finalize(() => httpLoading.stop()));
};
