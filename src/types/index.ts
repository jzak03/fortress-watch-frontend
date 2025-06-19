

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface Device {
  id: string;
  name: string;
  brand: string;
  model: string;
  version: string;
  location: string;
  ipAddress: string;
  macAddress: string;
  os: string;
  osVersion: string;
  isActive: boolean;
  lastSeen: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  tags?: string[];
}

export type ScanType = 'full' | 'local' | 'web' | 'ai';
export type ScanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Vulnerability {
  id: string;
  cveId?: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  cvssScore?: number;
  remediation?: string;
  affectedSoftware?: string;
  references?: string[];
}

export interface ScanResult {
  id: string;
  scanId: string;
  vulnerabilityId?: string; // Could be an identified vulnerability
  finding: string; // Description of the finding
  details?: string; // More details about the finding
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  status: 'open' | 'closed' | 'ignored';
  aiConfidenceScore?: number; // For AI-enhanced findings
  aiSuggestedRemediation?: string;
  createdAt: string; // ISO date string
}

export interface Scan {
  id: string;
  deviceId: string;
  deviceName?: string; // Denormalized for convenience
  scanType: ScanType;
  status: ScanStatus;
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  summary?: string; // AI generated summary
  aiAnalysis?: {
    executiveSummary: string;
    prioritizedRecommendations: string;
    confidenceScore: number;
  };
  results?: ScanResult[]; // Or just a count/summary, full results might be a separate fetch
  vulnerabilitiesFound: number;
  createdAt: string; // ISO date string
}

export interface OrganizationSummary {
  totalDevices: number;
  activeDevices: number;
  devicesWithCriticalVulnerabilities: number;
  totalVulnerabilities: number;
  averageTimeToRemediate?: string; // e.g. "X days"
  recentScansCount: number;
  scanActivity: { date: string; count: number }[]; // For charts
  vulnerabilitySeverityDistribution: { severity: Vulnerability['severity']; count: number }[]; // For charts
}

export interface AISuggestion {
  remediationSteps: string;
  confidenceScore: number;
}

export interface AIEnhancement {
  executiveSummary: string;
  prioritizedRecommendations: string;
  confidenceScore: number;
}

export interface AISummary {
  summary: string;
  keyInsights: string;
  confidenceScore: number;
}

// Filter types
export interface DeviceFilters {
  name?: string;
  brand?: string;
  model?: string;
  version?: string;
  location?: string;
  isActive?: boolean | string; // string for 'all' option
  page?: number;
  limit?: number;
}

export interface ScanHistoryFilters {
  deviceId?: string;
  status?: ScanStatus | string; // string for 'all' option
  scanType?: ScanType | string; // string for 'all' option
  page?: number;
  limit?: number;
}

// Custom Report Types
export type ReportSeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type ReportFormat = 'pdf' | 'csv';

export interface CustomReportFilters {
  device_brands?: string[];
  severity_levels?: ReportSeverityLevel[];
  date_range?: {
    start?: string; // ISO Date string
    end?: string; // ISO Date string
  };
}

export interface CustomReportParams {
  report_type: string;
  filters: CustomReportFilters;
  include_trends: boolean;
  format: ReportFormat;
}

export interface CustomReportResponse {
  report_id: string;
  status: string; // e.g., "queued", "generating", "completed", "failed"
  message?: string;
  data?: any; // Could be a URL to the report or embedded data for small reports
  generated_at: string; // ISO date string
}
