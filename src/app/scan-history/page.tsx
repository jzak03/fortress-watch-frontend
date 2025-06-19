
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchScanHistory, getScanTypes, getScanStatuses, fetchDevices } from '@/lib/api';
import type { Scan, PaginatedResponse, ScanHistoryFilters as ScanFiltersType, Device } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/common/PaginationControls';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, X, ListFilter, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function ScanHistoryPage() {
  const [scansResponse, setScansResponse] = useState<PaginatedResponse<Scan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ScanFiltersType>({ page: 1, limit: ITEMS_PER_PAGE });
  const [devices, setDevices] = useState<Device[]>([]);
  const { toast } = useToast();

  const scanTypes = getScanTypes();
  const scanStatuses = getScanStatuses();

  useEffect(() => {
    async function loadDevicesForFilter() {
      try {
        // Fetch all devices for the filter dropdown (or a reasonable subset)
        const deviceData = await fetchDevices({ limit: 1000 }); // Adjust limit as needed
        setDevices(deviceData.data);
      } catch (error) {
        console.error("Failed to fetch devices for filter:", error);
      }
    }
    loadDevicesForFilter();
  }, []);

  const loadScans = useCallback(async (currentFilters: ScanFiltersType) => {
    setLoading(true);
    try {
      const data = await fetchScanHistory(currentFilters);
      setScansResponse(data);
    } catch (error) {
      console.error("Failed to fetch scan history:", error);
      toast({ title: "Error", description: "Could not load scan history.", variant: "destructive"});
      setScansResponse(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScans(filters);
  }, [filters, loadScans]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterValueChange = (name: keyof ScanFiltersType) => (value: string) => {
    setFilters(prev => ({ ...prev, [name]: value === 'all' ? undefined : value, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: ITEMS_PER_PAGE });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
         {/* Potentially a "New Scan" button if contextually appropriate, or export button */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5"/> Filter Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label htmlFor="deviceId" className="text-sm font-medium text-muted-foreground">Device</label>
              <Select name="deviceId" value={filters.deviceId || 'all'} onValueChange={handleFilterValueChange('deviceId')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="scanType" className="text-sm font-medium text-muted-foreground">Scan Type</label>
              <Select name="scanType" value={filters.scanType || 'all'} onValueChange={handleFilterValueChange('scanType')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {scanTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status</label>
              <Select name="status" value={filters.status || 'all'} onValueChange={handleFilterValueChange('status')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {scanStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full lg:col-span-2 flex gap-2 items-end">
              <Button onClick={() => loadScans(filters)} className="w-full sm:w-auto h-9">
                <Filter className="h-4 w-4 mr-2" /> Apply Filters
              </Button>
              <Button variant="outline" onClick={handleResetFilters} className="w-full sm:w-auto h-9">
                <X className="h-4 w-4 mr-2" /> Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {loading && !scansResponse ? (
        <Skeleton className="h-96 w-full" />
      ) : scansResponse && scansResponse.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scan ID</TableHead>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scansResponse.data.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-mono text-xs">{scan.id.substring(0,12)}...</TableCell>
                    <TableCell>
                      <Link href={`/devices/${scan.deviceId}`} className="hover:underline text-primary">
                        {scan.deviceName || scan.deviceId}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">{scan.scanType}</TableCell>
                    <TableCell>
                       <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-80">
                        {scan.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{scan.vulnerabilitiesFound}</TableCell>
                    <TableCell>{scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                       <Button asChild variant="ghost" size="sm">
                        <Link href={`/devices/${scan.deviceId}?scanId=${scan.id}`}>
                           View <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="p-4">
            <PaginationControls
              currentPage={scansResponse.currentPage}
              totalPages={scansResponse.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={scansResponse.currentPage < scansResponse.totalPages}
              hasPrevPage={scansResponse.currentPage > 1}
            />
          </CardFooter>
        </Card>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No scan history found.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or run some scans.</p>
        </div>
      )}
    </div>
  );
}
