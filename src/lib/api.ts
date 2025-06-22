
import { createClient } from './supabase/client';
import type {
  Device,
  Scan,
  OrganizationSummary,
  PaginatedResponse,
  Vulnerability,
  ScanResult,
  AISuggestion,
  AIEnhancement,
  AISummary,
  DeviceFilters,
  ScanHistoryFilters,
  ScanType,
  ScanStatus,
  CustomReportParams,
  CustomReportResponse,
  CustomReportData,
  ReportSeverityLevel,
  ReportFormat,
  ScheduledScan,
  UserProfileSettings,
  Notification,
  NotificationFilters
} from '@/types';
import { suggestRemediationSteps } from '@/ai/flows/suggest-remediation-steps';
import { enhanceScanWithAi } from '@/ai/flows/enhance-scan-with-ai-analysis';
import { summarizeScanFindings } from '@/ai/flows/summarize-scan-findings';

const MOCK_DELAY = 500;

// #region Data Mapping Functions
// These functions map data from the Supabase snake_case format to our app's camelCase format.
// This creates an anti-corruption layer, minimizing UI changes.

const mapDbDeviceToDevice = (dbDevice: any): Device => ({
  id: dbDevice.id,
  name: dbDevice.name,
  brand: dbDevice.brand,
  model: dbDevice.model,
  version: dbDevice.version,
  location: dbDevice.location,
  ipAddress: dbDevice.ip_address,
  macAddress: dbDevice.mac_address,
  os: dbDevice.os,
  osVersion: dbDevice.os_version,
  isActive: dbDevice.is_active,
  lastSeen: dbDevice.last_seen,
  createdAt: dbDevice.created_at,
  updatedAt: dbDevice.updated_at,
  tags: dbDevice.tags,
});

const mapDbScanToScan = (dbScan: any): Scan => ({
    id: dbScan.id,
    deviceId: dbScan.device_id,
    scanType: dbScan.scan_type,
    status: dbScan.status,
    startedAt: dbScan.started_at,
    completedAt: dbScan.completed_at,
    summary: dbScan.summary,
    vulnerabilitiesFound: dbScan.vulnerabilities_found,
    createdAt: dbScan.created_at,
    // Construct the nested aiAnalysis object from flat DB columns
    aiAnalysis: (dbScan.ai_executive_summary || dbScan.ai_recommendations) ? {
        executiveSummary: dbScan.ai_executive_summary,
        prioritizedRecommendations: dbScan.ai_recommendations,
        confidenceScore: dbScan.ai_confidence_score,
    } : undefined,
});

const mapDbScanResultToScanResult = (dbResult: any): ScanResult => ({
    id: dbResult.id,
    scanId: dbResult.scan_id,
    vulnerabilityId: dbResult.vulnerability_id,
    finding: dbResult.finding,
    details: dbResult.details,
    severity: dbResult.severity,
    status: dbResult.status,
    aiConfidenceScore: dbResult.ai_confidence_score,
    aiSuggestedRemediation: dbResult.ai_suggested_remediation,
    createdAt: dbResult.created_at,
});

const mapDbScheduledScanToScheduledScan = (dbSched: any): ScheduledScan => ({
    id: dbSched.id,
    deviceId: dbSched.device_id,
    scanType: dbSched.scan_type,
    scheduleType: dbSched.schedule_type,
    cronExpression: dbSched.cron_expression,
    nextRunAt: dbSched.next_run_at,
    lastRunAt: dbSched.last_run_at,
    isActive: dbSched.is_active,
    createdAt: dbSched.created_at,
    updatedAt: dbSched.updated_at,
});

const mapDbNotificationToNotification = (dbNotif: any): Notification => ({
    id: dbNotif.id,
    type: dbNotif.type,
    title: dbNotif.title,
    message: dbNotif.message,
    isRead: dbNotif.is_read,
    link: dbNotif.link,
    createdAt: dbNotif.created_at,
});

const mapDbUserProfileToUserProfile = (dbProfile: any): UserProfileSettings => ({
    user_id: dbProfile.user_id, // Keep user_id for updates
    name: dbProfile.name,
    email: dbProfile.email,
    avatar_url: dbProfile.avatar_url,
});

// #endregion

// #region Device API
export const fetchDevices = async (filters: DeviceFilters = {}): Promise<PaginatedResponse<Device>> => {
  const supabase = createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit - 1;

  let query = supabase
    .from('devices')
    .select('*', { count: 'exact' });

  if (filters.name) query = query.ilike('name', `%${filters.name}%`);
  if (filters.brand && filters.brand !== 'all') query = query.eq('brand', filters.brand);
  if (filters.model) query = query.ilike('model', `%${filters.model}%`);
  if (filters.location && filters.location !== 'all') query = query.eq('location', filters.location);
  if (filters.isActive !== undefined && filters.isActive !== 'all') query = query.eq('is_active', filters.isActive);

  query = query.order('created_at', { ascending: false }).range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching devices from Supabase:', error);
    throw error;
  }
  
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: data.map(mapDbDeviceToDevice),
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
  };
};

export const fetchDeviceById = async (id: string): Promise<Device | undefined> => {
  const supabase = createClient();

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single();

  if (deviceError) {
    console.error(`Error fetching device ${id}:`, deviceError);
    if (deviceError.code === 'PGRST116') return undefined;
    throw deviceError;
  }
  
  if (!device) return undefined;
  
  const { data: scans, error: scansError } = await supabase
    .from('scans')
    .select('*')
    .eq('device_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (scansError) console.error(`Error fetching scans for device ${id}:`, scansError);

  const mappedDevice = mapDbDeviceToDevice(device);
  (mappedDevice as any).scans = scans ? scans.map(s => ({...mapDbScanToScan(s), deviceName: mappedDevice.name })) : [];
  
  return mappedDevice;
};

export const createDevice = async (deviceData: Omit<Device, 'id' | 'lastSeen' | 'createdAt' | 'updatedAt'>): Promise<Device> => {
  const supabase = createClient();
  const dbData = {
    name: deviceData.name,
    brand: deviceData.brand,
    model: deviceData.model,
    version: deviceData.version,
    location: deviceData.location,
    ip_address: deviceData.ipAddress,
    mac_address: deviceData.macAddress,
    os: deviceData.os,
    os_version: deviceData.osVersion,
    is_active: deviceData.isActive,
    tags: deviceData.tags,
  };

  const { data, error } = await supabase.from('devices').insert([dbData]).select().single();
  if (error) {
    console.error('Error creating device:', error);
    throw error;
  }
  return mapDbDeviceToDevice(data);
};

export const updateDevice = async (id: string, deviceData: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device> => {
  const supabase = createClient();
  const dbData: {[key: string]: any} = {};
  if (deviceData.name) dbData.name = deviceData.name;
  if (deviceData.brand) dbData.brand = deviceData.brand;
  if (deviceData.isActive !== undefined) dbData.is_active = deviceData.isActive;
  // Add other fields as needed, converting to snake_case
  
  const { data, error } = await supabase.from('devices').update(dbData).eq('id', id).select().single();
  if (error) {
    console.error(`Error updating device ${id}:`, error);
    throw error;
  }
  return mapDbDeviceToDevice(data);
};

export const deleteDevice = async (id: string): Promise<{ message: string }> => {
  const supabase = createClient();
  const { error } = await supabase.from('devices').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting device ${id}:`, error);
    throw error;
  }
  return { message: 'Device deleted successfully.' };
};
// #endregion

// #region Scan API (Partially Mocked)

// Logic for triggering scans remains external/mocked
export const triggerScan = async (deviceId: string, scanType: ScanType, options?: any): Promise<Scan> => {
  console.log(`API: Triggering ${scanType} scan for device ${deviceId} with options`, options);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1000));
  
  const { data: device } = await createClient().from('devices').select('name').eq('id', deviceId).single();
  if (!device) throw new Error('Device not found');

  const newScanData = {
    device_id: deviceId,
    scan_type: scanType,
    status: 'pending' as ScanStatus,
    started_at: new Date().toISOString(),
    vulnerabilities_found: 0,
    created_at: new Date().toISOString(),
  };

  // Simulate inserting the scan into the DB
  const { data: savedScan, error } = await createClient().from('scans').insert(newScanData).select().single();
  if (error) throw error;
  
  // Simulate scan progress and completion / AI enhancement (remains mock)
  setTimeout(async () => {
    let updatedScanData: any = { status: 'in_progress' };
    await createClient().from('scans').update(updatedScanData).eq('id', savedScan.id);
    
    setTimeout(async () => {
      updatedScanData = { 
        status: 'completed', 
        completed_at: new Date().toISOString(),
      };
      
      const results = mockScanResults(savedScan.id, deviceId);
      updatedScanData.vulnerabilities_found = results.filter(r => r.status === 'open').length;
      
      if (scanType === 'ai' || scanType === 'web') {
        const aiSummary = await summarizeScanFindings({ scanData: JSON.stringify(results) });
        updatedScanData.summary = aiSummary.summary;
        if (scanType === 'ai') {
          const aiEnhancement = await enhanceScanWithAi({ scanReport: JSON.stringify(results) });
          updatedScanData.ai_executive_summary = aiEnhancement.executiveSummary;
          updatedScanData.ai_recommendations = aiEnhancement.prioritizedRecommendations;
          updatedScanData.ai_confidence_score = aiEnhancement.confidenceScore;
        }
      } else {
         updatedScanData.summary = `Scan completed. Found ${updatedScanData.vulnerabilities_found} open vulnerabilities.`;
      }
      
      await createClient().from('scans').update(updatedScanData).eq('id', savedScan.id);
      
      // Simulate adding results to scan_results table
      const dbResults = results.map(r => ({
          scan_id: savedScan.id,
          finding: r.finding,
          severity: r.severity,
          status: r.status,
      }));
      await createClient().from('scan_results').insert(dbResults);
      
    }, MOCK_DELAY * 3);
  }, MOCK_DELAY * 2);

  return {...mapDbScanToScan(savedScan), deviceName: device.name};
};

export const triggerBulkScan = async (deviceIds: string[]): Promise<{ jobId: string, message: string }> => {
  console.log('API: Triggering bulk scan for devices:', deviceIds);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1500));
  deviceIds.forEach(id => {
    triggerScan(id, 'full');
  });
  return { jobId: `bulk-job-fw-${Date.now()}`, message: `${deviceIds.length} firewall scans initiated.` };
};

export const fetchScanHistory = async (filters: ScanHistoryFilters = {}): Promise<PaginatedResponse<Scan>> => {
  const supabase = createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit - 1;

  let query = supabase.from('scans').select('*, devices(name)', { count: 'exact' });

  if (filters.deviceId) query = query.eq('device_id', filters.deviceId);
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.scanType && filters.scanType !== 'all') query = query.eq('scan_type', filters.scanType);
  
  query = query.order('created_at', { ascending: false }).range(startIndex, endIndex);

  const { data, error, count } = await query;
  if (error) {
    console.error('Error fetching scan history:', error);
    throw error;
  }
  
  const scans = data.map((d: any) => ({
      ...mapDbScanToScan(d),
      deviceName: d.devices?.name || d.device_id, // Use joined device name
  }));
  
  return {
    data: scans,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    totalItems: count || 0,
    itemsPerPage: limit,
  };
};
// #endregion

// #region Organization Summary API
export const fetchOrganizationSummary = async (): Promise<OrganizationSummary> => {
  console.log('API: Fetching organization summary from Supabase');
  const supabase = createClient();
  
  const { count: totalDevices } = await supabase.from('devices').select('*', { count: 'exact', head: true });
  const { count: activeDevices } = await supabase.from('devices').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  // This is a simplified query. A real implementation might use a DB function or view.
  const { data: criticalScans, error: critError } = await supabase
    .from('scans')
    .select('device_id, scan_results(severity)')
    .eq('status', 'completed')
    .eq('scan_results.severity', 'critical');
  
  if(critError) console.error("Error fetching critical vulns", critError);

  const devicesWithCriticalVulnerabilities = new Set(criticalScans?.map(s => s.device_id)).size;

  const { data: allScans, error: scansError } = await supabase.from('scans').select('created_at, vulnerabilities_found').order('created_at', {ascending: false});
  if(scansError) console.error("Error fetching all scans", scansError);
  
  const totalVulnerabilities = allScans?.reduce((acc, s) => acc + (s.vulnerabilities_found || 0), 0) || 0;
  const recentScansCount = allScans?.filter(s => new Date(s.created_at).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length || 0;

  const scanActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateString = date.toDateString();
      const count = allScans?.filter(s => new Date(s.created_at).toDateString() === dateString).length || 0;
      return { date: date.toLocaleDateString('en-CA'), count: count };
  });

  // Simplified severity distribution. A real implementation would be more complex.
  const { data: severityResults } = await supabase.from('scan_results').select('severity');
  const vulnerabilitySeverityDistribution = (severityResults || []).reduce((acc, curr) => {
    acc[curr.severity] = (acc[curr.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDevices: totalDevices || 0,
    activeDevices: activeDevices || 0,
    devicesWithCriticalVulnerabilities,
    totalVulnerabilities,
    averageTimeToRemediate: '9 days', // Mocked
    recentScansCount,
    scanActivity,
    vulnerabilitySeverityDistribution: Object.entries(vulnerabilitySeverityDistribution).map(([severity, count]) => ({ severity, count })) as any,
  };
};
// #endregion

// #region Scheduled Scans API
export const fetchScheduledScans = async (): Promise<ScheduledScan[]> => {
    const { data, error } = await createClient().from('scheduled_scans').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapDbScheduledScanToScheduledScan);
};

export const createScheduledScan = async (schedule: Omit<ScheduledScan, 'id'|'createdAt'|'updatedAt'|'nextRunAt'|'lastRunAt'>): Promise<ScheduledScan> => {
    const dbData = {
        device_id: schedule.deviceId,
        scan_type: schedule.scanType,
        schedule_type: schedule.scheduleType,
        cron_expression: schedule.cronExpression,
        is_active: schedule.isActive,
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Mock next run
    };
    const { data, error } = await createClient().from('scheduled_scans').insert(dbData).select().single();
    if (error) throw error;
    return mapDbScheduledScanToScheduledScan(data);
};

export const updateScheduledScan = async (id: string, schedule: Partial<ScheduledScan>): Promise<ScheduledScan> => {
    const dbData: {[key: string]: any} = {};
    if(schedule.isActive !== undefined) dbData.is_active = schedule.isActive;
    if(schedule.scanType) dbData.scan_type = schedule.scanType;
    if(schedule.cronExpression) dbData.cron_expression = schedule.cronExpression;
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await createClient().from('scheduled_scans').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    return mapDbScheduledScanToScheduledScan(data);
};

export const deleteScheduledScan = async (id: string): Promise<{ message: string }> => {
    const { error } = await createClient().from('scheduled_scans').delete().eq('id', id);
    if (error) throw error;
    return { message: "Schedule deleted successfully." };
};
// #endregion

// #region Notifications API
export const fetchNotifications = async (filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> => {
    const supabase = createClient();
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;

    let query = supabase.from('notifications').select('*', { count: 'exact' });
    
    if(filters.status === 'read') query = query.eq('is_read', true);
    if(filters.status === 'unread') query = query.eq('is_read', false);

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + limit - 1);
        
    if (error) throw error;
    return {
        data: data.map(mapDbNotificationToNotification),
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
    };
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
    const { data, error } = await createClient().from('notifications').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw error;
    return mapDbNotificationToNotification(data);
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
    // Note: This would typically be restricted by user_id in RLS policies.
    const { error } = await createClient().from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
    return { message: 'All notifications marked as read.' };
};

export const deleteNotification = async (id: string): Promise<{ message: string }> => {
  const { error } = await createClient().from('notifications').delete().eq('id', id);
  if (error) throw error;
  return { message: 'Notification deleted successfully.' };
};
// #endregion

// #region User Profile API
export const fetchUserProfile = async (): Promise<UserProfileSettings> => {
  // Since auth is disabled, we fetch the first profile as a stand-in for the current user.
  const { data, error } = await createClient().from('user_profile_settings').select('*').limit(1).single();
  if (error) {
    if(error.code === 'PGRST116') throw new Error("No user profiles found in the database.");
    throw error;
  };
  return mapDbUserProfileToUserProfile(data);
};

export const updateUserProfile = async (profile: UserProfileSettings): Promise<UserProfileSettings> => {
  const { data, error } = await createClient()
    .from('user_profile_settings')
    .update({ name: profile.name, email: profile.email, avatar_url: profile.avatar_url })
    .eq('user_id', profile.user_id)
    .select()
    .single();
  if (error) throw error;
  return mapDbUserProfileToUserProfile(data);
};
// #endregion

// #region Mocks and Static Data
// GenAI flows remain unchanged as they are external logic
export const callSuggestRemediationSteps = async (vulnerabilityDescription: string, deviceInformation: string): Promise<AISuggestion> => {
    return suggestRemediationSteps({ vulnerabilityDescription, deviceInformation });
};
export const callEnhanceScanWithAi = async (scanReport: string): Promise<AIEnhancement> => {
    return enhanceScanWithAi({ scanReport });
};
export const callSummarizeScanFindings = async (scanData: string): Promise<AISummary> => {
    return summarizeScanFindings({ scanData });
};

// Report generation remains mocked as it's external logic
export const generateCustomReport = async (params: CustomReportParams): Promise<CustomReportResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 2000));
    return {
        report_id: `report-fw-${Date.now()}`,
        status: 'completed',
        message: `Custom report '${params.report_type}' generated successfully.`,
        data: {
          downloadLink: `/mock-reports/report-${Date.now()}.${params.format}`,
          details: `This is a mock ${params.format.toUpperCase()} report of type '${params.report_type}'.`,
          filtersApplied: params.filters,
          trendsIncluded: params.include_trends,
        },
        generated_at: new Date().toISOString(),
    };
};

export const generateReportFromScan = async (scanId: string, params: { format: ReportFormat }): Promise<CustomReportResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 2500));
    const {data: scan} = await createClient().from('scans').select('*').eq('id', scanId).single();
    if (!scan) throw new Error("Scan not found");

    const aiAnalysis = await enhanceScanWithAi({ scanReport: "mock report" });
    return {
        report_id: `report-fw-scan-${Date.now()}`,
        status: 'completed',
        message: `AI-enhanced report for scan ${scanId} generated successfully.`,
        data: {
          downloadLink: `/mock-reports/ai-report-${scan.id}-${Date.now()}.${params.format}`,
          aiAnalysis,
        },
        generated_at: new Date().toISOString(),
    };
};

// This function can be removed if scan results are fetched from the DB with scans.
const mockScanResults = (scanId: string, deviceId: string): ScanResult[] => { return [] };

// Static data getters
export const getScanTypes = (): ScanType[] => ['full', 'local', 'web', 'ai'];
export const getScanStatuses = (): (ScanStatus | 'all')[] => ['all', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'];
export const getDeviceBrands = (): string[] => ['all', 'Cisco', 'Palo Alto Networks', 'Fortinet', 'Juniper Networks', 'Check Point'];
export const getDeviceLocations = (): string[] => ['all', 'Data Center A', 'Branch Office X', 'DMZ Zone', 'Cloud VPC Segment'];
export const getReportFormats = (): Array<{value: ReportFormat, label: string}> => [
    { value: 'pdf', label: 'PDF' }, { value: 'csv', label: 'CSV' },
];
export const getSeverityLevels = (): Array<{id: ReportSeverityLevel, label: string}> => [
    { id: 'critical', label: 'Critical' }, { id: 'high', label: 'High' }, { id: 'medium', label: 'Medium' }, { id: 'low', label: 'Low' }, { id: 'informational', label: 'Informational' },
];
// #endregion
