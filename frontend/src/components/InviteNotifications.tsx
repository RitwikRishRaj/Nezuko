"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useApiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/api-config';

export function InviteNotifications() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const apiClient = useApiClient();
  const shownInvites = useRef<Set<string>>(new Set());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkForInvites = async () => {
      try {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ROOM.INVITES_CHECK);
        if (!response.ok) return;

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse invite check response:', jsonError);
          return;
        }
        const invites = data.invites || [];

        invites.forEach((invite: any) => {
          // Only show toast if we haven't shown it before
          if (!shownInvites.current.has(invite.id)) {
            shownInvites.current.add(invite.id);
            
            toast(
              `Room Invite from ${invite.inviter_handle}`,
              {
                description: `You've been invited to join as ${invite.slot_type === 'host' ? 'Host' : 'Opponent'} ${invite.slot.replace(/\D/g, '')}`,
                duration: 30000, // 30 seconds
                action: {
                  label: 'Accept',
                  onClick: async () => {
                    try {
                      const res = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.INVITES_RESPOND, {
                        roomId: invite.room_id,
                        response: 'accept'
                      });

                      if (res.ok) {
                        toast.success('Invite accepted!');
                        const mode = invite.room_mode || 'team-vs-team';
                        router.push(`/room?id=${invite.room_id}&mode=${mode}`);
                      } else {
                        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                        toast.error('Failed to accept invite: ' + (errorData.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error accepting invite:', error);
                      toast.error('Failed to accept invite');
                    }
                  }
                },
                cancel: {
                  label: 'Reject',
                  onClick: async () => {
                    try {
                      const res = await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.INVITES_RESPOND, {
                        roomId: invite.room_id,
                        response: 'reject'
                      });

                      if (res.ok) {
                        toast.info('Invite rejected');
                      } else {
                        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                        toast.error('Failed to reject invite: ' + (errorData.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error rejecting invite:', error);
                      toast.error('Failed to reject invite');
                    }
                  }
                }
              }
            );
          }
        });
      } catch (error) {
        console.error('Error checking invites:', error);
      }
    };

    // Check immediately
    checkForInvites();

    // Then check every 5 seconds
    checkInterval.current = setInterval(checkForInvites, 5000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [isLoaded, user, router, apiClient]);

  return null;
}
