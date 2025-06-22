
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchNotifications } from '@/lib/api';
import type { Notification, PaginatedResponse } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Check, AlertTriangle, FileText, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'scan_completed': return <Check className="h-4 w-4 text-green-500" />;
        case 'critical_alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case 'report_ready': return <FileText className="h-4 w-4 text-blue-500" />;
        case 'system_update': return <CircleDot className="h-4 w-4 text-purple-500" />;
        default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
};

export function NotificationBell() {
    const [response, setResponse] = useState<PaginatedResponse<Notification> | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUnreadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchNotifications({ status: 'unread', limit: 5 });
            setResponse(data);
        } catch (error) {
            console.error("Failed to fetch notifications for header:", error);
            setResponse(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUnreadNotifications();
        // Optional: Poll for new notifications every minute
        const interval = setInterval(loadUnreadNotifications, 60000);
        return () => clearInterval(interval);
    }, [loadUnreadNotifications]);

    const unreadCount = response?.totalItems ?? 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" suppressHydrationWarning />
                {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
                <span className="sr-only">Notifications</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Badge variant="secondary">{unreadCount} Unread</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {loading ? (
                    <div className="p-2 space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : response && response.data.length > 0 ? (
                    response.data.map(notification => (
                        <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                            <Link href={notification.link || '/notifications'}>
                                <div className="flex items-start gap-3">
                                    <NotificationIcon type={notification.type} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                                    </div>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        You're all caught up!
                    </div>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center" asChild>
                    <Link href="/notifications">
                        <Button variant="link" size="sm" className="p-0 h-auto">View all notifications</Button>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
