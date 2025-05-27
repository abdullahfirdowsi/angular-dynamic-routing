import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SystemService } from './system.service';

// Core report interface
export interface Report {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  type: ReportType;
  status: ReportStatus;
  filters: ReportFilter;
  data?: any;
}

// Report types
export enum ReportType {
  PERFORMANCE = 'performance',
  ASSESSMENT = 'assessment',
  TRAINING = 'training',
  ATTENDANCE = 'attendance',
  FEEDBACK = 'feedback',
  SUMMARY = 'summary',
  CUSTOM = 'custom'
}

// Report status
export enum ReportStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SCHEDULED = 'scheduled',
  ERROR = 'error'
}

// Report filters
export interface ReportFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  interns?: string[];
  spocs?: string[];
  departments?: string[];
  skills?: string[];
  minScore?: number;
  maxScore?: number;
  status?: string;
  tags?: string[];
  customFilters?: Record<string, any>;
}

// Export format
export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

// Schedule frequency
export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

// Report schedule
export interface ReportSchedule {
  id: string;
  reportId: string;
  frequency: ScheduleFrequency;
  nextRun: Date;
  recipients: string[];
  enabled: boolean;
  lastRun?: Date;
  lastStatus?: 'success' | 'failure';
}

// Analytics metrics
export interface AnalyticsMetric {
  key: string;
  label: string;
  value: number;
  change?: number; // Percentage change from previous period
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

// Analytics insight (automated findings)
export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'positive' | 'negative' | 'neutral';
  relatedMetrics: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private reports = new BehaviorSubject<Report[]>([]);
  private schedules = new BehaviorSubject<ReportSchedule[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorMessageSubject = new BehaviorSubject<string>('');
  private successMessageSubject = new BehaviorSubject<string>('');

  constructor(
    private authService: AuthService,
    private systemService: SystemService
  ) {
    // Initialize with sample data
    this.initializeSampleData();
  }

  // Initialize sample data
  private initializeSampleData(): void {
    const sampleReports: Report[] = [
      {
        id: '1',
        title: 'Monthly Intern Performance Report',
        description: 'Overall performance metrics for all interns',
        createdAt: new Date('2025-05-01'),
        createdBy: 'Manager User',
        type: ReportType.PERFORMANCE,
        status: ReportStatus.GENERATED,
        filters: {
          dateRange: {
            start: new Date('2025-04-01'),
            end: new Date('2025-04-30')
          }
        }
      },
      {
        id: '2',
        title: 'Q2 Skills Assessment',
        description: 'Technical skills evaluation for Q2',
        createdAt: new Date('2025-05-15'),
        createdBy: 'SPOC User',
        type: ReportType.ASSESSMENT,
        status: ReportStatus.GENERATED,
        filters: {
          departments: ['Engineering', 'Product'],
          skills: ['Angular', 'React', 'Node.js']
        }
      },
      {
        id: '3',
        title: 'Training Completion Status',
        description: 'Progress report on mandatory training completion',
        createdAt: new Date('2025-05-20'),
        createdBy: 'SPOC User',
        type: ReportType.TRAINING,
        status: ReportStatus.GENERATED,
        filters: {
          status: 'in-progress'
        }
      },
      {
        id: '4',
        title: 'Intern Feedback Summary',
        description: 'Aggregated feedback from SPOCs',
        createdAt: new Date('2025-05-25'),
        createdBy: 'Manager User',
        type: ReportType.FEEDBACK,
        status: ReportStatus.SCHEDULED,
        filters: {
          dateRange: {
            start: new Date('2025-05-01'),
            end: new Date('2025-05-31')
          }
        }
      }
    ];

    const sampleSchedules: ReportSchedule[] = [
      {
        id: '1',
        reportId: '1',
        frequency: ScheduleFrequency.MONTHLY,
        nextRun: new Date('2025-06-01'),
        recipients: ['manager@ilink-systems.com', 'hr@ilink-systems.com'],
        enabled: true,
        lastRun: new Date('2025-05-01'),
        lastStatus: 'success'
      },
      {
        id: '2',
        reportId: '4',
        frequency: ScheduleFrequency.WEEKLY,
        nextRun: new Date('2025-06-01'),
        recipients: ['manager@ilink-systems.com', 'spocs@ilink-systems.com'],
        enabled: true
      }
    ];

    this.reports.next(sampleReports);
    this.schedules.next(sampleSchedules);
  }

  // Get all reports
  getReports(): Observable<Report[]> {
    return this.reports.asObservable();
  }

  // Get report by ID
  getReportById(id: string): Observable<Report | undefined> {
    return this.reports.pipe(
      map(reports => reports.find(report => report.id === id))
    );
  }

  // Get reports by type
  getReportsByType(type: ReportType): Observable<Report[]> {
    return this.reports.pipe(
      map(reports => reports.filter(report => report.type === type))
    );
  }

  // Generate a new report
  generateReport(title: string, type: ReportType, filters: ReportFilter): Observable<Report> {
    this.isLoadingSubject.next(true);

    // Get current user
    const user = this.authService.getCurrentUser();
    let createdBy = 'Unknown User';
    
    // Subscribe to get the actual user value (needed for sync operation)
    user.subscribe(u => {
      if (u) {
        createdBy = u.name;
      }
    });

    // Create new report object
    const newReport: Report = {
      id: Date.now().toString(), // Simple ID generation
      title,
      description: `Generated ${type} report`,
      createdAt: new Date(),
      createdBy,
      type,
      status: ReportStatus.GENERATED,
      filters
    };

    // Simulate report data generation based on type
    return of(newReport).pipe(
      delay(2000), // Simulate processing time
      tap(report => {
        // Generate mock data based on report type
        switch (type) {
          case ReportType.PERFORMANCE:
            report.data = this.generatePerformanceData(filters);
            break;
          case ReportType.ASSESSMENT:
            report.data = this.generateAssessmentData(filters);
            break;
          case ReportType.TRAINING:
            report.data = this.generateTrainingData(filters);
            break;
          case ReportType.ATTENDANCE:
            report.data = this.generateAttendanceData(filters);
            break;
          case ReportType.FEEDBACK:
            report.data = this.generateFeedbackData(filters);
            break;
          default:
            report.data = { message: 'Custom report data would be generated here' };
        }

        // Add to reports list
        const currentReports = this.reports.getValue();
        this.reports.next([...currentReports, report]);

        // Update status
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next(`Report "${title}" generated successfully`);
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // Schedule a report
  scheduleReport(reportId: string, frequency: ScheduleFrequency, recipients: string[]): Observable<ReportSchedule> {
    this.isLoadingSubject.next(true);

    const newSchedule: ReportSchedule = {
      id: Date.now().toString(),
      reportId,
      frequency,
      nextRun: this.calculateNextRunDate(frequency),
      recipients,
      enabled: true
    };

    return of(newSchedule).pipe(
      delay(1000),
      tap(schedule => {
        const currentSchedules = this.schedules.getValue();
        this.schedules.next([...currentSchedules, schedule]);
        this.isLoadingSubject.next(false);
        this.successMessageSubject.next('Report scheduled successfully');
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
      })
    );
  }

  // Get all scheduled reports
  getSchedules(): Observable<ReportSchedule[]> {
    return this.schedules.asObservable();
  }

  // Export a report in specified format
  exportReport(reportId: string, format: ExportFormat): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    return this.getReportById(reportId).pipe(
      delay(1500),
      map(report => {
        if (!report) {
          this.errorMessageSubject.next('Report not found');
          return false;
        }
        
        // In a real app, this would trigger the actual export process
        console.log(`Exporting report ${report.title} in ${format} format`);
        
        this.successMessageSubject.next(`Report exported as ${format.toUpperCase()} successfully`);
        
        // Auto-clear success message
        setTimeout(() => this.successMessageSubject.next(''), 3000);
        return true;
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // Generate analytics from a report
  generateAnalytics(reportId: string): Observable<{ metrics: AnalyticsMetric[], insights: AnalyticsInsight[] }> {
    this.isLoadingSubject.next(true);
    
    return this.getReportById(reportId).pipe(
      delay(2000),
      map(report => {
        if (!report || !report.data) {
          return {
            metrics: [],
            insights: []
          };
        }
        
        // Generate mock analytics based on report type
        let metrics: AnalyticsMetric[] = [];
        let insights: AnalyticsInsight[] = [];
        
        switch (report.type) {
          case ReportType.PERFORMANCE:
            metrics = this.generatePerformanceMetrics(report);
            insights = this.generatePerformanceInsights(report);
            break;
          case ReportType.ASSESSMENT:
            metrics = this.generateAssessmentMetrics(report);
            insights = this.generateAssessmentInsights(report);
            break;
          // Additional cases for other report types
          default:
            metrics = [
              {
                key: 'generic',
                label: 'Generic Metric',
                value: 75,
                change: 5,
                trend: 'up',
                unit: '%'
              }
            ];
            insights = [
              {
                id: '1',
                title: 'Generic Insight',
                description: 'This is a placeholder insight for this report type.',
                severity: 'medium',
                category: 'neutral',
                relatedMetrics: ['generic']
              }
            ];
        }
        
        this.isLoadingSubject.next(false);
        return { metrics, insights };
      })
    );
  }

  // Delete a report
  deleteReport(reportId: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    
    return of(true).pipe(
      delay(1000),
      tap(() => {
        const currentReports = this.reports.getValue();
        const filteredReports = currentReports.filter(report => report.id !== reportId);
        
        if (currentReports.length === filteredReports.length) {
          this.errorMessageSubject.next('Report not found');
          
          // Auto-clear error message
          setTimeout(() => this.errorMessageSubject.next(''), 3000);
        } else {
          this.reports.next(filteredReports);
          this.successMessageSubject.next('Report deleted successfully');
          
          // Auto-clear success message
          setTimeout(() => this.successMessageSubject.next(''), 3000);
          
          // Also delete any associated schedules
          const currentSchedules = this.schedules.getValue();
          const filteredSchedules = currentSchedules.filter(schedule => schedule.reportId !== reportId);
          this.schedules.next(filteredSchedules);
        }
        
        this.isLoadingSubject.next(false);
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

  // Helper methods for generating mock data
  private calculateNextRunDate(frequency: ScheduleFrequency): Date {
    const today = new Date();
    const nextRun = new Date(today);
    
    switch (frequency) {
      case ScheduleFrequency.DAILY:
        nextRun.setDate(today.getDate() + 1);
        break;
      case ScheduleFrequency.WEEKLY:
        nextRun.setDate(today.getDate() + 7);
        break;
      case ScheduleFrequency.BIWEEKLY:
        nextRun.setDate(today.getDate() + 14);
        break;
      case ScheduleFrequency.MONTHLY:
        nextRun.setMonth(today.getMonth() + 1);
        break;
      case ScheduleFrequency.QUARTERLY:
        nextRun.setMonth(today.getMonth() + 3);
        break;
    }
    
    return nextRun;
  }

  private generatePerformanceData(filters: ReportFilter): any {
    return {
      summary: {
        averageScore: 82.5,
        topPerformer: 'John Doe',
        topPerformerScore: 97,
        lowestScore: 65,
        improvementRate: '8.3%'
      },
      interns: [
        { name: 'John Doe', score: 97, change: 5, strengths: ['Communication', 'Problem-solving'], improvements: ['Documentation'] },
        { name: 'Jane Smith', score: 92, change: 3, strengths: ['Technical skills', 'Leadership'], improvements: ['Time management'] },
        { name: 'Michael Johnson', score: 85, change: 7, strengths: ['Teamwork', 'Adaptability'], improvements: ['Technical depth'] },
        { name: 'Emily Brown', score: 78, change: 2, strengths: ['Creativity', 'Documentation'], improvements: ['Decision making'] },
        { name: 'David Wilson', score: 65, change: -3, strengths: ['Analytical skills'], improvements: ['Communication', 'Teamwork'] }
      ],
      categories: [
        { name: 'Technical Skills', average: 83 },
        { name: 'Communication', average: 79 },
        { name: 'Problem Solving', average: 85 },
        { name: 'Teamwork', average: 88 },
        { name: 'Leadership', average: 76 }
      ],
      trends: [
        { month: 'January', average: 76 },
        { month: 'February', average: 78 },
        { month: 'March', average: 77 },
        { month: 'April', average: 80 },
        { month: 'May', average: 82.5 }
      ]
    };
  }

  private generateAssessmentData(filters: ReportFilter): any {
    return {
      summary: {
        assessmentsCompleted: 45,
        averageScore: 76.8,
        passRate: '89%',
        skillGaps: ['Advanced React', 'Cloud Architecture', 'Testing']
      },
      skills: [
        { name: 'Angular', average: 82, topPerformer: 'Emily Brown' },
        { name: 'React', average: 75, topPerformer: 'John Doe' },
        { name: 'Node.js', average: 70, topPerformer: 'Jane Smith' },
        { name: 'Testing', average: 65, topPerformer: 'Michael Johnson' },
        { name: 'DevOps', average: 62, topPerformer: 'David Wilson' }
      ],
      departments: [
        { name: 'Engineering', average: 80, headcount: 25 },
        { name: 'Product', average: 75, headcount: 15 },
        { name: 'Design', average: 73, headcount: 10 }
      ],
      recommendations: [
        'Increase React training sessions',
        'Provide more hands-on testing workshops',
        'Create mentorship program for DevOps skills'
      ]
    };
  }

  private generateTrainingData(filters: ReportFilter): any {
    return {
      summary: {
        totalCourses: 12,
        completionRate: '68%',
        averageCompletionTime: '14 days',
        onTrackPercentage: '72%'
      },
      courses: [
        { name: 'Angular Fundamentals', completion: 92, averageScore: 88 },
        { name: 'React Advanced', completion: 78, averageScore: 82 },
        { name: 'Node.js Basics', completion: 85, averageScore: 90 },
        { name: 'API Design', completion: 62, averageScore: 75 },
        { name: 'Git Workflow', completion: 98, averageScore: 95 }
      ],
      interns: [
        { name: 'John Doe', coursesCompleted: 10, averageScore: 92, onTrack: true },
        { name: 'Jane Smith', coursesCompleted: 8, averageScore: 88, onTrack: true },
        { name: 'Michael Johnson', coursesCompleted: 7, averageScore: 79, onTrack: false },
        { name: 'Emily Brown', coursesCompleted: 12, averageScore: 95, onTrack: true },
        { name: 'David Wilson', coursesCompleted: 6, averageScore: 72, onTrack: false }
      ]
    };
  }

  private generateAttendanceData(filters: ReportFilter): any {
    return {
      summary: {
        averageAttendance: '94.2%',
        lateArrivalRate: '5.8%',
        absenteeismRate: '2.3%',
        perfectAttendance: 12
      },
      interns: [
        { name: 'John Doe', attendance: 98, lateCount: 1, absentCount: 0 },
        { name: 'Jane Smith', attendance: 95, lateCount: 2, absentCount: 1 },
        { name: 'Michael Johnson', attendance: 92, lateCount: 3, absentCount: 2 },
        { name: 'Emily Brown', attendance: 100, lateCount: 0, absentCount: 0 },
        { name: 'David Wilson', attendance: 88, lateCount: 5, absentCount: 3 }
      ],
      trends: [
        { month: 'January', attendance: 91 },
        { month: 'February', attendance: 93 },
        { month: 'March', attendance: 92 },
        { month: 'April', attendance: 94 },
        { month: 'May', attendance: 94.2 }
      ]
    };
  }

  private generateFeedbackData(filters: ReportFilter): any {
    return {
      summary: {
        totalFeedback: 125,
        averageRating: 4.2,
        positivePercentage: '78%',
        improvementAreas: ['Documentation', 'Communication', 'Testing']
      },
      categories: [
        { name: 'Technical Skills', rating: 4.3, feedback: 42 },
        { name: 'Communication', rating: 3.8, feedback: 38 },
        { name: 'Problem Solving', rating: 4.1, feedback: 35 },
        { name: 'Teamwork', rating: 4.5, feedback: 30 },
        { name: 'Initiative', rating: 4.0, feedback: 25 }
      ],
      interns: [
        { name: 'John Doe', averageRating: 4.8, topStrength: 'Problem Solving', improvement: 'Documentation' },
        { name: 'Jane Smith', averageRating: 4.5, topStrength: 'Teamwork', improvement: 'Technical Depth' },
        { name: 'Michael Johnson', averageRating: 4.0, topStrength: 'Technical Skills', improvement: 'Communication' },
        { name: 'Emily Brown', averageRating: 4.7, topStrength: 'Initiative', improvement: 'Focus' },
        { name: 'David Wilson', averageRating: 3.8, topStrength: 'Creativity', improvement: 'Consistency' }
      ]
    };
  }

  private generatePerformanceMetrics(report: Report): AnalyticsMetric[] {
    return [
      {
        key: 'avg_score',
        label: 'Average Performance Score',
        value: 82.5,
        change: 3.1,
        trend: 'up',
        unit: '%'
      },
      {
        key: 'top_performers',
        label: 'Top Performers (90%+)',
        value: 2,
        change: 0,
        trend: 'stable',
        unit: 'people'
      },
      {
        key: 'low_performers',
        label: 'Low Performers (<70%)',
        value: 1,
        change: -1,
        trend: 'down',
        unit: 'people'
      },
      {
        key: 'improvement_rate',
        label: 'Overall Improvement Rate',
        value: 8.3,
        change: 2.1,
        trend: 'up',
        unit: '%'
      }
    ];
  }

  private generatePerformanceInsights(report: Report): AnalyticsInsight[] {
    return [
      {
        id: '1',
        title: 'Strong technical skill development',
        description: 'Technical skills show consistent improvement across most interns, with a 7% increase in average technical scores.',
        severity: 'medium',
        category: 'positive',
        relatedMetrics: ['avg_score', 'improvement_rate']
      },
      {
        id: '2',
        title: 'Communication skills need attention',
        description: 'Communication scores are consistently lower than other categories, suggesting a need for targeted training.',
        severity: 'high',
        category: 'negative',
        relatedMetrics: ['avg_score']
      },
      {
        id: '3',
        title: 'Consistent top performers',
        description: 'John Doe and Jane Smith consistently rank in the top performance bracket for 3 consecutive months.',
        severity: 'low',
        category: 'positive',
        relatedMetrics: ['top_performers']
      }
    ];
  }

  private generateAssessmentMetrics(report: Report): AnalyticsMetric[] {
    return [
      {
        key: 'pass_rate',
        label: 'Assessment Pass Rate',
        value: 89,
        change: 4,
        trend: 'up',
        unit: '%'
      },
      {
        key: 'avg_score',
        label: 'Average Assessment Score',
        value: 76.8,
        change: 1.5,
        trend: 'up',
        unit: '%'
      },
      {
        key: 'skill_coverage',
        label: 'Skill Coverage',
        value: 85,
        change: 5,
        trend: 'up',
        unit: '%'
      }
    ];
  }

  private generateAssessmentInsights(report: Report): AnalyticsInsight[] {
    return [
      {
        id: '1',
        title: 'React skills gap identified',
        description: 'Advanced React skills show consistently lower scores, suggesting a training opportunity.',
        severity: 'medium',
        category: 'negative',
        relatedMetrics: ['avg_score']
      },
      {
        id: '2',
        title: 'High Angular proficiency',
        description: 'Angular skills show high proficiency across all departments, with Engineering leading at 82% average.',
        severity: 'low',
        category: 'positive',
        relatedMetrics: ['skill_coverage']
      }
    ];
  }
}

