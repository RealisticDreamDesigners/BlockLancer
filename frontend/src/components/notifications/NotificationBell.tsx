'use client';

import React, { useState } from 'react';
import { Bell, X, Check, AlertCircle, Info, FileText, Vote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Notification types
 */
export enum NotificationType {
  DISPUTE_OPENED = 'dispute-opened',
  EVIDENCE_SUBMITTED = 'evidence-submitted',
  DISPUTE_RESOLVED = 'dispute-resolved',
  PROPOSAL_CREATED = 'proposal-created',
  VOTE_CAST = 'vote-cast',
  PROPOSAL_FINALIZED = 'proposal-finalized',
  INFO = 'info',
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface NotificationBellProps {
  /**
   * Array of notifications
   */
  notifications?: Notification[];
  /**
   * Callback when notification is clicked
   */
  onNotificationClick?: (notification: Notification) => void;
  /**
   * Callback when notification is marked as read
   */
  onMarkAsRead?: (notificationId: string) => void;
  /**
   * Callback when all notifications are cleared
   */
  onClearAll?: () => void;
}

/**
 * NotificationBell Component
 *
 * Displays notification bell icon with badge for unread count.
 * Opens dropdown panel showing recent notifications.
 */
export function NotificationBell({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onClearAll,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DISPUTE_OPENED:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case NotificationType.EVIDENCE_SUBMITTED:
        return <FileText className="h-4 w-4 text-blue-600" />;
      case NotificationType.DISPUTE_RESOLVED:
        return <Check className="h-4 w-4 text-green-600" />;
      case NotificationType.PROPOSAL_CREATED:
        return <FileText className="h-4 w-4 text-purple-600" />;
      case NotificationType.VOTE_CAST:
        return <Vote className="h-4 w-4 text-blue-600" />;
      case NotificationType.PROPOSAL_FINALIZED:
        return <Check className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[32rem] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && onClearAll && (
                  <button
                    onClick={onClearAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : '-'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : '-'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
