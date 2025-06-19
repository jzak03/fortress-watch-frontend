

'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { generateCustomReport, getReportFormats, getSeverityLevels } from '@/lib/api';
import type { CustomReportParams, CustomReportResponse, ReportSeverityLevel, ReportFormat } from '@/types';
import { CalendarIcon, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


const reportSeverityLevels = getSeverityLevels();
const reportFormats = getReportFormats();

const customReportFormSchema = z.object({
  report_type: z.string().min(1, "Report type is required"),
  device_brands: z.string().optional(), // Comma-separated string
  severity_levels: z.array(z.enum(reportSeverityLevels.map(s => s.id) as [ReportSeverityLevel, ...ReportSeverityLevel[]])).optional(),
  date_range_start: z.date().optional(),
  date_range_end: z.date().optional(),
  include_trends: z.boolean().default(false),
  format: z.enum(reportFormats.map(f => f.value) as [ReportFormat, ...ReportFormat[]]).default('pdf'),
}).refine(data => {
    if (data.date_range_start && data.date_range_end && data.date_range_start > data.date_range_end) {
        return false;
    }
    return true;
}, {
    message: "End date cannot be earlier than start date",
    path: ["date_range_end"],
});


type CustomReportFormValues = z.infer<typeof customReportFormSchema>;

export default function CustomReportsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<CustomReportResponse | null>(null);

  const form = useForm<CustomReportFormValues>({
    resolver: zodResolver(customReportFormSchema),
    defaultValues: {
      report_type: '',
      device_brands: '',
      severity_levels: [],
      include_trends: false,
      format: 'pdf',
    },
  });

  async function onSubmit(data: CustomReportFormValues) {
    setIsSubmitting(true);
    setReportResult(null);

    const params: CustomReportParams = {
      report_type: data.report_type,
      filters: {
        device_brands: data.device_brands ? data.device_brands.split(',').map(b => b.trim()).filter(b => b) : undefined,
        severity_levels: data.severity_levels,
        date_range: (data.date_range_start || data.date_range_end) ? {
          start: data.date_range_start ? data.date_range_start.toISOString() : undefined,
          end: data.date_range_end ? data.date_range_end.toISOString() : undefined,
        } : undefined,
      },
      include_trends: data.include_trends,
      format: data.format,
    };

    try {
      const result = await generateCustomReport(params);
      setReportResult(result);
      if (result.status === 'failed') {
        toast({
            title: "Report Generation Failed",
            description: result.message || "Could not generate the report.",
            variant: "destructive",
        });
      } else {
         // Do not show toast for successful generation, the Alert component will display results
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Reports</h1>
            <p className="text-muted-foreground">Generate detailed reports based on your specific criteria.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Define the parameters for your custom report.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="report_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type / Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quarterly Vulnerability Summary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device_brands"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Brands (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cisco, Fortinet, Palo Alto" {...field} />
                    </FormControl>
                     <FormDescription>Leave blank for all brands.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem className="md:col-span-2">
                <FormLabel>Severity Levels</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                  {reportSeverityLevels.map((level) => (
                    <FormField
                      key={level.id}
                      control={form.control}
                      name="severity_levels"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(level.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), level.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== level.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {level.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormDescription className="pt-1">Select severity levels to include. Leave all unchecked for all levels.</FormDescription>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="date_range_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range (Start)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_range_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range (End)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || (form.getValues("date_range_start") && date < form.getValues("date_range_start")!)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="include_trends"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 md:mt-0 md:col-start-2">
                    <div className="space-y-0.5">
                      <FormLabel>Include Trends</FormLabel>
                      <FormDescription>
                        Include trend analysis in the report, if applicable.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {reportResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {reportResult.status === 'completed' ? <CheckCircle2 className="h-6 w-6 mr-2 text-green-600" /> : <AlertCircle className="h-6 w-6 mr-2 text-red-600" />}
              Report Generation Status
            </CardTitle>
            <CardDescription>
              Report ID: {reportResult.report_id} - Generated at: {new Date(reportResult.generated_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant={reportResult.status === 'failed' ? "destructive" : "default"}>
              <AlertTitle>{reportResult.status.toUpperCase()}</AlertTitle>
              <AlertDescription>
                {reportResult.message || "Report processing details."}
                {reportResult.status === 'completed' && reportResult.data?.downloadLink && (
                  <p className="mt-2">
                    Download your report: <a href={reportResult.data.downloadLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{reportResult.data.downloadLink.split('/').pop()}</a>
                  </p>
                )}
                {reportResult.data?.trendsIncluded && reportResult.data?.trendSummary && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <h4 className="font-semibold text-sm">Trend Analysis:</h4>
                    <p className="text-sm text-muted-foreground">{reportResult.data.trendSummary}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

