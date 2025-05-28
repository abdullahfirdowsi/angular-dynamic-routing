import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './components/login/login.component';
import { InternDashboardComponent } from './components/intern-dashboard/intern-dashboard.component';
import { SpocDashboardComponent } from './components/spoc-dashboard/spoc-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { AuthService } from './services/auth.service';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Role-based guard functions with improved logging
const isInternGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.getUserRole().pipe(
    tap(role => console.log('Guard checking intern role:', role)),
    map(role => {
      const isIntern = role?.toLowerCase() === 'intern';
      console.log('Is intern?', isIntern);
      if (!isIntern) {
        inject(Router).navigate(['/login']);
      }
      return isIntern;
    })
  );
};

const isSpocGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.getUserRole().pipe(
    tap(role => console.log('Guard checking spoc role:', role)),
    map(role => {
      const isSpoc = role?.toLowerCase() === 'spoc';
      console.log('Is spoc?', isSpoc);
      if (!isSpoc) {
        inject(Router).navigate(['/login']);
      }
      return isSpoc;
    })
  );
};

const isManagerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.getUserRole().pipe(
    tap(role => console.log('Guard checking manager role:', role)),
    map(role => {
      const isManager = role?.toLowerCase() === 'manager';
      console.log('Is manager?', isManager);
      if (!isManager) {
        inject(Router).navigate(['/login']);
      }
      return isManager;
    })
  );
};

// Authentication guard - Any authenticated user
const isAuthenticatedGuard: CanActivateFn = () => {
  return inject(AuthService).getUserRole().pipe(
    map(role => !!role)
  );
};

export const routes: Routes = [
  { 
    path: '', 
    component: LoginComponent,
    pathMatch: 'full'
  },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'intern-dashboard', 
    component: InternDashboardComponent,
    canActivate: [isInternGuard]
  },
  { 
    path: 'spoc-dashboard', 
    component: SpocDashboardComponent,
    canActivate: [isSpocGuard]
  },
  { 
    path: 'manager-dashboard', 
    component: ManagerDashboardComponent,
    canActivate: [isManagerGuard]
  },
  { 
    path: '**', 
    redirectTo: 'login'
  }
];
