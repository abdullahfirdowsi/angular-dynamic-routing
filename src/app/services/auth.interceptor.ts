import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private activeRequests = 0;
  private readonly apiUrl = environment.apiUrl;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token for authentication endpoints to avoid circular dependencies
    const isAuthRequest = request.url.includes('/Auth/login') || request.url.includes('/Auth/logout');
    
    // Get the token from the auth service for non-auth requests
    const token = !isAuthRequest ? this.authService.getToken() : null;

    console.log(`Intercepting request to: ${request.url}`);
    console.log('Is auth request:', isAuthRequest);
    console.log('Token present:', !!token);

    // Track active requests for loading indicators
    this.activeRequests++;
    // Show loading spinner or other UI element if needed
    // this.showLoading();
    
    // Clone the request with updated headers
    let modifiedRequest = request;
    
    // For API requests, add withCredentials and other necessary headers
    if (request.url.startsWith(this.apiUrl)) {
      modifiedRequest = request.clone({
        withCredentials: true,
        setHeaders: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add client-side CORS request headers
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    }

    // Handle the modified request
    return next.handle(modifiedRequest).pipe(
      // Log requests in development mode
      tap({
        next: (event) => {
          if (!environment.production && event.type !== 0) {
            console.log(`Request to ${request.url} successful`);
          }
        },
        error: (error) => {
          console.error(`Request to ${request.url} failed:`, error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        if (error instanceof HttpErrorResponse) {
          // Check for specific error statuses
          switch (error.status) {
            case 401:
              // Unauthorized - token might be expired
              console.log('Unauthorized request - clearing token and redirecting to login');
              this.handleAuthError();
              return throwError(() => new Error('Your session has expired. Please log in again.'));
            
            case 403:
              // Forbidden - user doesn't have permission
              console.warn('Permission denied for resource:', request.url);
              return throwError(() => new Error('You do not have permission to access this resource.'));
            
            case 0:
              // Network error or CORS issue
              console.error('Network error or CORS issue:', request.url);
              console.warn('This may be a CORS configuration issue. Check if the backend has proper CORS headers enabled.');
              // More descriptive error for CORS issues
              return throwError(() => new Error('Unable to connect to the server. This might be due to a CORS configuration issue or network problem.'));
            
            case 500:
              // Server error
              console.error('Server error:', error);
              return throwError(() => new Error('An error occurred on the server. Please try again later.'));
            
            default:
              // Handle other status codes
              return throwError(() => error);
          }
        }
        // Return other errors
        return throwError(() => error);
      }),
      // Always decrement the active requests counter
      finalize(() => {
        this.activeRequests--;
        console.log(`Request to ${request.url} completed. Active requests: ${this.activeRequests}`);
        // Hide loading spinner when no active requests
        // if (this.activeRequests === 0) {
        //   this.hideLoading();
        // }
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    // Clone the request and add the authorization header
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handleAuthError(): void {
    // Clear the token
    this.authService.clearToken();
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }
}

