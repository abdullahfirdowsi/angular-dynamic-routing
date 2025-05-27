import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InternService } from '../../services/intern.service';
import { Router } from '@angular/router';
import { Intern, Feedback, User } from '../../models/user.model';
import { Observable, Subscription, catchError, finalize, of, tap } from 'rxjs';

interface TrainingModule {
  id: number;
  name: string;
  completed: boolean;
  progress: number;
  description?: string;
  dueDate?: string;
}

interface UpcomingEvent {
  date: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-intern-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intern-dashboard.component.html',
  styleUrls: ['./intern-dashboard.component.css']
})
export class InternDashboardComponent implements OnInit, OnDestroy {
  // Data properties
  intern: Intern | undefined;
  currentUser: User | null = null;
  isLoading = false;
  errorMessage = '';
  private subscription = new Subscription();
  
  // UI state management
  sidebarCollapsed = window.innerWidth < 992; // Collapsed by default on mobile
  activeTab: 'dashboard' | 'training' | 'communication' | 'profile' | 'performance' = 'dashboard';
  
  // New feedback form
  newFeedbackMessage = '';
  messageSending = false;
  
  // Training modules with more details
  trainingModules: TrainingModule[] = [
    { 
      id: 1, 
      name: 'Python Basics', 
      completed: true, 
      progress: 100,
      description: 'Introduction to Python programming language, syntax, data types, control structures, and basic algorithms.'
    },
    { 
      id: 2, 
      name: 'SQL Fundamentals', 
      completed: true, 
      progress: 100,
      description: 'Learn database concepts, SQL queries, joins, and data manipulation techniques.'
    },
    { 
      id: 3, 
      name: 'Cloud Computing', 
      completed: false, 
      progress: 70,
      description: 'Introduction to cloud services, infrastructure, and deployment models with practical examples.'
    },
    { 
      id: 4, 
      name: 'Data Analysis', 
      completed: false, 
      progress: 45,
      description: 'Techniques for analyzing and interpreting complex data sets using Python libraries.'
    },
    { 
      id: 5, 
      name: 'Machine Learning', 
      completed: false, 
      progress: 20,
      description: 'Introduction to machine learning algorithms and their applications in real-world scenarios.'
    }
  ];
  
  // Upcoming events with ISO date format
  upcomingEvents: UpcomingEvent[] = [
    { date: '2025-06-01', title: 'Team Meeting', description: 'Weekly project status update with the DATA BU team.' },
    { date: '2025-06-05', title: 'Training Session', description: 'Advanced Python techniques and best practices workshop.' },
    { date: '2025-06-10', title: 'Performance Review', description: 'Quarterly evaluation with SPOC to discuss progress and goals.' }
  ];

  // Skill assessment data with percentages
  skillAssessment = [
    { name: 'Technical Skills', percentage: 85, colorClass: 'bg-primary' },
    { name: 'Problem Solving', percentage: 75, colorClass: 'bg-success' },
    { name: 'Communication', percentage: 65, colorClass: 'bg-info' },
    { name: 'Team Collaboration', percentage: 80, colorClass: 'bg-warning' },
    { name: 'Time Management', percentage: 70, colorClass: 'bg-danger' }
  ];

  // Messages history for the communication tab
  messageHistory = [
    {
      sender: 'Sarah Johnson (SPOC)',
      content: 'Hello! How is your training progress going? Do you need any assistance with the current modules?',
      time: 'Yesterday, 2:30 PM',
      isReceived: true
    },
    {
      sender: 'You',
      content: 'Hi Sarah, I\'m making good progress. I\'ve completed the Python and SQL modules, and now I\'m working on Cloud Computing. No issues so far!',
      time: 'Yesterday, 3:15 PM',
      isReceived: false
    },
    {
      sender: 'Sarah Johnson (SPOC)',
      content: 'Great to hear! Don\'t forget about the team meeting next Monday. Let me know if you have any questions about the cloud module.',
      time: 'Yesterday, 3:45 PM',
      isReceived: true
    }
  ];

  constructor(
    private authService: AuthService, 
    private internService: InternService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication and redirect if not logged in
    this.checkAuthentication();
    
    // Load intern data
    this.loadInternData();
    
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
    
    // Add event listener for window resize to handle sidebar visibility
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
        
        if (user.role !== 'intern') {
          this.router.navigate([`/${user.role}-dashboard`]);
        }
      })
    );
  }

  // Load intern data with error handling
  loadInternData(): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.internService.getCurrentIntern().pipe(
        tap(intern => {
          this.intern = intern;
          if (!intern) {
            this.errorMessage = 'Could not load intern data. Please try again later.';
          }
        }),
        catchError(error => {
          this.errorMessage = 'An error occurred while loading data: ' + error.message;
          return of(undefined);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe()
    );
  }
  
  // Handle window resize for responsive sidebar
  private handleWindowResize(): void {
    this.sidebarCollapsed = window.innerWidth < 992;
  }
  
  // UI Interactions
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  setActiveTab(tab: 'dashboard' | 'training' | 'communication' | 'profile' | 'performance'): void {
    this.activeTab = tab;
    
    // Close sidebar automatically on mobile when tab is selected
    if (window.innerWidth < 992) {
      this.sidebarCollapsed = true;
    }
  }
  
  // Performance calculations
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
  
  // Send message to SPOC with loading state
  sendMessageToSPOC(): void {
    if (!this.newFeedbackMessage.trim() || !this.intern) return;
    
    this.messageSending = true;
    
    // Simulate API call
    setTimeout(() => {
      // Add message to chat history
      this.messageHistory.push({
        sender: 'You',
        content: this.newFeedbackMessage,
        time: new Date().toLocaleString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        }),
        isReceived: false
      });
      
      // Reset form and loading state
      this.newFeedbackMessage = '';
      this.messageSending = false;
      
      // Auto-reply for demo purposes
      setTimeout(() => {
        this.messageHistory.push({
          sender: 'Sarah Johnson (SPOC)',
          content: 'Thanks for your message. I\'ll get back to you shortly.',
          time: new Date().toLocaleString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric',
            hour12: true 
          }),
          isReceived: true
        });
      }, 1500);
    }, 1000);
  }

  // Calculate overall progress (average of training modules)
  calculateOverallProgress(): number {
    const totalProgress = this.trainingModules.reduce((sum, module) => sum + module.progress, 0);
    return Math.round(totalProgress / this.trainingModules.length);
  }
  
  // Get total completed modules count
  getCompletedModulesCount(): number {
    return this.trainingModules.filter((module: TrainingModule) => module.completed).length;
  }
  
  // Safely get training module count string
  getTrainingModulesStatusText(): string {
    const completedCount = this.getCompletedModulesCount();
    const totalCount = this.trainingModules.length;
    return `You have completed ${completedCount} out of ${totalCount} training modules.`;
  }
  
  // Convert skills to array for visualization
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
