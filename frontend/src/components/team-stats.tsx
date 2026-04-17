"use client"

import { User, Users, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useApiClient } from "@/lib/api-client"

type TeamMember = {
  id: string
  name: string
  points: number
  problemsAttended: string[] // Array of problem indices like ['A', 'B', 'C']
  rank: number
}

interface TeamStatsProps {
  roomMode?: '1v1' | 'team-vs-team'
  sessionId?: string
  problems?: any[]
  onParticipantsUpdate?: (participants: any[]) => void
}

export function TeamStats({ 
  roomMode = 'team-vs-team', 
  sessionId, 
  problems = [],
  onParticipantsUpdate 
}: TeamStatsProps) {
  const apiClient = useApiClient()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [opponents, setOpponents] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const is1v1Mode = roomMode === '1v1'

  // Generate problem labels (A, B, C, D, etc.)
  const problemLabels = problems.map((_, index) => String.fromCharCode(65 + index))

  // Fetch team stats data
  useEffect(() => {
    const fetchTeamStats = async () => {
      if (!sessionId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching participants for session:', sessionId)
        const participantsResponse = await apiClient.get(`/api/arena/session/${sessionId}/participants`)
        
        if (!participantsResponse.ok) {
          const errorText = await participantsResponse.text()
          console.error('Failed to fetch participants:', errorText)
          throw new Error(`Failed to fetch participants: ${participantsResponse.status}`)
        }

        const participantsData = await participantsResponse.json()
        const participants = participantsData.participants || []

        console.log('Fetched participants:', participants)

        // Notify parent of participants update
        if (onParticipantsUpdate) {
          onParticipantsUpdate(participants)
        }

        // Helper to extract attended problems from submissions
        const getAttendedProblems = (participant: any): string[] => {
          const submissions = participant.problem_submissions || []
          const attendedIndices = new Set<string>()
          
          submissions.forEach((sub: any) => {
            // Find the problem index from the submission
            const problemIndex = problems.findIndex(
              (p: any) => p.id === sub.problem_id || 
                         (p.contestId === sub.contest_id && p.index === sub.problem_index)
            )
            if (problemIndex !== -1) {
              attendedIndices.add(String.fromCharCode(65 + problemIndex))
            }
          })
          
          return Array.from(attendedIndices).sort()
        }

        // Separate participants by team type
        const hostTeam = participants
          .filter((p: any) => p.team_type === 'host')
          .sort((a: any, b: any) => (b.final_score || b.score || 0) - (a.final_score || a.score || 0))
          .map((p: any, index: number) => ({
            id: p.participant_clerk_id,
            name: p.participant_handle || 'Unknown',
            points: p.final_score || p.score || 0,
            problemsAttended: getAttendedProblems(p),
            rank: index + 1
          }))

        const opponentTeam = participants
          .filter((p: any) => p.team_type === 'opponent')
          .sort((a: any, b: any) => (b.final_score || b.score || 0) - (a.final_score || a.score || 0))
          .map((p: any, index: number) => ({
            id: p.participant_clerk_id,
            name: p.participant_handle || 'Unknown',
            points: p.final_score || p.score || 0,
            problemsAttended: getAttendedProblems(p),
            rank: index + 1
          }))

        setTeamMembers(hostTeam)
        setOpponents(opponentTeam)
        setLastUpdated(new Date())

      } catch (err) {
        console.error('Error fetching team stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load team stats')
        setTeamMembers([])
        setOpponents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamStats()

    // Real-time polling every 5 seconds
    const interval = setInterval(fetchTeamStats, 5000)
    return () => clearInterval(interval)
  }, [sessionId, apiClient, problems, onParticipantsUpdate])
  
  const renderTable = (title: string, members: TeamMember[], isTeam: boolean) => {
    // Loading state
    if (isLoading) {
      return (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg h-full">
          <div className="px-4 h-12 flex items-center border-b border-border bg-secondary/30">
            <h3 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
              {isTeam ? (
                <Users className="w-4.5 h-4.5 text-blue-500" />
              ) : (
                <User className="w-4.5 h-4.5 text-rose-500" />
              )}
              {title}
            </h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      )
    }

    // Error state
    if (error) {
      return (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg h-full">
          <div className="px-4 h-12 flex items-center border-b border-border bg-secondary/30">
            <h3 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
              {isTeam ? (
                <Users className="w-4.5 h-4.5 text-blue-500" />
              ) : (
                <User className="w-4.5 h-4.5 text-rose-500" />
              )}
              {title}
            </h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Failed to load</p>
          </div>
        </div>
      )
    }

    // Empty state
    if (members.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg h-full">
          <div className="px-4 h-12 flex items-center justify-between border-b border-border bg-secondary/30">
            <h3 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
              {isTeam ? (
                <Users className="w-4.5 h-4.5 text-blue-500" />
              ) : (
                <User className="w-4.5 h-4.5 text-rose-500" />
              )}
              {title}
            </h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No participants yet</p>
            </div>
          </div>
        </div>
      )
    }

    // For 1v1 mode, blur the team stats section
    const shouldBlur = is1v1Mode && isTeam

    return (
      <div className={`bg-card border border-border rounded-lg overflow-hidden shadow-lg h-full relative`}>
        {/* Blur overlay for team stats in 1v1 mode */}
        {shouldBlur && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center p-4">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground font-medium">
                Team stats not available in 1v1 mode
              </p>
            </div>
          </div>
        )}
        
        <div className="px-4 h-12 flex items-center justify-between border-b border-border bg-secondary/30">
          <h3 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
            {isTeam ? (
              <Users className="w-4.5 h-4.5 text-blue-500" />
            ) : (
              <User className="w-4.5 h-4.5 text-rose-500" />
            )}
            {is1v1Mode && !isTeam ? 'Opponent Stats' : title}
          </h3>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="px-4 py-2 text-left text-xs font-medium text-foreground uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-foreground uppercase">Name</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-foreground uppercase">Questions</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-foreground uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member, idx) => (
                <tr key={member.id} className="hover:bg-secondary/10">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium bg-secondary text-foreground">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                    {member.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      {problemLabels.map((label) => (
                        <span
                          key={label}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                            member.problemsAttended.includes(label)
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isTeam ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                             : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                    }`}>
                      {member.points} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div>
        {renderTable(is1v1Mode ? 'Your Stats' : 'Team Stats', teamMembers, true)}
      </div>
      <div>
        {renderTable(is1v1Mode ? 'Opponent Stats' : 'Opponents', opponents, false)}
      </div>
    </div>
  )
}
