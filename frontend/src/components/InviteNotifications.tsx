"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function InviteNotifications() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const shownInvites = useRef<Set<string>>(new Set());
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkForInvites = async () => {
      try {
        const response = await fetch('/api/room/invites/check');
        if (!response.ok) return;

        const data = await response.json();
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
                      const res = await fetch('/api/room/invites/respond', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          inviteId: invite.id,
                          action: 'accept'
                        })
                      });

                      if (res.ok) {
                        toast.success('Invite accepted!');
                        const mode = invite.room_mode || 'team-vs-team';
                        router.push(`/room?id=${invite.room_id}&mode=${mode}`);
                      } else {
                        toast.error('Failed to accept invite');
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
                      const res = await fetch('/api/room/invites/respond', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          inviteId: invite.id,
                          action: 'reject'
                        })
                      });

                      if (res.ok) {
                        toast.info('Invite rejected');
                      } else {
                        toast.error('Failed to reject invite');
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
  }, [isLoaded, user, router]);

  return null;
}
