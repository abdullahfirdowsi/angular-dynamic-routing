import { TestBed } from '@angular/core/testing';

import { InternPerformanceService } from './intern-performance.service';

describe('InternPerformanceService', () => {
  let service: InternPerformanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InternPerformanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
