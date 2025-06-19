
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ShieldCheck, CalendarDays, Activity, ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  joinedDate: string; // ISO string or simple date string
  avatarUrl: string;
}

interface ActivityLogEntry {
  id: string;
  description: string;
  timestamp: Date;
  link?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    // Mock data fetching
    const mockUser: UserProfile = {
      name: "Admin User",
      email: "admin@fortresswatch.com",
      role: "Administrator",
      joinedDate: "2023-01-15T10:00:00Z",
      avatarUrl: "https://placehold.co/128x128.png",
    };
    setUser(mockUser);

    const mockActivities: ActivityLogEntry[] = [
      { id: "act1", description: "Logged in", timestamp: new Date(Date.now() - 3600000 * 2) },
      { id: "act2", description: "Viewed device FW-ASA-1020", timestamp: new Date(Date.now() - 3600000 * 2.5), link: "/devices/device-fw-20" }, // Assuming device-fw-20 is an example ID
      { id: "act3", description: "Started bulk scan for 3 devices", timestamp: new Date(Date.now() - 3600000 * 3), link: "/bulk-scan" },
      { id: "act4", description: "Generated 'Quarterly Security Report'", timestamp: new Date(Date.now() - 3600000 * 24), link: "/reports" },
    ];
    setActivities(mockActivities);
  }, []);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-1 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-3/4 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-1 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="space-y-3">
             {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <Badge variant="secondary" className="mt-1 text-sm py-1 px-3">{user.role}</Badge>
        </div>
         <Button variant="outline">Edit Profile</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your personal and account information.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
             <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium">{user.role}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Joined Date</p>
              <p className="text-sm font-medium">{new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of your recent actions within the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{activity.description} - <span className="text-xs text-muted-foreground">{activity.timestamp.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                  </div>
                  {activity.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={activity.link} target={activity.link.startsWith('/') ? '_self' : '_blank'} rel="noopener noreferrer">
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

