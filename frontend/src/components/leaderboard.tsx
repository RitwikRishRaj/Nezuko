"use client"

import { Trophy } from "lucide-react"

type LeaderboardUser = {
  id: string
  name: string
  points: number
  rank: number
  avatar?: string
}

const SAMPLE_LEADERS: LeaderboardUser[] = [
  { id: '1', name: 'Alex Johnson', points: 1245, rank: 1 },
  { id: '2', name: 'Taylor Swift', points: 1180, rank: 2 },
  { id: '3', name: 'Jordan Lee', points: 1095, rank: 3 },
]

export function Leaderboard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-2 border-b border-border bg-secondary/30">
        <h2 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
          <Trophy className="w-4.5 h-4.5 text-yellow-500" />
          Leaderboard
        </h2>
      </div>
      <div className="divide-y divide-border">
        {SAMPLE_LEADERS.map((user) => (
          <div key={user.id} className="py-3 px-4 hover:bg-secondary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[0.95rem] font-medium">
                  {user.rank}
                </div>
                <span className="text-[0.95rem] font-medium text-foreground">{user.name}</span>
              </div>
              <span className="text-[0.95rem] font-semibold text-accent">
                {user.points} <span className="text-xs opacity-80">pts</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
