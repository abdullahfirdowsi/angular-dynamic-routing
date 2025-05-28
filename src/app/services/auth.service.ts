import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

// Interfaces for login request/response
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  username?: string;
  role?: string;
  message: string;
}

export interface JwtTokenPayload {
  // Microsoft specific claims for identity
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  sub?: string;      // subject (username)
  role?: string;     // user role (standard claim)
  exp: number;       // expiration timestamp
  iss?: string;      // issuer
  aud?: string;      // audience
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userRole = new BehaviorSubject<string | null>(null);
  private apiUrl = environment.apiUrl;
  private tokenKey = environment.jwtTokenKey;
  private tokenExpirationTimer: any = null;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check for existing token on service initialization
    this.checkToken();
  }

  // Initialize user state from stored token if it exists
  private checkToken(): void {
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        // Check if token is expired
        if (payload && payload.exp > Date.now() / 1000) {
          // Extract role using helper method
          const role = this.getRoleFromToken(payload);
          if (role) {
            this.userRole.next(role);
            console.log('Restored user role from token:', role);
          
            // Set up token expiration timer
            this.setTokenExpirationTimer(payload.exp);
          } else {
            console.warn('No role found in token');
            this.clearToken();
          }
        } else {
          // Token expired, clear it
          this.clearToken();
          this.router.navigate(['/login']);
        }
      } catch (error) {
        // Invalid token, clear it
        this.clearToken();
        this.router.navigate(['/login']);
      }
    }
  }
  
  // Set a timer to handle token expiration
  private setTokenExpirationTimer(expirationTimestamp: number): void {
    // Clear any existing timer
    this.clearTokenExpirationTimer();
    
    // Calculate time until expiration in milliseconds
    const expiresIn = expirationTimestamp * 1000 - Date.now();
    
    if (expiresIn > 0) {
      // Set timer to log out when token expires
      this.tokenExpirationTimer = setTimeout(() => {
        this.clearToken();
        this.router.navigate(['/login'], { 
          queryParams: { expired: true }
        });
      }, expiresIn);
    }
  }
  
  private clearTokenExpirationTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  login(username: string, password: string): Observable<string> {
    console.log('Login attempt for user:', username);
    const loginUrl = `${this.apiUrl}/Auth/login`;
    
    return this.http.post<LoginResponse>(loginUrl, { username, password })
      .pipe(
        tap(response => console.log('Login response received:', response)),
        map(response => {
          if (response && response.token) {
            console.log('Token received, processing...');
            // Store token
            localStorage.setItem(this.tokenKey, response.token);
            
            // Get user role from token
            const decodedToken = this.decodeToken(response.token);
            console.log('Decoded token payload:', decodedToken);
            
            if (decodedToken) {
              const role = this.getRoleFromToken(decodedToken);
              console.log('Extracted role from token:', role);
              
              if (role) {
                this.userRole.next(role);
                
                // Set up token expiration timer
                this.setTokenExpirationTimer(decodedToken.exp);
                
                return role;
              }
            }
            throw new Error('Could not extract role from token');
          }
          throw new Error('No token received in response');
        }),
        catchError(error => {
          console.error('Login error:', error);
          // Clear any existing token on error
          this.clearToken();
          if (error instanceof HttpErrorResponse) {
            return throwError(() => new Error(error.error?.message || 'Login failed'));
          }
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    console.log('Logging out user');
    // Clear token from local storage
    this.clearToken();
    
    // Call logout endpoint (optional, as JWT is stateless)
    return this.http.post(`${this.apiUrl}/Auth/logout`, {}).pipe(
      tap(() => {
        console.log('Logout API call successful');
        this.userRole.next(null);
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Logout API error:', error);
        // Even if the server call fails, we still want to clear the local state
        this.userRole.next(null);
        this.router.navigate(['/login']);
        return of({ message: 'Logged out successfully' });
      })
    );
  }

  getUserRole(): Observable<string | null> {
    return this.userRole.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.userRole.next(null);
    this.clearTokenExpirationTimer();
  }

  private decodeToken(token: string): JwtTokenPayload | null {
    try {
      const decoded = jwtDecode<JwtTokenPayload>(token);
      console.log('Token decoded successfully');
      return decoded;
    } catch (error) {
      console.error('Error decoding token', error);
      return null;
    }
  }

  private getRoleFromToken(decodedToken: JwtTokenPayload): string {
    // Try to extract role from Microsoft claims format first
    const msRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (msRole) {
      console.log('Found role in Microsoft claim:', msRole);
      return msRole.toLowerCase();
    }
    
    // Fallback to standard role claim
    if (decodedToken.role) {
      console.log('Found role in standard claim:', decodedToken.role);
      return decodedToken.role.toLowerCase();
    }
    
    console.warn('No role found in token');
    return '';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to access this resource';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}, Message: ${error.message}`;
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
