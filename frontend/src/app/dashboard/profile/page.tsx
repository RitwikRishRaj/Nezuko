"use client"

import React, { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Award, 
  TrendingUp, 
  Settings, 
  Edit3,
  Save,
  X,
  ExternalLink,
  Star,
  Clock,
  Users,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { useApiClient } from "@/lib/api-client"
import { API_CONFIG } from "@/lib/api-config"

interface UserStats {
  totalContests: number
  wins: number
  losses: number
  winRate: number
  averageRating: number
  bestRank: number
  totalProblems: number
  favoriteCategory: string
}

interface UserProfile {
  codeforces_handle: string
  rating: number
  rank: string
  maxRating: number
  maxRank: string
  country: string
  organization: string
  contribution: number
  friendOfCount: number
  avatar: string
  registrationTime: string
  lastOnlineTime: string
}

const getRankColor = (rank: string) => {
  const colors: Record<string, string> = {
    Newbie: "text-gray-400",
    Pupil: "text-green-400",
    Specialist: "text-cyan-400",
    Expert: "text-blue-400",
    "Candidate Master": "text-violet-400",
    Master: "text-orange-400",
    "International Master": "text-orange-300",
    Grandmaster: "text-red-400",
    "International Grandmaster": "text-red-300",
    "Legendary Grandmaster": "text-red-500",
  }
  return colors[rank] || "text-gray-400"
}

export default function ProfilePage() {
  const { user } = useUser()
  const apiClient = useApiClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [editedHandle, setEditedHandle] = useState("")

  // Mock data for demonstration
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user profile data
      const mockProfile: UserProfile = {
        codeforces_handle: user?.username || "user123",
        rating: 1847,
        rank: "Expert",
        maxRating: 1923,
        maxRank: "Expert",
        country: "Unknown",
        organization: "Unknown",
        contribution: 42,
        friendOfCount: 156,
        avatar: `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=1f2937&color=ffffff&size=128`,
        registrationTime: "2022-01-15",
        lastOnlineTime: "2024-01-10"
      }
      
      // Mock user stats
      const mockStats: UserStats = {
        totalContests: 28,
        wins: 18,
        losses: 10,
        winRate: 64.3,
        averageRating: 1756,
        bestRank: 1,
        totalProblems: 342,
        favoriteCategory: "Dynamic Programming"
      }
      
      setUserProfile(mockProfile)
      setUserStats(mockStats)
      setEditedHandle(mockProfile.codeforces_handle)
      setIsLoading(false)
    }
    
    if (user) {
      loadUserData()
    }
  }, [user])

  const handleSaveProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          codeforces_handle: editedHandle
        })
      }
      
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }

  const handleCancelEdit = () => {
    setEditedHandle(userProfile?.codeforces_handle || "")
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!userProfile || !userStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-white/30 mb-4 mx-auto" />
          <p className="text-white/60">Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
              <p className="text-white/60">Manage your account and competitive programming stats</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              {/* Avatar and Basic Info */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={userProfile.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full ring-4 ring-white/20 mx-auto mb-4"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black" />
                </div>
                
                <div className="mb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editedHandle}
                        onChange={(e) => setEditedHandle(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-center focus:outline-none focus:border-blue-500/50"
                        placeholder="Codeforces Handle"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white mb-1">
                        {userProfile.codeforces_handle}
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-medium ${getRankColor(userProfile.rank)}`}>
                          {userProfile.rank}
                        </span>
                        <span className="text-white/60">•</span>
                        <span className="text-white/80">{userProfile.rating}</span>
                      </div>
                    </>
                  )}
                </div>

                <a
                  href={`https://codeforces.com/profile/${userProfile.codeforces_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Codeforces
                </a>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Max Rating</span>
                  <span className="text-white font-medium">{userProfile.maxRating}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Contribution</span>
                  <span className="text-white font-medium">+{userProfile.contribution}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-white/60">Friends</span>
                  <span className="text-white font-medium">{userProfile.friendOfCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/60">Registered</span>
                  <span className="text-white font-medium">
                    {new Date(userProfile.registrationTime).getFullYear()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contest Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Contest Statistics</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{userStats.totalContests}</div>
                  <div className="text-sm text-white/60">Total Contests</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{userStats.wins}</div>
                  <div className="text-sm text-white/60">Wins</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{userStats.winRate}%</div>
                  <div className="text-sm text-white/60">Win Rate</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">#{userStats.bestRank}</div>
                  <div className="text-sm text-white/60">Best Rank</div>
                </div>
              </div>
            </motion.div>

            {/* Problem Solving Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Problem Solving</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-white/80 font-medium">Total Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.totalProblems}</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium">Avg Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.averageRating}</div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-white/80 font-medium">Favorite</span>
                  </div>
                  <div className="text-sm font-bold text-white">{userStats.favoriteCategory}</div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              </div>

              <div className="space-y-4">
                {[
                  { action: "Solved Problem 1847A", time: "2 hours ago", type: "solve" },
                  { action: "Participated in Contest #912", time: "1 day ago", type: "contest" },
                  { action: "Achieved Expert rank", time: "3 days ago", type: "achievement" },
                  { action: "Solved 50 problems milestone", time: "1 week ago", type: "milestone" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'solve' ? 'bg-green-500/20' :
                      activity.type === 'contest' ? 'bg-blue-500/20' :
                      activity.type === 'achievement' ? 'bg-yellow-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      {activity.type === 'solve' && <Target className="w-4 h-4 text-green-400" />}
                      {activity.type === 'contest' && <Users className="w-4 h-4 text-blue-400" />}
                      {activity.type === 'achievement' && <Award className="w-4 h-4 text-yellow-400" />}
                      {activity.type === 'milestone' && <Star className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-white/60 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}