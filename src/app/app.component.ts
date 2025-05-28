import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-dynamic-routing';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    console.log('AppComponent constructor called');
    console.log('Current route:', this.router.url);
  }

  ngOnInit() {
    console.log('AppComponent initialized');
    
    // Check if we're at root and not authenticated
    if (this.router.url === '/' && !this.authService.isLoggedIn()) {
      console.log('Not authenticated, navigating to login');
      this.router.navigate(['/login']);
    }

    // Subscribe to navigation end events for debugging
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      console.log('Navigation completed:', event);
    });
  }
}
