import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card border-primary shadow">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">Session Expired</h4>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="bi bi-clock-history" style="font-size: 4rem; color: #0d6efd;"></i>
              </div>
              <h5 class="card-title">Your session has expired</h5>
              <p class="card-text mb-4">
                For your security, your session has timed out due to inactivity. 
                Please log in again to continue.
              </p>
              <a routerLink="/login" class="btn btn-primary btn-lg px-4">
                Log In Again
              </a>
            </div>
            <div class="card-footer text-muted text-center">
              If you need assistance, please contact system support.
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
  `]
})
export class SessionExpiredComponent { }

