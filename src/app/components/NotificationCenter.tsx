'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertNotification, getAlertAgent } from '../services/alertAgent';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertAgent = getAlertAgent();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Load initial notifications
    setNotifications(alertAgent.getNotifications());

    // Subscribe to updates
    const unsubscribe = alertAgent.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alertAgent.getUnreadCount();
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = (notification: AlertNotification) => {
    if (!notification.read) {
      alertAgent.markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllRead = () => {
    alertAgent.markAllAsRead();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      alertAgent.clearAllNotifications();
    }
  };

  const getNotificationIcon = (type: AlertNotification['type']) => {
    switch (type) {
      case 'token_created': return '🎉';
      case 'token_purchased': return '💰';
      case 'service_completed': return '✅';
      case 'payment_received': return '💳';
      case 'token_expired': return '⏰';
      case 'market_update': return '📊';
      case 'system': return '🔧';
      default: return '📬';
    }
  };

  const getPriorityColor = (priority: AlertNotification['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-orange-500 bg-orange-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-green-500 bg-green-500/5';
      default: return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-all"
      >
        <div className="text-xl">🔔</div>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-96 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">Notifications</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                    className="text-white/70 hover:text-white text-sm"
                  >
                    {filter === 'all' ? 'Show Unread' : 'Show All'}
                  </button>
                </div>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition-all"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-3 py-1 rounded-lg transition-all"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <div className="text-white/70 text-sm">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        p-3 rounded-xl mb-2 border-l-4 cursor-pointer transition-all hover:bg-white/10
                        ${getPriorityColor(notification.priority)}
                        ${!notification.read ? 'bg-white/5' : 'opacity-75'}
                      `}
                    >
                      <div className="flex gap-3">
                        <div className="text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-white/70'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                            )}
                          </div>
                          <p className="text-white/60 text-xs mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-white/50 text-xs">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.actionLabel && (
                              <span className="text-blue-400 text-xs hover:text-blue-300">
                                {notification.actionLabel} →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}