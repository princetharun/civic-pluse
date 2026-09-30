export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn';

export type IssueCategory =
  | 'Roads'
  | 'Water'
  | 'Electricity'
  | 'Healthcare'
  | 'Education'
  | 'Public Transport'
  | 'Sanitation'
  | 'Housing'
  | 'Digital Infrastructure'
  | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type RequestStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Verified'
  | 'Prioritized'
  | 'Project Planned'
  | 'In Progress'
  | 'Completed';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  areaName: string;
  district?: string;
  state?: string;
  address?: string;
}

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string;
  remarks: string;
  updatedBy?: string;
}

export interface CitizenRequest {
  id: string; // e.g. REQ-1042
  userId: string;
  userEmail?: string;
  title: string;
  description: string;
  originalLanguage: SupportedLanguage;
  translatedText?: string;
  category: IssueCategory;
  severity: SeverityLevel;
  infrastructureType?: string;
  keyDemand?: string;
  suggestedAction?: string;
  location: LocationCoordinates;
  imageUrl?: string;
  photoUrl?: string;
  photoType?: 'uploaded' | 'url';
  audioUrl?: string;
  status: RequestStatus;
  statusHistory: StatusHistoryEntry[];
  clusterId?: string;
  priorityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueCluster {
  id: string;
  title: string;
  category: IssueCategory;
  affectedArea: string;
  demandLevel: SeverityLevel;
  requestCount: number;
  requestIds: string[];
  summary: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Demographics {
  totalHouseholds: number;
  bplPercentage: number;
  scStPercentage: number;
  elderlyPercentage: number;
  accessToCleanWaterPct: number;
  accessToHealthcarePct: number;
  allWeatherRoadAccessPct: number;
}

export interface InfrastructureCapacity {
  hospitalBedsPer1000: number;
  waterSupplyLitersPerCapita: number;
  roadPavedPct: number;
  powerAvailabilityHours: number;
  sanitationCoveragePct: number;
  internetBroadbandPct: number;
}

export interface GovernmentData {
  id: string;
  areaName: string;
  district: string;
  state: string;
  population: number;
  demographics: Demographics;
  infrastructureCapacity: InfrastructureCapacity;
  lat: number;
  lng: number;
  existingProjectsCount: number;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  category: IssueCategory;
  areaName: string;
  status: 'Project Planned' | 'In Progress' | 'Completed';
  progress: number; // 0 to 100
  budgetAllocated: number; // in INR
  budgetSpent: number;
  affectedPopulation: number;
  expectedCompletion: string;
  beforeImpact: string;
  afterImpact: string;
  lat: number;
  lng: number;
  contractor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  existingProjectId?: string;
  existingProjectName?: string;
  recommendationType: 'new' | 'expansion' | 'acceleration';
  notes: string;
}

export interface Recommendation {
  id: string;
  title: string;
  problemAddressed: string;
  category: IssueCategory;
  areaName: string;
  affectedPopulation: number;
  infrastructureGap: string;
  priorityScore: number;
  estimatedBudget: number;
  expectedImpact: string;
  evidence: string;
  confidenceScore: number;
  explanation: string;
  duplicateCheck: DuplicateCheckResult;
  status: 'Draft' | 'Approved' | 'Rejected' | 'Under Review';
  createdAt: string;
}

export interface NationalPriority {
  id: string;
  name: string;
  category: IssueCategory;
  weight: number; // e.g. 10 - 30
  description: string;
  updatedAt: string;
}

export interface BudgetSimulation {
  id: string;
  name: string;
  totalBudget: number;
  allocations: Record<string, number>;
  results: {
    peopleAffected: number;
    gapsReduced: number;
    priorityCoverage: number;
    impactScore: number;
    label: string;
    sectorBreakdown?: Record<string, { budgetCr: number; beneficiaries: number }>;
  };
  createdBy: string;
  createdAt: string;
}

export interface CitizenNotification {
  id: string;
  userId: string;
  requestId: string;
  title: string;
  message: string;
  language?: string;
  read: boolean;
  createdAt: string;
}

export interface AIAnalysisResult {
  detectedLanguage: string;
  detectedLanguageCode: string;
  translatedText: string;
  category: IssueCategory;
  severity: SeverityLevel;
  infrastructureType: string;
  keyDemand: string;
  suggestedAction: string;
  summary: string;
  priorityScoreDemand: number;
  aiPowered?: boolean;
  modelUsed?: string;
}

export interface PriorityScoreBreakdown {
  totalScore: number;
  factors: {
    citizenDemand: number; // Max 25
    severity: number; // Max 20
    infrastructureDeficit: number; // Max 20
    populationImpact: number; // Max 15
    equityFactor: number; // Max 10
    nationalPriority: number; // Max 10
  };
  rationale: string;
}
