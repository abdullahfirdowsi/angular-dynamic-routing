import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userRole = new BehaviorSubject<string | null>(null);

  login(username: string, password: string): string {
    // Simulated login logic
    if (username === 'intern' && password === 'intern123') {
      this.userRole.next('intern');
      return 'intern';
    } else if (username === 'spoc' && password === 'spoc123') {
      this.userRole.next('spoc');
      return 'spoc';
    } else if (username === 'manager' && password === 'manager123') {
      this.userRole.next('manager');
      return 'manager';
    }
    return '';
  }

  logout() {
    this.userRole.next(null);
  }

  getUserRole() {
    return this.userRole.asObservable();
  }
}