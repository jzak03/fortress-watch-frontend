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
  ScanStatus
} from '@/types';
import { suggestRemediationSteps } from '@/ai/flows/suggest-remediation-steps';
import { enhanceScanWithAi } from '@/ai/flows/enhance-scan-with-ai-analysis';
import { summarizeScanFindings } from '@/ai/flows/summarize-scan-findings';

const MOCK_DELAY = 500;

const mockDevices: Device[] = Array.from({ length: 55 }, (_, i) => ({
  id: `device-${i + 1}`,
  name: `Workstation ${100 + i}`,
  brand: ['Dell', 'HP', 'Lenovo', 'Apple'][i % 4],
  model: ['OptiPlex 7000', 'EliteDesk 800', 'ThinkCentre M90', 'iMac 27"'][i % 4],
  version: `1.${i % 3}.0`,
  location: ['Office A', 'Office B', 'Remote', 'Lab'][i % 4],
  ipAddress: `192.168.1.${10 + i}`,
  macAddress: `00:1A:2B:3C:4D:${(10 + i).toString(16).padStart(2, '0').toUpperCase()}`,
  os: ['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04', 'Windows 10'][i % 4],
  osVersion: ['23H2', '14.1', 'LTS', '22H2'][i % 4],
  isActive: i % 5 !== 0, // every 5th device is inactive
  lastSeen: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [['critical', 'server'], ['finance-dept'], ['dev-env']][i%3],
}));

const mockVulnerabilities: Vulnerability[] = [
  { id: 'vuln-1', cveId: 'CVE-2023-12345', name: 'Remote Code Execution', description: 'A critical RCE vulnerability.', severity: 'critical', cvssScore: 9.8, affectedSoftware: 'Apache Struts 2.0.0', references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-12345'] },
  { id: 'vuln-2', cveId: 'CVE-2023-67890', name: 'SQL Injection', description: 'A high severity SQL injection.', severity: 'high', cvssScore: 8.5, affectedSoftware: 'Legacy DB Connector 1.2', references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-67890'] },
  { id: 'vuln-3', name: 'Outdated TLS Version', description: 'Server supports TLS 1.0.', severity: 'medium', cvssScore: 5.4 },
  { id: 'vuln-4', name: 'Weak Password Policy', description: 'Password policy allows weak passwords.', severity: 'low' },
];

const mockScanResults = (scanId: string, deviceId: string): ScanResult[] => {
    const numResults = Math.floor(Math.random() * 5);
    return Array.from({ length: numResults }, (_, i) => {
        const vuln = mockVulnerabilities[i % mockVulnerabilities.length];
        return {
            id: `scanresult-${scanId}-${i}`,
            scanId,
            vulnerabilityId: vuln.id,
            finding: vuln.name,
            details: vuln.description,
            severity: vuln.severity,
            status: (['open', 'closed'] as const)[i%2],
            aiConfidenceScore: Math.random() > 0.5 ? Math.random() : undefined,
            aiSuggestedRemediation: Math.random() > 0.5 ? "Update software to latest version." : undefined,
            createdAt: new Date().toISOString(),
        };
    });
};


const mockScans: Scan[] = Array.from({ length: 120 }, (_, i) => {
  const device = mockDevices[i % mockDevices.length];
  const scanType = (['full', 'local', 'web', 'ai'] as ScanType[])[i % 4];
  const statusOptions: ScanStatus[] = ['completed', 'in_progress', 'failed', 'pending'];
  const status = statusOptions[i % statusOptions.length];
  const results = status === 'completed' ? mockScanResults(`scan-${i + 1}`, device.id) : [];
  return {
    id: `scan-${i + 1}`,
    deviceId: device.id,
    deviceName: device.name,
    scanType,
    status,
    startedAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString() : undefined,
    completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
    summary: status === 'completed' ? `Scan found ${results.length} potential issues.` : undefined,
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
    device.scans = mockScans.filter(s => s.deviceId === id).slice(0, 5);
  }
  return device;
};

export const triggerScan = async (deviceId: string, scanType: ScanType, options?: any): Promise<Scan> => {
  console.log(`API: Triggering ${scanType} scan for device ${deviceId} with options`, options);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1000)); // Longer delay for scan trigger
  const device = mockDevices.find(d => d.id === deviceId);
  if (!device) throw new Error('Device not found');

  const newScan: Scan = {
    id: `scan-${mockScans.length + 1}`,
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
         newScan.summary = `Scan completed. Found ${newScan.vulnerabilitiesFound} vulnerabilities.`;
      }
      console.log(`API: Scan ${newScan.id} completed.`);
      // Note: In a real app, you'd update this scan's state in your backend/DB.
      // Here we just log, the `newScan` object itself is not being 'updated' in the mockScans array after this async block.
    }, MOCK_DELAY * 3);
  }, MOCK_DELAY * 2);

  mockScans.unshift(newScan); // Add to the beginning for visibility in lists
  return newScan;
};

export const triggerBulkScan = async (deviceIds: string[]): Promise<{ jobId: string, message: string }> => {
  console.log('API: Triggering bulk scan for devices:', deviceIds);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY + 1500));
  // Simulate starting scans for each device
  deviceIds.forEach(id => triggerScan(id, 'full')); 
  return { jobId: `bulk-job-${Date.now()}`, message: `${deviceIds.length} scans initiated.` };
};

export const fetchScanHistory = async (filters: ScanHistoryFilters = {}): Promise<PaginatedResponse<Scan>> => {
  console.log('API: Fetching scan history with filters', filters);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  
  let filteredScans = mockScans.filter(scan => {
    if (filters.deviceId && scan.deviceId !== filters.deviceId) return false;
    if (filters.status && filters.status !== 'all' && scan.status !== filters.status) return false;
    if (filters.scanType && filters.scanType !== 'all' && scan.scanType !== filters.scanType) return false;
    return true;
  });

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
  mockScans.forEach(scan => {
    if (scan.status === 'completed' && scan.results) {
      scan.results.forEach(res => {
        if (res.severity === 'critical' && res.status === 'open') {
          criticalVulnsByDevice[scan.deviceId] = true;
        }
      });
    }
  });

  return {
    totalDevices: mockDevices.length,
    activeDevices: mockDevices.filter(d => d.isActive).length,
    devicesWithCriticalVulnerabilities: Object.keys(criticalVulnsByDevice).length,
    totalVulnerabilities: mockScans.reduce((acc, s) => acc + (s.vulnerabilitiesFound || 0),0),
    averageTimeToRemediate: '5 days', // Mocked
    recentScansCount: mockScans.filter(s => new Date(s.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7).length,
    scanActivity: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), // YYYY-MM-DD format
      count: Math.floor(Math.random() * 20)
    })),
    vulnerabilitySeverityDistribution: [
      { severity: 'critical', count: Math.floor(Math.random() * 20) + 5 },
      { severity: 'high', count: Math.floor(Math.random() * 50) + 10 },
      { severity: 'medium', count: Math.floor(Math.random() * 100) + 20 },
      { severity: 'low', count: Math.floor(Math.random() * 80) + 15 },
      { severity: 'informational', count: Math.floor(Math.random() * 30) + 5 },
    ],
  };
};


// GenAI Flow Wrappers (mocked or calling actual flows)
export const callSuggestRemediationSteps = async (vulnerabilityDescription: string, deviceInformation: string): Promise<AISuggestion> => {
  console.log(`API: Calling AI for remediation steps: ${vulnerabilityDescription}`);
  // return suggestRemediationSteps({ vulnerabilityDescription, deviceInformation }); // Actual call
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return {
    remediationSteps: `1. Isolate the device: ${deviceInformation}.\n2. Apply patch XYZ if available.\n3. Monitor for further suspicious activity.`,
    confidenceScore: Math.random() * 0.3 + 0.7, // High confidence for mock
  };
};

export const callEnhanceScanWithAi = async (scanReport: string): Promise<AIEnhancement> => {
  console.log(`API: Calling AI to enhance scan report.`);
   // return enhanceScanWithAi({ scanReport }); // Actual call
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return {
    executiveSummary: "The AI analysis indicates several critical vulnerabilities requiring immediate attention. Key areas include outdated software and misconfigured services.",
    prioritizedRecommendations: "1. Patch CVE-2023-XXXX on all affected servers.\n2. Update all instances of Library Y to version 3.5 or higher.\n3. Review and harden firewall rules for external-facing services.",
    confidenceScore: Math.random() * 0.3 + 0.65,
  };
};

export const callSummarizeScanFindings = async (scanData: string): Promise<AISummary> => {
  console.log(`API: Calling AI to summarize scan findings.`);
  // return summarizeScanFindings({ scanData }); // Actual call
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return {
    summary: "The scan identified multiple vulnerabilities, primarily of medium severity. Common issues include weak configurations and missing security updates.",
    keyInsights: "- Most vulnerabilities are related to unpatched software (60%).\n- 20% of findings are due to weak authentication mechanisms.\n- A small number of critical vulnerabilities (5%) were found on internet-facing systems.",
    confidenceScore: Math.random() * 0.2 + 0.75,
  };
};

export const getScanTypes = () => ['full', 'local', 'web', 'ai'] as ScanType[];
export const getScanStatuses = () => ['all', 'pending', 'in_progress', 'completed', 'failed', 'cancelled'] as (ScanStatus | 'all')[];
export const getDeviceBrands = () => ['all', ...new Set(mockDevices.map(d => d.brand))];
export const getDeviceLocations = () => ['all', ...new Set(mockDevices.map(d => d.location))];
