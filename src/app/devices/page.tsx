'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchDevices } from '@/lib/api';
import type { Device, PaginatedResponse, DeviceFilters as DeviceFiltersType } from '@/types';
import { DeviceTable } from '@/components/devices/DeviceTable';
import { DeviceFilters } from '@/components/devices/DeviceFilters';
import { PaginationControls } from '@/components/common/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export default function DevicesPage() {
  const [devicesResponse, setDevicesResponse] = useState<PaginatedResponse<Device> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DeviceFiltersType>({ page: 1, limit: ITEMS_PER_PAGE });
  const { toast } = useToast();

  const loadDevices = useCallback(async (currentFilters: DeviceFiltersType) => {
    setLoading(true);
    try {
      const data = await fetchDevices(currentFilters);
      setDevicesResponse(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      toast({
        title: "Error",
        description: "Failed to load devices. Please try again later.",
        variant: "destructive",
      });
      setDevicesResponse(null); // Clear previous data on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDevices(filters);
  }, [filters, loadDevices]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFiltersChange = (newFilterValues: Partial<DeviceFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilterValues, page: 1 })); // Reset to page 1 on filter change
  };
  
  const handleResetFilters = () => {
    setFilters({ page: 1, limit: ITEMS_PER_PAGE });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Device
        </Button>
      </div>
      
      <DeviceFilters filters={filters} onFiltersChange={handleFiltersChange} onResetFilters={handleResetFilters} />

      {loading && !devicesResponse ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-1/3 self-end" />
        </div>
      ) : devicesResponse && devicesResponse.data.length > 0 ? (
        <>
          <DeviceTable devices={devicesResponse.data} />
          <PaginationControls
            currentPage={devicesResponse.currentPage}
            totalPages={devicesResponse.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={devicesResponse.currentPage < devicesResponse.totalPages}
            hasPrevPage={devicesResponse.currentPage > 1}
          />
        </>
      ) : (
         <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No devices match your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or adding new devices.</p>
        </div>
      )}
    </div>
  );
}
