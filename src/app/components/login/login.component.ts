import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize, catchError } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h3 class="text-center">iLink Interns Management</h3>
            </div>
            <div class="card-body">
              <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                {{ errorMessage }}
                <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
              </div>
              
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" formControlName="username">
                  <div *ngIf="username?.invalid && (username?.dirty || username?.touched)" class="text-danger">
                    <small *ngIf="username?.errors?.['required']">Username is required</small>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" formControlName="password">
                  <div *ngIf="password?.invalid && (password?.dirty || password?.touched)" class="text-danger">
                    <small *ngIf="password?.errors?.['required']">Password is required</small>
                    <small *ngIf="password?.errors?.['minlength']">Password must be at least 6 characters</small>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid || isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isLoading ? 'Logging in...' : 'Login' }}
                </button>
              </form>

              <!-- Demo accounts section -->
              <div class="mt-4 pt-3 border-top">
                <h6 class="text-center text-secondary mb-3">Demo Accounts</h6>
                <div class="row g-2">
                  <div class="col-md-4" *ngFor="let cred of demoCredentials">
                    <button 
                      (click)="fillDemoCredentials(cred.username, cred.password)" 
                      class="btn btn-outline-primary btn-sm w-100">
                      {{ cred.role }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .card-header {
      background-color: #007bff;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  sessionExpired = false;
  
  // Demo credentials for easy testing
  demoCredentials = [
    { role: 'Intern', username: 'intern', password: 'intern123' },
    { role: 'SPOC', username: 'spoc', password: 'spoc123' },
    { role: 'Manager', username: 'manager', password: 'manager123' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('LoginComponent constructor called');
  }
  
  ngOnInit(): void {
    console.log('LoginComponent initialized');
    // Initialize the form with validators
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    // Check if redirected due to session expiration
    this.route.queryParams.subscribe(params => {
      if (params['expired']) {
        this.sessionExpired = true;
        this.errorMessage = 'Your session has expired. Please log in again.';
      }
      console.log('Current route params:', params);
    });

    // Log current route
    console.log('Current route:', this.router.url);
  }
  
  // Fill login form with demo credentials
  fillDemoCredentials(username: string, password: string) {
    console.log('Filling demo credentials:', username);
    this.loginForm.patchValue({
      username: username,
      password: password
    });
    // this.onSubmit(); // Auto-submit for convenience
  }

  // Getters for form field validation
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit() {
    console.log('Form submitted');
    // Clear any previous errors
    this.errorMessage = '';
    
    // If form is invalid, mark all fields as touched to show validation errors
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    // Set loading state
    this.isLoading = true;
    
    // Get form values
    const { username, password } = this.loginForm.value;
    console.log('Attempting login with username:', username);
    
    // Call the auth service login method
    this.authService.login(username, password)
      .pipe(
        // Regardless of success or failure, set loading to false when complete
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (role) => {
          console.log('Login successful, role:', role);
          if (role) {
            // Convert role to lowercase and append -dashboard
            const dashboardRoute = `/${role.toLowerCase()}-dashboard`;
            console.log('Navigating to:', dashboardRoute);
            this.router.navigate([dashboardRoute])
              .then(() => console.log('Navigation complete'))
              .catch(err => console.error('Navigation failed:', err));
          } else {
            this.errorMessage = 'Login failed. Please check your credentials.';
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Login failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          console.log('Login request completed');
          this.isLoading = false;
        }
      });
  }
}