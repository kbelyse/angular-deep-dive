import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './global-error-handler';
import { loadingInterceptor } from './loading-interceptor';
import { SelectivePreloadingStrategy } from './selective-preloading-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
