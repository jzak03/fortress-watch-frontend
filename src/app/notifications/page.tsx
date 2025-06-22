
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/api';
import type { Notification, PaginatedResponse, NotificationFilters } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bell, Check, Trash2, Mail, MailOpen, CircleDot, AlertTriangle, FileText, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { PaginationControls } from '@/components/common/PaginationControls';

const ITEMS_PER_PAGE = 10;

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'scan_completed':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'critical_alert':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'report_ready':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'system_update':
      return <CircleDot className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleMarkRead = () => {
    startTransition(async () => {
      await onMarkAsRead(notification.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete(notification.id);
    });
  };

  const content = (
    <div className="flex items-start gap-4">
      <div className="mt-1">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkRead}
            disabled={isPending}
            aria-label="Mark as read"
          >
            <MailOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "p-4 border-b transition-colors",
        !notification.isRead && "bg-primary/5",
        isPending && "opacity-50"
      )}
    >
      {notification.link ? (
        <Link href={notification.link} className="block hover:bg-muted/50 -m-4 p-4 rounded-lg">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};


export default function NotificationsPage() {
  const [response, setResponse] = useState<PaginatedResponse<Notification> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    status: 'unread',
  });
  const { toast } = useToast();

  const loadNotifications = useCallback(async (currentFilters: NotificationFilters) => {
    setLoading(true);
    try {
      const data = await fetchNotifications(currentFilters);
      setResponse(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load notifications.', variant: 'destructive' });
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications(filters);
  }, [filters, loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      // Optimistically update UI or refetch
      setResponse(prev => {
        if (!prev) return null;
        return {
          ...prev,
          data: prev.data.map(n => n.id === id ? { ...n, isRead: true } : n)
        };
      });
      toast({ title: 'Success', description: 'Notification marked as read.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to mark notification as read.', variant: 'destructive' });
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
        await markAllNotificationsAsRead();
        await loadNotifications(filters); // refetch to update list
        toast({ title: "Success", description: "All notifications marked as read." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to mark all as read.", variant: "destructive"});
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      loadNotifications(filters); // refetch
      toast({ title: 'Success', description: 'Notification deleted.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete notification.', variant: 'destructive' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  
  const handleTabChange = (status: 'all' | 'unread') => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const unreadCount = response?.totalItems ?? 0;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <CardDescription>Manage and review your system alerts and updates.</CardDescription>
          </div>
          <Button onClick={handleMarkAllRead} disabled={filters.status === 'unread' && unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={filters.status} onValueChange={(value) => handleTabChange(value as 'all' | 'unread')}>
            <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger value="unread" className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">Unread {filters.status === 'unread' && `(${unreadCount})`}</TabsTrigger>
                <TabsTrigger value="all" className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">All</TabsTrigger>
            </TabsList>
            <TabsContent value="unread">
                {/* Content is rendered outside based on filters */}
            </TabsContent>
            <TabsContent value="all">
                 {/* Content is rendered outside based on filters */}
            </TabsContent>
          </Tabs>

          <div className="divide-y">
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : response && response.data.length > 0 ? (
                response.data.map(notification => (
                    <NotificationItem 
                        key={notification.id} 
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                    />
                ))
            ) : (
                <div className="p-10 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">You're all caught up!</p>
                    <p className="text-sm text-muted-foreground">There are no notifications to show right now.</p>
                </div>
            )}
          </div>
          
           {response && response.totalPages > 1 && (
            <div className="p-4 border-t">
                <PaginationControls
                    currentPage={response.currentPage}
                    totalPages={response.totalPages}
                    onPageChange={handlePageChange}
                    hasNextPage={response.currentPage < response.totalPages}
                    hasPrevPage={response.currentPage > 1}
                />
            </div>
           )}

        </CardContent>
      </Card>
    </div>
  );
}
