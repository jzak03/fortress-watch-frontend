

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
  vulnerabilityId?: string;
  finding: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  status: 'open' | 'closed' | 'ignored';
  aiConfidenceScore?: number;
  aiSuggestedRemediation?: string;
  createdAt: string;
}

export interface Scan {
  id: string;
  deviceId: string;
  deviceName?: string; // Kept for UI convenience, populated at runtime
  scanType: ScanType;
  status: ScanStatus;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  aiAnalysis?: AIEnhancement;
  results?: ScanResult[];
  vulnerabilitiesFound: number;
  createdAt: string;
}

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ScheduledScan {
  id: string;
  deviceId: string;
  scanType: ScanType;
  scheduleType: ScheduleType;
  cronExpression: string;
  nextRunAt: string;
  lastRunAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSummary {
  totalDevices: number;
  activeDevices: number;
  devicesWithCriticalVulnerabilities: number;
  totalVulnerabilities: number;
  averageTimeToRemediate?: string;
  recentScansCount: number;
  scanActivity: { date: string; count: number }[];
  vulnerabilitySeverityDistribution: { severity: Vulnerability['severity']; count: number }[];
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
  isActive?: boolean | string;
  page?: number;
  limit?: number;
}

export interface ScanHistoryFilters {
  deviceId?: string;
  status?: ScanStatus | string;
  scanType?: ScanType | string;
  page?: number;
  limit?: number;
}

export interface Notification {
  id: string;
  type: 'scan_completed' | 'critical_alert' | 'report_ready' | 'system_update';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'read' | 'unread' | 'all';
}

// Custom Report Types
export type ReportSeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type ReportFormat = 'pdf' | 'csv';

export interface CustomReportFilters {
  device_brands?: string[];
  severity_levels?: ReportSeverityLevel[];
  date_range?: {
    start?: string;
    end?: string;
  };
}

export interface CustomReportParams {
  report_type: string;
  filters: CustomReportFilters;
  include_trends: boolean;
  format: ReportFormat;
}

export interface CustomReportData {
  downloadLink?: string;
  details?: any;
  filtersApplied?: CustomReportFilters;
  trendsIncluded?: boolean;
  trendSummary?: string; 
  aiAnalysis?: AIEnhancement;
}

export interface CustomReportResponse {
  report_id: string;
  status: string;
  message?: string;
  data?: CustomReportData;
  generated_at: string;
}

export interface UserProfileSettings {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
}
