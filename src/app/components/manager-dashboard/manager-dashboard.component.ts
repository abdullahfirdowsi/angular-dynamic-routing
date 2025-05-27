import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, catchError, finalize, of, tap } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { InternService } from '../../services/intern.service';
import { Intern, User, Feedback, InternPerformance } from '../../models/user.model';

/**
 * Represents a SPOC (Single Point of Contact) user in the system
 */
interface SpocUser {
  id: number;
  name: string;
  email: string;
  assignedBU: string;
  internCount: number;
  status: 'Active' | 'Inactive';
  lastLogin?: Date;
  createdAt?: Date;
  teamPerformance?: number;
  assignedInterns?: string[]; // Array of intern IDs
}

/**
 * Represents a system configuration setting
 */
interface SystemConfig {
  name: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'number';
  description: string;
  category?: 'notification' | 'performance' | 'security' | 'general';
  lastUpdated?: Date;
  updatedBy?: string;
}

// Type guards for SystemConfig
interface BooleanSystemConfig extends SystemConfig {
  type: 'boolean';
  value: boolean;
}

interface TextSystemConfig extends SystemConfig {
  type: 'text';
  value: string;
}

interface NumberSystemConfig extends SystemConfig {
  type: 'number';
  value: number;
}

/**
 * Represents system-wide statistics
 */
interface SystemStats {
  totalInterns: number;
  totalSpocs: number;
  activeInterns: number;
  averageScore: number;
  topPerformingBU: string;
  needsAttentionCount: number;
  gradeDistribution?: {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C': number;
  };
  skillLevelDistribution?: {
    'Advanced': number;
    'Intermediate': number;
    'Beginner': number;
  };
  lastUpdated?: Date;
}

/**
 * Represents monthly progress data for charts
 */
interface MonthlyProgress {
  month: string;
  score: number;
  internCount?: number;
  completedTrainings?: number;
  feedbackCount?: number;
}

/**
 * Represents a report configuration
 */
interface ReportConfig {
  id: number;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  lastGenerated?: Date;
  recipients: string;
  status: 'Active' | 'Inactive';
  type: 'Performance' | 'Skills' | 'Business Unit' | 'Location' | 'Custom';
  format?: 'PDF' | 'Excel' | 'CSV';
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  // User and authentication
  currentUser: User | null = null;
  
  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  sidebarCollapsed = window.innerWidth < 992;
  activeTab: 'dashboard' | 'interns' | 'spocs' | 'reports' | 'config' = 'dashboard';
  
  // Data
  interns: Intern[] = [];
  filteredInterns: Intern[] = [];
  selectedIntern: Intern | null = null;
  
  // SPOC Management
  spocUsers: SpocUser[] = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@ilink-systems.com', assignedBU: 'DATA', internCount: 15, status: 'Active' },
    { id: 2, name: 'Michael Chen', email: 'michael.chen@ilink-systems.com', assignedBU: 'DEX', internCount: 18, status: 'Active' },
    { id: 3, name: 'Jessica Williams', email: 'jessica.williams@ilink-systems.com', assignedBU: 'IAT', internCount: 8, status: 'Active' },
    { id: 4, name: 'Robert Taylor', email: 'robert.taylor@ilink-systems.com', assignedBU: 'DATA', internCount: 12, status: 'Inactive' }
  ];
  
  selectedSpoc: SpocUser | null = null;
  
  // System configuration
  systemConfig: SystemConfig[] = [
    { name: 'enableFeedbackNotifications', value: true, type: 'boolean', description: 'Send email notifications when new feedback is added' },
    { name: 'performanceUpdateFrequency', value: 'Weekly', type: 'text', description: 'Frequency of performance evaluations' },
    { name: 'minimumPerformanceScore', value: 60, type: 'number', description: 'Minimum acceptable performance score' },
    { name: 'enableAutoReports', value: true, type: 'boolean', description: 'Automatically generate and send reports' },
    { name: 'reportRecipients', value: 'managers@ilink-systems.com', type: 'text', description: 'Email recipients for automated reports' }
  ];
  
  // System statistics
  systemStats: SystemStats = {
    totalInterns: 72,
    totalSpocs: 4,
    activeInterns: 68,
    averageScore: 82,
    topPerformingBU: 'DATA',
    needsAttentionCount: 8
  };
  
  // Charts and metrics
  buPerformance = new Map<string, number>([
    ['DATA', 85],
    ['DEX', 78],
    ['IAT', 76]
  ]);
  
  locationPerformance = new Map<string, number>([
    ['Chennai', 83],
    ['Pune', 80],
    ['Trichy', 79]
  ]);
  
  monthlyProgress = [
    { month: 'Jan', score: 75 },
    { month: 'Feb', score: 78 },
    { month: 'Mar', score: 76 },
    { month: 'Apr', score: 80 },
    { month: 'May', score: 82 },
    { month: 'Jun', score: 85 }
  ];
  
  private subscription = new Subscription();
  
  constructor(
    private authService: AuthService,
    private internService: InternService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Check authentication
    this.checkAuthentication();
    
    // Load data
    this.loadData();
    
    // Add event listener for window resize
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
    
    // Remove event listener
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
  }
  
  // Authentication check
  private checkAuthentication(): void {
    this.subscription.add(
      this.authService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
        
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        
        if (user.role !== 'manager') {
          this.router.navigate([`/${user.role}-dashboard`]);
        }
      })
    );
  }
  
  // Load all data
  loadData(): void {
    this.isLoading = true;
    
    this.subscription.add(
      this.internService.getAllInterns().pipe(
        tap(interns => {
          this.interns = interns;
          this.filteredInterns = [...interns];
          this.calculateStatistics();
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
  
  // Calculate system statistics
  private calculateStatistics(): void {
    if (!this.interns.length) return;
    
    // Calculate average score
    const totalScore = this.interns.reduce((sum, intern) => sum + (intern.performance?.score || 0), 0);
    this.systemStats.averageScore = Math.round(totalScore / this.interns.length);
    
    // Count interns needing attention (score < 70)
    this.systemStats.needsAttentionCount = this.interns.filter(intern => (intern.performance?.score || 0) < 70).length;
    
    // Update intern count
    this.systemStats.totalInterns = this.interns.length;
    this.systemStats.activeInterns = this.interns.filter(i => i.performance?.score !== undefined).length;
    
    // Find top performing BU
    const buScores = new Map<string, { total: number, count: number }>();
    
    this.interns.forEach(intern => {
      const bu = intern.allocatedBU;
      const score = intern.performance?.score || 0;
      
      if (!buScores.has(bu)) {
        buScores.set(bu, { total: 0, count: 0 });
      }
      
      const current = buScores.get(bu)!;
      buScores.set(bu, {
        total: current.total + score,
        count: current.count + 1
      });
    });
    
    let topBU = '';
    let topScore = 0;
    
    buScores.forEach((value, key) => {
      const avgScore = value.total / value.count;
      if (avgScore > topScore) {
        topScore = avgScore;
        topBU = key;
      }
    });
    
    this.systemStats.topPerformingBU = topBU;
  }
  
  // UI event handlers
  handleWindowResize(): void {
    this.sidebarCollapsed = window.innerWidth < 992;
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  setActiveTab(tab: 'dashboard' | 'interns' | 'spocs' | 'reports' | 'config'): void {
    this.activeTab = tab;
    
    // Close sidebar automatically on mobile when tab is selected
    if (window.innerWidth < 992) {
      this.sidebarCollapsed = true;
    }
  }
  
  // SPOC management
  selectSpoc(spoc: SpocUser): void {
    this.selectedSpoc = spoc;
  }
  
  closeSpocDetail(): void {
    this.selectedSpoc = null;
  }
  
  updateSpocStatus(spoc: SpocUser, status: 'Active' | 'Inactive'): void {
    spoc.status = status;
    this.successMessage = `SPOC ${spoc.name} status updated to ${status}`;
    
    // Auto-clear success message
    setTimeout(() => this.successMessage = '', 3000);
  }
  
  // System configuration
  updateConfigFromCheckbox(config: SystemConfig, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    config.value = inputElement.checked;
    this.successMessage = `System configuration updated: ${config.name}`;
    
    // Auto-clear success message
    setTimeout(() => this.successMessage = '', 3000);
  }
  
  updateConfigFromInput(config: SystemConfig, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (config.type === 'number') {
      config.value = Number(inputElement.value);
    } else {
      config.value = inputElement.value;
    }
    this.successMessage = `System configuration updated: ${config.name}`;
    
    // Auto-clear success message
    setTimeout(() => this.successMessage = '', 3000);
  }
  
  // Legacy method for backward compatibility
  updateConfig(config: SystemConfig, value: any): void {
    config.value = value;
    this.successMessage = `System configuration updated: ${config.name}`;
    
    // Auto-clear success message
    setTimeout(() => this.successMessage = '', 3000);
  }
  
  // Report generation
  generateReport(reportType: string): void {
    this.isLoading = true;
    
    // Simulate report generation
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = `${reportType} report generated successfully`;
      
      // Auto-clear success message
      setTimeout(() => this.successMessage = '', 3000);
    }, 1500);
  }
  
  // Intern management
  selectIntern(intern: Intern): void {
    this.selectedIntern = intern;
  }
  
  closeInternDetail(): void {
    this.selectedIntern = null;
  }
  
  // Helper functions
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
  
  getStatusColorClass(status: string): string {
    return status === 'Active' ? 'text-success' : 'text-danger';
  }
  
  // Authentication
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
