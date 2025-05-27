import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card border-danger shadow">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0">Unauthorized Access</h4>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="bi bi-shield-exclamation" style="font-size: 4rem; color: #dc3545;"></i>
              </div>
              <h5 class="card-title">Access Denied</h5>
              <p class="card-text mb-4">
                You don't have permission to access this page. 
                This might be because:
              </p>
              <ul class="text-start list-group list-group-flush mb-4">
                <li class="list-group-item">You're trying to access a resource that requires different permissions</li>
                <li class="list-group-item">Your role doesn't allow access to this section</li>
                <li class="list-group-item">You need to log in with a different account</li>
              </ul>
              <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                <a [routerLink]="getDashboardRoute()" class="btn btn-primary me-md-2">
                  Return to Dashboard
                </a>
                <a routerLink="/login" class="btn btn-outline-secondary">
                  Log In Again
                </a>
              </div>
            </div>
            <div class="card-footer text-muted text-center">
              If you believe this is an error, please contact your administrator.
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
    .list-group-item {
      background-color: transparent;
    }
  `]
})
export class UnauthorizedComponent {
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

