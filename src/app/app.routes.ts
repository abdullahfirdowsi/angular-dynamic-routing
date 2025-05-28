import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './components/login/login.component';
import { InternDashboardComponent } from './components/intern-dashboard/intern-dashboard.component';
import { SpocDashboardComponent } from './components/spoc-dashboard/spoc-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/operators';

// Role-based guard functions
const isInternGuard: CanActivateFn = () => {
  return inject(AuthService).getUserRole().pipe(
    map(role => role === 'intern')
  );
};

const isSpocGuard: CanActivateFn = () => {
  return inject(AuthService).getUserRole().pipe(
    map(role => role === 'spoc')
  );
};

const isManagerGuard: CanActivateFn = () => {
  return inject(AuthService).getUserRole().pipe(
    map(role => role === 'manager')
  );
};

// Authentication guard - Any authenticated user
const isAuthenticatedGuard: CanActivateFn = () => {
  return inject(AuthService).getUserRole().pipe(
    map(role => !!role)
  );
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
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
  { path: '**', redirectTo: 'login' }
];
