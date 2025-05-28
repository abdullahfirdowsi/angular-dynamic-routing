import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, retry, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Interface for InternPerformance data
export interface InternPerformance {
  id: number;
  internId: string;
  name: string;
  location: string;
  programmingLanguage: string;
  email: string;
  collegeName: string;
  bu: string;
  score: number;
  performanceLevel: string; // 'L1' | 'L2' | 'L3' | 'N/A'
  status: string; // 'Pending' | 'Approved'
  lastModifiedBy?: string;
  lastModifiedDate?: Date;
}

// Interface for update performance request
export interface UpdatePerformanceRequest {
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class InternPerformanceService {
  private performanceData = new BehaviorSubject<InternPerformance[]>([]);
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadPerformanceData();
  }

  // Method to get the performance data as observable
  getPerformanceData(): Observable<InternPerformance[]> {
    return this.performanceData.asObservable();
  }

  // Method to calculate performance level based on score
  calculatePerformanceLevel(score: number): string {
    if (score > 90) return 'L1';
    if (score >= 80 && score <= 90) return 'L2';
    if (score < 70) return 'L3';
    return 'N/A'; 
  }

  // Load performance data from API
  loadPerformanceData(): void {
    this.http.get<InternPerformance[]>(`${this.apiUrl}/InternPerformance`)
      .pipe(
        retry({ count: 2, delay: 1000 }), // Retry failed requests up to 2 times with 1s delay
        tap(data => {
          console.log('Loaded intern performance data:', data.length, 'records');
          this.performanceData.next(data);
        }),
        catchError(error => {
          console.error('Error loading performance data:', error);
          // Keep existing data if there was an error
          return this.handleError(error);
        })
      )
      .subscribe({
        error: (err) => console.error('Failed to load intern performance data:', err.message)
      });
  }

  // CRUD Operations
  
  // Get intern by ID
  getInternById(id: number): Observable<InternPerformance> {
    return this.http.get<InternPerformance>(`${this.apiUrl}/InternPerformance/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update intern performance (SPOC only)
  updateInternData(id: number, score: number): Observable<InternPerformance> {
    const request: UpdatePerformanceRequest = { score };
    
    // First check if user has permission to update
    return this.canEdit().pipe(
      tap(canEdit => {
        if (!canEdit) {
          throw new Error('You do not have permission to update intern performance data');
        }
      }),
      // If user has permission, proceed with the update
      map(() => this.http.put<InternPerformance>(
        `${this.apiUrl}/InternPerformance/${id}`, request)
        .pipe(
          retry({ count: 1, delay: 1000 }), // Retry once with 1s delay
          tap(updatedIntern => {
            console.log('Updated intern performance:', updatedIntern);
            // Update the local data
            const currentData = this.performanceData.value;
            const updatedData = currentData.map(intern => 
              intern.id === id ? updatedIntern : intern
            );
            this.performanceData.next(updatedData);
          }),
          catchError(this.handleError)
        )
      ),
      // Flatten the observable
      catchError(error => {
        console.error('Permission check failed:', error);
        return throwError(() => error);
      })
    ).pipe(
      // Flatten the nested observable
      switchMap(observable => observable)
    );
  }

  // Approve intern performance (Manager only)
  approveInternPerformance(id: number): Observable<InternPerformance> {
    return this.http.post<InternPerformance>(`${this.apiUrl}/InternPerformance/${id}/approve`, {})
      .pipe(
        tap(approvedIntern => {
          // Update the local data
          const currentData = this.performanceData.value;
          const updatedData = currentData.map(intern => 
            intern.id === id ? approvedIntern : intern
          );
          this.performanceData.next(updatedData);
        }),
        catchError(this.handleError)
      );
  }

  // Refresh data from API
  refreshData(): void {
    this.loadPerformanceData();
  }

  // Role-based access methods
  
  // Check if user can edit (SPOC role)
  canEdit(): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      map(role => role === 'spoc')
    );
  }
  
  // Check if user can approve (Manager role)
  canApprove(): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      map(role => role === 'manager')
    );
  }
  
  // Check if user is intern (read-only access)
  isIntern(): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      map(role => role === 'intern')
    );
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'You must be logged in to access this resource';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
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
