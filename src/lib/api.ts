

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
  ReportSeverityLevel
} from '@/types';
import { suggestRemediationSteps } from '@/ai/flows/suggest-remediation-steps';
import { enhanceScanWithAi } from '@/ai/flows/enhance-scan-with-ai-analysis';
import { summarizeScanFindings } from '@/ai/flows/summarize-scan-findings';

const MOCK_DELAY = 500;

const mockFirewallBrands = ['Cisco', 'Palo Alto Networks', 'Fortinet', 'Juniper Networks', 'Check Point'];
const mockFirewallModels = {
  'Cisco': ['ASA 5500-X', 'Firepower 1000', 'Meraki MX'],
  'Palo Alto Networks': ['PA-220', 'PA-800 Series', 'PA-3200 Series'],
  'Fortinet': ['FortiGate 60F', 'FortiGate 100F', 'FortiGate 1800F'],
  'Juniper Networks': ['SRX300 Series', 'SRX1500', 'SRX4600'],
  'Check Point': ['Quantum Spark', 'Quantum Security Gateway', 'Maestro Hyperscale Orchestrator'],
};
const mockFirewallOS = {
  'Cisco': 'Cisco ASA Software',
  'Palo Alto Networks': 'PAN-OS',
  'Fortinet': 'FortiOS',
  'Juniper Networks': 'Junos OS',
  'Check Point': 'Gaia OS',
};

const mockDevices: Device[] = Array.from({ length: 55 }, (_, i) => {
  const brand = mockFirewallBrands[i % mockFirewallBrands.length];
  const model = mockFirewallModels[brand][i % mockFirewallModels[brand].length];
  const os = mockFirewallOS[brand];
  const osVersion = `${9 + (i % 3)}.${i % 5}.${i % 9}`;

  return {
    id: `device-fw-${i + 1}`,
    name: `${brand.split(' ')[0]} Firewall ${model.split(' ')[0]}-${1000 + i}`,
    brand: brand,
    model: model,
    version: `${1 + (i%4)}.${i % 10}.${i%5}`, // Firmware version of the device itself
    location: ['Data Center A', 'Branch Office X', 'DMZ Zone', 'Cloud VPC Segment'][i % 4],
    ipAddress: `10.0.${i % 255}.${10 + (i % 200)}`,
    macAddress: `00:A1:B2:C3:D4:${(10 + i).toString(16).padStart(2, '0').toUpperCase()}`,
    os: os,
    osVersion: osVersion, // OS version running on the firewall
    isActive: i % 6 !== 0, // every 6th device is inactive
    lastSeen: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [['core-network', 'high-availability'], ['perimeter-security'], ['internal-segmentation']][i%3],
  };
});

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
  const device = mockDevices[i % mockDevices.length];
  const scanType = (['full', 'local', 'web', 'ai'] as ScanType[])[i % 4];
  const statusOptions: ScanStatus[] = ['completed', 'in_progress', 'failed', 'pending'];
  const status = statusOptions[i % statusOptions.length];
  const results = status === 'completed' ? mockScanResults(`scan-fw-${i + 1}`, device.id) : [];
  return {
    id: `scan-fw-${i + 1}`,
    deviceId: device.id,
    deviceName: device.name, // Store the device name at the time of scan
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


export const fetchDevices = async (filters: DeviceFilters = {}): Promise<PaginatedResponse<Device>> => {
  console.log('API: Fetching devices with filters', filters);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  
  let filteredDevices = mockDevices.filter(device => {
    if (filters.name && !device.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.brand && device.brand !== filters.brand) return false;
    if (filters.model && !device.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
    if (filters.version && device.version !== filters.version) return false;
    if (filters.location && device.location !== filters.location) return false;
    if (filters.isActive !== undefined && filters.isActive !== 'all' && device.isActive !== filters.isActive) return false;
    return true;
  });

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const totalItems = filteredDevices.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedData = filteredDevices.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
  };
};

export const fetchDeviceById = async (id: string): Promise<Device | undefined> => {
  console.log(`API: Fetching device by ID ${id}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  const device = mockDevices.find(d => d.id === id);
  if (device) {
    // Add some mock scans related to this device
    // @ts-ignore
    device.scans = mockScans.filter(s => s.deviceId === id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }
  return device;
};

export const triggerScan = async (deviceId: string, scanType: ScanType, options?: any): Promise<Scan> => {
  console.log(`API: Triggering ${scanType} scan for device ${deviceId} with options`, options);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1000)); // Longer delay for scan trigger
  const device = mockDevices.find(d => d.id === deviceId);
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
      // Note: In a real app, you'd update this scan's state in your backend/DB.
    }, MOCK_DELAY * 3);
  }, MOCK_DELAY * 2);

  mockScans.unshift(newScan); 
  return newScan;
};

export const triggerBulkScan = async (deviceIds: string[]): Promise<{ jobId: string, message: string }> => {
  console.log('API: Triggering bulk scan for devices:', deviceIds);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1500));
  // Simulate starting scans for each device
  deviceIds.forEach(id => {
    const device = mockDevices.find(d => d.id === id);
    if (device) {
      triggerScan(id, 'full'); // Trigger full scan for bulk operations
    }
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
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  const criticalVulnsByDevice: { [deviceId: string]: boolean } = {};
  let totalOpenVulnerabilities = 0;
  
  mockScans.forEach(scan => {
    if (scan.status === 'completed' && scan.results) {
      let deviceHasOpenCritical = false;
      scan.results.forEach(res => {
        if (res.status === 'open') {
          totalOpenVulnerabilities++;
          if (res.severity === 'critical') {
            deviceHasOpenCritical = true;
          }
        }
      });
      if (deviceHasOpenCritical) {
        criticalVulnsByDevice[scan.deviceId] = true;
      }
    }
  });

  const criticalCount = mockScans.reduce((sum, scan) => sum + (scan.results?.filter(r => r.severity === 'critical' && r.status === 'open').length || 0), 0);
  const highCount = mockScans.reduce((sum, scan) => sum + (scan.results?.filter(r => r.severity === 'high' && r.status === 'open').length || 0), 0);
  const mediumCount = mockScans.reduce((sum, scan) => sum + (scan.results?.filter(r => r.severity === 'medium' && r.status === 'open').length || 0), 0);
  const lowCount = mockScans.reduce((sum, scan) => sum + (scan.results?.filter(r => r.severity === 'low' && r.status === 'open').length || 0), 0);
  const informationalCount = mockScans.reduce((sum, scan) => sum + (scan.results?.filter(r => r.severity === 'informational' && r.status === 'open').length || 0), 0);

  return {
    totalDevices: mockDevices.length,
    activeDevices: mockDevices.filter(d => d.isActive).length,
    devicesWithCriticalVulnerabilities: Object.keys(criticalVulnsByDevice).length,
    totalVulnerabilities: totalOpenVulnerabilities,
    averageTimeToRemediate: '7 days', // Mocked
    recentScansCount: mockScans.filter(s => new Date(s.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length,
    scanActivity: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), 
      count: mockScans.filter(s => new Date(s.createdAt).toDateString() === new Date(Date.now() - (6-i) * 24*60*60*1000).toDateString()).length
    })),
    vulnerabilitySeverityDistribution: [
      { severity: 'critical', count: criticalCount },
      { severity: 'high', count: highCount },
      { severity: 'medium', count: mediumCount },
      { severity: 'low', count: lowCount },
      { severity: 'informational', count: informationalCount },
    ].filter(item => item.count > 0), // Only include severities with counts
  };
};


// GenAI Flow Wrappers
export const callSuggestRemediationSteps = async (vulnerabilityDescription: string, deviceInformation: string): Promise<AISuggestion> => {
  console.log(`API: Calling AI for remediation steps for '${vulnerabilityDescription}' on '${deviceInformation}'`);
  try {
    // Simulate AI response for specific vulnerabilities if needed for consistency
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

  // Simulate different outcomes
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


export const getScanTypes = (): ScanType[] => ['full', 'local', 'web', 'ai'];
export const getScanStatuses = (): (ScanStatus | 'all')[] => ['all', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'];
export const getDeviceBrands = (): string[] => ['all', ...new Set(mockDevices.map(d => d.brand))];
export const getDeviceLocations = (): string[] => ['all', ...new Set(mockDevices.map(d => d.location))];

export const getReportFormats = (): Array<{value: CustomReportParams['format'], label: string}> => [
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


