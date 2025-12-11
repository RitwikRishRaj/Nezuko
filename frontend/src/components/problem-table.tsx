"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Circle, ExternalLink, Loader2 } from "lucide-react"

interface Problem {
  id?: string
  contestId?: number
  index?: string
  name?: string
  question?: string
  url?: string
  rating?: number 
  timeSpent?: string
  status?: "correct" | "incorrect" | "blank"
  points?: number
  tags?: string[]
}

interface ProblemTableProps {
  problems?: Problem[]
  isLoading?: boolean
}

export function ProblemTable({ problems: externalProblems, isLoading }: ProblemTableProps) {
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    if (externalProblems && externalProblems.length > 0) {
      // Transform Codeforces API format to our format
      const transformedProblems = externalProblems.map((p, index) => ({
        id: p.id || `${p.contestId}-${p.index}`,
        question: p.name || p.question || 'Unknown Problem',
        url: p.url || `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        rating: p.rating || 0,
        timeSpent: p.timeSpent || "—",
        status: (p.status || "blank") as "correct" | "incorrect" | "blank",
        points: p.points || 0,
      }));
      setProblems(transformedProblems);
    }
  }, [externalProblems])



  const getSerialColor = (index: number) => {
    const colors = [
      "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "bg-green-500/20 text-green-400 border border-green-500/30",
      "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      "bg-pink-500/20 text-pink-400 border border-pink-500/30",
      "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      "bg-red-500/20 text-red-400 border border-red-500/30",
    ];
    return colors[index % colors.length];
  }

  const getRatingColor = (rating: number) => {
    if (rating <= 1000) return "text-blue-400 bg-blue-500/10 border border-blue-500/30"
    if (rating <= 1400) return "text-green-400 bg-green-500/10 border border-green-500/30"
    if (rating <= 1800) return "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
    if (rating <= 2200) return "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30"
    if (rating <= 2600) return "text-orange-400 bg-orange-500/10 border border-orange-500/30"
    return "text-red-400 bg-red-500/10 border border-red-500/30"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case "incorrect":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "blank":
        return <Circle className="w-5 h-5 text-gray-500" />
      default:
        return null
    }
  }

  const totalPoints = problems.reduce((sum, p) => sum + p.points, 0)

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading problems...</span>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">No problems found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-4 text-center text-sm font-semibold text-foreground w-16">#</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Question</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rating</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Time Spent</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Points</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr
                key={problem.id}
                className="border-b border-border hover:bg-secondary/20 transition-colors duration-200"
              >
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getSerialColor(index)}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-white/80 transition-colors duration-200 font-medium group"
                  >
                    {problem.question}
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getRatingColor(problem.rating)}`}
                  >
                    {problem.rating}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground font-medium">{problem.timeSpent}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center items-center">{getStatusIcon(problem.status)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-bold text-lg ${problem.points > 0 ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {problem.points}
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
