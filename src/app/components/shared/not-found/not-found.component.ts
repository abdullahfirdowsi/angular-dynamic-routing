import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card border-info shadow">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0">Page Not Found</h4>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="bi bi-map" style="font-size: 4rem; color: #0dcaf0;"></i>
              </div>
              <h1 class="display-1 fw-bold text-info">404</h1>
              <h5 class="card-title mb-3">Oops! The page you're looking for doesn't exist</h5>
              <p class="card-text mb-4">
                The page you requested could not be found. It might have been removed, 
                renamed, or is temporarily unavailable.
              </p>
              <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                <a [routerLink]="getDashboardRoute()" class="btn btn-primary me-md-2">
                  Return to Dashboard
                </a>
                <a routerLink="/login" class="btn btn-outline-secondary">
                  Go to Login
                </a>
              </div>
            </div>
            <div class="card-footer text-muted text-center">
              <small>Interns Management System | &copy; 2023</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 8px;
      overflow: hidden;
    }
    .card-header {
      border-radius: 0;
    }
    .bi {
      display: block;
      margin: 0 auto;
    }
    .display-1 {
      font-size: 5rem;
      line-height: 1;
    }
  `]
})
export class NotFoundComponent {
  constructor(private authService: AuthService) {}

  getDashboardRoute(): string {
    const userRole = this.authService.getUserRole();
    switch (userRole) {
      case 'intern':
        return '/intern-dashboard';
      case 'spoc':
        return '/spoc-dashboard';
      case 'manager':
        return '/manager-dashboard';
      default:
        return '/login';
    }
  }
}

