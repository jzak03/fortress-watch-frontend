'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, notFound, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchDeviceById, triggerScan, callSuggestRemediationSteps, updateDevice, generateReportFromScan, getReportFormats } from '@/lib/api';
import type { Device, Scan, ScanType, Vulnerability, ScanResult, AISuggestion, AIEnhancement, AISummary, ScanStatus, CustomReportResponse, ReportFormat } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Laptop, Smartphone, Server, Tablet, ScanLine, AlertTriangle, CheckCircle2, ShieldCheck, Lightbulb, Brain, Globe, Activity, CalendarDays, Tag, ListChecks, BarChartHorizontalBig, Loader2, Edit, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const getDeviceIcon = (brand?: string) => {
  if (!brand) return Laptop;
  const lowerBrand = brand.toLowerCase();
  if (lowerBrand.includes('apple') && (lowerBrand.includes('macbook') || lowerBrand.includes('imac'))) return Laptop;
  if (lowerBrand.includes('iphone') || lowerBrand.includes('pixel') || lowerBrand.includes('samsung galaxy s')) return Smartphone;
  if (lowerBrand.includes('server') || lowerBrand.includes('dell poweredge') || lowerBrand.includes('hp proliant')) return Server;
  if (lowerBrand.includes('ipad') || lowerBrand.includes('tablet') || lowerBrand.includes('surface pro')) return Tablet;
  return Laptop; // Default
};

const severityBadgeVariant = (severity: Vulnerability['severity'] | ScanResult['severity']): 'destructive' | 'default' | 'secondary' | 'outline' | 'success' => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};


export default function DeviceDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [device, setDevice] = useState<Device | null>(null);
  const [relatedScans, setRelatedScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [selectedVulnerabilityForSuggestion, setSelectedVulnerabilityForSuggestion] = useState<Vulnerability | ScanResult | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);

  const [aiEnhancement, setAiEnhancement] = useState<AIEnhancement | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for report generation
  const [reportResult, setReportResult] = useState<CustomReportResponse | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedReportFormat, setSelectedReportFormat] = useState<ReportFormat>('pdf');
  const reportFormats = getReportFormats();


  const loadDevice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchDeviceById(id);
      if (data) {
        setDevice(data);
        const deviceScans = (data as any).scans || [];
        setRelatedScans(deviceScans.sort((a: Scan, b: Scan) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        const scanIdFromQuery = searchParams.get('scanId');
        if (scanIdFromQuery && deviceScans.length > 0) {
          const scanToDisplay = deviceScans.find((s: Scan) => s.id === scanIdFromQuery);
          if (scanToDisplay && scanToDisplay.status === 'completed') {
            setCurrentScan(scanToDisplay);
            setReportResult(null); // Reset report result when viewing a new scan
            if (scanToDisplay.aiAnalysis) {
              setAiEnhancement(scanToDisplay.aiAnalysis);
            }
            if (scanToDisplay.summary && (scanToDisplay.scanType === 'ai' || scanToDisplay.scanType === 'web' || scanToDisplay.aiAnalysis)) {
                setAiSummary({
                    summary: scanToDisplay.summary,
                    keyInsights: scanToDisplay.aiAnalysis?.prioritizedRecommendations || "Refer to scan results for details.",
                    confidenceScore: scanToDisplay.aiAnalysis?.confidenceScore || 0.70,
                });
            }
          } else if (scanToDisplay) {
            console.log("Scan from URL is not completed, not setting as current detailed scan:", scanToDisplay);
          }
        }
      } else {
        notFound();
      }
    } catch (error) {
      console.error("Failed to fetch device details:", error);
      toast({ title: "Error", description: "Could not load device details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, searchParams, toast]);

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  const handleFormSubmit = async (values: any) => {
    if (!device) return;
    setIsSubmitting(true);
    try {
        const deviceData = {
            ...values,
            tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        };
        const updatedDevice = await updateDevice(device.id, deviceData);
        setDevice(updatedDevice);
        toast({ title: "Success", description: "Device updated successfully." });
        setIsFormOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update device.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!device) return;
    
    setDevice(prev => prev ? { ...prev, isActive } : null);

    try {
      await updateDevice(device.id, { isActive });
      toast({ title: 'Status Updated', description: `Device is now ${isActive ? 'active' : 'inactive'}.` });
    } catch (error) {
      setDevice(prev => prev ? { ...prev, isActive: !isActive } : null);
      toast({ title: 'Error', description: 'Failed to update device status.', variant: 'destructive' });
    }
  };

  const handleStartScan = async (scanType: ScanType) => {
    if (!device) return;
    setIsScanning(true);
    setScanLog([`Initializing ${scanType} scan...`]);
    setCurrentScan(null);
    setAiEnhancement(null);
    setAiSummary(null);
    setScanProgress(10);

    try {
      const scanJob = await triggerScan(device.id, scanType);
      setCurrentScan(scanJob);
      setScanLog(prev => [...prev, `Scan ${scanJob.id} started with status: ${scanJob.status}`]);
      setScanProgress(30);

      let progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 1000);

      setTimeout(async () => {
        clearInterval(progressInterval);
        setScanProgress(100);
        
        await loadDevice(); // Re-fetch all device data including new scan
        setIsScanning(false);
      }, 5000);

    } catch (error) {
      console.error(`Failed to trigger ${scanType} scan:`, error);
      toast({ title: "Scan Error", description: `Could not start ${scanType} scan.`, variant: "destructive" });
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleSuggestRemediation = async (vuln: Vulnerability | ScanResult) => {
    if (!device) return;
    
    setIsLoadingAiSuggestion(true);
    setAiSuggestion(null);
    setAiSuggestionError(null);

    try {
      const suggestion = await callSuggestRemediationSteps(vuln.finding || (vuln as Vulnerability).name, device.name);
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      setAiSuggestionError("Failed to load AI remediation suggestions. Please try again later.");
      toast({ title: "Error", description: "Could not get AI remediation suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingAiSuggestion(false);
    }
  };

  const handleDialogClose = () => {
    setAiSuggestion(null);
    setAiSuggestionError(null);
    setIsLoadingAiSuggestion(false);
    setSelectedVulnerabilityForSuggestion(null);
  };
  
  const handleGenerateReport = async () => {
    if (!currentScan) return;
    setIsGeneratingReport(true);
    setReportResult(null);
    try {
        const result = await generateReportFromScan(currentScan.id, { format: selectedReportFormat });
        setReportResult(result);
        if (result.status === 'completed') {
            toast({
                title: 'Report Queued',
                description: `Your report is being generated and will be available shortly.`,
            });
        } else {
             toast({
                title: 'Report Generation Failed',
                description: result.message,
                variant: 'destructive',
            });
        }
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' });
    } finally {
        setIsGeneratingReport(false);
        setIsReportDialogOpen(false);
    }
  };


  if (loading && !device) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-1" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!device) {
    return <p>Device not found.</p>;
  }

  const DeviceIcon = getDeviceIcon(device.brand);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <DeviceIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
            <p className="text-muted-foreground">{device.brand} {device.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Device</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Device</DialogTitle>
                        <DialogDescription>
                            Update the details for {device.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <DeviceForm 
                        device={device}
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            
            <div className="flex items-center space-x-2 p-2 rounded-md border">
              <Switch
                id="device-status"
                checked={device.isActive}
                onCheckedChange={handleStatusChange}
                aria-label={`Device status: ${device.isActive ? 'Active' : 'Inactive'}`}
              />
              <Label htmlFor="device-status" className="text-sm font-medium cursor-pointer">{device.isActive ? 'Active' : 'Inactive'}</Label>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>IP Address:</strong> {device.ipAddress}</p>
            <p><strong>MAC Address:</strong> {device.macAddress}</p>
            <p><strong>OS:</strong> {device.os} {device.osVersion}</p>
            <p><strong>Location:</strong> {device.location}</p>
            <p><strong>Version:</strong> {device.version}</p>
            <p><strong>Last Seen:</strong> {new Date(device.lastSeen).toLocaleString()}</p>
            {device.tags && device.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                    {device.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vulnerability Scanning</CardTitle>
            <CardDescription>Choose a scan type to assess this device.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['full', 'local', 'web', 'ai'] as ScanType[]).map((type) => (
              <Button key={type} onClick={() => handleStartScan(type)} disabled={isScanning} variant="outline" className="flex-col h-auto py-3">
                {type === 'full' && <ListChecks className="h-6 w-6 mb-1" />}
                {type === 'local' && <Laptop className="h-6 w-6 mb-1" />}
                {type === 'web' && <Globe className="h-6 w-6 mb-1" />}
                {type === 'ai' && <Brain className="h-6 w-6 mb-1" />}
                <span className="capitalize">{type} Scan</span>
              </Button>
            ))}
          </CardContent>
          {isScanning && (
            <CardFooter className="flex-col items-start pt-4">
              <p className="text-sm font-medium mb-2">Scan in progress: {currentScan?.scanType || ''} ({currentScan?.status.replace('_',' ') || ''})</p>
              <Progress value={scanProgress} className="w-full mb-2" />
              <div className="h-32 w-full bg-muted rounded-md p-2 overflow-y-auto text-xs font-mono">
                {scanLog.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {currentScan && currentScan.status === 'completed' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Scan Results: {currentScan.id.substring(0,12)}...</CardTitle>
                    <CardDescription>Type: <span className="capitalize">{currentScan.scanType}</span> - Completed on {new Date(currentScan.completedAt!).toLocaleString()}</CardDescription>
                </div>
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogTrigger asChild>
                       <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Generate Report</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Generate Report for Scan</DialogTitle>
                            <DialogDescription>
                               Select a format for the report of scan <span className="font-mono text-xs">{currentScan.id.substring(0,12)}...</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-4">
                            <Label htmlFor="report-format">Report Format</Label>
                            <Select defaultValue={selectedReportFormat} onValueChange={(value: ReportFormat) => setSelectedReportFormat(value)}>
                               <SelectTrigger id="report-format">
                                    <SelectValue placeholder="Select format" />
                               </SelectTrigger>
                               <SelectContent>
                                   {reportFormats.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                               </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                             <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
                             <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                                {isGeneratingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 Generate
                             </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {reportResult && (
                <Alert variant={reportResult.status === 'failed' ? "destructive" : "default"} className="mb-4">
                    <AlertTitle className="flex items-center gap-2">
                        {reportResult.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        Report Status: {reportResult.status.charAt(0).toUpperCase() + reportResult.status.slice(1)}
                    </AlertTitle>
                    <AlertDescription>
                        {reportResult.message}
                        {reportResult.data?.downloadLink && (
                            <Button asChild variant="link" className="p-0 h-auto ml-2">
                                <a href={reportResult.data.downloadLink} target="_blank" rel="noopener noreferrer">Download Report</a>
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
             )}
            {aiSummary && (
              <div className="mb-4 p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Lightbulb className="text-yellow-500"/>AI Summary (Confidence: {aiSummary.confidenceScore.toFixed(2)})</h3>
                <p className="text-sm text-muted-foreground mt-1">{aiSummary.summary}</p>
                <h4 className="font-medium mt-2">Key Insights:</h4>
                 <div className="text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans">{aiSummary.keyInsights}</pre>
                 </div>
              </div>
            )}
            {aiEnhancement && (
               <div className="mb-4 p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Brain className="text-primary"/>AI Enhanced Analysis (Confidence: {aiEnhancement.confidenceScore.toFixed(2)})</h3>
                <h4 className="font-medium mt-2">Executive Summary:</h4>
                <p className="text-sm text-muted-foreground mt-1">{aiEnhancement.executiveSummary}</p>
                <h4 className="font-medium mt-2">Prioritized Recommendations:</h4>
                 <div className="text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-sans">{aiEnhancement.prioritizedRecommendations}</pre>
                 </div>
              </div>
            )}
            <h4 className="font-semibold mb-2">Vulnerabilities Found ({currentScan.vulnerabilitiesFound}):</h4>
            {currentScan.results && currentScan.results.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Finding</TableHead><TableHead>Severity</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentScan.results.map(res => (
                    <TableRow key={res.id}>
                      <TableCell>{res.finding}</TableCell>
                      <TableCell><Badge variant={severityBadgeVariant(res.severity)} className="capitalize">{res.severity}</Badge></TableCell>
                      <TableCell><Badge variant={res.status === 'open' ? 'destructive' : 'default'} className="capitalize">{res.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Dialog onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedVulnerabilityForSuggestion(res); handleSuggestRemediation(res); }}>
                              {isLoadingAiSuggestion && selectedVulnerabilityForSuggestion?.id === res.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                              Suggest Fix
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                AI Remediation Suggestion
                              </DialogTitle>
                              <DialogDescription>
                                For: <span className="font-semibold">{selectedVulnerabilityForSuggestion?.finding || (selectedVulnerabilityForSuggestion as Vulnerability)?.name}</span>
                              </DialogDescription>
                            </DialogHeader>

                            {isLoadingAiSuggestion && (
                              <div className="space-y-3 my-4 py-4">
                                <div className="flex items-center space-x-2">
                                  <Skeleton className="h-5 w-5 rounded-full" />
                                  <Skeleton className="h-4 w-1/3" />
                                </div>
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-8 w-1/4" />
                              </div>
                            )}

                            {aiSuggestionError && !isLoadingAiSuggestion && (
                              <Alert variant="destructive" className="my-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error Fetching Suggestion</AlertTitle>
                                <AlertDescription>{aiSuggestionError}</AlertDescription>
                              </Alert>
                            )}

                            {aiSuggestion && !isLoadingAiSuggestion && !aiSuggestionError && (
                              <div className="mt-2 space-y-4">
                                <div className="flex items-center text-sm">
                                  <ShieldCheck className="h-5 w-5 mr-2 text-accent" />
                                  <span className="font-medium">Confidence Score:</span>
                                  <Badge 
                                    variant={aiSuggestion.confidenceScore > 0.7 ? 'success' : aiSuggestion.confidenceScore > 0.4 ? 'default' : 'secondary'} 
                                    className="ml-2 text-xs"
                                  >
                                    {aiSuggestion.confidenceScore.toFixed(2)}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-1.5 text-sm">Suggested Steps:</h4>
                                  <ScrollArea className="h-64 w-full rounded-md border p-3 bg-muted/20">
                                    <div className="text-sm text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: aiSuggestion.remediationSteps.replace(/\n/g, '<br />') }}
                                    />
                                  </ScrollArea>
                                </div>
                              </div>
                            )}
                            <DialogFooter className="mt-6">
                                <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">No vulnerabilities found in this scan.</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans for this Device</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedScans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scan ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedScans.slice(0,5).map(scan => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-mono text-xs">{scan.id.substring(0,12)}...</TableCell>
                    <TableCell className="capitalize">{scan.scanType}</TableCell>
                    <TableCell>
                      <Badge variant={scan.status === 'completed' ? 'success' : scan.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-80">
                        {scan.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(scan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{scan.vulnerabilitiesFound}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" disabled={scan.status !== 'completed'}>
                        <Link href={`/devices/${device.id}?scanId=${scan.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No scan history for this device yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
