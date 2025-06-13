'use client';

export interface AlertNotification {
  id: string;
  type: 'token_created' | 'token_purchased' | 'service_completed' | 'payment_received' | 'token_expired' | 'market_update' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    tokenId?: string;
    amount?: number;
    buyer?: string;
    seller?: string;
    contractAddress?: string;
    chainId?: number;
  };
}

export interface NotificationPreferences {
  enableBrowserNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  notifyOnTokenCreated: boolean;
  notifyOnTokenPurchased: boolean;
  notifyOnServiceCompleted: boolean;
  notifyOnPaymentReceived: boolean;
  notifyOnTokenExpiry: boolean;
  notifyOnMarketUpdates: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
}

export class AlertAgent {
  private notifications: AlertNotification[] = [];
  private preferences: NotificationPreferences;
  private listeners: ((notifications: AlertNotification[]) => void)[] = [];

  constructor() {
    this.preferences = this.loadPreferences();
    this.notifications = this.loadNotifications();
    
    // Only request notification permission on client side
    if (typeof window !== 'undefined') {
      this.requestNotificationPermission();
    }
  }

  // Browser notification permission
  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Load preferences from localStorage
  private loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }
    
    try {
      const stored = localStorage.getItem('timeTokenizer_alertPreferences');
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load alert preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  // Default notification preferences
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enableBrowserNotifications: true,
      enableEmailNotifications: false,
      enableSmsNotifications: false,
      notifyOnTokenCreated: true,
      notifyOnTokenPurchased: true,
      notifyOnServiceCompleted: true,
      notifyOnPaymentReceived: true,
      notifyOnTokenExpiry: true,
      notifyOnMarketUpdates: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem('timeTokenizer_alertPreferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save alert preferences:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotifications(): AlertNotification[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const stored = localStorage.getItem('timeTokenizer_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        // Only keep notifications from last 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return notifications.filter((n: AlertNotification) => n.timestamp > thirtyDaysAgo);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    return [];
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    if (typeof window === 'undefined') {
      this.notifyListeners();
      return;
    }
    
    try {
      localStorage.setItem('timeTokenizer_notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Check if we're in quiet hours
  private isQuietHours(): boolean {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    const start = this.preferences.quietHoursStart;
    const end = this.preferences.quietHoursEnd;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  // Add notification
  addNotification(notification: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: AlertNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only latest 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();

    // Show browser notification if enabled and not in quiet hours
    if (this.shouldShowNotification(notification.type) && !this.isQuietHours()) {
      this.showBrowserNotification(newNotification);
    }
  }

  // Check if notification type should be shown
  private shouldShowNotification(type: AlertNotification['type']): boolean {
    if (!this.preferences.enableBrowserNotifications) return false;
    
    switch (type) {
      case 'token_created': return this.preferences.notifyOnTokenCreated;
      case 'token_purchased': return this.preferences.notifyOnTokenPurchased;
      case 'service_completed': return this.preferences.notifyOnServiceCompleted;
      case 'payment_received': return this.preferences.notifyOnPaymentReceived;
      case 'token_expired': return this.preferences.notifyOnTokenExpiry;
      case 'market_update': return this.preferences.notifyOnMarketUpdates;
      case 'system': return true; // Always show system notifications
      default: return false;
    }
  }

  // Show browser notification
  private async showBrowserNotification(notification: AlertNotification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icons/time-token-icon.png',
      badge: '/icons/time-token-badge.png',
      tag: notification.type,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low'
    });

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }

    // Handle click
    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Get all notifications
  getNotifications(): AlertNotification[] {
    return [...this.notifications];
  }

  // Get unread notifications
  getUnreadNotifications(): AlertNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Update preferences
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Get preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: AlertNotification[]) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Predefined notification creators
  static createTokenCreatedAlert(tokenId: string, serviceName: string, pricePerHour: number): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'token_created',
      title: '🎉 Token Created Successfully',
      message: `Your "${serviceName}" token is now live at $${pricePerHour}/hour`,
      priority: 'medium',
      actionUrl: `/tokens/${tokenId}`,
      actionLabel: 'View Token',
      metadata: { tokenId, amount: pricePerHour }
    };
  }

  static createTokenPurchasedAlert(tokenId: string, serviceName: string, buyer: string, hours: number, amount: number): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'token_purchased',
      title: '💰 Token Purchased!',
      message: `${buyer.slice(0, 6)}... bought ${hours}h of "${serviceName}" for $${amount}`,
      priority: 'high',
      actionUrl: `/tokens/${tokenId}`,
      actionLabel: 'View Details',
      metadata: { tokenId, buyer, amount }
    };
  }

  static createServiceCompletedAlert(tokenId: string, serviceName: string, hours: number): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'service_completed',
      title: '✅ Service Completed',
      message: `${hours}h of "${serviceName}" service has been marked as completed`,
      priority: 'medium',
      actionUrl: `/dashboard/services`,
      actionLabel: 'View Services',
      metadata: { tokenId }
    };
  }

  static createPaymentReceivedAlert(amount: number, serviceName: string): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'payment_received',
      title: '💳 Payment Received',
      message: `Received $${amount} payment for "${serviceName}"`,
      priority: 'high',
      actionUrl: '/dashboard/earnings',
      actionLabel: 'View Earnings',
      metadata: { amount }
    };
  }

  static createTokenExpiryAlert(tokenId: string, serviceName: string, daysLeft: number): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'token_expired',
      title: daysLeft > 0 ? '⏰ Token Expiring Soon' : '🔴 Token Expired',
      message: daysLeft > 0 
        ? `"${serviceName}" token expires in ${daysLeft} days`
        : `"${serviceName}" token has expired`,
      priority: daysLeft > 0 ? 'medium' : 'high',
      actionUrl: `/tokens/${tokenId}`,
      actionLabel: 'Manage Token',
      metadata: { tokenId }
    };
  }

  static createMarketUpdateAlert(title: string, message: string): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'market_update',
      title: `📊 ${title}`,
      message,
      priority: 'low',
      actionUrl: '/marketplace',
      actionLabel: 'View Marketplace'
    };
  }

  static createSystemAlert(title: string, message: string, priority: AlertNotification['priority'] = 'medium'): Omit<AlertNotification, 'id' | 'timestamp' | 'read'> {
    return {
      type: 'system',
      title: `🔧 ${title}`,
      message,
      priority
    };
  }
}

// Global alert agent instance
let alertAgentInstance: AlertAgent | null = null;

export const getAlertAgent = (): AlertAgent => {
  if (!alertAgentInstance) {
    alertAgentInstance = new AlertAgent();
  }
  return alertAgentInstance;
};

export default AlertAgent;