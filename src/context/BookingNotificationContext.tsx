'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getSocket,
  onNewBooking,
  onBookingStatusUpdate,
  offNewBooking,
  offBookingStatusUpdate
} from '@/lib/socket-client';

interface BookingNotification {
  id: string;
  type: 'new_booking' | 'status_update';
  bookingId: string;
  homestayId: string;
  homestayName: string;
  guestName: string;
  message: string;
  timestamp: string;
  read: boolean;
  data: any;
}

interface BookingNotificationContextType {
  notifications: BookingNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  isConnected: boolean;
}

const BookingNotificationContext = createContext<BookingNotificationContextType | undefined>(undefined);

export const useBookingNotifications = () => {
  const context = useContext(BookingNotificationContext);
  if (context === undefined) {
    throw new Error('useBookingNotifications must be used within a BookingNotificationProvider');
  }
  return context;
};

interface BookingNotificationProviderProps {
  children: React.ReactNode;
  userId?: string;
  userType?: 'homestay' | 'clerk';
}

export const BookingNotificationProvider: React.FC<BookingNotificationProviderProps> = ({
  children,
  userId,
  userType = 'homestay'
}) => {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('booking_notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('booking_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification: BookingNotification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      // Add new notification at the beginning
      const updated = [notification, ...prev];
      
      // Keep only the last 50 notifications
      return updated.slice(0, 50);
    });
  }, []);

  const handleNewBooking = useCallback((data: any) => {
    console.log('📋 BookingNotificationContext - Received new booking notification:', data);

    const notification: BookingNotification = {
      id: `booking_${data.bookingId}_${Date.now()}`,
      type: 'new_booking',
      bookingId: data.bookingId,
      homestayId: data.homestayId,
      homestayName: data.homestayName,
      guestName: data.guestName,
      message: `New booking request from ${data.guestName} for ${data.numberOfGuests} guest${data.numberOfGuests !== 1 ? 's' : ''}`,
      timestamp: data.timestamp,
      read: false,
      data
    };

    console.log('📋 BookingNotificationContext - Adding notification:', notification);
    addNotification(notification);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('New Booking Request', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }, [addNotification]);

  const handleBookingStatusUpdate = useCallback((data: any) => {
    console.log('📋 Received booking status update:', data);
    
    const notification: BookingNotification = {
      id: `status_${data.bookingId}_${Date.now()}`,
      type: 'status_update',
      bookingId: data.bookingId,
      homestayId: data.homestayId,
      homestayName: '', // Will be filled from existing data if needed
      guestName: '', // Will be filled from existing data if needed
      message: `Booking ${data.bookingId} status changed to ${data.newStatus}`,
      timestamp: data.timestamp,
      read: false,
      data
    };

    addNotification(notification);
  }, [addNotification]);

  // Socket connection management
  useEffect(() => {
    if (!userId) {
      console.log('📋 No userId provided, skipping booking notification setup');
      return;
    }

    console.log('📋 Setting up booking notifications for user:', userId, 'type:', userType);

    // Check if socket is connected (should be connected via ChatContext)
    const socket = getSocket();
    if (socket?.connected) {
      console.log('📋 BookingNotificationContext - Using existing socket connection');
      setIsConnected(true);
    } else {
      console.log('📋 BookingNotificationContext - Socket not connected, waiting for ChatContext');
      setIsConnected(false);
    }

    // Set up event listeners regardless of connection status
    // The socket client functions will handle the case when socket is not ready
    console.log('📋 BookingNotificationContext - Setting up event listeners...');
    onNewBooking(handleNewBooking);
    onBookingStatusUpdate(handleBookingStatusUpdate);

    // Request notification permission
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📋 Notification permission:', permission);
      });
    }

    // Monitor socket connection status
    const checkConnection = () => {
      const currentSocket = getSocket();
      setIsConnected(currentSocket?.connected || false);
    };

    const interval = setInterval(checkConnection, 2000); // Check every 2 seconds

    return () => {
      console.log('📋 Cleaning up booking notification listeners');
      offNewBooking(handleNewBooking);
      offBookingStatusUpdate(handleBookingStatusUpdate);
      clearInterval(interval);
    };
  }, [userId, userType, handleNewBooking, handleBookingStatusUpdate]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: BookingNotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected
  };

  return (
    <BookingNotificationContext.Provider value={value}>
      {children}
    </BookingNotificationContext.Provider>
  );
};
