import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'ilink_user_session';
  private userRole = new BehaviorSubject<string | null>(null);
  private currentUser = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkAndRestoreSession();
  }

  // Check for existing session in localStorage
  private checkAndRestoreSession(): void {
    const savedSession = localStorage.getItem(this.STORAGE_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        this.userRole.next(user.role);
        this.currentUser.next(user);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  // Clear session data
  private clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.userRole.next(null);
    this.currentUser.next(null);
  }

  // Simulate async login request
  login(username: string, password: string): Observable<string | null> {
    this.isLoadingSubject.next(true);

    // Simulated login logic with proper role typing
    let role: 'intern' | 'spoc' | 'manager' | null = null;
    let user: User | null = null;

    if (username === 'intern' && password === 'intern123') {
      role = 'intern';
      user = { username, role, name: 'Intern User' };
    } else if (username === 'spoc' && password === 'spoc123') {
      role = 'spoc';
      user = { username, role, name: 'SPOC User' };
    } else if (username === 'manager' && password === 'manager123') {
      role = 'manager';
      user = { username, role, name: 'Manager User' };
    }

    // Simulate network delay
    return of(role).pipe(
      delay(800), // Add slight delay to simulate network request
      tap(() => {
        this.isLoadingSubject.next(false);
        if (role) {
          this.userRole.next(role);
          this.currentUser.next(user);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  getUserRole(): Observable<string | null> {
    return this.userRole.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  isLoading(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return this.userRole.value !== null;
  }
}
