
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, ShieldAlert, Users, Activity } from 'lucide-react';
import type { OrganizationSummary, Vulnerability } from '@/types';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description?: string; }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const severityColors: Record<Vulnerability['severity'], string> = {
  critical: 'hsl(var(--destructive))',
  high: 'hsl(var(--chart-5))', // Orange-red
  medium: 'hsl(var(--chart-4))', // Yellow
  low: 'hsl(var(--chart-2))', // Accent Green
  informational: 'hsl(var(--muted))', // Gray
};

const chartConfigSeverity: ChartConfig = {
  critical: { label: "Critical", color: severityColors.critical },
  high: { label: "High", color: severityColors.high },
  medium: { label: "Medium", color: severityColors.medium },
  low: { label: "Low", color: severityColors.low },
  informational: { label: "Informational", color: severityColors.informational },
};

const chartConfigActivity: ChartConfig = {
  scans: { label: "Scans", color: "hsl(var(--chart-1))" },
};

export function DashboardClient({ summary }: { summary: OrganizationSummary }) {
  const vulnerabilityData = summary.vulnerabilitySeverityDistribution.map(item => ({
    name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
    value: item.count,
    fill: severityColors[item.severity],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Devices" value={summary.totalDevices} icon={Users} description={`${summary.activeDevices} active`} />
        <StatCard title="Critical Vulnerabilities" value={summary.devicesWithCriticalVulnerabilities} icon={ShieldAlert} description="Devices affected" />
        <StatCard title="Total Open Vulnerabilities" value={summary.totalVulnerabilities} icon={BarChart3} description="Across all devices" />
        <StatCard title="Recent Scans (7d)" value={summary.recentScansCount} icon={Activity} description={`Avg. time to remediate: ${summary.averageTimeToRemediate || 'N/A'}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Scan Activity (Last 7 Days)</CardTitle>
            <CardDescription>Number of scans performed daily.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfigActivity} className="h-[300px] w-full">
              <RechartsLineChart data={summary.scanActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-scans)" strokeWidth={2} dot={false} name="Scans"/>
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Vulnerability Severity Distribution</CardTitle>
            <CardDescription>Breakdown of open vulnerabilities by severity.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={chartConfigSeverity} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={vulnerabilityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} 
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (percent * 100) > 5 ? ( // Only show label if percent > 5%
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                  >
                    {vulnerabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                   <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
