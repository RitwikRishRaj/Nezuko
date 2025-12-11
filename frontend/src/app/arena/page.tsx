"use client";

import { ProblemTable } from "@/components/problem-table";
import { Leaderboard } from "@/components/leaderboard";
import { TeamStats } from "@/components/team-stats";
import { TeamChat } from "@/components/team-chat";
import AnimatedNumberCountdown from "@/components/countdown-number";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";

export default function ArenaPage() {
  const searchParams = useSearchParams();
  const apiClient = useApiClient();
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  
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
      try {
        // Fetch room configuration
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

        // Update countdown end date
        const date = new Date();
        date.setMinutes(date.getMinutes() + roomConfig.minutes);
        setEndDate(date);

        // Check if using custom problem links (from database or localStorage fallback)
        let customLinksData = null;
        
        if (roomConfig.use_custom_links && roomConfig.custom_problem_links && roomConfig.custom_problem_links.length > 0) {
          customLinksData = {
            links: roomConfig.custom_problem_links,
            useCustomLinks: roomConfig.use_custom_links
          };
        } else {
          // Fallback to localStorage
          const storedLinks = localStorage.getItem(`room_${roomId}_custom_links`);
          if (storedLinks) {
            try {
              customLinksData = JSON.parse(storedLinks);
            } catch (e) {
              console.error('Failed to parse stored custom links:', e);
            }
          }
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

        // Fetch new problems
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

        // Save problems to database for other participants
        await apiClient.post(API_CONFIG.ENDPOINTS.ROOM.CONFIG, {
          ...roomConfig,
          roomId,
          problems: fetchedProblems
        });

      } catch (error) {
        console.error('Error loading arena:', error);
        setProblems([]);
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
            <div className="px-6 py-3">
              <AnimatedNumberCountdown 
                endDate={endDate} 
                autoStart={false}
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
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Leaderboard />
            <TeamChat />
          </div>
        </div>
      </div>
    </main>
  );
}