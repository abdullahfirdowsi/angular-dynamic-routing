export interface User {
  id?: number;
  username: string;
  role: 'intern' | 'spoc' | 'manager';
  name: string;
  email?: string;
}

export interface Intern {
  sNo: number;
  internId: string;
  name: string;
  location: string;
  programmingLanguage: string;
  officialCompanyEmailId: string;
  collegeName: string;
  primarySkill: string;
  secondarySkill: string;
  areaOfInterest: string;
  allocatedBU: string;
  performance?: InternPerformance;
}

export interface InternPerformance {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C'; 
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progressPercentage: number; // 0-100
  strengths: string[];
  areasOfImprovement: string[];
  feedbacks: Feedback[];
}

export interface Feedback {
  id: number;
  from: string; // SPOC or Manager name
  message: string;
  date: Date;
  rating: number; // 1-5
}

