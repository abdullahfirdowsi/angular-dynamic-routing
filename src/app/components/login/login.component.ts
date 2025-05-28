import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  
  // Demo credentials for easy testing
  demoCredentials = [
    { role: 'Intern', username: 'intern', password: 'intern123' },
    { role: 'SPOC', username: 'spoc', password: 'spoc123' },
    { role: 'Manager', username: 'manager', password: 'manager123' }
  ];

  constructor(private authService: AuthService, private router: Router) {}
  
  // Fill login form with demo credentials
  fillDemoCredentials(username: string, password: string) {
    this.username = username;
    this.password = password;
    this.onSubmit(); // Auto-submit for convenience
  }

  onSubmit() {
    const role = this.authService.login(this.username, this.password);
    if (role) {
      this.router.navigate([`/${role}-dashboard`]);
    } else {
      alert('Invalid credentials');
    }
  }
}