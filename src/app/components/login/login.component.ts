import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  loginError = '';
  private subscription = new Subscription();

  // Demo credentials for easy testing
  demoCredentials = [
    { role: 'Intern', username: 'intern', password: 'intern123' },
    { role: 'SPOC', username: 'spoc', password: 'spoc123' },
    { role: 'Manager', username: 'manager', password: 'manager123' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Subscribe to loading state
    this.subscription.add(
      this.authService.isLoading().subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Fill form with demo credentials
  fillDemoCredentials(username: string, password: string): void {
    this.loginForm.patchValue({
      username,
      password
    });
  }

  onSubmit(): void {
    // Reset previous errors
    this.loginError = '';
    
    // Return if the form is invalid
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.value;

    this.subscription.add(
      this.authService.login(username, password).subscribe(role => {
        if (role) {
          this.router.navigate([`/${role}-dashboard`]);
        } else {
          this.loginError = 'Invalid username or password. Please try again.';
        }
      })
    );
  }

  // Helper methods for form validation
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
  get usernameInvalid() { 
    return this.usernameControl?.invalid && 
      (this.usernameControl?.touched || this.usernameControl?.dirty); 
  }
  get passwordInvalid() { 
    return this.passwordControl?.invalid && 
      (this.passwordControl?.touched || this.passwordControl?.dirty); 
  }
}
