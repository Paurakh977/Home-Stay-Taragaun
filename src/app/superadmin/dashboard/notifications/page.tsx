'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Bell, Check, Eye, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  homestayId: string;
  homeStayName: string;
  adminUsername: string;
  lastUpdated: string;
  message: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  
  // Fetch notifications on load
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/superadmin/notifications');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectNotification = (homestayId: string) => {
    setSelectedNotifications(prev => {
      // If already selected, remove it
      if (prev.includes(homestayId)) {
        return prev.filter(id => id !== homestayId);
      }
      // Otherwise add it
      return [...prev, homestayId];
    });
  };
  
  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      // If all are selected, deselect all
      setSelectedNotifications([]);
    } else {
      // Otherwise select all
      setSelectedNotifications(notifications.map(n => n.homestayId));
    }
  };
  
  const markAsRead = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select at least one notification');
      return;
    }
    
    setMarkingAsRead(true);
    
    try {
      const response = await fetch('/api/superadmin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homestayIds: selectedNotifications,
          reviewerUsername: 'superadmin' // Should be the actual superadmin username
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast.success(`${selectedNotifications.length} notifications marked as reviewed`);
      
      // Remove marked notifications from the list
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.homestayId)));
      
      // Clear selected notifications
      setSelectedNotifications([]);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    } finally {
      setMarkingAsRead(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        formatted: format(date, 'MMM d, yyyy h:mm a'),
        relative: formatDistanceToNow(date, { addSuffix: true })
      };
    } catch (error) {
      return {
        formatted: 'Invalid date',
        relative: 'Unknown time'
      };
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Custom field updates that need your review
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            size="sm" 
            onClick={markAsRead} 
            disabled={selectedNotifications.length === 0 || markingAsRead}
          >
            {markingAsRead ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Mark as Reviewed
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                <span>Custom Field Updates</span>
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {notifications.length}
                  </Badge>
                )}
              </div>
            </CardTitle>
            
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={selectAllNotifications}>
                {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          <CardDescription>
            Homestays have updated their custom field information that needs review.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">{error}</p>
              <Button onClick={fetchNotifications}>Try Again</Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No notifications to display. All custom field updates have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const isSelected = selectedNotifications.includes(notification.homestayId);
                const dates = formatDate(notification.lastUpdated);
                
                return (
                  <div 
                    key={notification.homestayId} 
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                      isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10 bg-primary/10">
                        <AvatarFallback className="text-primary">
                          {notification.homeStayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{notification.homeStayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {dates.relative}
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        Updated custom field information. Admin: {notification.adminUsername}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          asChild
                        >
                          <Link href={`/superadmin/dashboard/custom-fields?homestayId=${notification.homestayId}`}>
                            <Eye className="h-3 w-3 mr-1" /> View Values
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          asChild
                        >
                          <Link href={`/admin/homestays/${notification.homestayId}?username=${notification.adminUsername}`}>
                            <ExternalLink className="h-3 w-3 mr-1" /> View Homestay
                          </Link>
                        </Button>
                        
                        <div className="ml-auto">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleSelectNotification(notification.homestayId)}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 