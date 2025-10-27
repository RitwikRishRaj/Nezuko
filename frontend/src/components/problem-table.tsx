"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Circle, ExternalLink } from "lucide-react"

interface Problem {
  id: string
  question: string
  url: string
  rating: number 
  timeSpent: string
  status: "correct" | "incorrect" | "blank"
  points: number
}

const SAMPLE_PROBLEMS: Problem[] = [
  {
    id: "1",
    question: "Two Sum",
    url: "https://codeforces.com/problemset/problem/1/A",
    rating: 800,
    timeSpent: "15 min",
    status: "blank",
    points: 0,
  },
  {
    id: "2",
    question: "Add Two Numbers",
    url: "https://codeforces.com/problemset/problem/1/B",
    rating: 1200,
    timeSpent: "45 min",
    status: "blank",
    points: 0,
  },
  {
    id: "3",
    question: "Longest Substring Without Repeating Characters",
    url: "https://codeforces.com/problemset/problem/1/C",
    rating: 1500,
    timeSpent: "32 min",
    status: "blank",
    points: 0,
  },
  {
    id: "4",
    question: "Median of Two Sorted Arrays",
    url: "https://codeforces.com/problemset/problem/1/D",
    rating: 2000,
    timeSpent: "—",
    status: "blank",
    points: 0,
  },
  {
    id: "5",
    question: "Reverse Integer",
    url: "https://codeforces.com/problemset/problem/1/E",
    rating: 1100,
    timeSpent: "8 min",
    status: "blank",
    points: 0,
  },
]

export function ProblemTable() {
  const [problems, setProblems] = useState<Problem[]>(SAMPLE_PROBLEMS)

  useEffect(() => {
    setProblems((prevProblems) =>
      prevProblems.map((p) => {
        if (p.timeSpent !== "—" && p.status === "blank") {
          return { ...p, status: "correct", points: Math.floor(p.rating / 100) }
        }
        return p
      }),
    )
  }, [])

  const getRatingColor = (rating: number) => {
    if (rating <= 1000) return "text-blue-400 bg-blue-400/10"
    if (rating <= 1400) return "text-green-400 bg-green-400/10"
    if (rating <= 1800) return "text-cyan-400 bg-cyan-400/10"
    if (rating <= 2200) return "text-yellow-400 bg-yellow-400/10"
    if (rating <= 2600) return "text-orange-400 bg-orange-400/10"
    return "text-red-400 bg-red-400/10"
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

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Question</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rating</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Time Spent</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Points</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr
                key={problem.id}
                className="border-b border-border hover:bg-secondary/20 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-accent transition-colors duration-200 font-medium"
                  >
                    {problem.question}
                    <ExternalLink className="w-4 h-4 opacity-60" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(problem.rating)}`}
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
