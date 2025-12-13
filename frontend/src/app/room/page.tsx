"use client"

import React, { useState, useMemo, useEffect } from "react"
import { UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { HoverButton } from "@/components/ui/hover-button"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@supabase/supabase-js'
import AnimatedNumberCounter from "@/components/count-down-numbers"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import GlassRadioGroup from "@/components/glass-radio-group"
import { TagSelector } from "@/components/ui/tagSelector"
import ToggleSwitch from "@/components/toggle-switch"
import RatingRangeSlider from "@/components/RatingRangeSlider"
import LinkEditor from "@/components/link-editor"
import AnimatedNumberCountdown from "@/components/countdown-number"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { useApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

type CompetitionType = 'icpc' | 'ioi' | 'long';

// Algorithm and data structure tags
interface Tag {
  id: string
  name: string
}
const AVAILABLE_TAGS: Tag[] = [
  { id: "1", name: "implementation" },
  { id: "2", name: "brute force" },
  { id: "3", name: "sortings" },
  { id: "4", name: "two pointers" },
  { id: "5", name: "binary search" },
  { id: "6", name: "math" },
  { id: "7", name: "greedy" },
  { id: "8", name: "strings" },
  { id: "9", name: "data structures" },
  { id: "10", name: "graphs" },
  { id: "11", name: "dfs and similar" },
  { id: "12", name: "trees" },
  { id: "13", name: "constructive algorithms" },
  { id: "14", name: "bitmasks" },
  { id: "15", name: "hashing" },
  { id: "16", name: "combinatorics" },
  { id: "17", name: "number theory" },
  { id: "18", name: "dp" },
  { id: "19", name: "shortest paths" },
  { id: "20", name: "divide and conquer" },
  { id: "21", name: "ternary search" },
  { id: "22", name: "dsu" },
  { id: "23", name: "geometry" },
  { id: "24", name: "interactive" },
  { id: "25", name: "matrices" },
  { id: "26", name: "probabilities" },
  { id: "27", name: "schedules" },
  { id: "28", name: "expression parsing" },
  { id: "29", name: "meet-in-the-middle" },
  { id: "30", name: "games" },
  { id: "31", name: "flows" },
  { id: "32", name: "graph matchings" },
  { id: "33", name: "string suffix structures" },
  { id: "34", name: "fft" },
  { id: "35", name: "chinese remainder theorem" },
  { id: "36", name: "2-sat" },
]


export default function RoomPage() {
  const { user } = useUser();
  const apiClient = useApiClient();
  const searchParams = useSearchParams();
  
  // Get or generate room ID
  const [roomId] = useState(() => {
    const urlRoomId = searchParams.get('id');
    return urlRoomId || Math.random().toString(36).substring(7);
  });
  
  // Get room mode (1v1 or team-vs-team)
  const [roomMode, setRoomMode] = useState(() => {
    return searchParams.get('mode') || 'team-vs-team';
  });
  
  // Track if current user created this room (stored in sessionStorage)
  const [isRoomCreatorBySession, setIsRoomCreatorBySession] = useState(false);
  
  useEffect(() => {
    // Only run on client side
    const urlRoomId = searchParams.get('id');
    if (!urlRoomId) {
      // New room being created, current user is creator
      sessionStorage.setItem(`room_creator_${roomId}`, 'true');
      setIsRoomCreatorBySession(true);
    } else {
      // Check if this user created this room
      const isCreator = sessionStorage.getItem(`room_creator_${urlRoomId}`) === 'true';
      setIsRoomCreatorBySession(isCreator);
    }
  }, [roomId, searchParams]);
  
  const [minutes, setMinutes] = useState(1); // Time in minutes
  const [competitionType, setCompetitionType] = useState<CompetitionType>('icpc');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isRandom, setIsRandom] = useState(false);
  const [showProblemLinks, setShowProblemLinks] = useState(false);
  const [customProblemLinks, setCustomProblemLinks] = useState<string[]>([]);
  const [isRoomCreator, setIsRoomCreator] = useState(true);
  const [roomCreatorInfo, setRoomCreatorInfo] = useState<{
    clerk_id: string;
    codeforces_handle: string;
  } | null>(null);
  
  // Question settings
  const [questionCount, setQuestionCount] = useState(5);
  const [ratingRange, setRatingRange] = useState({ min: 800, max: 1500 });
  
  // Invite system state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{type: 'host' | 'opponent', index: number} | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<{
    host2: any | null;
    host3: any | null;
    opponent1: any | null;
    opponent2: any | null;
    opponent3: any | null;
  }>({
    host2: null,
    host3: null,
    opponent1: null,
    opponent2: null,
    opponent3: null,
  });
  
  // Track if current user was in a slot (to detect kicks)
  const [currentUserSlot, setCurrentUserSlot] = useState<string | null>(null);
  const isInitialLoadRef = React.useRef(true);
  
  // Handle realtime updates directly without API calls
  const handleRealtimeInviteUpdate = async (payload: any) => {
    console.log('🔄 Processing realtime invite update:', payload);
    
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const invite = payload.new;
      
      // If this is an accepted invite, add user to local state
      if (invite.status === 'accepted') {
        try {
          // Fetch user details for the accepted invite
          const userResponse = await apiClient.get(API_CONFIG.ENDPOINTS.USER.DETAILS, { clerkId: invite.invited_clerk_id });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            setInvitedUsers(prev => ({
              ...prev,
              [invite.slot]: {
                clerk_id: invite.invited_clerk_id,
                codeforces_handle: userData.codeforces_handle || 'Unknown'
              }
            }));
            
            // Track if current user accepted
            if (invite.invited_clerk_id === user?.id) {
              setCurrentUserSlot(invite.slot);
            }
          }
        } catch (error) {
          console.error('Error fetching user details for realtime update:', error);
        }
      }
      
      // If invite was rejected or deleted, remove from local state
      if (invite.status === 'rejected' || payload.eventType === 'DELETE') {
        setInvitedUsers(prev => ({
          ...prev,
          [invite.slot]: null
        }));
        
        // If current user was removed
        if (invite.invited_clerk_id === user?.id) {
          setCurrentUserSlot(null);
        }
      }
    }
    
    if (payload.eventType === 'DELETE') {
      const invite = payload.old;
      setInvitedUsers(prev => ({
        ...prev,
        [invite.slot]: null
      }));
    }
  };

  // Handle realtime config updates directly
  const handleRealtimeConfigUpdate = (payload: any) => {
    console.log('🔄 Processing realtime config update:', payload);
    
    if (payload.eventType === 'UPDATE' && payload.new) {
      // Check if game was started
      if (payload.new.game_status === 'started' && payload.new.game_started_by !== user?.id) {
        console.log('🚀 Game started by host (via room_config), redirecting to arena...');
        
        toast.success('Game started by host!', {
          description: 'Redirecting to arena...',
          duration: 2000
        });
        
        setTimeout(() => {
          window.location.href = `/arena?roomId=${roomId}`;
        }, 1000);
      }
    }
  };

  // Load room state on mount and subscribe to realtime updates
  useEffect(() => {
    // Update URL with room ID and mode if not present
    if (!searchParams.get('id')) {
      window.history.replaceState(null, '', `/room?id=${roomId}&mode=${roomMode}`);
    } else if (!searchParams.get('mode')) {
      // If ID exists but mode doesn't, add mode to URL
      window.history.replaceState(null, '', `/room?id=${searchParams.get('id')}&mode=${roomMode}`);
    }
    
    const loadRoomState = async () => {
      if (!user) {
        console.log('No user, skipping room state load');
        return;
      }
      

      
      console.log('🔄 Loading room state for room:', roomId, 'at', new Date().toISOString());
      
      try {
        // Check if there are accepted invites for this room
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ROOM.STATE, { roomId });
        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse room state response:', jsonError);
            toast.error('Failed to load room data');
            return;
          }
          console.log('📦 Room state response:', {
            totalInvites: data.invites?.length,
            acceptedInvites: data.invites?.filter((i: any) => i.status === 'accepted').length,
            myInvite: data.invites?.find((i: any) => i.invited_clerk_id === user.id)
          });
          
          // Get room creator info and room mode from invites
          let creatorClerkId = null;
          let fetchedRoomMode = null;
          if (data.invites?.length > 0) {
            creatorClerkId = data.invites[0]?.inviter_clerk_id;
            fetchedRoomMode = data.invites[0]?.room_mode;
            
            // Update room mode if we got it from the database
            if (fetchedRoomMode && fetchedRoomMode !== roomMode) {
              setRoomMode(fetchedRoomMode);
              // Update URL with correct mode
              window.history.replaceState(null, '', `/room?id=${roomId}&mode=${fetchedRoomMode}`);
            }
          }
          
          // Check if current user is the creator (use session storage as primary source)
          const isCreator = isRoomCreatorBySession || creatorClerkId === user.id;
          setIsRoomCreator(isCreator);
          
          // Fetch creator's info if we don't have it yet
          if (creatorClerkId && !roomCreatorInfo) {
            try {
              const creatorResponse = await apiClient.get(API_CONFIG.ENDPOINTS.USER.DETAILS, { clerkId: creatorClerkId });
              if (creatorResponse.ok) {
                let creatorData;
                try {
                  creatorData = await creatorResponse.json();
                } catch (jsonError) {
                  console.error('Failed to parse creator data:', jsonError);
                  return;
                }
                setRoomCreatorInfo({
                  clerk_id: creatorClerkId,
                  codeforces_handle: creatorData.codeforces_handle || 'Unknown'
                });
              }
            } catch (error) {
              console.error('Error fetching creator info:', error);
            }
          }
          
          console.log('Room state check:', {
            userId: user.id,
            creatorClerkId,
            isCreator,
            invites: data.invites
          });
          
          // Load accepted invites
          const acceptedInvites = data.invites?.filter((inv: any) => inv.status === 'accepted') || [];
          console.log('All invites for room:', data.invites);
          console.log('Accepted invites:', acceptedInvites);
          console.log('Looking for user:', user.id);
          
          const newInvitedUsers: any = {
            host2: null,
            host3: null,
            opponent1: null,
            opponent2: null,
            opponent3: null,
          };
          
          // Fetch user details for each accepted invite
          let foundCurrentUserSlot: string | null = null;
          
          for (const inv of acceptedInvites) {
            try {
              const userResponse = await apiClient.get(API_CONFIG.ENDPOINTS.USER.DETAILS, { clerkId: inv.invited_clerk_id });
              if (userResponse.ok) {
                let userData;
                try {
                  userData = await userResponse.json();
                } catch (jsonError) {
                  console.error('Failed to parse user data:', jsonError);
                  continue;
                }
                newInvitedUsers[inv.slot] = {
                  clerk_id: inv.invited_clerk_id,
                  codeforces_handle: userData.codeforces_handle || 'Unknown'
                };
                
                // Track if current user is in a slot
                if (inv.invited_clerk_id === user.id) {
                  foundCurrentUserSlot = inv.slot;
                }
              }
            } catch (error) {
              console.error('Error fetching user details:', error);
            }
          }
          
          // Detect if current user was kicked BEFORE updating state
          const timestamp = new Date().toISOString();
          console.log(`\n=== Kick Detection [${timestamp}] ===`);
          console.log('Is initial load:', isInitialLoadRef.current);
          console.log('Current user ID:', user.id);
          console.log('Is creator (from API):', isCreator);
          console.log('Is creator (from session):', isRoomCreatorBySession);
          console.log('Previous slot (before update):', currentUserSlot);
          console.log('Current slot (from API):', foundCurrentUserSlot);
          console.log('Accepted invites count:', acceptedInvites.length);
          console.log('All accepted invites:', acceptedInvites.map((inv: any) => ({
            slot: inv.slot,
            invited_clerk_id: inv.invited_clerk_id,
            isCurrentUser: inv.invited_clerk_id === user.id
          })));
          
          // SIMPLE KICK DETECTION: Am I in the accepted invites list?
          const myAcceptedInvite = acceptedInvites.find((inv: any) => inv.invited_clerk_id === user.id);
          const hasInvites = data.invites && data.invites.length > 0;
          
          console.log('👤 Kick check:', {
            isInitialLoad: isInitialLoadRef.current,
            isCreator: isCreator,
            hasAcceptedInvite: !!myAcceptedInvite,
            myInviteSlot: myAcceptedInvite?.slot || 'none',
            totalInvites: data.invites?.length,
            acceptedInvitesCount: acceptedInvites.length
          });
          
          // If I'm not creator and I don't have an accepted invite, I shouldn't be here
          // Check this ALWAYS, not just after initial load
          if (!isCreator && !myAcceptedInvite && hasInvites) {
            console.log('🚨🚨🚨 NOT AUTHORIZED! Not in accepted invites list');
            console.log('Redirecting in 1.5 seconds...');
            
            toast.error('You have been removed from the room', {
              description: 'Redirecting to dashboard...',
              duration: 1500
            });
            
            setTimeout(() => {
              console.log('Executing redirect now...');
              window.location.href = '/dashboard';
            }, 1500);
            
            return;
          }
          
          // Mark initial load as complete after first poll
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            console.log('✅ Initial load complete, kick detection will be active on next poll');
            console.log('📍 Setting currentUserSlot to:', foundCurrentUserSlot);
            
            // SPECIAL CHECK: If user joined a room but has no slot and is not creator, redirect
            if (!foundCurrentUserSlot && !isCreator && data.invites?.length > 0) {
              console.log('⚠️ User has no slot in this room and is not creator - redirecting');
              toast.error('You are not part of this room', {
                description: 'Redirecting to dashboard...',
                duration: 2000
              });
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 2000);
              return;
            }
          }
          
          // Update the state
          console.log('📝 Updating state - currentUserSlot:', foundCurrentUserSlot);
          setCurrentUserSlot(foundCurrentUserSlot);
          setInvitedUsers(newInvitedUsers);
        }

        // Check if game has already started
        try {
          const configResponse = await apiClient.get(API_CONFIG.ENDPOINTS.ROOM.CONFIG, { roomId });
          if (configResponse.ok) {
            let configData;
            try {
              configData = await configResponse.json();
            } catch (jsonError) {
              console.error('Failed to parse room config:', jsonError);
              return;
            }
            const roomConfig = configData.config;
            
            // If game has started and current user didn't start it, redirect to arena
            if (roomConfig.game_status === 'started' && roomConfig.game_started_by !== user.id) {
              console.log('🎮 Game already started, redirecting to arena...');
              
              toast.info('Game is already in progress', {
                description: 'Redirecting to arena...',
                duration: 2000
              });
              
              setTimeout(() => {
                window.location.href = `/arena?roomId=${roomId}`;
              }, 1000);
              return;
            }
          }
        } catch (error) {
          console.log('Could not check game status:', error);
        }
      } catch (error) {
        console.error('Error loading room state:', error);
      }
    };
    
    // Load initially
    loadRoomState();
    
    // Set up Supabase Realtime subscription - NO POLLING
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('🔴 Setting up realtime subscription for room:', roomId);
    
    const channel = supabase
      .channel(`room_${roomId}_${Date.now()}`) // Unique channel name

      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'room_invites',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          try {
            console.log('🔴 ROOM INVITES EVENT:', payload.eventType, payload);
            
            // Check if someone was kicked (status changed to 'kicked')
            if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'kicked' && payload.new.invited_clerk_id === user?.id) {
              toast.error('You have been removed from the room', {
                description: 'Redirecting to dashboard...',
                duration: 1500
              });
              
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
            } else {
              // Process the realtime event data directly instead of making API calls
              handleRealtimeInviteUpdate(payload);
            }
          } catch (error) {
            console.error('Error handling room invites event:', error);
          }
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'room_config',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          try {
            console.log('🔴 ROOM CONFIG EVENT:', payload.eventType, payload);
            
            // Handle room config updates directly
            handleRealtimeConfigUpdate(payload);
          } catch (error) {
            console.error('Error handling room config event:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime SUBSCRIBED successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime CHANNEL_ERROR - This is usually due to:');
          console.error('  1. Row Level Security (RLS) blocking access');
          console.error('  2. Realtime not enabled on tables');
          console.error('  3. Network connectivity issues');
          console.error('  → Please check Supabase realtime configuration');
          
          // Show user-friendly error instead of polling
          toast.error('Real-time updates unavailable', {
            description: 'Please refresh the page to see latest updates',
            duration: 10000
          });
          
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Realtime TIMED_OUT - Connection timeout');
          console.error('  → This might be due to network issues');
        } else if (status === 'CLOSED') {
          console.log('🔴 Realtime connection CLOSED');
        }
      });
    
    return () => {
      console.log('🔴 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      
      // No additional cleanup needed
    };
  }, [user, roomId, searchParams]);
  
  // Search users by Codeforces handle with debounce
  const handleSearch = React.useCallback(
    async (query: string) => {
      setSearchQuery(query);
      
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      console.log('Searching for:', query);
      
      try {
        console.log('Searching for handle:', query.trim());
        
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER.SEARCH, { handle: query.trim() });
        console.log('Response status:', response.status, response.statusText);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          toast.error('Server returned invalid response');
          setSearchResults([]);
          return;
        }
        
        const data = await response.json();
        console.log('Search response:', { status: response.status, data });
        
        if (response.ok) {
          console.log('Found users:', data.users);
          setSearchResults(data.users || []);
          if (!data.users || data.users.length === 0) {
            toast.info('No users found with that handle');
          }
        } else {
          console.error('Search failed:', { status: response.status, error: data.error, details: data.details });
          toast.error(data.error || `Failed to search users (${response.status})`);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error(`Error searching users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );
  
  const handleInviteUser = async (selectedUser: any, slot: string) => {
    try {
      // Prevent inviting yourself
      if (selectedUser.clerk_id === user?.id) {
        toast.error('You cannot invite yourself');
        return;
      }

      // Determine slot type
      const slotType = slot.startsWith('host') ? 'host' : 'opponent';
      
      // Send invite via API
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.INVITE, {
        invitedUserId: selectedUser.clerk_id,
        roomId,
        slot,
        slotType,
        roomMode
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse invite response as JSON:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response:', textResponse);
        throw new Error('Server returned invalid response');
      }
      
      console.log('Invite response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Invite failed:', { status: response.status, error: data.error, fullData: data });
        throw new Error(data.error || `Failed to send invite (${response.status})`);
      }

      // Update local state
      setInvitedUsers(prev => ({
        ...prev,
        [slot]: selectedUser
      }));
      
      setActiveSlot(null);
      setSearchQuery('');
      setSearchResults([]);
      
      toast.success(`Invite sent to ${selectedUser.codeforces_handle}!`, {
        description: 'They will receive a notification to accept or reject'
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invite');
    }
  };
  
  const handleRemoveUser = async (slot: string, isCurrentUser: boolean) => {
    // Prevent room creator from leaving
    if (isCurrentUser && isRoomCreator) {
      toast.error('Room creator cannot leave', {
        description: 'Use "Discard Room" button to delete the room'
      });
      return;
    }

    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.INVITES_REMOVE, {
        roomId,
        slot
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse remove user response:', jsonError);
        toast.error('User removed but response was invalid');
        return;
      }
      console.log('✅ User removed successfully from slot:', slot, data);

      // Update local state immediately
      setInvitedUsers(prev => ({
        ...prev,
        [slot]: null
      }));
      
      if (isCurrentUser) {
        // User clicked Leave button themselves
        setCurrentUserSlot(null);
        toast.success('You left the room', {
          description: 'Redirecting to dashboard...'
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        // Host removed someone else
        console.log('✅ Host removed user from slot');
        toast.info('User removed from slot');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  const handlePlayClick = async () => {
    if (isStartingGame) return; // Prevent multiple clicks
    
    setIsStartingGame(true);
    try {
      // Filter out empty links and validate Codeforces URLs
      console.log('🔍 Custom links validation:', {
        showProblemLinks,
        customProblemLinksLength: customProblemLinks.length,
        customProblemLinks: customProblemLinks
      });
      
      const nonEmptyLinks = showProblemLinks 
        ? customProblemLinks.filter(link => link.trim() !== '')
        : [];
      
      console.log('🔍 Non-empty links:', nonEmptyLinks);
      
      const validCustomLinks = nonEmptyLinks.filter(link => {
        try {
          const url = new URL(link.trim());
          const isValid = url.hostname === 'codeforces.com' || url.hostname === 'www.codeforces.com';
          console.log('🔍 Validating link:', link, '→', isValid, '(hostname:', url.hostname, ')');
          return isValid;
        } catch (error) {
          console.log('🔍 Invalid URL:', link, '→', error.message);
          return false;
        }
      });
      
      console.log('🔍 Valid custom links:', validCustomLinks);

      // Show warning if some links are invalid
      if (showProblemLinks && nonEmptyLinks.length > 0 && validCustomLinks.length < nonEmptyLinks.length) {
        const invalidCount = nonEmptyLinks.length - validCustomLinks.length;
        toast.warning(`${invalidCount} invalid Codeforces link${invalidCount > 1 ? 's' : ''} ignored`, {
          description: 'Only valid Codeforces problem links will be used.',
          duration: 4000
        });
      }

      // Check if custom links are enabled but no valid links provided
      if (showProblemLinks && validCustomLinks.length === 0) {
        toast.error('No valid Codeforces problem links provided', {
          description: 'Please add valid Codeforces problem links or disable custom links.',
          duration: 5000
        });
        return;
      }

      // Custom links will be stored in the arena session database

      // Save room configuration
      const configPayload = {
        roomId,
        questionCount,
        minutes,
        format: competitionType,
        minRating: ratingRange.min,
        maxRating: ratingRange.max,
        tags: isRandom ? [] : selectedTags.map(t => t.name),
        isRandomTags: isRandom,
        problems: null, // Will be fetched in arena
        customProblemLinks: showProblemLinks ? validCustomLinks : null,
        useCustomLinks: showProblemLinks && validCustomLinks.length > 0
      };
      
      console.log('🔗 Saving custom links to room config:', {
        showProblemLinks,
        customProblemLinks: configPayload.customProblemLinks,
        useCustomLinks: configPayload.useCustomLinks,
        linksLength: configPayload.customProblemLinks?.length || 0
      });
      
      console.log('Sending config payload:', configPayload);
      const configResponse = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.CONFIG, configPayload);

      if (!configResponse.ok) {
        let errorData;
        let responseText;
        
        // Clone the response to read it multiple times if needed
        const responseClone = configResponse.clone();
        
        try {
          errorData = await configResponse.json();
        } catch (jsonError) {
          try {
            responseText = await responseClone.text();
            console.error('Non-JSON response:', responseText);
          } catch (textError) {
            console.error('Could not read response:', textError);
          }
          errorData = { error: 'Invalid response from server' };
        }
        
        console.error('Config save failed:', {
          status: configResponse.status,
          statusText: configResponse.statusText,
          error: errorData,
          responseText,
          payload: configPayload
        });
        
        toast.error('Failed to save room configuration', {
          description: errorData.error || responseText || `Server error: ${configResponse.status}`,
          duration: 5000
        });
        return;
      }

      console.log('Room configuration saved successfully');

      // Prepare data for arena session
      let questions = [];
      let customLinksForArena = null;
      let useCustomLinks = false;
      
      if (showProblemLinks && validCustomLinks.length > 0) {
        // Store custom links for arena session
        customLinksForArena = validCustomLinks;
        useCustomLinks = true;
        
        // Convert custom links to problem objects for immediate use
        questions = validCustomLinks.map((link: string, index: number) => {
          const urlMatch = link.match(/codeforces\.com\/(?:contest|problemset\/problem)\/(\d+)\/([A-Z]\d*)/);
          if (urlMatch) {
            const [, contestId, problemIndex] = urlMatch;
            return {
              id: `custom_${index}`,
              name: `Problem ${problemIndex}`,
              contestId: parseInt(contestId),
              index: problemIndex,
              rating: 0,
              tags: [],
              url: link,
              solvedCount: null
            };
          } else {
            return {
              id: `custom_${index}`,
              name: `Custom Problem ${index + 1}`,
              contestId: null,
              index: null,
              rating: 0,
              tags: [],
              url: link,
              solvedCount: null
            };
          }
        });
        
        console.log('Using custom problem links:', validCustomLinks);
      } else {
        // Fetch questions from question service
        const params = new URLSearchParams({
          count: questionCount.toString(),
        });

        if (ratingRange.min) params.append('minRating', ratingRange.min.toString());
        if (ratingRange.max) params.append('maxRating', ratingRange.max.toString());
        
        if (!isRandom && selectedTags.length > 0) {
          params.append('tags', selectedTags.map(t => t.name).join(','));
        }

        console.log('Fetching questions with params:', params.toString());
        const questionsResponse = await apiClient.get(`${API_CONFIG.ENDPOINTS.QUESTIONS.FETCH}?${params.toString()}`);
        
        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to fetch questions:', errorData);
          toast.error('Failed to fetch questions', {
            description: errorData.error || `Server error: ${questionsResponse.status}`,
            duration: 5000
          });
          return;
        }

        let questionsData;
        try {
          questionsData = await questionsResponse.json();
        } catch (jsonError) {
          console.error('Failed to parse questions response:', jsonError);
          toast.error('Failed to parse questions response');
          return;
        }
        
        questions = questionsData.problems || [];
        console.log('Questions fetched successfully:', questions.length, 'problems');
        
        // Check if fewer problems were fetched than requested
        if (questions.length < questionCount) {
          const tagsText = selectedTags.length > 0 
            ? `tags: ${selectedTags.map(t => t.name).join(', ')}` 
            : 'no specific tags';
          const ratingText = ratingRange.min && ratingRange.max
            ? `rating range: ${ratingRange.min}-${ratingRange.max}`
            : 'any rating';
          
          toast.warning('Limited Questions Available', {
            description: `Only ${questions.length} out of ${questionCount} questions found with ${tagsText} and ${ratingText}.`,
            duration: 8000,
          });
        }
      }

      // Start the game and notify all participants with questions and custom links
      console.log('🚀 Starting game with payload:', {
        roomId,
        questions: questions.length,
        customProblemLinks: customLinksForArena,
        useCustomLinks,
        showProblemLinks,
        validCustomLinksCount: validCustomLinks.length,
        actualCustomLinks: customLinksForArena
      });
      
      console.log('🔗 Custom links details:', {
        showProblemLinks,
        customProblemLinksLength: customProblemLinks.length,
        validCustomLinksLength: validCustomLinks.length,
        customLinksForArena,
        useCustomLinks
      });
      
      const startGameResponse = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.START_GAME, {
        roomId,
        questions,
        customProblemLinks: customLinksForArena,
        useCustomLinks
      });

      if (!startGameResponse.ok) {
        const errorData = await startGameResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to start game:', errorData);
        toast.error('Failed to start game', {
          description: errorData.error || `Server error: ${startGameResponse.status}`,
          duration: 5000
        });
        return;
      }

      let startGameData;
      try {
        startGameData = await startGameResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse start game response:', jsonError);
        toast.error('Game started but response was invalid');
        return;
      }
      console.log('Game started successfully:', startGameData);

      // Custom links are now stored in room_config database table
      console.log('✅ Custom links stored in room config database');

      toast.success('Game started!', {
        description: 'All participants are being notified...',
        duration: 2000
      });

      // Navigate to arena (host goes immediately)
      // Add a longer delay to ensure arena session is created
      setTimeout(() => {
        window.location.href = `/arena?roomId=${roomId}`;
      }, 2000);
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
      setIsStartingGame(false);
    }
  };

  const handleDiscardRoom = async () => {
    // Show confirmation toast
    toast('Are you sure you want to discard this room?', {
      description: 'All invites will be cancelled and the room will be deleted.',
      duration: 10000,
      action: {
        label: 'Yes, Discard',
        onClick: async () => {
          try {
            
            toast.loading('Discarding room...');
            
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.DISCARD, {
              roomId
            });

            let data;
            try {
              data = await response.json();
            } catch (jsonError) {
              console.error('Failed to parse discard room response:', jsonError);
              toast.error('Room discarded but response was invalid');
              return;
            }

            if (!response.ok) {
              throw new Error(data.error || 'Failed to discard room');
            }

            toast.success('Room discarded successfully');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
            
          } catch (error) {
            console.error('Error discarding room:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to discard room');
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          toast.info('Room discard cancelled');
        }
      }
    });
  };
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4 overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

      {/* Gradient accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative mb-10">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-bold text-white">Room</h1>
            <div className="flex items-center gap-3">
              <HoverButton 
                onClick={handlePlayClick}
                className={`px-4 py-2.5 group/button transition-all duration-300 ${
                  isStartingGame 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30'
                }`}
              >
                <span className="relative z-10 flex items-center gap-3 transition-all duration-300">
                  <span className="relative text-white">
                    {isStartingGame ? (
                      <svg
                        className="animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg
                        className="group-hover/button:scale-110 group-hover/button:-translate-y-0.5 transition-transform duration-300 group-active/button:scale-95"
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                        <line x1="13" x2="19" y1="19" y2="13" />
                        <line x1="16" x2="20" y1="16" y2="20" />
                        <line x1="19" x2="21" y1="21" y2="19" />
                        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                        <line x1="5" x2="9" y1="14" y2="18" />
                        <line x1="7" x2="4" y1="17" y2="20" />
                        <line x1="3" x2="5" y1="19" y2="21" />
                      </svg>
                    )}
                  </span>
                  <span className="font-semibold text-white/95 group-hover/button:translate-y-[-1px] group-hover/button:scale-105 transition-all duration-300">
                    {isStartingGame ? 'Starting Game...' : 'Play'}
                  </span>
                </span>
              </HoverButton>

              <HoverButton 
                onClick={handleDiscardRoom}
                className="bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 px-4 py-2.5 group/button"
              >
                <span className="relative z-10 flex items-center gap-3 transition-all duration-300">
                  <span className="relative text-white">
                    <svg
                      className="group-hover/button:scale-110 group-hover/button:-translate-y-0.5 transition-transform duration-300 group-active/button:scale-95"
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7l16 0" />
                      <path d="M10 11l0 6" />
                      <path d="M14 11l0 6" />
                      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                  </span>
                  <span className="font-semibold text-white/95 group-hover/button:translate-y-[-1px] transition-transform duration-300">Discard</span>
                </span>
              </HoverButton>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <AnimatedNumberCountdown
              endDate={useMemo(() => {
                const endDate = new Date();
                endDate.setMinutes(endDate.getMinutes() + minutes);
                return endDate;
              }, [minutes])}
              className="text-xl font-medium text-white/80"
              autoStart={false}
            />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Host vs Invite */}
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white mb-3">Hosts</h2>
              <div className="space-y-2">
                {/* Current User - Host 1 */}
                <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-600/30 flex items-center justify-center border border-green-500/30">
                      <svg fill="#10b981" height="18" width="18" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.123.0007c-.5442-.0038-1.0301.008-1.4389.0204C7.185.1697 4.2115 1.7057 4.2115 1.7057s-.2967.1988-.148.8428c0 0 .0993.7921.1983 1.139l.0494.0996c-.099.099-.4958.2973-.6445.4954-.3468.446-.0493 2.4772-.0493 2.4772.3468 2.1303.6938 2.5265.6938 2.5265s.4956.6436 1.1892 1.0895c.2973.1486.2477.4954.2477.4954L3.3203 24h16.3492l-3.4187-7.4808c.6936 0 2.1306.3464 2.9232-1.883.7432-2.1303 1.1397-5.3502 1.1893-6.2915.099-.9414-.0999-2.9233-.0503-3.4187 0-.1486.3473-.6442.3473-.9415.0496-.4459-.0006-.8418-.0996-1.585-.0496-.2972-.0983-.644-.1974-.9908-.0496-.2478-.0999-.3964-.298-.4955C17.91.1701 15.7555.0124 14.123.0007Zm-1.4389.4171c.545 0 5.1027-.0492 7.233.8922.1983.1486.0498.8915-.0493 1.2879-.0495.2972-.3967.3967-.3967.3967-.3468.099-.446.3464-.446.3464s.4458 4.3102.4954 4.4589c.0495.1981-.1485.1981-.5448.2477-.1982 0-2.4772.0493-2.4772.0493s-.4956-.0491-.446-.3464c0-.1981.0992-.595.1983-.595h.4461s.991.0497.6938-.0494l-1.0402-.2477s-.2483.0004-.3474.149c-.0495.1486-.297.9415-.297.9415s-.0002.0491.0493.0987c.0495.0495 2.5768 1.883 2.5768 1.883s-2.1311-.199-2.7752-.0503c-.644.1486-1.9813.8422-2.8235.9908-.8422.1487-3.9636.4955-4.1618.4955l-1.2386-5.35s-.1484-1.3375-1.5356-1.288c-1.0404.0495-1.189.2967-1.2386.3958-.099.1981 0 .3967 0 .3967l3.3693 5.7468s-2.2792-1.0896-3.171-2.3282c-.4954-.644-.9416-3.8645-.6444-4.4095.2973-.4954 2.1306-.8915 2.9233-.7925.3963.0496.7433.4452.9415.6929.0495.099.0985.0501.148.0996 0 0-.1982-1.2383-.9909-1.2879-1.1394-.099-2.3774.3464-2.3774.3464s-.0995-.0004-.149-.149c-.0496-.1982-.1984-1.2386-.1984-1.2386s.0495-.198.2477-.297c0 0 3.2209-1.4863 8.0265-1.4863zm.6435 1.4273c-.0704.003-.0987.0096-.0987.0096-2.0808.8423-3.765 2.675-3.765 2.5759.1981.0495.594 0 .594 0 1.8332-1.5854 3.4187-2.2295 3.4187-2.2295 1.3377 0 3.6165.7927 3.765.7432.0496 0 .0498-.2475-.0493-.297-.2477-.0496-.7433-.2973-1.6846-.4955-1.3748-.2973-1.9688-.316-2.1801-.3067Zm6.788 1.3972c.1981.0496.198.049.297.148.1486.0992.0991.3966 0 .4461-.099.0991-.1484-.0988-.7925-.0493 0 0 .2973-.5943.4955-.5448zm-4.8711.1016c-.3623-.0186-.8641.0469-1.4215.1955-.7431.1982-2.2294.9415-2.2294.9415.5945.2477 1.5861.3468 2.5275.4954 1.0404.0991 2.179-.446 2.179-.446-.0495-.1487-.3963-1.0408-.743-1.14-.0868-.0247-.1919-.0402-.3126-.0464zm.7867 7.4015c.7242.0174 1.5759.1012 2.449.3241 0 0 .4957.3964.4461.7432 0 0-3.567.198-4.9543-.9416 0 0 .852-.1548 2.0592-.1257zm-9.7383.176 1.5356 1.0403 2.5265 11.5429H3.9145Zm11.8032 1.4554a8.479 8.479 0 0 1 .7315.031s.2973.2475-.4954 1.0401c-.9909.9414-2.7256 1.6843-4.2615 1.288 0 0 .5664-2.351 4.0254-2.3591zm-8.0875 4.1918s3.1216 1.9323 3.617 2.6755l.3464 4.3108h-2.2787Zm5.3007 3.9634s1.8335 1.6852 2.3785 3.0229h-3.0713z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium">
                        {roomCreatorInfo?.codeforces_handle || (isRoomCreator ? (user?.firstName || user?.username || 'You') : 'Loading...')} (Host 1)
                      </span>
                      <span className="text-xs text-green-300">Room Creator</span>
                    </div>
                  </div>
                  <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                    Active
                  </Badge>
                </div>
                
                {/* Host 2 - Invite (Only show in team mode) */}
                {roomMode === 'team-vs-team' && (
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                      {invitedUsers.host2 ? (
                        <svg fill="#3b82f6" height="18" width="18" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.123.0007c-.5442-.0038-1.0301.008-1.4389.0204C7.185.1697 4.2115 1.7057 4.2115 1.7057s-.2967.1988-.148.8428c0 0 .0993.7921.1983 1.139l.0494.0996c-.099.099-.4958.2973-.6445.4954-.3468.446-.0493 2.4772-.0493 2.4772.3468 2.1303.6938 2.5265.6938 2.5265s.4956.6436 1.1892 1.0895c.2973.1486.2477.4954.2477.4954L3.3203 24h16.3492l-3.4187-7.4808c.6936 0 2.1306.3464 2.9232-1.883.7432-2.1303 1.1397-5.3502 1.1893-6.2915.099-.9414-.0999-2.9233-.0503-3.4187 0-.1486.3473-.6442.3473-.9415.0496-.4459-.0006-.8418-.0996-1.585-.0496-.2972-.0983-.644-.1974-.9908-.0496-.2478-.0999-.3964-.298-.4955C17.91.1701 15.7555.0124 14.123.0007Zm-1.4389.4171c.545 0 5.1027-.0492 7.233.8922.1983.1486.0498.8915-.0493 1.2879-.0495.2972-.3967.3967-.3967.3967-.3468.099-.446.3464-.446.3464s.4458 4.3102.4954 4.4589c.0495.1981-.1485.1981-.5448.2477-.1982 0-2.4772.0493-2.4772.0493s-.4956-.0491-.446-.3464c0-.1981.0992-.595.1983-.595h.4461s.991.0497.6938-.0494l-1.0402-.2477s-.2483.0004-.3474.149c-.0495.1486-.297.9415-.297.9415s-.0002.0491.0493.0987c.0495.0495 2.5768 1.883 2.5768 1.883s-2.1311-.199-2.7752-.0503c-.644.1486-1.9813.8422-2.8235.9908-.8422.1487-3.9636.4955-4.1618.4955l-1.2386-5.35s-.1484-1.3375-1.5356-1.288c-1.0404.0495-1.189.2967-1.2386.3958-.099.1981 0 .3967 0 .3967l3.3693 5.7468s-2.2792-1.0896-3.171-2.3282c-.4954-.644-.9416-3.8645-.6444-4.4095.2973-.4954 2.1306-.8915 2.9233-.7925.3963.0496.7433.4452.9415.6929.0495.099.0985.0501.148.0996 0 0-.1982-1.2383-.9909-1.2879-1.1394-.099-2.3774.3464-2.3774.3464s-.0995-.0004-.149-.149c-.0496-.1982-.1984-1.2386-.1984-1.2386s.0495-.198.2477-.297c0 0 3.2209-1.4863 8.0265-1.4863zm.6435 1.4273c-.0704.003-.0987.0096-.0987.0096-2.0808.8423-3.765 2.675-3.765 2.5759.1981.0495.594 0 .594 0 1.8332-1.5854 3.4187-2.2295 3.4187-2.2295 1.3377 0 3.6165.7927 3.765.7432.0496 0 .0498-.2475-.0493-.297-.2477-.0496-.7433-.2973-1.6846-.4955-1.3748-.2973-1.9688-.316-2.1801-.3067Zm6.788 1.3972c.1981.0496.198.049.297.148.1486.0992.0991.3966 0 .4461-.099.0991-.1484-.0988-.7925-.0493 0 0 .2973-.5943.4955-.5448zm-4.8711.1016c-.3623-.0186-.8641.0469-1.4215.1955-.7431.1982-2.2294.9415-2.2294.9415.5945.2477 1.5861.3468 2.5275.4954 1.0404.0991 2.179-.446 2.179-.446-.0495-.1487-.3963-1.0408-.743-1.14-.0868-.0247-.1919-.0402-.3126-.0464zm.7867 7.4015c.7242.0174 1.5759.1012 2.449.3241 0 0 .4957.3964.4461.7432 0 0-3.567.198-4.9543-.9416 0 0 .852-.1548 2.0592-.1257zm-9.7383.176 1.5356 1.0403 2.5265 11.5429H3.9145Zm11.8032 1.4554a8.479 8.479 0 0 1 .7315.031s.2973.2475-.4954 1.0401c-.9909.9414-2.7256 1.6843-4.2615 1.288 0 0 .5664-2.351 4.0254-2.3591zm-8.0875 4.1918s3.1216 1.9323 3.617 2.6755l.3464 4.3108h-2.2787Zm5.3007 3.9634s1.8335 1.6852 2.3785 3.0229h-3.0713z"/>
                        </svg>
                      ) : (
                        <UserPlus className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-white">
                      {invitedUsers.host2 ? invitedUsers.host2.codeforces_handle : 'Host 2 (Empty)'}
                    </span>
                  </div>
                  {invitedUsers.host2 ? (
                    <button 
                      onClick={() => handleRemoveUser('host2', invitedUsers.host2.clerk_id === user?.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {invitedUsers.host2.clerk_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveSlot({type: 'host', index: 2})}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
                )}
                
                {/* Host 3 - Invite (Only show in team mode) */}
                {roomMode === 'team-vs-team' && (
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                      {invitedUsers.host3 ? (
                        <svg fill="#3b82f6" height="18" width="18" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.123.0007c-.5442-.0038-1.0301.008-1.4389.0204C7.185.1697 4.2115 1.7057 4.2115 1.7057s-.2967.1988-.148.8428c0 0 .0993.7921.1983 1.139l.0494.0996c-.099.099-.4958.2973-.6445.4954-.3468.446-.0493 2.4772-.0493 2.4772.3468 2.1303.6938 2.5265.6938 2.5265s.4956.6436 1.1892 1.0895c.2973.1486.2477.4954.2477.4954L3.3203 24h16.3492l-3.4187-7.4808c.6936 0 2.1306.3464 2.9232-1.883.7432-2.1303 1.1397-5.3502 1.1893-6.2915.099-.9414-.0999-2.9233-.0503-3.4187 0-.1486.3473-.6442.3473-.9415.0496-.4459-.0006-.8418-.0996-1.585-.0496-.2972-.0983-.644-.1974-.9908-.0496-.2478-.0999-.3964-.298-.4955C17.91.1701 15.7555.0124 14.123.0007Zm-1.4389.4171c.545 0 5.1027-.0492 7.233.8922.1983.1486.0498.8915-.0493 1.2879-.0495.2972-.3967.3967-.3967.3967-.3468.099-.446.3464-.446.3464s.4458 4.3102.4954 4.4589c.0495.1981-.1485.1981-.5448.2477-.1982 0-2.4772.0493-2.4772.0493s-.4956-.0491-.446-.3464c0-.1981.0992-.595.1983-.595h.4461s.991.0497.6938-.0494l-1.0402-.2477s-.2483.0004-.3474.149c-.0495.1486-.297.9415-.297.9415s-.0002.0491.0493.0987c.0495.0495 2.5768 1.883 2.5768 1.883s-2.1311-.199-2.7752-.0503c-.644.1486-1.9813.8422-2.8235.9908-.8422.1487-3.9636.4955-4.1618.4955l-1.2386-5.35s-.1484-1.3375-1.5356-1.288c-1.0404.0495-1.189.2967-1.2386.3958-.099.1981 0 .3967 0 .3967l3.3693 5.7468s-2.2792-1.0896-3.171-2.3282c-.4954-.644-.9416-3.8645-.6444-4.4095.2973-.4954 2.1306-.8915 2.9233-.7925.3963.0496.7433.4452.9415.6929.0495.099.0985.0501.148.0996 0 0-.1982-1.2383-.9909-1.2879-1.1394-.099-2.3774.3464-2.3774.3464s-.0995-.0004-.149-.149c-.0496-.1982-.1984-1.2386-.1984-1.2386s.0495-.198.2477-.297c0 0 3.2209-1.4863 8.0265-1.4863zm.6435 1.4273c-.0704.003-.0987.0096-.0987.0096-2.0808.8423-3.765 2.675-3.765 2.5759.1981.0495.594 0 .594 0 1.8332-1.5854 3.4187-2.2295 3.4187-2.2295 1.3377 0 3.6165.7927 3.765.7432.0496 0 .0498-.2475-.0493-.297-.2477-.0496-.7433-.2973-1.6846-.4955-1.3748-.2973-1.9688-.316-2.1801-.3067Zm6.788 1.3972c.1981.0496.198.049.297.148.1486.0992.0991.3966 0 .4461-.099.0991-.1484-.0988-.7925-.0493 0 0 .2973-.5943.4955-.5448zm-4.8711.1016c-.3623-.0186-.8641.0469-1.4215.1955-.7431.1982-2.2294.9415-2.2294.9415.5945.2477 1.5861.3468 2.5275.4954 1.0404.0991 2.179-.446 2.179-.446-.0495-.1487-.3963-1.0408-.743-1.14-.0868-.0247-.1919-.0402-.3126-.0464zm.7867 7.4015c.7242.0174 1.5759.1012 2.449.3241 0 0 .4957.3964.4461.7432 0 0-3.567.198-4.9543-.9416 0 0 .852-.1548 2.0592-.1257zm-9.7383.176 1.5356 1.0403 2.5265 11.5429H3.9145Zm11.8032 1.4554a8.479 8.479 0 0 1 .7315.031s.2973.2475-.4954 1.0401c-.9909.9414-2.7256 1.6843-4.2615 1.288 0 0 .5664-2.351 4.0254-2.3591zm-8.0875 4.1918s3.1216 1.9323 3.617 2.6755l.3464 4.3108h-2.2787Zm5.3007 3.9634s1.8335 1.6852 2.3785 3.0229h-3.0713z"/>
                        </svg>
                      ) : (
                        <UserPlus className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-white">
                      {invitedUsers.host3 ? invitedUsers.host3.codeforces_handle : 'Host 3 (Empty)'}
                    </span>
                  </div>
                  {invitedUsers.host3 ? (
                    <button 
                      onClick={() => handleRemoveUser('host3', invitedUsers.host3.clerk_id === user?.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {invitedUsers.host3.clerk_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveSlot({type: 'host', index: 3})}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white mb-3">Opponents</h2>
              <div className="space-y-2">
                {/* Opponent 1 - Invite (Always show) */}
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-white">
                      {invitedUsers.opponent1 ? invitedUsers.opponent1.codeforces_handle : 'Opponent 1 (Empty)'}
                    </span>
                  </div>
                  {invitedUsers.opponent1 ? (
                    <button 
                      onClick={() => handleRemoveUser('opponent1', invitedUsers.opponent1.clerk_id === user?.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {invitedUsers.opponent1.clerk_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveSlot({type: 'opponent', index: 1})}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
                
                {/* Opponent 2 - Invite (Only show in team mode) */}
                {roomMode === 'team-vs-team' && (
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-white">
                      {invitedUsers.opponent2 ? invitedUsers.opponent2.codeforces_handle : 'Opponent 2 (Empty)'}
                    </span>
                  </div>
                  {invitedUsers.opponent2 ? (
                    <button 
                      onClick={() => handleRemoveUser('opponent2', invitedUsers.opponent2.clerk_id === user?.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {invitedUsers.opponent2.clerk_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveSlot({type: 'opponent', index: 2})}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
                )}
                
                {/* Opponent 3 - Invite (Only show in team mode) */}
                {roomMode === 'team-vs-team' && (
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600/30">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-white">
                      {invitedUsers.opponent3 ? invitedUsers.opponent3.codeforces_handle : 'Opponent 3 (Empty)'}
                    </span>
                  </div>
                  {invitedUsers.opponent3 ? (
                    <button 
                      onClick={() => handleRemoveUser('opponent3', invitedUsers.opponent3.clerk_id === user?.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {invitedUsers.opponent3.clerk_id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveSlot({type: 'opponent', index: 3})}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <UserPlus className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Counter */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="rounded-xl bg-white/5 p-6 border border-white/10">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className={`flex-1 pr-6 relative transition-all duration-300 ${showProblemLinks ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                      <h3 className="text-lg font-medium text-white/80 mb-3">Questions Counter</h3>
                      <AnimatedNumberCounter 
                        value={questionCount}
                        onChange={setQuestionCount}
                        min={1}
                        max={20}
                        disabled={showProblemLinks}
                      />
                      {showProblemLinks && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <span className="text-sm text-white/80 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md border border-white/20">
                            Disabled when using custom problem links
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="h-16 w-px bg-white/20"></div>
                    <div className="flex-1 pl-6">
                      <h3 className="text-lg font-medium text-white/80 mb-3">Time (in minutes)</h3>
                      <div className="flex items-center justify-between w-full">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={minutes}
                            min={1}
                            max={560}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setMinutes(Math.min(560, Math.max(1, value)));
                            }}
                            className="w-16 !bg-transparent px-1 py-0.5 text-center text-lg !text-white border-b border-white/30 outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="flex flex-col -ml-1">
                            <button
                              onClick={() => setMinutes(prev => Math.min(560, prev + 1))}
                              className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => setMinutes(prev => Math.max(1, prev - 1))}
                              className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                        <AnimatedCounter value={minutes} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="mt-6 flex items-baseline gap-4">
                  <h3 className="text-lg font-medium text-white/80 whitespace-nowrap pt-1">Format</h3>
                  <div className="w-56">
                    <GlassRadioGroup
                      value={competitionType}
                      onChange={(type: string) => setCompetitionType(type as CompetitionType)}
                    />
                  </div>
                </div>

                {/* Tags Input */}
                <div className={`mt-1 relative transition-all duration-300 ${showProblemLinks ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-medium text-white/80">Tags</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Randomize</span>
                      <div className="relative top-0.5">
                        <ToggleSwitch
                          name="randomize"
                          checked={isRandom}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setIsRandom(newValue);
                            if (newValue) {
                              setSelectedTags([]);
                            }
                          }}
                          disabled={showProblemLinks}
                        />
                      </div>
                    </div>
                  </div>
                  {isRandom ? (
                    <div className="text-sm text-gray-400 italic py-2 px-3 bg-black/20 rounded-md">
                      Random questions will be provided in the arena
                    </div>
                  ) : (
                    <TagSelector
                      availableTags={AVAILABLE_TAGS}
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                      placeholder="Search or create a topic..."
                      disabled={showProblemLinks}
                    />
                  )}
                  {showProblemLinks && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-sm text-white/80 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md border border-white/20">
                        Disabled when using custom problem links
                      </span>
                    </div>
                  )}
                </div>

                {/* Rating Range Selector */}
                <div className={`mt-0 relative transition-all duration-300 ${showProblemLinks ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                  <RatingRangeSlider
                    min={800}
                    max={3500}
                    step={100}
                    onChange={setRatingRange}
                    disabled={showProblemLinks}
                  />
                  {showProblemLinks && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-sm text-white/80 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md border border-white/20">
                        Disabled when using custom problem links
                      </span>
                    </div>
                  )}
                </div>

                {/* Link Editor Section */}
                <div className="mt-0 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-white/80">Problem Links</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Enable</span>
                      <div className="relative top-0.5">
                        <ToggleSwitch
                          name="problemLinks"
                          checked={showProblemLinks}
                          onChange={(e) => setShowProblemLinks(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                  <LinkEditor 
                    enabled={showProblemLinks} 
                    onChange={setCustomProblemLinks}
                  />
                  {showProblemLinks && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white/60">
                        Add Codeforces problem links (e.g., https://codeforces.com/problemset/problem/1234/A)
                      </p>
                      <p className="text-xs text-yellow-400/80">
                        💡 The number of questions will be determined by the number of links you provide
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Modal */}
      <AnimatePresence>
        {activeSlot && (
          <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" 
          onClick={() => {
            setActiveSlot(null);
            setSearchQuery('');
            setSearchResults([]);
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-lg mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Invite {activeSlot.type === 'host' ? `Host ${activeSlot.index}` : `Opponent ${activeSlot.index}`}
                </h3>
                <button
                  onClick={() => {
                    setActiveSlot(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by Codeforces handle..."
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="min-h-[200px] max-h-80">
                {searchResults.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto max-h-80 pr-2 custom-scrollbar">
                    {searchResults.map((result, index) => (
                      <motion.button
                        key={result.clerk_id || result.id || `search-result-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleInviteUser(result, `${activeSlot.type}${activeSlot.index}`)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-black/40 to-black/20 hover:from-blue-600/20 hover:to-purple-600/20 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/40 to-purple-600/40 flex items-center justify-center border border-white/10">
                            <span className="text-lg">👤</span>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                              {result.codeforces_handle}
                            </div>
                            <div className="text-xs text-gray-400">Codeforces User</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : searchQuery.trim().length >= 2 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                  </div>
                ) : searchQuery.trim().length < 2 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <span className="text-3xl">⌨️</span>
                    </div>
                    <p className="text-sm">Type at least 2 characters to search</p>
                  </div>
                ) : isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Searching...</p>
                  </div>
                ) : null}
              </div>
              
              <button
                onClick={() => {
                  setActiveSlot(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="mt-6 w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  )
}
