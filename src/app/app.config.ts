import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection, isDevMode, inject } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/services/auth.service';

function initializeApp(authService: AuthService) {
  return () =>
    new Promise<void>((resolve) => {
      // Admin routes manage their own session via localStorage — skip livreur refresh
      if (window.location.pathname.startsWith('/admin')) {
        resolve();
        return;
      }
      // Try to restore session via refresh token on app start
      authService.refreshToken().subscribe({
        next: () => {
          authService.fetchCurrentUser().subscribe({ next: () => resolve(), error: () => resolve() });
        },
        error: () => resolve(),
        complete: () => resolve(), // fired when catchError returns EMPTY (no cookie / 401)
      });
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => initializeApp(authService),
      deps: [AuthService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
