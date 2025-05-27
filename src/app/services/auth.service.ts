import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Define the Role enum
export enum Role {
  Intern = 'Intern',
  SPOC = 'SPOC',
  Manager = 'Manager'
}

// Define the User interface
export interface User {
  id: number;
  username: string;
  role: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // BehaviorSubject for the current user
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    // Initialize from localStorage if available
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Get current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Login method - determines role based on username prefix
  public login(username: string, password: string): Observable<User> {
    // In a real application, this would be an API call
    // For this demo, we're just checking username prefixes

    let role: Role;
    
    if (username.startsWith('intern_')) {
      role = Role.Intern;
    } else if (username.startsWith('spoc_')) {
      role = Role.SPOC;
    } else if (username.startsWith('manager_')) {
      role = Role.Manager;
    } else {
      throw new Error('Invalid username format. Must start with intern_, spoc_, or manager_');
    }

    // Simple mock authentication - would be replaced with actual API call
    // Just checking that password isn't empty for this demo
    if (!password) {
      throw new Error('Password is required');
    }

    // Create mock user with random ID
    const user: User = {
      id: Math.floor(Math.random() * 1000) + 1,
      username,
      role
    };

    // Store user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update the behavior subject
    this.currentUserSubject.next(user);
    
    return this.currentUser.pipe(
      map(user => {
        if (!user) {
          throw new Error('Login failed');
        }
        return user;
      })
    );
  }

  // Logout method
  public logout(): void {
    // Remove user from local storage
    localStorage.removeItem('currentUser');
    
    // Set current user to null
    this.currentUserSubject.next(null);
  }

  // Check if user is logged in
  public isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  // Check if user has a specific role
  public hasRole(role: Role): boolean {
    return this.isLoggedIn() && this.currentUserValue?.role === role;
  }

  // Check if user has at least the specified role (role hierarchy)
  public hasMinimumRole(role: Role): boolean {
    if (!this.isLoggedIn() || !this.currentUserValue) {
      return false;
    }

    const roleHierarchy = {
      [Role.Intern]: 1,
      [Role.SPOC]: 2,
      [Role.Manager]: 3
    };

    const userRoleLevel = roleHierarchy[this.currentUserValue.role];
    const requiredRoleLevel = roleHierarchy[role];

    return userRoleLevel >= requiredRoleLevel;
  }
}
