'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { DeviceFilters as DeviceFiltersType } from '@/types';
import { getDeviceBrands, getDeviceLocations } from '@/lib/api'; // Mock API for filter options

interface DeviceFiltersProps {
  filters: DeviceFiltersType;
  onFiltersChange: (filters: Partial<DeviceFiltersType>) => void;
  onResetFilters: () => void;
}

export function DeviceFilters({ filters, onFiltersChange, onResetFilters }: DeviceFiltersProps) {
  const deviceBrands = React.useMemo(() => getDeviceBrands(), []);
  const deviceLocations = React.useMemo(() => getDeviceLocations(), []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: keyof DeviceFiltersType) => (value: string) => {
    onFiltersChange({ [name]: value === 'all' ? undefined : value });
  };
  
  const handleActiveStatusChange = (value: string) => {
    let statusValue: boolean | string | undefined;
    if (value === 'active') statusValue = true;
    else if (value === 'inactive') statusValue = false;
    else statusValue = 'all'; // or undefined if 'all' means no filter
    onFiltersChange({ isActive: statusValue === 'all' ? undefined : statusValue });
  };


  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name</label>
            <Input
              id="name"
              name="name"
              placeholder="Search by name..."
              value={filters.name || ''}
              onChange={handleInputChange}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="brand" className="text-sm font-medium text-muted-foreground">Brand</label>
            <Select name="brand" value={filters.brand || 'all'} onValueChange={handleSelectChange('brand')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {deviceBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand === 'all' ? 'All Brands' : brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="model" className="text-sm font-medium text-muted-foreground">Model</label>
            <Input
              id="model"
              name="model"
              placeholder="Search by model..."
              value={filters.model || ''}
              onChange={handleInputChange}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="location" className="text-sm font-medium text-muted-foreground">Location</label>
             <Select name="location" value={filters.location || 'all'} onValueChange={handleSelectChange('location')}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {deviceLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc === 'all' ? 'All Locations' : loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="isActive" className="text-sm font-medium text-muted-foreground">Status</label>
            <Select 
              name="isActive" 
              value={filters.isActive === true ? 'active' : filters.isActive === false ? 'inactive' : 'all'} 
              onValueChange={handleActiveStatusChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onFiltersChange(filters)} className="w-full h-9" aria-label="Apply filters">
              <Search className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" onClick={onResetFilters} className="w-full h-9" aria-label="Reset filters">
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to add Card and CardContent imports
import { Card, CardContent } from '@/components/ui/card';
