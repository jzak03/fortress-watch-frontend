'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevices, triggerBulkScan } from '@/lib/api';
import type { Device, PaginatedResponse, DeviceFilters as DeviceFiltersType } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanSearch, Check, Loader2 } from 'lucide-react';
import { DeviceTable } from '@/components/devices/DeviceTable'; // Reuse device table for selection
import { DeviceFilters } from '@/components/devices/DeviceFilters';
import { PaginationControls } from '@/components/common/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ITEMS_PER_PAGE = 10;

export default function BulkScanPage() {
  const [devicesResponse, setDevicesResponse] = useState<PaginatedResponse<Device> | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanJobId, setScanJobId] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceFiltersType>({ page: 1, limit: ITEMS_PER_PAGE });
  const { toast } = useToast();

  const loadDevices = useCallback(async (currentFilters: DeviceFiltersType) => {
    setLoadingDevices(true);
    try {
      const data = await fetchDevices(currentFilters);
      setDevicesResponse(data);
    } catch (error) {
      console.error("Failed to fetch devices for bulk scan:", error);
      toast({ title: "Error", description: "Could not load devices.", variant: "destructive"});
    } finally {
      setLoadingDevices(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDevices(filters);
  }, [filters, loadDevices]);

  const handleDeviceSelection = (deviceId: string, selected: boolean) => {
    setSelectedDeviceIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(deviceId);
      } else {
        newSet.delete(deviceId);
      }
      return newSet;
    });
  };

  const handleSelectAllOnPage = (select: boolean) => {
    if (devicesResponse) {
      setSelectedDeviceIds(prev => {
        const newSet = new Set(prev);
        devicesResponse.data.forEach(device => {
          if (select) newSet.add(device.id);
          else newSet.delete(device.id);
        });
        return newSet;
      });
    }
  };

  const handleStartBulkScan = async () => {
    if (selectedDeviceIds.size === 0) {
      toast({ title: "No Devices Selected", description: "Please select at least one device to scan.", variant: "default" });
      return;
    }
    setIsScanning(true);
    setScanJobId(null);
    setScanMessage(null);
    try {
      const result = await triggerBulkScan(Array.from(selectedDeviceIds));
      setScanJobId(result.jobId);
      setScanMessage(result.message);
      toast({ title: "Bulk Scan Started", description: result.message, variant: "default" });
      setSelectedDeviceIds(new Set()); // Clear selection after starting
    } catch (error) {
      console.error("Failed to start bulk scan:", error);
      toast({ title: "Error", description: "Could not start bulk scan.", variant: "destructive"});
      setScanMessage("Failed to start bulk scan. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFiltersChange = (newFilterValues: Partial<DeviceFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilterValues, page: 1 }));
  };
  
  const handleResetFilters = () => {
    setFilters({ page: 1, limit: ITEMS_PER_PAGE });
  };
  
  const allOnPageSelected = devicesResponse?.data.length > 0 && devicesResponse.data.every(d => selectedDeviceIds.has(d.id));
  const someOnPageSelected = devicesResponse?.data.some(d => selectedDeviceIds.has(d.id));


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Vulnerability Scan</h1>
        <Button onClick={handleStartBulkScan} disabled={isScanning || selectedDeviceIds.size === 0}>
          {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
          Start Scan for {selectedDeviceIds.size} Device(s)
        </Button>
      </div>
      <CardDescription>Select devices from the list below to include in the bulk scan operation. A full scan will be initiated for each selected device.</CardDescription>

      {scanJobId && scanMessage && (
        <Alert variant={scanMessage.toLowerCase().includes('failed') ? "destructive" : "default"} className="mb-4">
          <Check className="h-4 w-4" />
          <AlertTitle>{scanMessage.toLowerCase().includes('failed') ? "Scan Initiation Problem" : "Scan Job Status"}</AlertTitle>
          <AlertDescription>
            {scanMessage} {scanJobId && `(Job ID: ${scanJobId})`}
            <p className="text-xs mt-1">You can monitor scan progress in the Scan History page.</p>
          </AlertDescription>
        </Alert>
      )}
      
      <DeviceFilters filters={filters} onFiltersChange={handleFiltersChange} onResetFilters={handleResetFilters} />

      {loadingDevices && !devicesResponse ? (
        <Skeleton className="h-96 w-full" />
      ) : devicesResponse && devicesResponse.data.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Devices</CardTitle>
               <div className="flex items-center space-x-2">
                <Checkbox
                    id="select-all-page"
                    checked={allOnPageSelected}
                    onCheckedChange={(checked) => handleSelectAllOnPage(!!checked)}
                    aria-label="Select all devices on this page"
                />
                <label
                    htmlFor="select-all-page"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                   {allOnPageSelected ? "Deselect" : "Select"} all on page ({devicesResponse.data.filter(d => selectedDeviceIds.has(d.id)).length} / {devicesResponse.data.length})
                </label>
            </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DeviceTable 
              devices={devicesResponse.data} 
              onRowSelect={handleDeviceSelection} 
              selectedDeviceIds={selectedDeviceIds}
              isSelectionMode={true}
            />
          </CardContent>
          <CardFooter className="p-4">
            <PaginationControls
              currentPage={devicesResponse.currentPage}
              totalPages={devicesResponse.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={devicesResponse.currentPage < devicesResponse.totalPages}
              hasPrevPage={devicesResponse.currentPage > 1}
            />
          </CardFooter>
        </Card>
      ) : (
         <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No devices available for selection.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting filters or ensure devices are registered.</p>
        </div>
      )}
    </div>
  );
}
