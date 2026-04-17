"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  Megaphone, 
  Clock, 
  CheckCircle, 
  Circle, 
  Trash2, 
  Filter,
  RefreshCw,
  AlertCircle,
  Trophy,
  Users,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationSkeleton } from '@/components/ui/notification-skeleton';

interface Notification {
  id: string;
  type: 'announcement' | 'event' | 'reminder' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  eventDate?: string;
  actionUrl?: string;
}

type FilterType = 'all' | 'announcement' | 'event' | 'reminder' | 'achievement';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual API calls
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'announcement',
      title: 'New Contest Format Available',
      message: 'We\'ve added a new ICPC-style contest format. Try it out in your next room!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'event',
      title: 'Weekly Contest #47',
      message: 'Join our weekly contest this Saturday. Registration opens 1 hour before start.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      read: false,
      priority: 'medium',
      eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      actionUrl: '/dashboard/arena-choose'
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Rating Milestone Reached!',
      message: 'Congratulations! You\'ve reached 1500 rating points.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      read: true,
      priority: 'medium'
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Contest Starting Soon',
      message: 'Your registered contest "Algorithm Masters" starts in 30 minutes.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      read: false,
      priority: 'high',
      eventDate: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
    },
    {
      id: '5',
      type: 'announcement',
      title: 'Maintenance Scheduled',
      message: 'Platform maintenance is scheduled for Sunday 2:00 AM - 4:00 AM UTC. Some features may be unavailable.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      read: true,
      priority: 'low',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadNotifications = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(mockNotifications);
      setLoading(false);
    };

    loadNotifications();
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      case 'achievement':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') return 'text-red-400';
    
    switch (type) {
      case 'announcement':
        return 'text-blue-400';
      case 'event':
        return 'text-green-400';
      case 'reminder':
        return 'text-yellow-400';
      case 'achievement':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatEventDate = (eventDate: string) => {
    const date = new Date(eventDate);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Starting soon';
    if (diffInHours < 24) return `In ${diffInHours}h`;
    return `In ${Math.floor(diffInHours / 24)}d`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notification deleted');
  };

  const refreshNotifications = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(mockNotifications);
    setLoading(false);
    toast.success('Notifications refreshed');
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter !== 'all' && notif.type !== filter) return false;
    if (showUnreadOnly && notif.read) return false;
    if (searchQuery && !notif.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notif.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterButtons = [
    { key: 'all' as FilterType, label: 'All', icon: Bell },
    { key: 'announcement' as FilterType, label: 'Announcements', icon: Megaphone },
    { key: 'event' as FilterType, label: 'Events', icon: Calendar },
    { key: 'reminder' as FilterType, label: 'Reminders', icon: Clock },
    { key: 'achievement' as FilterType, label: 'Achievements', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-white/60">Stay updated with announcements and events</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshNotifications}
              disabled={loading}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {filterButtons.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                  />
                  Show unread only
                </label>
                
                <div className="text-sm text-white/50">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <NotificationSkeleton />
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Bell className="w-16 h-16 text-white/20 mb-4" />
              <div className="text-white/60 text-center">
                <div className="text-lg mb-2">No notifications found</div>
                <div className="text-sm text-white/40">
                  {showUnreadOnly ? 'All caught up! No unread notifications.' : 'You\'ll see announcements and events here.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-200 ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg bg-white/5 ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold">{notification.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-white/50 text-sm whitespace-nowrap">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-white/70 mb-3">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {notification.eventDate && (
                              <div className="flex items-center gap-2 text-sm text-green-400">
                                <Calendar className="w-4 h-4" />
                                {formatEventDate(notification.eventDate)}
                              </div>
                            )}
                            
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                View Details →
                              </a>
                            )}
                          </div>

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                              <Circle className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationsPage;