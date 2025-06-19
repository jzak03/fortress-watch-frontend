
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound, useSearchParams } from 'next/navigation';
import { fetchDeviceById, triggerScan, callSuggestRemediationSteps } from '@/lib/api';
import type { Device, Scan, ScanType, Vulnerability, ScanResult, AISuggestion, AIEnhancement, AISummary, ScanStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Laptop, Smartphone, Server, Tablet, ScanLine, AlertTriangle, CheckCircle2, ShieldCheck, Lightbulb, Brain, Globe, Activity, CalendarDays, Tag, ListChecks, BarChartHorizontalBig } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const getDeviceIcon = (brand?: string) => {
  if (!brand) return Laptop;
  const lowerBrand = brand.toLowerCase();
  if (lowerBrand.includes('apple') && (lowerBrand.includes('macbook') || lowerBrand.includes('imac'))) return Laptop;
  if (lowerBrand.includes('iphone') || lowerBrand.includes('pixel') || lowerBrand.includes('samsung galaxy s')) return Smartphone;
  if (lowerBrand.includes('server') || lowerBrand.includes('dell poweredge') || lowerBrand.includes('hp proliant')) return Server;
  if (lowerBrand.includes('ipad') || lowerBrand.includes('tablet') || lowerBrand.includes('surface pro')) return Tablet;
  return Laptop; // Default
};

const severityBadgeVariant = (severity: Vulnerability['severity'] | ScanResult['severity']): 'destructive' | 'default' | 'secondary' | 'outline' => {
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

  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiEnhancement, setAiEnhancement] = useState<AIEnhancement | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | ScanResult | null>(null);


  useEffect(() => {
    if (id) {
      async function loadDevice() {
        setLoading(true);
        try {
          const data = await fetchDeviceById(id);
          if (data) {
            setDevice(data);
            const deviceScans = (data as any).scans || []; // Scans are attached in fetchDeviceById
            setRelatedScans(deviceScans.sort((a: Scan, b: Scan) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

            const scanIdFromQuery = searchParams.get('scanId');
            if (scanIdFromQuery && deviceScans.length > 0) {
              const scanToDisplay = deviceScans.find((s: Scan) => s.id === scanIdFromQuery);
              if (scanToDisplay && scanToDisplay.status === 'completed') { // Only display details for completed scans from query
                setCurrentScan(scanToDisplay);
                if (scanToDisplay.aiAnalysis) {
                  setAiEnhancement(scanToDisplay.aiAnalysis);
                }
                if (scanToDisplay.summary && (scanToDisplay.scanType === 'ai' || scanToDisplay.scanType === 'web' || scanToDisplay.aiAnalysis)) {
                    setAiSummary({
                        summary: scanToDisplay.summary,
                        keyInsights: scanToDisplay.aiAnalysis?.prioritizedRecommendations || "Refer to scan results for details.",
                        confidenceScore: scanToDisplay.aiAnalysis?.confidenceScore || 0.70, // Default confidence if not present
                    });
                }
              } else if (scanToDisplay) {
                // If scan from query is not completed, we can still set it to show its status (e.g. in_progress)
                // but results section might be empty or show 'in progress'.
                // For now, we are focusing on completed scans for detailed view from history.
                // You could add logic here to show basic info for non-completed scans from URL too.
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
      }
      loadDevice();
    }
  }, [id, searchParams, toast]);

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

      // Simulate waiting for scan completion. In real app, this would be a poll or webhook.
      // The triggerScan mock in api.ts already simulates this background update.
      // We need to re-fetch the device or scan list after a delay to get updated scan.
      setTimeout(async () => {
        clearInterval(progressInterval);
        setScanProgress(100);
        
        // Re-fetch device to get the latest scans list which should include the completed scan
        const updatedDeviceData = await fetchDeviceById(id);
        if (updatedDeviceData) {
            const updatedDeviceScans = (updatedDeviceData as any).scans || [];
            setRelatedScans(updatedDeviceScans.sort((a: Scan, b: Scan) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            const completedScan = updatedDeviceScans.find((s:Scan) => s.id === scanJob.id && s.status === 'completed');
            
            if (completedScan) {
                setCurrentScan(completedScan);
                setScanLog(prev => [...prev, `Scan ${completedScan.id} completed.`]);

                if (completedScan.aiAnalysis) {
                    setAiEnhancement(completedScan.aiAnalysis);
                    setScanLog(prev => [...prev, `AI Enhancement generated with confidence: ${completedScan.aiAnalysis.confidenceScore.toFixed(2)}`]);
                }
                if (completedScan.summary && (completedScan.scanType === 'ai' || completedScan.scanType === 'web' || completedScan.aiAnalysis)) {
                    setAiSummary({
                        summary: completedScan.summary,
                        keyInsights: completedScan.aiAnalysis?.prioritizedRecommendations || "Refer to scan results for key insights.",
                        confidenceScore: completedScan.aiAnalysis?.confidenceScore || 0.7 
                    });
                    setScanLog(prev => [...prev, `AI Summary available.`]);
                }
            } else {
                 const fallbackCompletedScan = { 
                    ...scanJob, 
                    status: 'completed' as ScanStatus, 
                    results: [{ id: 'res1', scanId: scanJob.id, finding: 'Mock Finding Fallback', severity: 'medium', status: 'open', createdAt: new Date().toISOString() }] as ScanResult[],
                    vulnerabilitiesFound: 1,
                    completedAt: new Date().toISOString(),
                    summary: "Scan completed (fallback after re-fetch)."
                };
                setCurrentScan(fallbackCompletedScan);
                setRelatedScans(prev => [fallbackCompletedScan, ...prev.filter(s => s.id !== fallbackCompletedScan.id)].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setScanLog(prev => [...prev, `Scan ${fallbackCompletedScan.id} completed (fallback).`]);
            }
        }
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
    setSelectedVulnerability(vuln);
    setAiSuggestion(null); 
    try {
      const suggestion = await callSuggestRemediationSteps(vuln.finding || (vuln as Vulnerability).name, device.name);
      setAiSuggestion(suggestion);
    } catch (error) {
      toast({ title: "Error", description: "Could not get AI remediation suggestions.", variant: "destructive" });
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
        <Badge variant={device.isActive ? 'default' : 'destructive'} className={cn(device.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300', 'capitalize text-sm py-1 px-3')}>
          {device.isActive ? 'Active' : 'Inactive'}
        </Badge>
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
            <CardTitle>Scan Results: {currentScan.id.substring(0,12)}...</CardTitle>
            <CardDescription>Type: <span className="capitalize">{currentScan.scanType}</span> - Completed on {new Date(currentScan.completedAt!).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {aiSummary && (
              <div className="mb-4 p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Lightbulb className="text-yellow-500"/>AI Summary (Confidence: {aiSummary.confidenceScore.toFixed(2)})</h3>
                <p className="text-sm text-muted-foreground mt-1">{aiSummary.summary}</p>
                <h4 className="font-medium mt-2">Key Insights:</h4>
                 <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                    <pre className="whitespace-pre-wrap bg-transparent p-0">{aiSummary.keyInsights}</pre>
                 </div>
              </div>
            )}
            {aiEnhancement && (
               <div className="mb-4 p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Brain className="text-primary"/>AI Enhanced Analysis (Confidence: {aiEnhancement.confidenceScore.toFixed(2)})</h3>
                <h4 className="font-medium mt-2">Executive Summary:</h4>
                <p className="text-sm text-muted-foreground mt-1">{aiEnhancement.executiveSummary}</p>
                <h4 className="font-medium mt-2">Prioritized Recommendations:</h4>
                 <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                    <pre className="whitespace-pre-wrap bg-transparent p-0">{aiEnhancement.prioritizedRecommendations}</pre>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleSuggestRemediation(res)}>
                              <Lightbulb className="h-4 w-4 mr-1" /> Suggest Fix
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>AI Remediation Suggestion for: {selectedVulnerability?.finding}</DialogTitle>
                              <DialogDescription>Confidence: {aiSuggestion ? aiSuggestion.confidenceScore.toFixed(2) : "Loading..."}</DialogDescription>
                            </DialogHeader>
                            {aiSuggestion ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <pre className="whitespace-pre-wrap">{aiSuggestion.remediationSteps}</pre>
                              </div>
                            ) : <Skeleton className="h-20 w-full" />}
                            <DialogFooter>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedScans.slice(0,5).map(scan => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-mono text-xs">{scan.id.substring(0,12)}...</TableCell>
                    <TableCell className="capitalize">{scan.scanType}</TableCell>
                    <TableCell>
                      <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-80">
                        {scan.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(scan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{scan.vulnerabilitiesFound}</TableCell>
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
