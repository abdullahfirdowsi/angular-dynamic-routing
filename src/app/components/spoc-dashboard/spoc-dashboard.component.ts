import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PerformanceDashboardComponent } from '../performance-dashboard/performance-dashboard.component';

@Component({
  selector: 'app-spoc-dashboard',
  standalone: true,
  imports: [CommonModule, PerformanceDashboardComponent],
  templateUrl: './spoc-dashboard.component.html',
  styleUrls: ['./spoc-dashboard.component.css']
})
export class SpocDashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}