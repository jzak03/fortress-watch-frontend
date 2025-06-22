
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Device } from '@/types';
import { getDeviceBrands, getDeviceLocations } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const deviceFormSchema = z.object({
  name: z.string().min(1, 'Device name is required.'),
  brand: z.string().min(1, 'Brand is required.'),
  model: z.string().min(1, 'Model is required.'),
  version: z.string().min(1, 'Firmware version is required.'),
  location: z.string().min(1, 'Location is required.'),
  ipAddress: z.string().ip({ version: 'v4', message: 'Invalid IP address.' }),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address.'),
  os: z.string().min(1, 'Operating System is required.'),
  osVersion: z.string().min(1, 'OS version is required.'),
  tags: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

interface DeviceFormProps {
  device?: Device | null;
  onSubmit: (values: DeviceFormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function DeviceForm({ device, onSubmit, isSubmitting, onCancel }: DeviceFormProps) {
  const deviceBrands = getDeviceBrands().filter(b => b !== 'all');
  const deviceLocations = getDeviceLocations().filter(l => l !== 'all');

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: device?.name || '',
      brand: device?.brand || '',
      model: device?.model || '',
      version: device?.version || '',
      location: device?.location || '',
      ipAddress: device?.ipAddress || '',
      macAddress: device?.macAddress || '',
      os: device?.os || '',
      osVersion: device?.osVersion || '',
      tags: device?.tags?.join(', ') || '',
    },
  });

  const handleSubmit = (values: DeviceFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Name</FormLabel>
                <FormControl><Input placeholder="e.g., Main Office Firewall" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {deviceBrands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl><Input placeholder="e.g., PA-220" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firmware Version</FormLabel>
                <FormControl><Input placeholder="e.g., 10.1.2" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl><Input placeholder="e.g., 192.168.1.1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="macAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MAC Address</FormLabel>
                <FormControl><Input placeholder="e.g., 00:1B:44:11:3A:B7" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="os"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operating System</FormLabel>
                <FormControl><Input placeholder="e.g., PAN-OS" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="osVersion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OS Version</FormLabel>
                <FormControl><Input placeholder="e.g., 9.1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                 <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {deviceLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl><Input placeholder="e.g., core, critical, pci" {...field} /></FormControl>
                <FormDescription>Comma-separated list of tags.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {device ? 'Save Changes' : 'Create Device'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
