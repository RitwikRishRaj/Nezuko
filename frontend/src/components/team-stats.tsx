"use client"

import { User, Users } from "lucide-react"

type TeamMember = {
  id: string
  name: string
  points: number
  problemsSolved: number
  rank: number
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Johnson', points: 245, problemsSolved: 12, rank: 1 },
  { id: '2', name: 'Taylor Swift', points: 210, problemsSolved: 10, rank: 2 },
  { id: '3', name: 'Jordan Lee', points: 195, problemsSolved: 9, rank: 3 },
]

const OPPONENTS: TeamMember[] = [
  { id: 'o1', name: 'Casey Kim', points: 230, problemsSolved: 11, rank: 1 },
  { id: 'o2', name: 'Riley Park', points: 185, problemsSolved: 8, rank: 2 },
  { id: 'o3', name: 'Jamie Smith', points: 170, problemsSolved: 7, rank: 3 },
]

export function TeamStats() {
  const renderTable = (title: string, members: TeamMember[], isTeam: boolean) => (
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/10">
              <th className="px-4 py-2 text-left text-xs font-medium text-foreground uppercase">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-foreground uppercase">Name</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-foreground uppercase">Solved</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-foreground uppercase">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-secondary/10">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium bg-secondary text-foreground">
                    {members.indexOf(member) + 1}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                  {member.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground text-right">
                  {member.problemsSolved}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isTeam ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div>
        {renderTable('Team Stats', TEAM_MEMBERS, true)}
      </div>
      <div>
        {renderTable('Opponents', OPPONENTS, false)}
      </div>
    </div>
  )
}
