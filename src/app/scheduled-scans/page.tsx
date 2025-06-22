
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  fetchScheduledScans, 
  createScheduledScan, 
  updateScheduledScan, 
  deleteScheduledScan, 
  fetchDevices,
  getScanTypes
} from '@/lib/api';
import type { ScheduledScan, PaginatedResponse, Device, ScanType, ScheduleType } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, CalendarClock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const scheduleFormSchema = z.object({
  id: z.string().optional(),
  deviceId: z.string().min(1, 'Device is required'),
  scanType: z.enum(getScanTypes() as [ScanType, ...ScanType[]]),
  scheduleType: z.enum(['once', 'daily', 'weekly', 'monthly']),
  cronExpression: z.string().min(1, 'A schedule time (cron format) is required. E.g., "0 22 * * 5" for Friday 10 PM'),
  isActive: z.boolean().default(true),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function ScheduledScansPage() {
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledScan | null>(null);
  const { toast } = useToast();
  
  const scanTypes = getScanTypes();
  const scheduleTypes: ScheduleType[] = ['once', 'daily', 'weekly', 'monthly'];

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      deviceId: '',
      scanType: 'full',
      scheduleType: 'weekly',
      cronExpression: '0 2 * * 1', // Default: 2 AM every Monday
      isActive: true,
    },
  });
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesData, devicesData] = await Promise.all([
        fetchScheduledScans(),
        fetchDevices({ limit: 1000 }), // Fetch devices for the dropdown
      ]);
      setScheduledScans(schedulesData);
      setDevices(devicesData.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleOpenDialog = (schedule: ScheduledScan | null = null) => {
    setEditingSchedule(schedule);
    if (schedule) {
      form.reset({
        id: schedule.id,
        deviceId: schedule.deviceId,
        scanType: schedule.scanType,
        scheduleType: schedule.scheduleType,
        cronExpression: schedule.cronExpression,
        isActive: schedule.isActive,
      });
    } else {
      form.reset({
        deviceId: '',
        scanType: 'full',
        scheduleType: 'weekly',
        cronExpression: '0 2 * * 1',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        await updateScheduledScan(editingSchedule.id, data);
        toast({ title: 'Success', description: 'Schedule updated successfully.' });
      } else {
        await createScheduledScan(data);
        toast({ title: 'Success', description: 'New schedule created.' });
      }
      await loadData(); // Refresh list
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save schedule.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteScheduledScan(id);
        toast({ title: 'Success', description: 'Schedule deleted.' });
        await loadData();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete schedule.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Scans</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
              <DialogDescription>
                Configure a scan to run automatically on a recurring schedule.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="deviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a device" /></SelectTrigger></FormControl>
                        <SelectContent><SelectContent>
                          {devices.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scanType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a scan type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {scanTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a schedule type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {scheduleTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="cronExpression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule (Cron Expression)</FormLabel>
                      <FormControl><Input placeholder='e.g., 0 22 * * 5' {...field} /></FormControl>
                      <FormDescription>Define when the scan should run. Use cron syntax. </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>Enable or disable this schedule.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                     </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editingSchedule ? 'Save Changes' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Existing Schedules</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : scheduledScans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Scan Type</TableHead>
                  <TableHead>Schedule Type</TableHead>
                  <TableHead>Schedule (Cron)</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledScans.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Badge variant={schedule.isActive ? 'success' : 'secondary'}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell>{devices.find(d => d.id === schedule.deviceId)?.name || schedule.deviceId}</TableCell>
                    <TableCell className="capitalize">{schedule.scanType}</TableCell>
                    <TableCell className="capitalize">{schedule.scheduleType}</TableCell>
                    <TableCell className="font-mono text-xs">{schedule.cronExpression}</TableCell>
                    <TableCell>{new Date(schedule.nextRunAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(schedule)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)}>
                         <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No schedules found.</p>
              <p className="text-sm text-muted-foreground">Create a new schedule to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
