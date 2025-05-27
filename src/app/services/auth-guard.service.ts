import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      // User is not authenticated, redirect to login
      this.router.navigate(['/session-expired']);
      return false;
    }

    // If no specific role is required for this route, just check if user is authenticated
    if (!route.data['role']) {
      return true;
    }

    // Check if user has the required role
    const userRole = this.authService.getUserRole();
    if (userRole !== route.data['role']) {
      // User does not have the required role
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}

import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): any {
    const expectedRole = route.data['role'];
    
    return this.authService.getUserRole().pipe(
      take(1),
      map(role => {
        // If no role or not matching expected role
        if (!role || role !== expectedRole) {
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}

// Factory function for the CanActivate guard
export const AuthGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuardService).canActivate(route);
};

