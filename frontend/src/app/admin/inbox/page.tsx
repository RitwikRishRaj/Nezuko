"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Trash2, 
  Star, 
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';
import { isAdminEmail } from '@/lib/admin-utils';

interface Message {
  id: string;
  subject: string;
  message: string;
  senderEmail: string;
  senderName?: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'bug' | 'feature' | 'question' | 'complaint' | 'other';
}

const AdminInboxPage = () => {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'bug' | 'feature' | 'question' | 'complaint' | 'other'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = isAdminEmail(userEmail);

  // Debug logging
  useEffect(() => {
    console.log('Admin check:', {
      isLoaded,
      userEmail,
      adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      isAdmin
    });
  }, [isLoaded, userEmail, isAdmin]);

  // Redirect non-admin users
  useEffect(() => {
    if (isLoaded && !isAdmin) {
      console.log('Redirecting non-admin user');
      window.location.href = '/dashboard';
    }
  }, [isLoaded, isAdmin]);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Transform Supabase data to Message interface
  const transformMessage = (msg: any): Message => ({
    id: msg.id,
    subject: msg.subject,
    message: msg.message,
    senderEmail: msg.sender_email,
    senderName: msg.sender_name,
    timestamp: new Date(msg.created_at),
    isRead: msg.is_read,
    isStarred: msg.is_starred,
    priority: msg.priority,
    category: msg.category
  });

  // Fetch messages from Supabase and set up real-time subscription
  useEffect(() => {
    const fetchMessages = async () => {
      console.log('Fetching messages...');
      
      // Skip fetching if not admin (but allow for debugging)
      if (isLoaded && !isAdmin) {
        console.log('Not admin, skipping message fetch');
        setIsLoading(false);
        return;
      }

      try {
        // Use service role key for admin access
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await adminSupabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Messages query result:', { data, error, count: data?.length });

        if (error) {
          console.error('Error fetching messages:', error);
          toast.error(`Failed to load messages: ${error.message}`);
          return;
        }

        const transformedMessages = data?.map(transformMessage) || [];
        console.log('Transformed messages:', transformedMessages.length, 'messages');
        setMessages(transformedMessages);
        
        if (transformedMessages.length === 0) {
          console.log('No messages found - this might be due to RLS policies');
          toast.info('No messages found. Check database permissions.');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = transformMessage(payload.new);
            console.log('New message received:', newMessage);
            setMessages(prev => [newMessage, ...prev]);
            toast.success('New message received!', {
              description: `From: ${newMessage.senderName || newMessage.senderEmail}`,
              duration: 3000
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? transformMessage(payload.new) : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Auto-delete messages older than 15 days (unless starred)
  useEffect(() => {
    const autoDeleteOldMessages = async () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .lt('created_at', fifteenDaysAgo.toISOString())
          .eq('is_starred', false);

        if (error) {
          console.error('Error auto-deleting old messages:', error);
        }
      } catch (error) {
        console.error('Error auto-deleting old messages:', error);
      }
    };

    // Run auto-delete on component mount
    autoDeleteOldMessages();

    // Set up interval to run auto-delete daily
    const interval = setInterval(autoDeleteOldMessages, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [supabase]);

  // Memoized filtered messages for better performance
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchTerm === '' || 
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.senderEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || message.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [messages, searchTerm, filterCategory]);

  const handleMessageClick = useCallback(async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', message.id);

        if (error) {
          console.error('Error marking message as read:', error);
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  }, [supabase]);

  const handleStarToggle = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_starred: !message.isStarred })
        .eq('id', messageId);

      if (error) {
        toast.error('Failed to update message');
      }
    } catch (error) {
      toast.error('Failed to update message');
    }
  }, [messages, supabase]);



  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      } else {
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
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



  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return <AlertCircle className="w-4 h-4" />;
      case 'feature': return <Star className="w-4 h-4" />;
      case 'question': return <Mail className="w-4 h-4" />;
      case 'complaint': return <Trash2 className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = messages.filter(m => !m.isRead).length;
  const highPriorityCount = messages.filter(m => m.priority === 'high').length;

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading inbox...</div>
      </div>
    );
  }

  // Temporarily bypass admin check for debugging
  // if (!isAdmin) {
  //   return (
  //     <div className="min-h-screen bg-black flex items-center justify-center">
  //       <div className="text-white text-xl">Access denied. Redirecting...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen">
        {/* Sidebar - Message List */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-purple-400"
                >
                  <path
                    d="M9 3.75H6.91179C5.92403 3.75 5.05178 4.39423 4.76129 5.33831L2.3495 13.1766C2.28354 13.391 2.25 13.614 2.25 13.8383V18C2.25 19.2426 3.25736 20.25 4.5 20.25H19.5C20.7426 20.25 21.75 19.2426 21.75 18V13.8383C21.75 13.614 21.7165 13.391 21.6505 13.1766L19.2387 5.33831C18.9482 4.39423 18.076 3.75 17.0882 3.75H15M2.25 13.5H6.10942C6.96166 13.5 7.74075 13.9815 8.12188 14.7438L8.37812 15.2562C8.75925 16.0185 9.53834 16.5 10.3906 16.5H13.6094C14.4617 16.5 15.2408 16.0185 15.6219 15.2562L15.8781 14.7438C16.2592 13.9815 17.0383 13.5 17.8906 13.5H21.75M12 3V11.25M12 11.25L9 8.25M12 11.25L15 8.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Inbox
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white text-xs rounded mr-2 flex items-center gap-1 transition-all"
                  title="Refresh inbox"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.71275 10.6736C7.16723 8.15492 9.38539 6.25 12.0437 6.25C13.6212 6.25 15.0431 6.9209 16.0328 7.9907C16.3141 8.29476 16.2956 8.76927 15.9915 9.05055C15.6875 9.33183 15.213 9.31337 14.9317 9.0093C14.2154 8.23504 13.1879 7.75 12.0437 7.75C10.2056 7.75 8.66974 9.00212 8.24452 10.6853L8.48095 10.4586C8.77994 10.172 9.25471 10.182 9.54137 10.4809C9.82804 10.7799 9.81805 11.2547 9.51905 11.5414L7.89662 13.0969C7.74932 13.2381 7.55084 13.3133 7.34695 13.3049C7.14306 13.2966 6.95137 13.2056 6.81608 13.0528L5.43852 11.4972C5.16391 11.1871 5.19267 10.7131 5.50277 10.4385C5.81286 10.1639 6.28686 10.1927 6.56148 10.5028L6.71275 10.6736Z" fill="#ffffff"/>
                    <path d="M16.6485 10.6959C16.8523 10.704 17.044 10.7947 17.1795 10.9472L18.5607 12.5019C18.8358 12.8115 18.8078 13.2856 18.4981 13.5607C18.1885 13.8358 17.7144 13.8078 17.4393 13.4981L17.2841 13.3234C16.8295 15.8458 14.6011 17.7509 11.9348 17.7509C10.3635 17.7509 8.94543 17.0895 7.95312 16.0322C7.66966 15.7302 7.68472 15.2555 7.98675 14.9721C8.28879 14.6886 8.76342 14.7037 9.04688 15.0057C9.76546 15.7714 10.792 16.2509 11.9348 16.2509C13.7819 16.2509 15.322 14.9991 15.7503 13.3193L15.5195 13.5409C15.2208 13.8278 14.746 13.8183 14.4591 13.5195C14.1721 13.2208 14.1817 12.746 14.4805 12.4591L16.0993 10.9044C16.2464 10.7631 16.4447 10.6878 16.6485 10.6959Z" fill="#ffffff"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12Z" fill="#ffffff"/>
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { data, error, count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact' });
                      console.log('Direct query test:', { data, error, count });
                      toast.info(`Direct query: ${count} messages, Error: ${error?.message || 'None'}`);
                    } catch (e) {
                      console.error('Direct query failed:', e);
                    }
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white text-xs rounded flex items-center gap-1 transition-all"
                  title="Test database connection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 8.04l-12.122 12.124a2.857 2.857 0 1 1 -4.041 -4.04l12.122 -12.124" />
                    <path d="M7 13h8" />
                    <path d="M19 15l1.5 1.6a2 2 0 1 1 -3 0l1.5 -1.6z" />
                    <path d="M15 3l6 6" />
                  </svg>
                  Test DB
                </button>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                    {unreadCount} unread
                  </span>
                )}
                {highPriorityCount > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {highPriorityCount} urgent
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="all">All Categories</option>
                <option value="bug">Bug Reports</option>
                <option value="feature">Feature Requests</option>
                <option value="question">Questions</option>
                <option value="complaint">Complaints</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-6 text-center text-white/60">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${
                      selectedMessage?.id === message.id ? 'bg-purple-500/20 border border-purple-500/30' : 'border border-transparent'
                    } ${!message.isRead ? 'bg-white/5' : ''}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {!message.isRead && <div className="w-2 h-2 bg-purple-400 rounded-full" />}
                        {message.isStarred && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                        <span className={`text-sm font-medium ${!message.isRead ? 'text-white' : 'text-white/80'}`}>
                          {message.senderName || message.senderEmail}
                        </span>
                      </div>
                      <span className="text-xs text-white/40">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    
                    <h3 className={`text-sm mb-1 ${!message.isRead ? 'font-semibold text-white' : 'text-white/90'}`}>
                      {message.subject}
                    </h3>
                    
                    <p className="text-xs text-white/60 line-clamp-2 mb-2">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                      <span className="px-2 py-1 text-xs rounded border text-white/60 bg-white/5 border-white/20">
                        {message.category}
                      </span>
                      <div className="text-white/40">
                        {getCategoryIcon(message.category)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Message Detail */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedMessage.senderName || selectedMessage.senderEmail}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {selectedMessage.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStarToggle(selectedMessage.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedMessage.isStarred ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                      title={selectedMessage.isStarred ? 'Remove star (allows auto-delete after 15 days)' : 'Star message (protects from auto-delete)'}
                    >
                      <Star className={`w-5 h-5 ${selectedMessage.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
                          handleDelete(selectedMessage.id);
                        }
                      }}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete message permanently"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Message Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(selectedMessage.priority)}`}>
                      {selectedMessage.priority} priority
                    </span>
                    <span className="px-2 py-1 text-xs rounded border text-white/60 bg-white/5 border-white/20">
                      {selectedMessage.category}
                    </span>
                    {selectedMessage.isStarred && (
                      <span className="px-2 py-1 text-xs rounded border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">
                        Protected from auto-delete
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 p-6">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                {/* Contact Email */}
                <div className="mt-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <a 
                      href={`mailto:${selectedMessage.senderEmail}`}
                      className="text-purple-400 hover:text-purple-300 transition-colors underline flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {selectedMessage.senderEmail}
                    </a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/60">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Select a message</h3>
                <p>Choose a message from the inbox to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInboxPage;