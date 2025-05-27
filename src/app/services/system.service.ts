import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface SystemConfig {
  id: string;
  name: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'select';
  description: string;
  category: 'notification' | 'performance' | 'security' | 'general' | 'backup';
  options?: string[]; // For select type
}

export interface SystemHealth {
  dbStatus: 'healthy' | 'warning' | 'error';
  apiStatus: 'online' | 'offline' | 'degraded';
  lastBackup: Date | null;
  serverLoad: number; // 0-100
  storageUsed: number; // 0-100
  memoryUsage: number; // 0-100
  errors24h: number;
}

export interface BackupInfo {
  id: number;
  date: Date;
  size: string;
  status: 'completed' | 'failed' | 'in-progress';
  type: 'full' | 'incremental';
}

export interface SystemLog {
  id: number;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  user?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private systemConfig = new BehaviorSubject<SystemConfig[]>([
    { id: 'emailNotifications', name: 'Email Notifications', value: true, type: 'boolean', description: 'Send email notifications when new feedback is added', category: 'notification' },
    { id: 'performanceFrequency', name: 'Performance Update Frequency', value: 'Weekly', type: 'select', description: 'Frequency of performance evaluations', category: 'performance', options: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'] },
    { id: 'minScore', name: 'Minimum Acceptable Score', value: 60, type: 'number', description: 'Minimum acceptable performance score', category: 'performance' },
    { id: 'autoReports', name: 'Automated Reports', value: true, type: 'boolean', description: 'Automatically generate and send reports', category: 'notification' },
    { id: 'reportRecipients', name: 'Report Recipients', value: 'managers@ilink-systems.com', type: 'string', description: 'Email recipients for automated reports', category: 'notification' },
    { id: 'backupFrequency', name: 'Backup Frequency', value: 'Daily', type: 'select', description: 'How often to run system backups', category: 'backup', options: ['Daily', 'Weekly', 'Monthly'] },
    { id: 'retentionPeriod', name: 'Backup Retention Period', value: 30, type: 'number', description: 'Days to keep backups', category: 'backup' },
    { id: 'requireTwoFactor', name: 'Require Two-Factor Authentication', value: true, type: 'boolean', description: 'Require 2FA for manager accounts', category: 'security' },
    { id: 'maxLoginAttempts', name: 'Maximum Login Attempts', value: 5, type: 'number', description: 'Maximum failed login attempts before account lock', category: 'security' },
    { id: 'logRetention', name: 'Log Retention (Days)', value: 30, type: 'number', description: 'Days to keep system logs', category: 'general' },
    { id: 'logLevel', name: 'Log Level', value: 'Info', type: 'select', description: 'Set the verbosity of system logs', category: 'general', options: ['Error', 'Warning', 'Info', 'Debug'] },
  ]);

  private systemHealth = new BehaviorSubject<SystemHealth>({
    dbStatus: 'healthy',
    apiStatus: 'online',
    lastBackup: new Date('2025-05-26T00:00:00'),
    serverLoad: 23,
    storageUsed: 35,
    memoryUsage: 42,
    errors24h: 0
  });

  private backups = new BehaviorSubject<BackupInfo[]>([
    { id: 1, date: new Date('2025-05-26T00:00:00'), size: '1.2 GB', status: 'completed', type: 'full' },
    { id: 2, date: new Date('2025-05-25T00:00:00'), size: '1.2 GB', status: 'completed', type: 'full' },
    { id: 3, date: new Date('2025-05-24T00:00:00'), size: '1.1 GB', status: 'completed', type: 'full' },
    { id: 4, date: new Date('2025-05-23T00:00:00'), size: '1.1 GB', status: 'completed', type: 'full' },
    { id: 5, date: new Date('2025-05-22T00:00:00'), size: '1.0 GB', status: 'completed', type: 'full' }
  ]);

  private systemLogs = new BehaviorSubject<SystemLog[]>([
    { id: 1, timestamp: new Date('2025-05-27T10:30:00'), level: 'info', message: 'New SPOC added: Jessica Williams', source: 'UserManagement', user: 'admin@ilink-systems.com' },
    { id: 2, timestamp: new Date('2025-05-26T17:45:00'), level: 'info', message: 'Performance report generated', source: 'ReportSystem', user: 'admin@ilink-systems.com' },
    { id: 3, timestamp: new Date('2025-05-26T14:15:00'), level: 'warning', message: '8 interns require attention due to low performance scores', source: 'PerformanceMonitor' },
    { id: 4, timestamp: new Date('2025-05-25T11:20:00'), level: 'info', message: 'Performance evaluation frequency updated to weekly', source: 'SystemConfig', user: 'admin@ilink-systems.com' },
    { id: 5, timestamp: new Date('2025-05-25T00:00:00'), level: 'info', message: 'System backup completed successfully', source: 'BackupSystem' }
  ]);

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorMessageSubject = new BehaviorSubject<string>('');
  private successMessageSubject = new BehaviorSubject<string>('');

  constructor() { }

  // Configuration methods
  getSystemConfig(): Observable<SystemConfig[]> {
    return this.systemConfig.asObservable();
  }

  getConfigByCategory(category: string): Observable<SystemConfig[]> {
    return of(this.systemConfig.value.filter(config => config.category === category));
  }

  updateConfig(configId: string, value: any): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    const configs = this.systemConfig.value;
    const index = configs.findIndex(config => config.id === configId);
    
    if (index !== -1) {
      configs[index].value = value;
      this.systemConfig.next([...configs]);
      
      // Simulate API call
      return of(true).pipe(
        delay(800),
        tap(() => {
          this.isLoadingSubject.next(false);
          this.successMessageSubject.next(`Configuration '${configs[index].name}' updated successfully`);
          
          // Auto-clear success message
          setTimeout(() => this.successMessageSubject.next(''), 3000);
        })
      );
    } else {
      this.isLoadingSubject.next(false);
      this.errorMessageSubject.next('Configuration not found');
      
      // Auto-clear error message
      setTimeout(() => this.errorMessageSubject.next(''), 3000);
      
      return of(false);
    }
  }

  // System health methods
  getSystemHealth(): Observable<SystemHealth> {
    return this.systemHealth.asObservable();
  }

  refreshSystemHealth(): Observable<SystemHealth> {
    this.isLoadingSubject.next(true);
    
    // Simulate API call to refresh system health
    return of({
      dbStatus: 'healthy',
      apiStatus: 'online',
      lastBackup: new Date('2025-05-26T00:00:00'),
      serverLoad: Math.floor(Math.random() * 30) + 10, // Random between 10-40
      storageUsed: Math.floor(Math.random() * 20) + 30, // Random between 30-50
      memoryUsage: Math.floor(Math.random() * 30) + 30, // Random between 30-60
      errors24h: Math.floor(Math.random() * 3) // Random between 0-2
    }).pipe(
      delay(1000),
      tap(health => {
        this.systemHealth.next(health);
        this.isLoadingSubject.next(false);
      })
    );
  }

  // Backup methods
  getBackups(): Observable<BackupInfo[]> {
    return this.backups.asObservable();
  }

  createBackup(): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    // Simulate backup creation
    const newBackup: BackupInfo = {
      id: this.backups.value.length + 1,
      date: new Date(),
      size: '1.2 GB',
      status: 'completed',
      type: 'full'
    };
    
    return of(true).pipe(
      delay(2000),
      tap(() => {
        const currentBackups = this.backups.value;
        this.backups.next([newBackup, ...currentBackups]);
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next('Backup created successfully');
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // System logs methods
  getSystemLogs(): Observable<SystemLog[]> {
    return this.systemLogs.asObservable();
  }

  clearLogs(): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    return of(true).pipe(
      delay(1000),
      tap(() => {
        this.systemLogs.next([]);
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next('System logs cleared successfully');
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // Cache methods
  clearCache(): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    return of(true).pipe(
      delay(1500),
      tap(() => {
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next('System cache cleared successfully');
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // System reset method (danger zone)
  resetSystem(): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    return of(true).pipe(
      delay(3000),
      tap(() => {
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next('System reset completed successfully');
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // Status observables
  isLoading(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  getErrorMessage(): Observable<string> {
    return this.errorMessageSubject.asObservable();
  }

  getSuccessMessage(): Observable<string> {
    return this.successMessageSubject.asObservable();
  }

  clearMessages(): void {
    this.errorMessageSubject.next('');
    this.successMessageSubject.next('');
  }
}

