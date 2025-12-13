"use client";

import { useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface Problem {
  id: string;
  name: string;
  contestId?: number;
  index?: string;
  rating?: number;
  url?: string;
}

interface ProblemSubmissionProps {
  problem: Problem;
  sessionId?: string;
}

export function ProblemSubmission({ problem, sessionId }: ProblemSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const apiClient = useApiClient();

  const handleSubmit = async (status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error') => {
    if (!sessionId) {
      toast.error('No active session found');
      return;
    }

    setIsSubmitting(true);
    try {
      const score = status === 'accepted' ? 100 : 0; // Simple scoring
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ARENA.SUBMIT, {
        sessionId,
        problemId: problem.id,
        status,
        score
      });

      if (response.ok) {
        const data = await response.json();
        setLastSubmission(data.submission);
        
        if (status === 'accepted') {
          toast.success('Solution accepted!', {
            description: `+${score} points for ${problem.name}`
          });
        } else {
          toast.error('Solution rejected', {
            description: `${status.replace('_', ' ')} for ${problem.name}`
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error('Submission failed', {
          description: errorData.error || 'Please try again'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed', {
        description: 'Network error, please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        return null;
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

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{problem.name}</h3>
          {problem.rating && (
            <Badge variant="outline" className="mt-1">
              {problem.rating}
            </Badge>
          )}
        </div>
        
        {problem.url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(problem.url, '_blank')}
          >
            Open Problem
          </Button>
        )}
      </div>

      {lastSubmission && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/50">
          <div className="flex items-center gap-2">
            {getStatusIcon(lastSubmission.status)}
            <span className="text-sm font-medium">Last Submission:</span>
            <Badge className={getStatusColor(lastSubmission.status)}>
              {lastSubmission.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground ml-auto">
              +{lastSubmission.score} points
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-3">
          Simulate submission result:
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleSubmit('accepted')}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {isSubmitting ? <Send className="w-4 h-4 animate-pulse" /> : <CheckCircle className="w-4 h-4" />}
            Accept
          </Button>
          
          <Button
            onClick={() => handleSubmit('wrong_answer')}
            disabled={isSubmitting}
            variant="destructive"
            size="sm"
          >
            {isSubmitting ? <Send className="w-4 h-4 animate-pulse" /> : <XCircle className="w-4 h-4" />}
            Wrong Answer
          </Button>
          
          <Button
            onClick={() => handleSubmit('time_limit')}
            disabled={isSubmitting}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
          >
            {isSubmitting ? <Send className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
            Time Limit
          </Button>
          
          <Button
            onClick={() => handleSubmit('runtime_error')}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            {isSubmitting ? <Send className="w-4 h-4 animate-pulse" /> : <AlertCircle className="w-4 h-4" />}
            Runtime Error
          </Button>
        </div>
      </div>
    </div>
  );
}