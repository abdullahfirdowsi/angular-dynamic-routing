import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard.service';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'intern-dashboard', 
    loadComponent: () => import('./components/intern-dashboard/intern-dashboard.component').then(m => m.InternDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: 'intern' },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./components/intern-dashboard/home/home.component').then(m => m.InternHomeComponent),
        canActivate: [AuthGuard],
        data: { role: 'intern' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/intern-dashboard/profile/profile.component').then(m => m.InternProfileComponent),
        canActivate: [AuthGuard],
        data: { role: 'intern' }
      },
      {
        path: 'performance',
        loadComponent: () => import('./components/intern-dashboard/performance/performance.component').then(m => m.InternPerformanceComponent),
        canActivate: [AuthGuard],
        data: { role: 'intern' }
      },
      {
        path: 'training',
        loadComponent: () => import('./components/intern-dashboard/training/training.component').then(m => m.InternTrainingComponent),
        canActivate: [AuthGuard],
        data: { role: 'intern' }
      },
      {
        path: 'messages',
        loadComponent: () => import('./components/intern-dashboard/messages/messages.component').then(m => m.InternMessagesComponent),
        canActivate: [AuthGuard],
        data: { role: 'intern' }
      }
    ]
  },
  { 
    path: 'spoc-dashboard', 
    loadComponent: () => import('./components/spoc-dashboard/spoc-dashboard.component').then(m => m.SpocDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: 'spoc' },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./components/spoc-dashboard/home/home.component').then(m => m.SpocHomeComponent),
        canActivate: [AuthGuard],
        data: { role: 'spoc' }
      },
      {
        path: 'interns',
        loadComponent: () => import('./components/spoc-dashboard/interns/interns.component').then(m => m.SpocInternsComponent),
        canActivate: [AuthGuard],
        data: { role: 'spoc' }
      },
      {
        path: 'interns/:id',
        loadComponent: () => import('./components/spoc-dashboard/intern-detail/intern-detail.component').then(m => m.SpocInternDetailComponent),
        canActivate: [AuthGuard],
        data: { role: 'spoc' }
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/spoc-dashboard/reports/reports.component').then(m => m.SpocReportsComponent),
        canActivate: [AuthGuard],
        data: { role: 'spoc' }
      },
      {
        path: 'feedback',
        loadComponent: () => import('./components/spoc-dashboard/feedback/feedback.component').then(m => m.SpocFeedbackComponent),
        canActivate: [AuthGuard],
        data: { role: 'spoc' }
      }
    ]
  },
  { 
    path: 'manager-dashboard', 
    loadComponent: () => import('./components/manager-dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent),
    canActivate: [AuthGuard],
    data: { role: 'manager' },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./components/manager-dashboard/home/home.component').then(m => m.ManagerHomeComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      },
      {
        path: 'spocs',
        loadComponent: () => import('./components/manager-dashboard/spocs/spocs.component').then(m => m.ManagerSpocsComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      },
      {
        path: 'interns',
        loadComponent: () => import('./components/manager-dashboard/interns/interns.component').then(m => m.ManagerInternsComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      },
      {
        path: 'analytics',
        loadComponent: () => import('./components/manager-dashboard/analytics/analytics.component').then(m => m.ManagerAnalyticsComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/manager-dashboard/reports/reports.component').then(m => m.ManagerReportsComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      },
      {
        path: 'system-config',
        loadComponent: () => import('./components/manager-dashboard/system-config/system-config.component').then(m => m.ManagerSystemConfigComponent),
        canActivate: [AuthGuard],
        data: { role: 'manager' }
      }
    ]
  },
  {
    path: 'redirect',
    loadComponent: () => import('./components/shared/role-redirect/role-redirect.component').then(m => m.RoleRedirectComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'session-expired',
    loadComponent: () => import('./components/shared/session-expired/session-expired.component').then(m => m.SessionExpiredComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./components/shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  { 
    path: '**', 
    redirectTo: '/not-found' 
  }
];
