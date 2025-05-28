import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PerformanceDashboardComponent } from '../performance-dashboard/performance-dashboard.component';

@Component({
  selector: 'app-intern-dashboard',
  standalone: true,
  imports: [CommonModule, PerformanceDashboardComponent],
  templateUrl: './intern-dashboard.component.html',
  styleUrls: ['./intern-dashboard.component.css']
})
export class InternDashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}