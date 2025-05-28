import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(
      routes, 
      withHashLocation() // Use hash location strategy for more reliable routing
    ),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          console.log('HTTP request:', req.url);
          return next(req);
        }
      ]),
      withInterceptorsFromDi()
    ),
    provideAnimations(),
    provideClientHydration(),
    importProvidersFrom(
      CommonModule,
      FormsModule,
      ReactiveFormsModule
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
