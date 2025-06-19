'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Laptop, Smartphone, Server, Tablet, CircleAlert } from 'lucide-react';
import type { Device } from '@/types';
import { cn } from '@/lib/utils';

interface DeviceTableProps {
  devices: Device[];
  onRowSelect?: (deviceId: string, selected: boolean) => void;
  selectedDeviceIds?: Set<string>;
  isSelectionMode?: boolean;
}

const getDeviceIcon = (brand: string) => {
  const lowerBrand = brand.toLowerCase();
  if (lowerBrand.includes('apple') && (lowerBrand.includes('macbook') || lowerBrand.includes('imac'))) return Laptop;
  if (lowerBrand.includes('iphone') || lowerBrand.includes('pixel') || lowerBrand.includes('samsung galaxy s')) return Smartphone;
  if (lowerBrand.includes('server') || lowerBrand.includes('dell poweredge') || lowerBrand.includes('hp proliant')) return Server;
  if (lowerBrand.includes('ipad') || lowerBrand.includes('tablet') || lowerBrand.includes('surface pro')) return Tablet;
  return Laptop; // Default
};

export function DeviceTable({ devices, onRowSelect, selectedDeviceIds, isSelectionMode = false }: DeviceTableProps) {
  if (!devices || devices.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No devices found.</p>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectionMode && <TableHead className="w-[50px]"><Checkbox disabled /></TableHead>}
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const Icon = getDeviceIcon(device.brand);
              return (
                <TableRow key={device.id} data-state={selectedDeviceIds?.has(device.id) ? 'selected' : undefined}>
                  {isSelectionMode && onRowSelect && selectedDeviceIds && (
                    <TableCell>
                      <Checkbox
                        checked={selectedDeviceIds.has(device.id)}
                        onCheckedChange={(checked) => onRowSelect(device.id, !!checked)}
                        aria-label={`Select device ${device.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={device.isActive ? 'default' : 'outline'} className={cn(device.isActive ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30', 'capitalize')}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{device.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-7">{device.ipAddress}</div>
                  </TableCell>
                  <TableCell>{device.brand}</TableCell>
                  <TableCell>{device.model}</TableCell>
                  <TableCell>{device.os} {device.osVersion}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/devices/${device.id}`} aria-label={`View details for ${device.name}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Need to add Card and Checkbox imports if not already available globally from ui components
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

