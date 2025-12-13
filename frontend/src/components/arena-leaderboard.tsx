"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock } from "lucide-react";

interface Participant {
  participant_clerk_id: string;
  participant_handle: string;
  team_type: 'host' | 'opponent';
  score: number;
  last_activity: string;
  problem_submissions: any[];
}

interface ArenaLeaderboardProps {
  sessionId: string;
  roomId: string;
}

export function ArenaLeaderboard({ sessionId, roomId }: ArenaLeaderboardProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = useApiClient();

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!sessionId) return;
      
      try {
        console.log('Loading leaderboard for session:', sessionId);
        const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ARENA.LEADERBOARD}/${sessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.leaderboard || []);
        } else {
          console.error('Failed to load leaderboard:', response.status);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();

    // Set up real-time updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`leaderboard_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_progress',
          filter: `arena_session_id=eq.${sessionId}`
        },
        () => {
          console.log('Participant progress updated, reloading leaderboard');
          loadLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `arena_session_id=eq.${sessionId}`
        },
        () => {
          console.log('New submission, reloading leaderboard');
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, apiClient]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hostParticipants = participants.filter(p => p.team_type === 'host');
  const opponentParticipants = participants.filter(p => p.team_type === 'opponent');
  
  const hostTotalScore = hostParticipants.reduce((sum, p) => sum + (p.score || 0), 0);
  const opponentTotalScore = opponentParticipants.reduce((sum, p) => sum + (p.score || 0), 0);

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-foreground">Live Leaderboard</h3>
        </div>
        
        {/* Team Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Host Team</span>
            </div>
            <div className="text-2xl font-bold text-blue-300">{hostTotalScore}</div>
            <div className="text-xs text-blue-400/70">{hostParticipants.length} members</div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Opponent Team</span>
            </div>
            <div className="text-2xl font-bold text-red-300">{opponentTotalScore}</div>
            <div className="text-xs text-red-400/70">{opponentParticipants.length} members</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {participants
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((participant, index) => (
              <div
                key={participant.participant_clerk_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  participant.team_type === 'host'
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {participant.participant_handle}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          participant.team_type === 'host'
                            ? 'border-blue-500/30 text-blue-400'
                            : 'border-red-500/30 text-red-400'
                        }`}
                      >
                        {participant.team_type === 'host' ? 'Host' : 'Opponent'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatLastActivity(participant.last_activity)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {participant.score || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(participant.problem_submissions || []).length} submissions
                  </div>
                </div>
              </div>
            ))}
          
          {participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No participants yet</p>
              <p className="text-sm">Waiting for players to join...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}