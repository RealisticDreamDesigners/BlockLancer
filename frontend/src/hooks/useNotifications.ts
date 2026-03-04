/**
 * useNotifications Hook
 *
 * Manages in-app notifications for dispute and DAO events.
 * Stores notifications in local storage and provides real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Notification as AppNotification } from '@/components/notifications/NotificationBell';
import { NotificationType } from '@/components/notifications/NotificationBell';

const NOTIFICATIONS_KEY = 'blocklancer_notifications';
const MAX_NOTIFICATIONS = 50;

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearNotification: (notificationId: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const withDates = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(withDates);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add new notification
  const addNotification = useCallback((
    notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
  ) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the most recent MAX_NOTIFICATIONS
      return updated.slice(0, MAX_NOTIFICATIONS);
    });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: newNotification.id,
      });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear single notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearNotification,
  };
}

/**
 * Request browser notification permission
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Helper to create dispute-related notifications
 */
export function createDisputeNotification(
  type: NotificationType,
  disputeId: number,
  message: string
): Omit<AppNotification, 'id' | 'createdAt' | 'read'> {
  const titles: Record<NotificationType, string> = {
    [NotificationType.DISPUTE_OPENED]: 'Dispute Opened',
    [NotificationType.EVIDENCE_SUBMITTED]: 'Evidence Submitted',
    [NotificationType.DISPUTE_RESOLVED]: 'Dispute Resolved',
    [NotificationType.PROPOSAL_CREATED]: 'Proposal Created',
    [NotificationType.VOTE_CAST]: 'Vote Cast',
    [NotificationType.PROPOSAL_FINALIZED]: 'Proposal Finalized',
    [NotificationType.INFO]: 'Info',
  };

  return {
    type,
    title: titles[type],
    message,
    link: `/disputes/${disputeId}`,
    metadata: { disputeId },
  };
}

/**
 * Helper to create proposal-related notifications
 */
export function createProposalNotification(
  type: NotificationType,
  proposalId: number,
  message: string
): Omit<AppNotification, 'id' | 'createdAt' | 'read'> {
  const titles: Record<NotificationType, string> = {
    [NotificationType.DISPUTE_OPENED]: 'Dispute Opened',
    [NotificationType.EVIDENCE_SUBMITTED]: 'Evidence Submitted',
    [NotificationType.DISPUTE_RESOLVED]: 'Dispute Resolved',
    [NotificationType.PROPOSAL_CREATED]: 'Proposal Created',
    [NotificationType.VOTE_CAST]: 'Vote Cast',
    [NotificationType.PROPOSAL_FINALIZED]: 'Proposal Finalized',
    [NotificationType.INFO]: 'Info',
  };

  return {
    type,
    title: titles[type],
    message,
    link: `/dao/proposals/${proposalId}`,
    metadata: { proposalId },
  };
}

export default useNotifications;
