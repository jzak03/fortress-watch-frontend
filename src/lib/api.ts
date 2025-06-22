
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

const mockVulnerabilities: Vulnerability[] = [
  { id: 'vuln-fw-1', cveId: 'CVE-2023-20202', name: 'Cisco IOS XE Web UI Auth Bypass', description: 'A critical authentication bypass in Cisco IOS XE Web UI.', severity: 'critical', cvssScore: 9.8, affectedSoftware: 'Cisco IOS XE', references: ['https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-iosxe-auth-bypass-kLgg5N3'] },
  { id: 'vuln-fw-2', cveId: 'CVE-2022-30524', name: 'PAN-OS GlobalProtect Heap Overflow', description: 'A high severity heap overflow in Palo Alto Networks GlobalProtect.', severity: 'high', cvssScore: 8.8, affectedSoftware: 'PAN-OS', references: ['https://security.paloaltonetworks.com/CVE-2022-30524'] },
  { id: 'vuln-fw-3', name: 'FortiOS Weak SSL/TLS Configuration', description: 'FortiGate device supports weak SSL/TLS ciphers.', severity: 'medium', cvssScore: 5.3, affectedSoftware: 'FortiOS' },
  { id: 'vuln-fw-4', name: 'Junos OS Default Credentials Active', description: 'Default credentials still active on Juniper SRX device.', severity: 'high', cvssScore: 7.5, affectedSoftware: 'Junos OS'},
  { id: 'vuln-fw-5', name: 'Outdated Firmware - General', description: 'Device firmware is outdated and misses security patches.', severity: 'low', cvssScore: 3.5 },
];

const mockScanResults = (scanId: string, deviceId: string): ScanResult[] => {
    const numResults = Math.floor(Math.random() * 5);
    return Array.from({ length: numResults }, (_, i) => {
        const vuln = mockVulnerabilities[i % mockVulnerabilities.length];
        return {
            id: `scanresult-fw-${scanId}-${i}`,
            scanId,
            vulnerabilityId: vuln.id,
            finding: vuln.name,
            details: vuln.description,
            severity: vuln.severity,
            status: (['open', 'closed', 'ignored'] as const)[i%3],
            aiConfidenceScore: Math.random() > 0.5 ? Math.random() : undefined,
            aiSuggestedRemediation: Math.random() > 0.5 ? "Update firmware to the latest vendor-supplied version. Refer to vendor advisory." : undefined,
            createdAt: new Date().toISOString(),
        };
    });
};


const mockScans: Scan[] = Array.from({ length: 120 }, (_, i) => {
  const deviceId = `device-fw-${(i % 55) + 1}`;
  const scanType = (['full', 'local', 'web', 'ai'] as ScanType[])[i % 4];
  const statusOptions: ScanStatus[] = ['completed', 'in_progress', 'failed', 'pending'];
  const status = statusOptions[i % statusOptions.length];
  const results = status === 'completed' ? mockScanResults(`scan-fw-${i + 1}`, deviceId) : [];
  return {
    id: `scan-fw-${i + 1}`,
    deviceId: deviceId,
    deviceName: `Device Name ${i % 55}`, // Store the device name at the time of scan
    scanType,
    status,
    startedAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString() : undefined,
    completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
    summary: status === 'completed' ? `Scan found ${results.filter(r => r.status === 'open').length} open issues.` : undefined,
    vulnerabilitiesFound: results.filter(r => r.status === 'open').length,
    results,
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 10).toISOString(),
  };
});

const mockScheduledScans: ScheduledScan[] = [
  { id: 'sched-1', deviceId: 'device-fw-1', scanType: 'full', scheduleType: 'weekly', cronExpression: '0 2 * * 1', nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sched-2', deviceId: 'device-fw-3', scanType: 'web', scheduleType: 'daily', cronExpression: '0 0 * * *', nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sched-3', deviceId: 'device-fw-10', scanType: 'ai', scheduleType: 'weekly', cronExpression: '0 4 * * 5', nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let mockUserProfileData = {
  name: "Admin User",
  email: "admin@vulntrack.com",
  avatarUrl: "https://placehold.co/128x128.png",
  role: "Administrator",
  joinedDate: "2023-01-15T10:00:00Z",
};

export const fetchDevices = async (filters: DeviceFilters = {}): Promise<PaginatedResponse<Device>> => {
  console.log('Supabase: Fetching devices with filters', filters);
  const supabase = createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit - 1;

  let query = supabase
    .from('devices')
    .select('*', { count: 'exact' });

  if (filters.name) {
    query = query.ilike('name', `%${filters.name}%`);
  }
  if (filters.brand && filters.brand !== 'all') {
    query = query.eq('brand', filters.brand);
  }
  if (filters.model) {
    query = query.ilike('model', `%${filters.model}%`);
  }
  if (filters.location && filters.location !== 'all') {
    query = query.eq('location', filters.location);
  }
  if (filters.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('isActive', filters.isActive);
  }

  query = query.order('createdAt', { ascending: false }).range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching devices from Supabase:', error);
    throw error;
  }
  
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: data as Device[],
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
  };
};

export const fetchDeviceById = async (id: string): Promise<Device | undefined> => {
  console.log(`Supabase: Fetching device by ID ${id}`);
  const supabase = createClient();

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single();

  if (deviceError) {
    console.error(`Error fetching device ${id}:`, deviceError);
    if (deviceError.code === 'PGRST116') {
      return undefined;
    }
    throw deviceError;
  }
  
  if (!device) {
    return undefined;
  }
  
  const { data: scans, error: scansError } = await supabase
    .from('scans')
    .select('*')
    .eq('deviceId', id)
    .order('createdAt', { ascending: false })
    .limit(5);

  if (scansError) {
    console.error(`Error fetching scans for device ${id}:`, scansError);
  }

  (device as any).scans = scans || [];
  
  return device as Device;
};

export const createDevice = async (deviceData: Omit<Device, 'id' | 'lastSeen' | 'createdAt' | 'updatedAt'>): Promise<Device> => {
  console.log('Supabase: Creating device', deviceData);
  const supabase = createClient();

  const { data, error } = await supabase
    .from('devices')
    .insert([deviceData])
    .select()
    .single();

  if (error) {
    console.error('Error creating device:', error);
    throw error;
  }

  return data as Device;
};

export const updateDevice = async (id: string, deviceData: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device> => {
  console.log(`Supabase: Updating device ${id}`, deviceData);
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('devices')
    .update(deviceData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating device ${id}:`, error);
    throw error;
  }

  return data as Device;
};

export const deleteDevice = async (id: string): Promise<{ message: string }> => {
  console.log(`Supabase: Deleting device ${id}`);
  const supabase = createClient();
  
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting device ${id}:`, error);
    throw error;
  }

  return { message: 'Device deleted successfully.' };
};

export const triggerScan = async (deviceId: string, scanType: ScanType, options?: any): Promise<Scan> => {
  console.log(`API: Triggering ${scanType} scan for device ${deviceId} with options`, options);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1000)); // Longer delay for scan trigger
  const { data: device } = await createClient().from('devices').select('*').eq('id', deviceId).single();
  if (!device) throw new Error('Device not found');

  const newScan: Scan = {
    id: `scan-fw-${mockScans.length + 1}`,
    deviceId,
    deviceName: device.name,
    scanType,
    status: 'pending',
    startedAt: new Date().toISOString(),
    vulnerabilitiesFound: 0,
    createdAt: new Date().toISOString(),
  };
  
  // Simulate scan progress and completion / AI enhancement
  setTimeout(async () => {
    newScan.status = 'in_progress';
    console.log(`API: Scan ${newScan.id} is in_progress`);
    
    setTimeout(async () => {
      newScan.status = 'completed';
      newScan.completedAt = new Date().toISOString();
      newScan.results = mockScanResults(newScan.id, deviceId);
      newScan.vulnerabilitiesFound = newScan.results.filter(r => r.status === 'open').length;
      
      if (scanType === 'ai' || scanType === 'web') {
        try {
          const aiSummary = await summarizeScanFindings({ scanData: JSON.stringify(newScan.results) });
          newScan.summary = aiSummary.summary;
          if (scanType === 'ai') {
            const aiEnhancement = await enhanceScanWithAi({ scanReport: JSON.stringify(newScan.results) });
            newScan.aiAnalysis = aiEnhancement;
          }
        } catch (error) {
          console.error("AI processing failed during mock scan:", error);
          newScan.summary = "AI processing failed.";
        }
      } else {
         newScan.summary = `Scan completed. Found ${newScan.vulnerabilitiesFound} open vulnerabilities.`;
      }
      console.log(`API: Scan ${newScan.id} completed.`);
      await updateDevice(newScan.deviceId, { lastSeen: new Date().toISOString() });
      mockScans.unshift(newScan); 
    }, MOCK_DELAY * 3);
  }, MOCK_DELAY * 2);

  return newScan;
};

export const triggerBulkScan = async (deviceIds: string[]): Promise<{ jobId: string, message: string }> => {
  console.log('API: Triggering bulk scan for devices:', deviceIds);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1500));
  // Simulate starting scans for each device
  deviceIds.forEach(id => {
    triggerScan(id, 'full'); // Trigger full scan for bulk operations
  });
  return { jobId: `bulk-job-fw-${Date.now()}`, message: `${deviceIds.length} firewall scans initiated.` };
};

export const fetchScanHistory = async (filters: ScanHistoryFilters = {}): Promise<PaginatedResponse<Scan>> => {
  console.log('API: Fetching scan history with filters', filters);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  
  let filteredScans = mockScans.filter(scan => {
    if (filters.deviceId && scan.deviceId !== filters.deviceId) return false;
    if (filters.status && filters.status !== 'all' && scan.status !== filters.status) return false;
    if (filters.scanType && filters.scanType !== 'all' && scan.scanType !== filters.scanType) return false;
    return true;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const totalItems = filteredScans.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedData = filteredScans.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
  };
};

export const fetchOrganizationSummary = async (): Promise<OrganizationSummary> => {
  console.log('API: Fetching organization summary');
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2)); // Reduced delay
  const { data: devices, error } = await createClient().from('devices').select('*');
  if (error) {
    console.error(error);
    throw new Error('Could not fetch devices for summary');
  }

  const criticalVulnsByDevice = new Set<string>();
  let totalOpenVulnerabilities = 0;
  const severityDistribution: { [key in Vulnerability['severity']]: number } = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  for (const scan of mockScans) {
    if (scan.status === 'completed' && scan.results) {
      let deviceHasOpenCritical = false;
      for (const result of scan.results) {
        if (result.status === 'open') {
          totalOpenVulnerabilities++;
          if (severityDistribution[result.severity] !== undefined) {
            severityDistribution[result.severity]++;
          }
          if (result.severity === 'critical') {
            deviceHasOpenCritical = true;
          }
        }
      }
      if (deviceHasOpenCritical) {
        criticalVulnsByDevice.add(scan.deviceId);
      }
    }
  }

  return {
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.isActive).length,
    devicesWithCriticalVulnerabilities: criticalVulnsByDevice.size,
    totalVulnerabilities: totalOpenVulnerabilities,
    averageTimeToRemediate: '7 days', // Mocked
    recentScansCount: mockScans.filter(s => new Date(s.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length,
    scanActivity: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateString = date.toDateString();
      const count = mockScans.filter(s => new Date(s.createdAt).toDateString() === dateString).length;
      return {
        date: date.toLocaleDateString('en-CA'),
        count: count
      };
    }),
    vulnerabilitySeverityDistribution: (Object.keys(severityDistribution) as Array<Vulnerability['severity']>)
      .map(severity => ({
        severity,
        count: severityDistribution[severity],
      }))
      .filter(item => item.count > 0),
  };
};


// GenAI Flow Wrappers
export const callSuggestRemediationSteps = async (vulnerabilityDescription: string, deviceInformation: string): Promise<AISuggestion> => {
  console.log(`API: Calling AI for remediation steps for '${vulnerabilityDescription}' on '${deviceInformation}'`);
  try {
    if (vulnerabilityDescription.toLowerCase().includes('cisco ios xe web ui auth bypass')) {
        return {
            remediationSteps: `**Immediate Actions:**\n1. **Restrict access** to the web UI from untrusted networks and the internet.\n2. **Apply vendor patches** immediately. Refer to Cisco Security Advisory cisco-sa-iosxe-auth-bypass-kLgg5N3.\n\n**Verification:**\n- Confirm patch application via CLI command 'show version'.\n- Test web UI access controls rigorously.\n\n**Considerations:**\n- If patching is delayed, disable the HTTP Server feature on affected systems using 'no ip http server' or 'no ip http secure-server' in global configuration mode. This will impact web UI access.`,
            confidenceScore: 0.95
        };
    }
    return await suggestRemediationSteps({ vulnerabilityDescription, deviceInformation });
  } catch (error) {
    console.error("Error in callSuggestRemediationSteps:", error);
    // Fallback mock for safety if Genkit call fails
    return {
      remediationSteps: `AI suggestion failed. Standard advice: 1. Identify affected firmware for ${deviceInformation}.\n2. Check vendor advisories for patch for '${vulnerabilityDescription}'.\n3. Apply patch if available and test.\n4. Monitor device logs.`,
      confidenceScore: 0.1,
    };
  }
};

export const callEnhanceScanWithAi = async (scanReport: string): Promise<AIEnhancement> => {
  console.log(`API: Calling AI to enhance scan report.`);
  try {
    return await enhanceScanWithAi({ scanReport });
  } catch (error) {
    console.error("Error in callEnhanceScanWithAi:", error);
    return {
      executiveSummary: "AI enhancement failed. The scan report indicates potential vulnerabilities. Manual review is recommended.",
      prioritizedRecommendations: "1. Manually review all 'critical' and 'high' severity findings.\n2. Cross-reference findings with vendor documentation.",
      confidenceScore: 0.1,
    };
  }
};

export const callSummarizeScanFindings = async (scanData: string): Promise<AISummary> => {
  console.log(`API: Calling AI to summarize scan findings.`);
   try {
    return await summarizeScanFindings({ scanData });
  } catch (error) {
    console.error("Error in callSummarizeScanFindings:", error);
    return {
      summary: "AI summary failed. The scan likely identified several findings. Please review the detailed results.",
      keyInsights: "- Manual review of scan results is necessary.",
      confidenceScore: 0.1,
    };
  }
};

export const generateCustomReport = async (params: CustomReportParams): Promise<CustomReportResponse> => {
  console.log('API: Generating custom report with params:', params);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 2000)); // Simulate report generation time

  const random = Math.random();
  if (random < 0.1) {
    return {
      report_id: `report-fw-${Date.now()}`,
      status: 'failed',
      message: 'Report generation failed due to an unexpected error.',
      generated_at: new Date().toISOString(),
    };
  }
  
  const responseData: CustomReportData = {
    details: `This is a mock ${params.format.toUpperCase()} report of type '${params.report_type}'.`,
    filtersApplied: params.filters,
    trendsIncluded: params.include_trends,
    downloadLink: `/mock-reports/report-${Date.now()}.${params.format}`,
  };

  if (params.include_trends) {
    responseData.trendSummary = "Overall vulnerability count decreased by 15% compared to the previous period. New critical vulnerabilities: 2, Resolved critical vulnerabilities: 5.";
  }

  return {
    report_id: `report-fw-${Date.now()}`,
    status: 'completed',
    message: `Custom report '${params.report_type}' generated successfully.`,
    data: responseData,
    generated_at: new Date().toISOString(),
  };
};

export const generateReportFromScan = async (scanId: string, params: { format: ReportFormat }): Promise<CustomReportResponse> => {
  console.log(`API: Generating AI report for scan ${scanId}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 2500));

  const scan = mockScans.find(s => s.id === scanId);
  if (!scan) {
    return {
      report_id: `report-fw-scan-${Date.now()}`,
      status: 'failed',
      message: `Scan with ID ${scanId} not found.`,
      generated_at: new Date().toISOString(),
    };
  }
  
  try {
    const aiAnalysis = await enhanceScanWithAi({ scanReport: JSON.stringify(scan.results) });
    const responseData: CustomReportData = {
      details: `This is a mock AI-generated ${params.format.toUpperCase()} report for scan '${scan.id}' on device '${scan.deviceName}'.`,
      aiAnalysis: aiAnalysis,
      downloadLink: `/mock-reports/ai-report-${scan.id}-${Date.now()}.${params.format}`,
    };

    return {
      report_id: `report-fw-scan-${Date.now()}`,
      status: 'completed',
      message: `AI-enhanced report for scan ${scanId} generated successfully.`,
      data: responseData,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      report_id: `report-fw-scan-${Date.now()}`,
      status: 'failed',
      message: 'Report generation failed due to an AI service error.',
      generated_at: new Date().toISOString(),
    };
  }
};


// Scheduled Scans API
export const fetchScheduledScans = async (): Promise<ScheduledScan[]> => {
  console.log('API: Fetching scheduled scans');
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return mockScheduledScans.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createScheduledScan = async (data: Omit<ScheduledScan, 'id' | 'createdAt' | 'updatedAt' | 'nextRunAt'>): Promise<ScheduledScan> => {
  console.log('API: Creating scheduled scan', data);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  const newSchedule: ScheduledScan = {
    ...data,
    id: `sched-${Date.now()}`,
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockScheduledScans.push(newSchedule);
  return newSchedule;
};

export const updateScheduledScan = async (id: string, data: Partial<ScheduledScan>): Promise<ScheduledScan> => {
  console.log(`API: Updating scheduled scan ${id}`, data);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  const index = mockScheduledScans.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Schedule not found");
  mockScheduledScans[index] = { ...mockScheduledScans[index], ...data, updatedAt: new Date().toISOString() };
  return mockScheduledScans[index];
};

export const deleteScheduledScan = async (id: string): Promise<{ message: string }> => {
  console.log(`API: Deleting scheduled scan ${id}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  const index = mockScheduledScans.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Schedule not found");
  mockScheduledScans.splice(index, 1);
  return { message: "Schedule deleted successfully." };
};

let mockNotifications: Notification[] = Array.from({ length: 15 }, (_, i) => {
    const type = (['scan_completed', 'critical_alert', 'report_ready', 'system_update'] as const)[i % 4];
    const isRead = i > 4; // First 5 are unread
    let title = '';
    let message = '';
    let link = '';
    
    switch(type) {
        case 'scan_completed':
            title = 'Scan Completed';
            message = `Device scan for 'Main-Router' finished successfully.`;
            link = '/devices/device-fw-1?scanId=scan-fw-1';
            break;
        case 'critical_alert':
            title = 'Critical Alert';
            message = `High severity vulnerability CVE-2023-20202 found on 'ASA-Firewall-HQ'.`;
            link = '/devices/device-fw-20';
            break;
        case 'report_ready':
            title = 'Report Ready';
            message = `Your 'Quarterly PCI Scan Summary' report is ready for download.`;
            link = '/reports';
            break;
        case 'system_update':
            title = 'System Update';
            message = `A new version of Vulntrack is available. Please refresh your browser.`;
            break;
    }
    
    return {
        id: `notif-${i + 1}`,
        type,
        title,
        message,
        isRead,
        link,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3).toISOString(),
    }
}).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


export const fetchNotifications = async (filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> => {
    console.log('API: Fetching notifications with filters', filters);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    let filteredNotifications = mockNotifications.filter(notif => {
        if (filters.status === 'read' && !notif.isRead) return false;
        if (filters.status === 'unread' && notif.isRead) return false;
        return true;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalItems = filteredNotifications.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = filteredNotifications.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
    };
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
    console.log(`API: Marking notification ${id} as read`);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2));
    const index = mockNotifications.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notification not found');
    mockNotifications[index].isRead = true;
    return mockNotifications[index];
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
    console.log(`API: Marking all notifications as read`);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    mockNotifications.forEach(n => n.isRead = true);
    return { message: 'All notifications marked as read.' };
};

export const deleteNotification = async (id: string): Promise<{ message: string }> => {
  console.log(`API: Deleting notification ${id}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2));
  const index = mockNotifications.findIndex(d => d.id === id);
  if (index === -1) throw new Error('Notification not found');
  mockNotifications.splice(index, 1);
  return { message: 'Notification deleted successfully.' };
};


export const getScanTypes = (): ScanType[] => ['full', 'local', 'web', 'ai'];
export const getScanStatuses = (): (ScanStatus | 'all')[] => ['all', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'];
export const getDeviceBrands = (): string[] => ['all', 'Cisco', 'Palo Alto Networks', 'Fortinet', 'Juniper Networks', 'Check Point'];
export const getDeviceLocations = (): string[] => ['all', 'Data Center A', 'Branch Office X', 'DMZ Zone', 'Cloud VPC Segment'];


export const getReportFormats = (): Array<{value: ReportFormat, label: string}> => [
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' },
];

export const getSeverityLevels = (): Array<{id: ReportSeverityLevel, label: string}> => [
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
    { id: 'informational', label: 'Informational' },
];

export const fetchUserProfile = async (): Promise<typeof mockUserProfileData> => {
  console.log('API: Fetching user profile');
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY / 2));
  return mockUserProfileData;
};

export const updateUserProfile = async (data: Partial<UserProfileSettings>): Promise<typeof mockUserProfileData> => {
  console.log('API: Updating user profile', data);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  mockUserProfileData = { ...mockUserProfileData, ...data };
  return mockUserProfileData;
};


    