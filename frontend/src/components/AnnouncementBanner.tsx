"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  target_audience: 'all' | 'users' | 'admins';
  expires_at: string | null;
  created_at: string;
}

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  // Initialize Supabase client outside of useEffect
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load dismissed announcements from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      try {
        setDismissedAnnouncements(new Set(JSON.parse(dismissed)));
      } catch (error) {
        console.error('Error parsing dismissed announcements:', error);
      }
    }
  }, []);

  // Fetch announcements and set up real-time subscription
  useEffect(() => {

    const fetchAnnouncements = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .in('target_audience', ['all', 'users'])
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching announcements:', error);
          return;
        }

        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();

    // Set up real-time subscription
    const channel = supabase
      .channel('user_announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAnnouncement = payload.new as Announcement;
            if (newAnnouncement.is_active && 
                ['all', 'users'].includes(newAnnouncement.target_audience) &&
                (!newAnnouncement.expires_at || new Date(newAnnouncement.expires_at) > new Date())) {
              setAnnouncements(prev => [newAnnouncement, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAnnouncement = payload.new as Announcement;
            if (updatedAnnouncement.is_active && 
                ['all', 'users'].includes(updatedAnnouncement.target_audience) &&
                (!updatedAnnouncement.expires_at || new Date(updatedAnnouncement.expires_at) > new Date())) {
              setAnnouncements(prev => prev.map(ann => 
                ann.id === updatedAnnouncement.id ? updatedAnnouncement : ann
              ));
            } else {
              setAnnouncements(prev => prev.filter(ann => ann.id !== updatedAnnouncement.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(ann => ann.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array since supabase client is stable

  const handleDismiss = (announcementId: string) => {
    const newDismissed = new Set(dismissedAnnouncements);
    newDismissed.add(announcementId);
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...newDismissed]));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-200';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-200';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-200';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-200';
    }
  };

  // Filter out dismissed announcements and sort by priority
  const visibleAnnouncements = announcements
    .filter(ann => !dismissedAnnouncements.has(ann.id))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-sm">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`flex items-start gap-3 p-4 border rounded-lg backdrop-blur-sm shadow-lg ${getColors(announcement.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(announcement.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">
                {announcement.title}
              </h4>
              <p className="text-sm opacity-90">
                {announcement.content}
              </p>
              {announcement.expires_at && (
                <p className="text-xs opacity-70 mt-1">
                  Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <button
              onClick={() => handleDismiss(announcement.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;