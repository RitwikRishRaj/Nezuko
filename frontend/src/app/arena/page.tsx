"use client";

import { ProblemTable } from "@/components/problem-table";
import { Leaderboard } from "@/components/leaderboard";
import { TeamStats } from "@/components/team-stats";
import { TeamChat } from "@/components/team-chat";
import { ArenaLeaderboard } from "@/components/arena-leaderboard";
import { SubmissionTracker } from "@/components/submission-tracker";
import { ProblemSubmission } from "@/components/problem-submission";
import AnimatedNumberCountdown from "@/components/countdown-number";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";

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
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [arenaSession, setArenaSession] = useState<any>(null);
  const [contestStatus, setContestStatus] = useState<'not-started' | 'running' | 'ended'>('not-started');
  
  const roomId = searchParams.get('roomId');
  
  // Set the end date for the countdown (will be updated when config loads)
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 60);
    return date;
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadArena = async () => {
      if (!roomId) {
        console.error('No room ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Retry logic for arena session (in case it's still being created)
      const maxRetries = 3;
      let retryCount = 0;
      let arenaResponse;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Fetching arena session for room: ${roomId} (attempt ${retryCount + 1}/${maxRetries})`);
          arenaResponse = await apiClient.get(`${API_CONFIG.ENDPOINTS.ARENA.SESSION}/${roomId}`);
          
          console.log('Arena response status:', arenaResponse.status);
          if (arenaResponse.ok) {
            break; // Success, exit retry loop
          } else {
            const errorText = await arenaResponse.text();
            console.log(`Arena session fetch failed (attempt ${retryCount + 1}):`, errorText);
          }
        } catch (fetchError) {
          console.log(`Arena session fetch error (attempt ${retryCount + 1}):`, fetchError);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying in 1 second... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      try {
        if (arenaResponse && arenaResponse.ok) {
          // Arena session exists - use it
          let arenaData;
          try {
            arenaData = await arenaResponse.json();
          } catch (jsonError) {
            console.error('Failed to parse arena response:', jsonError);
            throw new Error('Failed to load arena session');
          }
          
          const arenaSessionData = arenaData.session;
          console.log('Arena session loaded:', arenaSessionData);
          
          setArenaSession(arenaSessionData);
          setConfig(arenaSessionData.config);
          
          // Check if using custom problem links from arena session
          console.log('Arena session data check:', {
            use_custom_links: arenaSessionData.use_custom_links,
            custom_problem_links: arenaSessionData.custom_problem_links,
            custom_links_length: arenaSessionData.custom_problem_links?.length,
            questionsLength: arenaSessionData.questions?.length || 0,
            fullSessionData: arenaSessionData
          });
          
          // Check if using custom problem links
          if (arenaSessionData.use_custom_links) {
            console.log('🎯 Custom links mode detected');
            
            // First priority: Use pre-processed questions from room page
            if (arenaSessionData.questions && arenaSessionData.questions.length > 0) {
              console.log('✅ Using pre-processed custom questions from arena session:', arenaSessionData.questions.length, 'problems');
              setProblems(arenaSessionData.questions);
            }
            // Fallback: Process custom_problem_links if questions array is empty
            else if (arenaSessionData.custom_problem_links && arenaSessionData.custom_problem_links.length > 0) {
              console.log('⚠️ Fallback: Processing custom problem links in arena:', arenaSessionData.custom_problem_links);
              
              // Convert custom links to problem objects
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
              console.log('🎯 Set fallback custom problems in arena:', customProblems.length, 'problems');
            } else {
              console.error('❌ Custom links enabled but no questions or links found');
              setProblems([]);
            }
          } else {
            // Use regular questions from arena session
            console.log('📝 Using regular questions from arena session:', arenaSessionData.questions?.length || 0, 'questions');
            setProblems(arenaSessionData.questions || []);
          }
          
          // Update countdown based on session end time
          if (arenaSessionData.end_time) {
            console.log('🕒 Using session end time:', arenaSessionData.end_time);
            const endTime = new Date(arenaSessionData.end_time);
            setEndDate(endTime);
            
            // Determine contest status based on session times
            const now = new Date();
            const startTime = new Date(arenaSessionData.start_time);
            
            if (now < startTime) {
              setContestStatus('not-started');
            } else if (now > endTime) {
              setContestStatus('ended');
            } else {
              setContestStatus('running');
            }
          } else {
            // Fallback to config minutes - calculate from session start time
            const sessionStartTime = arenaSessionData.start_time ? new Date(arenaSessionData.start_time) : new Date();
            const contestDurationMinutes = arenaSessionData.config?.minutes || 60;
            
            console.log('🕒 Calculating end time from session start:', {
              startTime: sessionStartTime,
              durationMinutes: contestDurationMinutes
            });
            
            const endTime = new Date(sessionStartTime);
            endTime.setMinutes(endTime.getMinutes() + contestDurationMinutes);
            setEndDate(endTime);
            
            // Determine contest status
            const now = new Date();
            if (now < sessionStartTime) {
              setContestStatus('not-started');
            } else if (now > endTime) {
              setContestStatus('ended');
            } else {
              setContestStatus('running');
            }
          }
          
          setIsLoading(false);
          return;
        }
        
        // Fallback to room config if arena session doesn't exist
        console.log('Arena session not found, falling back to room config');
        const configResponse = await apiClient.get(API_CONFIG.ENDPOINTS.ROOM.CONFIG, { roomId });
        
        if (!configResponse.ok) {
          throw new Error('Failed to load room configuration');
        }

        let configData;
        try {
          configData = await configResponse.json();
        } catch (jsonError) {
          console.error('Failed to parse config response:', jsonError);
          throw new Error('Failed to load room configuration');
        }
        const roomConfig = configData.config;
        setConfig(roomConfig);

        // Update countdown end date from room config
        const contestDurationMinutes = roomConfig.minutes || 60;
        console.log('🕒 Setting countdown from room config:', {
          durationMinutes: contestDurationMinutes
        });
        
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() + contestDurationMinutes);
        setEndDate(endTime);
        
        // Set contest as running since we're in fallback mode
        setContestStatus('running');

        // Check if using custom problem links (from room config database)
        console.log('🔍 Arena session not found, checking room config for custom links...');
        console.log('🔍 Room config custom links data:', {
          use_custom_links: roomConfig.use_custom_links,
          custom_problem_links: roomConfig.custom_problem_links,
          linksLength: roomConfig.custom_problem_links?.length || 0
        });
        
        let customLinksData = null;
        
        if (roomConfig.use_custom_links && roomConfig.custom_problem_links && roomConfig.custom_problem_links.length > 0) {
          console.log('✅ Found custom links in room config:', roomConfig.custom_problem_links);
          customLinksData = {
            useCustomLinks: true,
            links: roomConfig.custom_problem_links
          };
        } else {
          console.log('❌ No custom links found in room config');
        }

        if (customLinksData && customLinksData.useCustomLinks && customLinksData.links && customLinksData.links.length > 0) {
          console.log('Using custom problem links:', customLinksData.links);
          
          // Convert custom links to problem objects
          const customProblems = customLinksData.links.map((link: string, index: number) => {
            // Extract problem info from Codeforces URL
            const urlMatch = link.match(/codeforces\.com\/(?:contest|problemset\/problem)\/(\d+)\/([A-Z]\d*)/);
            if (urlMatch) {
              const [, contestId, problemIndex] = urlMatch;
              return {
                id: `custom_${index}`,
                name: `Problem ${problemIndex}`,
                contestId: parseInt(contestId),
                index: problemIndex,
                rating: 0, // Set to 0 for custom problems since we don't know the rating
                tags: [],
                url: link,
                solvedCount: null
              };
            } else {
              // Fallback for invalid URLs
              return {
                id: `custom_${index}`,
                name: `Custom Problem ${index + 1}`,
                contestId: null,
                index: null,
                rating: 0, // Set to 0 for custom problems since we don't know the rating
                tags: [],
                url: link,
                solvedCount: null
              };
            }
          });
          
          setProblems(customProblems);
          setIsLoading(false);
          return;
        }

        // Check if problems are already fetched and stored
        if (roomConfig.problems && roomConfig.problems.length > 0) {
          console.log('Using cached problems from database');
          setProblems(roomConfig.problems);
          setIsLoading(false);
          return;
        }

        // Fetch new problems as fallback
        const params = new URLSearchParams({
          count: roomConfig.question_count.toString(),
        });

        if (roomConfig.min_rating) params.append('minRating', roomConfig.min_rating.toString());
        if (roomConfig.max_rating) params.append('maxRating', roomConfig.max_rating.toString());
        
        if (!roomConfig.is_random_tags && roomConfig.tags && roomConfig.tags.length > 0) {
          params.append('tags', roomConfig.tags.join(','));
        }

        const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.QUESTIONS.FETCH}?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to fetch questions');
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse questions response:', jsonError);
          throw new Error('Server returned invalid response');
        }
        const fetchedProblems = data.problems || [];
        console.log('Questions fetched successfully:', fetchedProblems.length, 'problems');
        
        // Check if fewer problems were fetched than requested
        if (fetchedProblems.length < roomConfig.question_count) {
          const tagsText = roomConfig.tags && roomConfig.tags.length > 0 
            ? `tags: ${roomConfig.tags.join(', ')}` 
            : 'no specific tags';
          const ratingText = roomConfig.min_rating && roomConfig.max_rating
            ? `rating range: ${roomConfig.min_rating}-${roomConfig.max_rating}`
            : 'any rating';
          
          toast.warning('Limited Questions Available', {
            description: `Only ${fetchedProblems.length} out of ${roomConfig.question_count} questions found with ${tagsText} and ${ratingText}.`,
            duration: 8000,
            position: 'top-right',
          });
        }
        
        setProblems(fetchedProblems);

      } catch (error) {
        console.error('Error loading arena:', error);
        setProblems([]);
        toast.error('Failed to load arena session', {
          description: 'Please try refreshing the page or contact support.',
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadArena();
  }, [roomId]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center px-6 py-3">
              <div className="flex items-center gap-6">
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">Round</div>
                  <div className="text-xl">1 of 2</div>
                </div>
                <div className="h-10 w-px bg-border"></div>
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">Team Points</div>
                  <div className="text-xl">1,245</div>
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
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {contestStatus === 'running' ? 'Live' : 
                     contestStatus === 'ended' ? 'Ended' : 'Starting Soon'}
                  </div>
                </div>
                {config && (
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatDuration(config.minutes)}
                  </div>
                )}
              </div>
              <AnimatedNumberCountdown 
                endDate={endDate} 
                autoStart={true}
                className="text-base"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <ProblemTable problems={problems} isLoading={isLoading} />
            </div>
            <TeamStats />
            
            {/* Problem Submission Testing - Only show if arena session exists */}
            {arenaSession && problems.length > 0 && (
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
                <ArenaLeaderboard sessionId={arenaSession.id} roomId={roomId!} />
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