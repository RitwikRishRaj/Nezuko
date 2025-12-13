"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle, Code } from "lucide-react";

interface Submission {
  id: string;
  participant_clerk_id: string;
  problem_id: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error';
  score: number;
  submission_time: string;
}

interface SubmissionTrackerProps {
  sessionId: string;
  participantId?: string;
  problemId?: string;
}

export function SubmissionTracker({ sessionId, participantId, problemId }: SubmissionTrackerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = useApiClient();

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!sessionId) return;
      
      try {
        console.log('Loading submissions for session:', sessionId);
        const params = new URLSearchParams();
        if (participantId) params.append('participantId', participantId);
        if (problemId) params.append('problemId', problemId);
        
        const response = await apiClient.get(
          `${API_CONFIG.ENDPOINTS.ARENA.SUBMISSIONS}/${sessionId}?${params.toString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.submissions || []);
        } else {
          console.error('Failed to load submissions:', response.status);
        }
      } catch (error) {
        console.error('Error loading submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();

    // Set up real-time updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`submissions_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `arena_session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New submission event:', payload);
          loadSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, participantId, problemId, apiClient]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'wrong_answer':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'time_limit':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'runtime_error':
      case 'compilation_error':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Code className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'wrong_answer':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'time_limit':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'runtime_error':
      case 'compilation_error':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-foreground">Submissions</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-foreground">
            Recent Submissions
          </h3>
          <Badge variant="outline" className="ml-auto">
            {submissions.length} total
          </Badge>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {submissions.length > 0 ? (
          <div className="divide-y divide-border">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(submission.status)}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Problem {submission.problem_id}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(submission.status)}`}
                        >
                          {formatStatus(submission.status)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {formatTime(submission.submission_time)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      +{submission.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      points
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No submissions yet</p>
            <p className="text-sm">Start solving problems to see submissions here</p>
          </div>
        )}
      </div>
    </div>
  );
}