import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './app/components/login/login.component';
import { InternDashboardComponent } from './app/components/intern-dashboard/intern-dashboard.component';
import { SpocDashboardComponent } from './app/components/spoc-dashboard/spoc-dashboard.component';
import { ManagerDashboardComponent } from './app/components/manager-dashboard/manager-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'intern-dashboard', component: InternDashboardComponent },
  { path: 'spoc-dashboard', component: SpocDashboardComponent },
  { path: 'manager-dashboard', component: ManagerDashboardComponent },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
}).catch(err => console.error(err));