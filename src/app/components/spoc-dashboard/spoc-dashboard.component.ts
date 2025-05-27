import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InternService } from '../../services/intern.service';
import { Router } from '@angular/router';
import { Intern, User, Feedback, InternPerformance } from '../../models/user.model';
import { Observable, Subscription, catchError, finalize, of, tap, BehaviorSubject } from 'rxjs';

interface FeedbackForm {
  internId: string;
  message: string;
  rating: number;
}

@Component({
  selector: 'app-spoc-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spoc-dashboard.component.html',
  styleUrls: ['./spoc-dashboard.component.css']
})
export class SpocDashboardComponent implements OnInit, OnDestroy {
  // Data properties
  interns: Intern[] = [];
  filteredInterns: Intern[] = [];
  currentUser: User | null = null;
  selectedIntern: Intern | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private subscription = new Subscription();
  
  // UI state management
  sidebarCollapsed = window.innerWidth < 992;
  activeTab = 'dashboard';
  
  // Feedback form
  feedbackForm: FeedbackForm = {
    internId: '',
    message: '',
    rating: 5
  };
  submittingFeedback = false;
  
  // Search and filtering
  searchTerm = '';
  filterOptions = {
    location: '',
    allocatedBU: '',
    programmingLanguage: '',
    skillLevel: ''
  };
  
  // Dropdown options (derived from data)
  locationOptions: string[] = [];
  buOptions: string[] = [];
  languageOptions: string[] = [];
  
  // Sorting
  sortField = 'name';
  sortDirection = 'asc';
  
  // Performance metrics
  overallPerformanceData = {
    averageScore: 0,
    gradeDistribution: {
      'A+': 0,
      'A': 0,
      'B+': 0,
      'B': 0,
      'C': 0
    },
    skillLevelDistribution: {
      'Advanced': 0,
      'Intermediate': 0,
      'Beginner': 0
    },
    topPerformers: [] as Intern[],
    needsImprovement: [] as Intern[]
  };
  
  // Charts data
  performanceByBU = new Map<string, number>();
  performanceByLocation = new Map<string, number>();
  
  constructor(
    private authService: AuthService,
    private internService: InternService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication and redirect if not logged in
    this.checkAuthentication();
    
    // Load all interns data
    this.loadInternsData();
    
    // Subscribe to loading state
    this.subscription.add(
      this.internService.isLoading().subscribe(loading => {
        this.isLoading = loading;
      })
    );
    
    // Subscribe to error messages
    this.subscription.add(
      this.internService.getErrorMessage().subscribe(message => {
        this.errorMessage = message;
        if (message) {
          // Auto-clear error after 5 seconds
          setTimeout(() => this.internService.clearErrorMessage(), 5000);
        }
      })
    );
    
    // Add event listener for window resize
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscription.unsubscribe();
    
    // Remove event listener
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
  }

  // Check if user is authenticated and has correct role
  private checkAuthentication(): void {
    this.subscription.add(
      this.authService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
        
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        
        if (user.role !== 'spoc') {
          this.router.navigate([`/${user.role}-dashboard`]);
        }
      })
    );
  }

  // Load all interns data
  loadInternsData(): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.internService.getAllInterns().pipe(
        tap(interns => {
          this.interns = interns;
          this.filteredInterns = [...interns];
          
          // Initialize dropdown options from data
          this.initializeFilterOptions();
          
          // Calculate performance metrics
          this.calculatePerformanceMetrics();
        }),
        catchError(error => {
          this.errorMessage = 'An error occurred while loading data: ' + error.message;
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe()
    );
  }
  
  // Initialize filter dropdown options from data
  private initializeFilterOptions(): void {
    // Extract unique values for each filter
    this.locationOptions = [...new Set(this.interns.map(intern => intern.location))];
    this.buOptions = [...new Set(this.interns.map(intern => intern.allocatedBU))];
    this.languageOptions = [...new Set(this.interns.map(intern => intern.programmingLanguage))];
  }
  
  // Calculate performance metrics for charts and summaries
  private calculatePerformanceMetrics(): void {
    if (!this.interns.length) return;
    
    // Calculate average score
    const totalScore = this.interns.reduce((sum, intern) => sum + (intern.performance?.score || 0), 0);
    this.overallPerformanceData.averageScore = Math.round(totalScore / this.interns.length);
    
    // Calculate grade distribution
    this.interns.forEach(intern => {
      const grade = intern.performance?.grade || 'C';
      if (this.overallPerformanceData.gradeDistribution[grade] !== undefined) {
        this.overallPerformanceData.gradeDistribution[grade]++;
      }
      
      const level = intern.performance?.level || 'Beginner';
      if (this.overallPerformanceData.skillLevelDistribution[level] !== undefined) {
        this.overallPerformanceData.skillLevelDistribution[level]++;
      }
    });
    
    // Get top performers (score >= 85)
    this.overallPerformanceData.topPerformers = this.interns
      .filter(intern => (intern.performance?.score || 0) >= 85)
      .sort((a, b) => (b.performance?.score || 0) - (a.performance?.score || 0))
      .slice(0, 5);
    
    // Get interns needing improvement (score < 70)
    this.overallPerformanceData.needsImprovement = this.interns
      .filter(intern => (intern.performance?.score || 0) < 70)
      .sort((a, b) => (a.performance?.score || 0) - (b.performance?.score || 0))
      .slice(0, 5);
    
    // Calculate performance by business unit
    const buPerformance = new Map<string, { total: number, count: number }>();
    this.interns.forEach(intern => {
      const bu = intern.allocatedBU;
      const score = intern.performance?.score || 0;
      
      if (!buPerformance.has(bu)) {
        buPerformance.set(bu, { total: 0, count: 0 });
      }
      
      const current = buPerformance.get(bu)!;
      buPerformance.set(bu, {
        total: current.total + score,
        count: current.count + 1
      });
    });
    
    // Convert to averages
    buPerformance.forEach((value, key) => {
      this.performanceByBU.set(key, Math.round(value.total / value.count));
    });
    
    // Calculate performance by location
    const locationPerformance = new Map<string, { total: number, count: number }>();
    this.interns.forEach(intern => {
      const location = intern.location;
      const score = intern.performance?.score || 0;
      
      if (!locationPerformance.has(location)) {
        locationPerformance.set(location, { total: 0, count: 0 });
      }
      
      const current = locationPerformance.get(location)!;
      locationPerformance.set(location, {
        total: current.total + score,
        count: current.count + 1
      });
    });
    
    // Convert to averages
    locationPerformance.forEach((value, key) => {
      this.performanceByLocation.set(key, Math.round(value.total / value.count));
    });
  }
  
  // Handle window resize for responsive sidebar
  private handleWindowResize(): void {
    this.sidebarCollapsed = window.innerWidth < 992;
  }
  
  // UI Interactions
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Close sidebar automatically on mobile when tab is selected
    if (window.innerWidth < 992) {
      this.sidebarCollapsed = true;
    }
  }
  
  // Select an intern for detailed view
  selectIntern(intern: Intern): void {
    this.selectedIntern = intern;
    this.feedbackForm.internId = intern.internId;
  }
  
  // Close the detailed view
  closeInternDetail(): void {
    this.selectedIntern = null;
    this.resetFeedbackForm();
  }
  
  // Search and filtering
  applySearch(): void {
    this.filterInterns();
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.filterOptions = {
      location: '',
      allocatedBU: '',
      programmingLanguage: '',
      skillLevel: ''
    };
    this.filteredInterns = [...this.interns];
  }
  
  filterInterns(): void {
    // Start with all interns
    let result = [...this.interns];
    
    // Apply search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(intern => 
        intern.name.toLowerCase().includes(term) || 
        intern.internId.toLowerCase().includes(term) ||
        intern.primarySkill.toLowerCase().includes(term) ||
        intern.secondarySkill.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (this.filterOptions.location) {
      result = result.filter(intern => intern.location === this.filterOptions.location);
    }
    
    if (this.filterOptions.allocatedBU) {
      result = result.filter(intern => intern.allocatedBU === this.filterOptions.allocatedBU);
    }
    
    if (this.filterOptions.programmingLanguage) {
      result = result.filter(intern => intern.programmingLanguage === this.filterOptions.programmingLanguage);
    }
    
    if (this.filterOptions.skillLevel) {
      result = result.filter(intern => intern.performance?.level === this.filterOptions.skillLevel);
    }
    
    // Apply sorting
    result = this.sortInterns(result);
    
    this.filteredInterns = result;
  }
  
  // Sorting functions
  setSorting(field: string): void {
    // Toggle direction if same field
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.filteredInterns = this.sortInterns(this.filteredInterns);
  }
  
  private sortInterns(interns: Intern[]): Intern[] {
    return [...interns].sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'score':
          comparison = (a.performance?.score || 0) - (b.performance?.score || 0);
          break;
        case 'bu':
          comparison = a.allocatedBU.localeCompare(b.allocatedBU);
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Feedback submission
  submitFeedback(): void {
    if (!this.feedbackForm.internId || !this.feedbackForm.message || !this.currentUser) {
      return;
    }
    
    this.submittingFeedback = true;
    
    const feedback: Omit<Feedback, 'id'> = {
      from: this.currentUser.name || 'SPOC User',
      message: this.feedbackForm.message,
      rating: this.feedbackForm.rating,
      date: new Date()
    };
    
    this.subscription.add(
      this.internService.addFeedback(this.feedbackForm.internId, feedback).pipe(
        tap(success => {
          if (success) {
            this.successMessage = 'Feedback submitted successfully!';
            this.resetFeedbackForm();
            
            // Refresh the intern data
            this.loadInternsData();
            
            // Auto-clear success message
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = 'Failed to submit feedback. Please try again.';
          }
        }),
        catchError(error => {
          this.errorMessage = 'An error occurred: ' + error.message;
          return of(false);
        }),
        finalize(() => {
          this.submittingFeedback = false;
        })
      ).subscribe()
    );
  }
  
  resetFeedbackForm(): void {
    this.feedbackForm = {
      internId: this.selectedIntern?.internId || '',
      message: '',
      rating: 5
    };
  }
  
  // Update intern performance directly
  updatePerformance(internId: string, updates: Partial<InternPerformance>): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.internService.updateInternPerformance(internId, updates).pipe(
        tap(success => {
          if (success) {
            this.successMessage = 'Intern performance updated successfully!';
            
            // Refresh the intern data
            this.loadInternsData();
            
            // Auto-clear success message
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = 'Failed to update performance. Please try again.';
          }
        }),
        catchError(error => {
          this.errorMessage = 'An error occurred: ' + error.message;
          return of(false);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe()
    );
  }
  
  // Helper functions for UI
  getScoreColorClass(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  }
  
  getGradeColorClass(grade: string): string {
    switch(grade) {
      case 'A+': return 'bg-success text-white';
      case 'A': return 'bg-primary text-white';
      case 'B+': return 'bg-info text-white';
      case 'B': return 'bg-warning text-dark';
      default: return 'bg-danger text-white';
    }
  }
  
  getLevelColorClass(level: string): string {
    switch(level) {
      case 'Advanced': return 'bg-success';
      case 'Intermediate': return 'bg-info';
      default: return 'bg-warning';
    }
  }
  
  getSkillsArray(skillString: string): string[] {
    if (!skillString) return [];
    return skillString.split(',').map(skill => skill.trim());
  }
  
  // Authentication
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
