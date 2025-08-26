'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Filter, RefreshCw, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandedDashboardHeader from '@/components/dashboard/BrandedDashboardHeader';
import BookingList from '@/components/booking/BookingList';
import AvailabilityToggle from '@/components/booking/AvailabilityToggle';
import type { Booking, BookingStats, BookingFilters } from '@/types/booking';

interface BookingDashboardProps {
  adminUsername?: string;
}

export default function BookingDashboard({ adminUsername }: BookingDashboardProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all'
  });

  // Load user data from localStorage
  useEffect(() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } else {
        router.push(adminUsername ? `/${adminUsername}/login` : '/login');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      router.push(adminUsername ? `/${adminUsername}/login` : '/login');
    }
  }, [router, adminUsername]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchStats();
    }
  }, [user, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use the homestayId from user data
      // In production, you'd get this from the authenticated homestay user
      const homestayId = user?.homestayId || 'demo-homestay';
      
      const params = new URLSearchParams({
        homestayId,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom.toString() }),
        ...(filters.dateTo && { dateTo: filters.dateTo.toString() })
      });

      const response = await fetch(`/api/bookings?${params}`);
      const result = await response.json();

      if (result.success) {
        setBookings(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('An error occurred while fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const homestayId = user?.homestayId || 'demo-homestay';
      const response = await fetch(`/api/bookings/stats?homestayId=${homestayId}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string, response?: any) => {
    try {
      const updateResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          homestayResponse: response
        }),
      });

      const result = await updateResponse.json();

      if (result.success) {
        // Refresh bookings and stats
        await fetchBookings();
        await fetchStats();
      } else {
        alert(result.message || 'Failed to update booking');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('An error occurred while updating the booking');
    }
  };

  const handleFilterChange = (key: keyof BookingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div>
      {/* Branded Header */}
      <BrandedDashboardHeader adminUsername={adminUsername} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600">Manage your homestay bookings and availability</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Stay</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageStayDuration}</p>
                  <p className="text-xs text-gray-500">nights</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[200px]">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bookings</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={fetchBookings}
                  disabled={loading}
                  className="flex items-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Requests</CardTitle>
              <CardDescription>
                Manage incoming booking requests and communicate with guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <BookingList
                bookings={bookings}
                loading={loading}
                onStatusUpdate={handleStatusUpdate}
                onRefresh={fetchBookings}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <AvailabilityToggle
            homestayId={user?.homestayId || 'demo-homestay'}
            onAvailabilityChange={(availability) => {
              console.log('Availability updated:', availability);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
