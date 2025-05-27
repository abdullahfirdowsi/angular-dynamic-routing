import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: '<div class="text-center p-5">Redirecting...</div>',
})
export class RoleRedirectComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Subscribe to user role and redirect accordingly
    this.subscription = this.authService.getUserRole().subscribe(role => {
      if (role) {
        switch (role) {
          case 'intern':
            this.router.navigate(['/intern-dashboard']);
            break;
          case 'spoc':
            this.router.navigate(['/spoc-dashboard']);
            break;
          case 'manager':
            this.router.navigate(['/manager-dashboard']);
            break;
          default:
            // If role doesn't match any route, redirect to login
            this.router.navigate(['/login']);
        }
      } else {
        // No role, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    this.subscription.unsubscribe();
  }
}

