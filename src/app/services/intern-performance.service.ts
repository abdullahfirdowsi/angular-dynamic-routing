import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
  performanceLevel: 'L1' | 'L2' | 'L3' | 'N/A';
  status: 'Pending' | 'Approved';
  lastModifiedBy?: string;
  lastModifiedDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class InternPerformanceService {
  private performanceData = new BehaviorSubject<InternPerformance[]>([]);
  private originalData: InternPerformance[] = [];

  constructor(private authService: AuthService) {
    this.initializeData();
  }

  // Method to get the performance data as observable
  getPerformanceData(): Observable<InternPerformance[]> {
    return this.performanceData.asObservable();
  }

  // Method to calculate performance level based on score
  calculatePerformanceLevel(score: number): 'L1' | 'L2' | 'L3' | 'N/A' {
    if (score > 90) return 'L1';
    if (score >= 80 && score <= 90) return 'L2';
    if (score < 70) return 'L3';
    return 'N/A'; // For scores between 70-79
  }

  // Initialize sample data
  private initializeData(): void {
    const sampleData: InternPerformance[] = [
      {
        id: 1,
        internId: 'I400',
        name: 'Abdullah Firdowsi',
        location: 'Chennai',
        programmingLanguage: 'Python',
        email: 'abdullah.firdowsi@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 95,
        performanceLevel: 'L1',
        status: 'Approved'
      },
      {
        id: 2,
        internId: 'I403',
        name: 'Logesh M',
        location: 'Trichy',
        programmingLanguage: 'Java',
        email: 'logesh.m@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 85,
        performanceLevel: 'L2',
        status: 'Pending'
      },
      {
        id: 3,
        internId: 'I404',
        name: 'Guna Kuppuchamy',
        location: 'Trichy',
        programmingLanguage: 'Java',
        email: 'guna.kuppuchamy@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 65,
        performanceLevel: 'L3',
        status: 'Pending'
      },
      {
        id: 4,
        internId: 'I406',
        name: 'Gugan MK',
        location: 'Chennai',
        programmingLanguage: 'Java',
        email: 'gugan.mk@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 88,
        performanceLevel: 'L2',
        status: 'Approved'
      },
      {
        id: 5,
        internId: 'I411',
        name: 'Mohana Gowri',
        location: 'Chennai',
        programmingLanguage: 'Java',
        email: 'mohana.gowri@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 92,
        performanceLevel: 'L1',
        status: 'Pending'
      },
      {
        id: 6,
        internId: 'I413',
        name: 'Dilip S',
        location: 'Chennai',
        programmingLanguage: 'Java',
        email: 'dilip.s@ilink-systems.com',
        collegeName: 'Karpagam',
        bu: 'DEX',
        score: 75,
        performanceLevel: 'N/A',
        status: 'Pending'
      }
    ];

    this.originalData = [...sampleData];
    this.performanceData.next(sampleData);
  }

  // CRUD Operations
  
  // Get intern by ID
  getInternById(id: number): InternPerformance | undefined {
    return this.performanceData.value.find(intern => intern.id === id);
  }

  // Update intern data
  updateInternData(updatedIntern: InternPerformance): void {
    const currentData = this.performanceData.value;
    const index = currentData.findIndex(intern => intern.id === updatedIntern.id);
    
    if (index !== -1) {
      // Auto-calculate performance level based on score
      updatedIntern.performanceLevel = this.calculatePerformanceLevel(updatedIntern.score);
      updatedIntern.lastModifiedDate = new Date();
      
      // Get current user role for tracking who made the change
      this.authService.getUserRole().subscribe(role => {
        updatedIntern.lastModifiedBy = role || 'unknown';
      });
      
      // Mark as pending when SPOC makes changes
      updatedIntern.status = 'Pending';
      
      // Update the data
      const newData = [...currentData];
      newData[index] = updatedIntern;
      this.performanceData.next(newData);
    }
  }

  // Approve intern performance (for Manager role)
  approveInternPerformance(id: number): void {
    const currentData = this.performanceData.value;
    const index = currentData.findIndex(intern => intern.id === id);
    
    if (index !== -1) {
      const updatedData = [...currentData];
      updatedData[index] = {
        ...updatedData[index],
        status: 'Approved',
        lastModifiedDate: new Date()
      };
      
      this.authService.getUserRole().subscribe(role => {
        updatedData[index].lastModifiedBy = role || 'unknown';
      });
      
      this.performanceData.next(updatedData);
    }
  }

  // Reset data to original state
  resetData(): void {
    this.performanceData.next([...this.originalData]);
  }

  // Role-based access methods
  
  // Check if user can edit (SPOC role)
  canEdit(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.authService.getUserRole().subscribe(role => {
        observer.next(role === 'spoc');
        observer.complete();
      });
    });
  }
  
  // Check if user can approve (Manager role)
  canApprove(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.authService.getUserRole().subscribe(role => {
        observer.next(role === 'manager');
        observer.complete();
      });
    });
  }
  
  // Check if user is intern (read-only access)
  isIntern(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.authService.getUserRole().subscribe(role => {
        observer.next(role === 'intern');
        observer.complete();
      });
    });
  }
}
