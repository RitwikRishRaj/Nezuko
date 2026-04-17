"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  target_audience: 'all' | 'users' | 'admins';
  created_by: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const AdminAnnouncementPage = () => {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as const,
    priority: 'medium' as const,
    target_audience: 'all' as const,
    expires_at: ''
  });

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch announcements and set up real-time subscription
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching announcements:', error);
          toast.error('Failed to load announcements');
          return;
        }

        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error('Failed to load announcements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Set up real-time subscription
    const channel = supabase
      .channel('announcements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          console.log('Real-time announcement update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => [payload.new as Announcement, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev => prev.map(ann => 
              ann.id === payload.new.id ? payload.new as Announcement : ann
            ));
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(ann => ann.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      target_audience: 'all',
      expires_at: ''
    });
    setShowCreateForm(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        priority: formData.priority,
        target_audience: formData.target_audience,
        created_by: user?.id || 'unknown',
        expires_at: formData.expires_at || null,
        is_active: true
      };

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) {
          console.error('Error updating announcement:', error);
          toast.error('Failed to update announcement');
          return;
        }

        toast.success('Announcement updated successfully!');
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) {
          console.error('Error creating announcement:', error);
          toast.error('Failed to create announcement');
          return;
        }

        toast.success('Announcement created successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error submitting announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : ''
    });
    setEditingAnnouncement(announcement);
    setShowCreateForm(true);
  };

  const handleToggleActive = async (announcementId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', announcementId);

      if (error) {
        console.error('Error toggling announcement status:', error);
        toast.error('Failed to update announcement status');
      } else {
        toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      toast.error('Failed to update announcement status');
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) {
        console.error('Error deleting announcement:', error);
        toast.error('Failed to delete announcement');
      } else {
        toast.success('Announcement deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500/20 bg-blue-500/10';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/10';
      case 'success': return 'border-green-500/20 bg-green-500/10';
      case 'error': return 'border-red-500/20 bg-red-500/10';
      default: return 'border-blue-500/20 bg-blue-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Announcements</h1>
            <p className="text-white/60">Manage platform-wide announcements and notifications</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        </div>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-2">Expires At</label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-2">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content..."
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 font-medium mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-2">Target Audience</label>
                    <select
                      value={formData.target_audience}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="all">All Users</option>
                      <option value="users">Regular Users</option>
                      <option value="admins">Admins Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingAnnouncement ? 'Update' : 'Create'} Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No announcements found</p>
              <p className="text-sm">Create your first announcement to get started</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border rounded-lg ${getTypeColor(announcement.type)} ${
                  !announcement.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(announcement.type)}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {announcement.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className={`px-2 py-1 rounded border ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {announcement.target_audience}
                        </span>
                        {announcement.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.is_active 
                          ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' 
                          : 'text-gray-400 bg-gray-500/10 hover:bg-gray-500/20'
                      }`}
                      title={announcement.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {announcement.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-white/90 mb-4">{announcement.content}</p>

                <div className="text-xs text-white/40">
                  Created: {new Date(announcement.created_at).toLocaleString()}
                  {announcement.updated_at !== announcement.created_at && (
                    <span> • Updated: {new Date(announcement.updated_at).toLocaleString()}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementPage;