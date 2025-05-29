import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InternPerformance, InternPerformanceService } from '../../services/intern-performance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './performance-dashboard.component.html',
  styleUrl: './performance-dashboard.component.css'
})
export class PerformanceDashboardComponent implements OnInit {
  performanceData: InternPerformance[] = [];
  filteredData: InternPerformance[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isSpoc: boolean = false;
  isManager: boolean = false;
  isIntern: boolean = false;
  // Using a non-null assertion with default values to handle TypeScript null checks
  editingIntern: InternPerformance = {
    id: 0,
    internId: '',
    name: '',
    location: '',
    programmingLanguage: '',
    email: '',
    collegeName: '',
    bu: '',
    score: 0,
    performanceLevel: 'N/A',
    status: 'Pending'
  };
  isEditing = false;
  scoreError: string = '';
  // State tracking properties
  originalScore: number = 0;
  showNoChangeAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'info' | 'warning' | 'success' = 'info';

  constructor(
    private internPerformanceService: InternPerformanceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get performance data
    this.internPerformanceService.getPerformanceData().subscribe(data => {
      this.performanceData = data;
      this.filteredData = [...data];
    });

    // Check user roles
    this.internPerformanceService.canEdit().subscribe(canEdit => {
      this.isSpoc = canEdit;
    });

    this.internPerformanceService.canApprove().subscribe(canApprove => {
      this.isManager = canApprove;
    });

    this.internPerformanceService.isIntern().subscribe(isIntern => {
      this.isIntern = isIntern;
    });
  }

  // Filter data based on search term
  filterData(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.performanceData];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = this.performanceData.filter(intern => 
        intern.name.toLowerCase().includes(term) ||
        intern.internId.toLowerCase().includes(term) ||
        intern.location.toLowerCase().includes(term) ||
        intern.programmingLanguage.toLowerCase().includes(term) ||
        intern.bu.toLowerCase().includes(term)
      );
    }
  }

  // Sort data by column
  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let valueA: any = a[column as keyof InternPerformance];
      let valueB: any = b[column as keyof InternPerformance];

      // Convert to lowercase if string for case-insensitive sorting
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Get CSS class for performance level badge
  getPerformanceLevelClass(level: string): string {
    switch (level) {
      case 'L1': return 'badge bg-success';
      case 'L2': return 'badge bg-warning text-dark';
      case 'L3': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  // Get tooltip text for performance level
  getPerformanceLevelTooltip(level: string): string {
    switch (level) {
      case 'L1': return 'Excellent Performance (Score > 90)';
      case 'L2': return 'Good Performance (Score 80-90)';
      case 'L3': return 'Needs Improvement (Score < 70)';
      default: return 'Score between 70-79';
    }
  }

  // Show alert with auto-hide
  private showAlert(message: string, type: 'info' | 'warning' | 'success'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showNoChangeAlert = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showNoChangeAlert = false;
      this.alertMessage = '';
    }, 3000);
  }

  // Check if score has been modified
  hasScoreChanged(): boolean {
    return this.originalScore !== this.editingIntern.score;
  }

  // Start editing an intern record (SPOC role)
  startEditing(intern: InternPerformance): void {
    if (!this.isSpoc) return;
    this.editingIntern = { ...intern };
    this.originalScore = intern.score; // Store original score for comparison
    this.isEditing = true;
    this.scoreError = '';
    this.showNoChangeAlert = false;
  }
  
  // Handle score changes
  onScoreChange(newScore: number): void {
    // Validate score
    if (newScore < 0 || newScore > 100 || isNaN(newScore)) {
      this.scoreError = 'Score must be between 0 and 100';
    } else {
      this.scoreError = '';
      
      // Check if score has changed from original
      if (!this.hasScoreChanged()) {
        this.showAlert('No changes detected. Score is the same as original.', 'info');
      }
    }
  }

  // Cancel editing
  cancelEditing(): void {
    this.isEditing = false;
    this.scoreError = '';
    this.showNoChangeAlert = false;
  }

  // Save edited record
  saveEditing(): void {
    // Validate score
    const score = this.editingIntern.score;
    if (score < 0 || score > 100 || isNaN(score)) {
      this.scoreError = 'Score must be between 0 and 100';
      return;
    }

    // Check if score has actually changed
    if (!this.hasScoreChanged()) {
      this.showAlert('No changes to save. Score remains the same.', 'info');
      this.isEditing = false;
      return;
    }

    // Save changes only if score has actually changed
    this.internPerformanceService.updateInternData(this.editingIntern.id, this.editingIntern.score)
      .subscribe({
        next: (updatedIntern) => {
          console.log('Successfully updated intern:', updatedIntern);
          
          // Update the data in the table
          const index = this.filteredData.findIndex(i => i.id === updatedIntern.id);
          if (index !== -1) {
            this.filteredData[index] = updatedIntern;
            this.performanceData = this.performanceData.map(i => 
              i.id === updatedIntern.id ? updatedIntern : i
            );
          }
          
          this.isEditing = false;
          this.scoreError = '';
          this.showAlert('Score updated successfully!', 'success');
        },
        error: (error) => {
          console.error('Error updating intern:', error);
          this.showAlert('Failed to update score. Please try again.', 'warning');
          this.scoreError = error.message || 'Failed to update intern performance';
        }
      });
  }

  // Approve performance record (Manager role)
  approvePerformance(id: number): void {
    if (!this.isManager) return;
    this.internPerformanceService.approveInternPerformance(id)
      .subscribe({
        next: (approvedIntern) => {
          console.log('Successfully approved intern performance:', approvedIntern);
        },
        error: (error) => {
          console.error('Error approving intern performance:', error);
        }
      });
  }

  // Determine if sorting is active for a column
  isSortActive(column: string): boolean {
    return this.sortColumn === column;
  }

  // Get sorting icon based on direction
  getSortIcon(column: string): string {
    if (!this.isSortActive(column)) return 'bi bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi bi-arrow-down' : 'bi bi-arrow-up';
  }
}
