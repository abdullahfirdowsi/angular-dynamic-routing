import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Intern, InternPerformance, Feedback } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class InternService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorMessageSubject = new BehaviorSubject<string>('');

  // Mock intern data
  private internsData: Intern[] = [
    { sNo: 1, internId: 'I346', name: 'Deepan Chakkaravarthi', location: 'Chennai', programmingLanguage: 'Python', officialCompanyEmailId: 'deepan.chakkaravarthi@ilink-systems.com', collegeName: 'REC', primarySkill: 'Python,SQL', secondarySkill: 'Cloud computing,RPA', areaOfInterest: 'Cloud Computing', allocatedBU: 'DATA' },
    { sNo: 2, internId: 'I347', name: 'Logesh Kanna', location: 'Chennai', programmingLanguage: 'Java', officialCompanyEmailId: 'logesh.kanna@ilink-systems.com', collegeName: 'REC', primarySkill: 'Java,SQL', secondarySkill: 'HTML,CSS,Python', areaOfInterest: 'Web development , Data Analytics', allocatedBU: 'DATA' },
    // Add more interns as needed
  ];

  // Mock performance data
  private performanceData: { [key: string]: InternPerformance } = {
    'I346': {
      score: 85,
      grade: 'A',
      level: 'Intermediate',
      progressPercentage: 70,
      strengths: ['Python programming', 'Database management', 'Problem-solving'],
      areasOfImprovement: ['Communication skills', 'Documentation'],
      feedbacks: [
        { id: 1, from: 'SPOC User', message: 'Good progress on the Python project.', date: new Date('2025-05-20'), rating: 4 }
      ]
    },
    'I347': {
      score: 92,
      grade: 'A+',
      level: 'Advanced',
      progressPercentage: 85,
      strengths: ['Java programming', 'Web development', 'Team collaboration'],
      areasOfImprovement: ['Testing practices'],
      feedbacks: [
        { id: 2, from: 'SPOC User', message: 'Excellent work on the Java application.', date: new Date('2025-05-22'), rating: 5 }
      ]
    }
  };

  constructor() {
    // Add performance data to interns
    this.internsData = this.internsData.map(intern => {
      return {
        ...intern,
        performance: this.performanceData[intern.internId] || {
          score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
          grade: this.calculateGrade(Math.floor(Math.random() * 30) + 70),
          level: this.calculateLevel(Math.floor(Math.random() * 30) + 70),
          progressPercentage: Math.floor(Math.random() * 40) + 60, // Random progress between 60-100%
          strengths: ['Coding', 'Problem-solving'],
          areasOfImprovement: ['Communication'],
          feedbacks: []
        }
      };
    });
  }

  private calculateGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C' {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  }

  private calculateLevel(score: number): 'Beginner' | 'Intermediate' | 'Advanced' {
    if (score >= 85) return 'Advanced';
    if (score >= 70) return 'Intermediate';
    return 'Beginner';
  }

  // Get all interns
  getAllInterns(): Observable<Intern[]> {
    this.isLoadingSubject.next(true);
    return of(this.internsData).pipe(
      delay(800),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // Get intern by ID
  getInternById(internId: string): Observable<Intern | undefined> {
    this.isLoadingSubject.next(true);
    return of(this.internsData.find(intern => intern.internId === internId)).pipe(
      delay(600),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // Get current logged-in intern (for intern dashboard)
  getCurrentIntern(): Observable<Intern | undefined> {
    // For demo, we'll return the first intern
    return this.getInternById('I346');
  }

  // Add a feedback to an intern
  addFeedback(internId: string, feedback: Omit<Feedback, 'id'>): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    const intern = this.internsData.find(intern => intern.internId === internId);
    if (!intern || !intern.performance) {
      this.errorMessageSubject.next('Intern not found');
      this.isLoadingSubject.next(false);
      return of(false);
    }

    const newFeedback: Feedback = {
      ...feedback,
      id: intern.performance.feedbacks.length + 1
    };

    intern.performance.feedbacks.push(newFeedback);
    
    return of(true).pipe(
      delay(800),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // Update intern performance
  updateInternPerformance(internId: string, performance: Partial<InternPerformance>): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    const intern = this.internsData.find(intern => intern.internId === internId);
    if (!intern || !intern.performance) {
      this.errorMessageSubject.next('Intern not found');
      this.isLoadingSubject.next(false);
      return of(false);
    }

    intern.performance = {
      ...intern.performance,
      ...performance
    };
    
    return of(true).pipe(
      delay(800),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // Get all skills from interns (for filtering)
  getAllSkills(): Observable<string[]> {
    const primarySkills = this.internsData.flatMap(intern => intern.primarySkill.split(','));
    const secondarySkills = this.internsData.flatMap(intern => intern.secondarySkill.split(','));
    const uniqueSkills = [...new Set([...primarySkills, ...secondarySkills])];
    
    return of(uniqueSkills.map(skill => skill.trim()));
  }

  // Get loading state
  isLoading(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  // Get error message
  getErrorMessage(): Observable<string> {
    return this.errorMessageSubject.asObservable();
  }

  // Clear error message
  clearErrorMessage(): void {
    this.errorMessageSubject.next('');
  }
}

