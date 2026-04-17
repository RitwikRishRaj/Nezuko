"use client";

import { ProblemTable } from "@/components/problem-table";
import { Leaderboard } from "@/components/leaderboard";
import { TeamStats } from "@/components/team-stats";
import { TeamChat } from "@/components/team-chat";
import { ArenaLeaderboard } from "@/components/arena-leaderboard";
import { SubmissionTracker } from "@/components/submission-tracker";
import { ProblemSubmission } from "@/components/problem-submission";
import AnimatedNumberCountdown from "@/components/countdown-number";
import { Clock, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import { useUser } from "@clerk/nextjs";

// Helper function to format duration
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

export default function ArenaPage() {
  const searchParams = useSearchParams();
  const apiClient = useApiClient();
  const { user } = useUser();
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [arenaSession, setArenaSession] = useState<any>(null);
  const [contestStatus, setContestStatus] = useState<'loading' | 'cooloff' | 'running' | 'ended'>('loading');
  const [cooloffSeconds, setCooloffSeconds] = useState(10);
  const [teamPoints, setTeamPoints] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const roomId = searchParams.get('roomId');
  const roomMode = arenaSession?.config?.room_mode || config?.room_mode || 'team-vs-team';
  const is1v1Mode = roomMode === '1v1';
  
  // Set the end date for the countdown (will be updated when config loads)
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 60);
    return date;
  });

  // Calculate team points based on mode
  const calculateTeamPoints = useCallback((participantsData: any[]) => {
    if (!participantsData || participantsData.length === 0) return 0;
    
    if (is1v1Mode) {
      // In 1v1, show current user's points
      const currentUserParticipant = participantsData.find(
        p => p.participant_clerk_id === user?.id
      );
      return currentUserParticipant?.score || currentUserParticipant?.final_score || 0;
    } else {
      // In team mode, show host team total
      const hostTeam = participantsData.filter(p => p.team_type === 'host');
      return hostTeam.reduce((sum, p) => sum + (p.score || p.final_score || 0), 0);
    }
  }, [is1v1Mode, user?.id]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cooloff countdown effect
  useEffect(() => {
    if (contestStatus === 'cooloff' && cooloffSeconds > 0) {
      const timer = setTimeout(() => {
        setCooloffSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (contestStatus === 'cooloff' && cooloffSeconds === 0) {
      setContestStatus('running');
      toast.success('Contest Started!', {
        description: 'Good luck!',
        duration: 3000,
      });
    }
  }, [contestStatus, cooloffSeconds]);

  useEffect(() => {
    const loadArena = async () => {
      if (!roomId) {
        console.error('No room ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Retry logic for arena session (in case it's still being created)
      const maxRetries = 5;
      let retryCount = 0;
      let arenaResponse;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Fetching arena session for room: ${roomId} (attempt ${retryCount + 1}/${maxRetries})`);
          arenaResponse = await apiClient.get(`${API_CONFIG.ENDPOINTS.ARENA.SESSION}/${roomId}`);
          
          if (arenaResponse.ok) {
            console.log('✅ Arena session found successfully!');
            break;
          }
        } catch (fetchError) {
          console.log(`💥 Arena session fetch error (attempt ${retryCount + 1}):`, fetchError);
        }
        
        // Log the response status if we got one
        if (arenaResponse) {
          console.log(`📊 Arena response status: ${arenaResponse.status}`);
          if (!arenaResponse.ok) {
            try {
              const errorText = await arenaResponse.text();
              console.log(`📊 Arena error response: ${errorText}`);
            } catch (e) {
              console.log('Could not read error response');
            }
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = retryCount * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      try {
        if (arenaResponse && arenaResponse.ok) {
          let arenaData;
          try {
            arenaData = await arenaResponse.json();
          } catch (jsonError) {
            console.error('Failed to parse arena response:', jsonError);
            throw new Error('Failed to load arena session');
          }
          
          const arenaSessionData = arenaData.session;
          console.log('Arena session loaded:', arenaSessionData);
          
          if (!arenaSessionData) {
            console.error('Arena response has no session data:', arenaData);
            throw new Error('Arena session data is empty');
          }
          
          setArenaSession(arenaSessionData);
          
          // Config is not stored in arena_sessions, fetch from room config if needed
          // For now, create a minimal config from the session data
          const sessionConfig = {
            minutes: arenaSessionData.end_time && arenaSessionData.start_time 
              ? Math.round((new Date(arenaSessionData.end_time).getTime() - new Date(arenaSessionData.start_time).getTime()) / 60000)
              : 60,
            room_mode: '1v1' // Default, will be updated from room state if available
          };
          setConfig(sessionConfig);
          
          // Load problems - check multiple sources
          console.log('🔍 Loading problems from arena session:', {
            use_custom_links: arenaSessionData.use_custom_links,
            questions_length: arenaSessionData.questions?.length || 0,
            custom_problem_links_length: arenaSessionData.custom_problem_links?.length || 0,
            questions: arenaSessionData.questions,
            custom_problem_links: arenaSessionData.custom_problem_links
          });
          
          if (arenaSessionData.use_custom_links && arenaSessionData.custom_problem_links && arenaSessionData.custom_problem_links.length > 0) {
            // Use custom problem links
            console.log('📋 Using custom problem links');
            const customProblems = arenaSessionData.custom_problem_links.map((link: string, index: number) => {
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
            setProblems(customProblems);
          } else if (arenaSessionData.questions && arenaSessionData.questions.length > 0) {
            // Use questions from session (could be pre-converted custom links or fetched questions)
            console.log('📋 Using questions from session');
            setProblems(arenaSessionData.questions);
          } else {
            console.warn('⚠️ No problems found in arena session');
            setProblems([]);
          }
          
          // Update countdown based on session timing
          const sessionStartTime = new Date(arenaSessionData.start_time);
          const contestDurationMinutes = arenaSessionData.config?.minutes || 60;
          
          let endTime;
          if (arenaSessionData.end_time) {
            endTime = new Date(arenaSessionData.end_time);
          } else {
            endTime = new Date(sessionStartTime);
            endTime.setMinutes(endTime.getMinutes() + contestDurationMinutes);
          }
          
          // Add 10 seconds cooloff to end time
          const cooloffEndTime = new Date(endTime);
          cooloffEndTime.setSeconds(cooloffEndTime.getSeconds() + 10);
          setEndDate(cooloffEndTime);
          
          // Determine contest status
          const now = new Date();
          if (now > endTime) {
            setContestStatus('ended');
          } else {
            // Start with cooloff
            setContestStatus('cooloff');
            setCooloffSeconds(10);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Fallback to room config
        console.log('❌ Arena session not found - trying room config fallback');
        
        try {
          const roomStateResponse = await apiClient.get(API_CONFIG.ENDPOINTS.ROOM.STATE, { roomId });
          
          if (roomStateResponse.ok) {
            const roomStateData = await roomStateResponse.json();
            const roomConfig = roomStateData.config;
            
            if (roomConfig && roomConfig.problems && roomConfig.problems.length > 0) {
              setProblems(roomConfig.problems);
              setConfig(roomConfig);
              
              if (roomConfig.minutes) {
                const now = new Date();
                const endTime = new Date(now);
                endTime.setMinutes(endTime.getMinutes() + roomConfig.minutes);
                endTime.setSeconds(endTime.getSeconds() + 10); // Add cooloff
                setEndDate(endTime);
                setContestStatus('cooloff');
                setCooloffSeconds(10);
              }
              
              setIsLoading(false);
              toast.warning('Using fallback mode', {
                description: 'Arena session not found, using room configuration.',
                duration: 5000,
              });
              return;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback to room config also failed:', fallbackError);
        }
        
        toast.error('Arena session not found', {
          description: 'Please try starting the game again.',
          duration: 8000,
        });
        
        setTimeout(() => {
          window.location.href = `/room?id=${roomId}`;
        }, 3000);
        
        setProblems([]);
        setIsLoading(false);

      } catch (error) {
        console.error('Error loading arena:', error);
        setProblems([]);
        toast.error('Failed to load arena session');
      } finally {
        setIsLoading(false);
      }
    };

    loadArena();
  }, [roomId, apiClient]);

  // Update team points when participants change
  useEffect(() => {
    setTeamPoints(calculateTeamPoints(participants));
  }, [participants, calculateTeamPoints]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Cooloff Overlay */}
      {contestStatus === 'cooloff' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{cooloffSeconds}</div>
            <div className="text-xl text-white/80">Get Ready!</div>
            <div className="text-sm text-white/60 mt-2">Contest starts in {cooloffSeconds} seconds</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center px-6 py-3">
              <div className="flex items-center gap-6">
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">Round</div>
                  <div className="text-xl">1 of 1</div>
                </div>
                <div className="h-10 w-px bg-border"></div>
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">
                    {is1v1Mode ? 'Your Points' : 'Team Points'}
                  </div>
                  <div className="text-xl">{teamPoints.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Contest Timer</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contestStatus === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    contestStatus === 'ended' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    contestStatus === 'cooloff' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {contestStatus === 'running' ? 'Live' : 
                     contestStatus === 'ended' ? 'Ended' : 
                     contestStatus === 'cooloff' ? 'Starting...' : 'Loading'}
                  </div>
                </div>
                {config && (
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatDuration(config.minutes)}
                  </div>
                )}
              </div>
              {contestStatus === 'cooloff' ? (
                <div className="text-2xl font-mono text-yellow-500">
                  Starting in {cooloffSeconds}s...
                </div>
              ) : (
                <AnimatedNumberCountdown 
                  endDate={endDate} 
                  autoStart={contestStatus === 'running'}
                  className="text-base"
                />
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <ProblemTable problems={problems} isLoading={isLoading} />
            </div>
            <TeamStats 
              roomMode={roomMode} 
              sessionId={arenaSession?.id}
              problems={problems}
              onParticipantsUpdate={setParticipants}
            />
            
            {/* Problem Submission Testing */}
            {arenaSession && problems.length > 0 && contestStatus === 'running' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Test Submissions</h3>
                <div className="grid gap-4">
                  {problems.slice(0, 2).map((problem: any) => (
                    <ProblemSubmission
                      key={problem.id}
                      problem={problem}
                      sessionId={arenaSession.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-1 space-y-6">
            {arenaSession ? (
              <>
                <ArenaLeaderboard 
                  sessionId={arenaSession.id} 
                  roomId={roomId!} 
                  roomMode={roomMode}
                />
                <SubmissionTracker sessionId={arenaSession.id} />
              </>
            ) : (
              <>
                <Leaderboard />
                <TeamChat />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
