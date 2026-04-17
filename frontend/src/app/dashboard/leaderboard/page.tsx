"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Star, RefreshCw, Users } from 'lucide-react';
import { useApiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/api-config';
import { toast } from 'sonner';
import { LeaderboardSkeleton } from '@/components/ui/leaderboard-skeleton';

interface LeaderboardEntry {
  clerk_id: string;
  codeforces_handle?: string;
  current_rating?: number;
  peak_rating?: number;
  contests_participated?: number;
  total_points?: number;
  arena_wins?: number;
  rank?: number;
}


const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const apiClient = useApiClient();

  const fetchLeaderboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.POINTS.LEADERBOARD_RATING, { limit: '50' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      console.log('Leaderboard data:', data);
      
      if (!data) {
        console.warn('No data received from leaderboard API');
        setLeaderboardData([]);
        return;
      }
      
      if (!data.leaderboard) {
        console.warn('No leaderboard property in response:', data);
        setLeaderboardData([]);
        return;
      }
      
      if (!Array.isArray(data.leaderboard)) {
        console.warn('Leaderboard data is not an array:', typeof data.leaderboard, data.leaderboard);
        setLeaderboardData([]);
        return;
      }
      
      // Add rank to each entry and filter out invalid entries
      const validEntries = (data.leaderboard || []).filter((entry: LeaderboardEntry) => 
        entry.clerk_id && (entry.codeforces_handle || entry.clerk_id)
      );
      
      const rankedData = validEntries.map((entry: LeaderboardEntry, index: number) => ({
        ...entry,
        rank: index + 1,
        codeforces_handle: entry.codeforces_handle || `User_${entry.clerk_id.slice(-4)}`,
        current_rating: entry.current_rating || 0,
        peak_rating: entry.peak_rating || 0,
        contests_participated: entry.contests_participated || 0,
        total_points: entry.total_points || 0,
        arena_wins: entry.arena_wins || 0
      }));
      
      setLeaderboardData(rankedData);
      
      if (rankedData.length === 0) {
        console.log('No valid entries found for leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      toast.error('Failed to load leaderboard data');
      setLeaderboardData([]); // Clear data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-white/60 font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
      case 2:
        return 'from-gray-300/20 to-gray-500/20 border-gray-300/30';
      case 3:
        return 'from-amber-600/20 to-amber-800/20 border-amber-600/30';
      default:
        return 'from-white/5 to-white/10 border-white/10';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return 'text-red-400';
    if (rating >= 2100) return 'text-orange-400';
    if (rating >= 1900) return 'text-purple-400';
    if (rating >= 1600) return 'text-blue-400';
    if (rating >= 1400) return 'text-cyan-400';
    if (rating >= 1200) return 'text-green-400';
    return 'text-gray-400';
  };


  const entryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white/80 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-white/60">See how you rank against other competitive programmers</p>
        </motion.div>



        {/* Leaderboard Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
        >
          {loading ? (
            <LeaderboardSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-red-400 mb-2">⚠️ Error loading leaderboard</div>
              <div className="text-white/60 text-sm mb-4">{error}</div>
              <button
                onClick={() => fetchLeaderboard()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Trophy className="w-16 h-16 text-white/20 mb-4" />
              <div className="text-white/60 text-center">
                <div className="text-lg mb-2">No leaderboard data available</div>
                <div className="text-sm text-white/40">
                  No users have participated in rated contests yet
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="bg-white/10 px-6 py-4 border-b border-white/10">
                <div className="grid grid-cols-12 gap-4 items-center text-white/80 font-medium">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-center">Current Rating</div>
                  <div className="col-span-2 text-center">Peak Rating</div>
                  <div className="col-span-3 text-center">Contests</div>
                </div>
              </div>

              {/* Leaderboard Entries */}
              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {leaderboardData.filter(entry => entry.clerk_id).map((entry, index) => (
                    <motion.div
                      key={entry.clerk_id}
                      custom={index}
                      variants={entryVariants}
                      initial="hidden"
                      animate="visible"
                      className={`px-6 py-4 hover:bg-white/5 transition-colors duration-200 ${
                        entry.rank && entry.rank <= 3 ? `bg-gradient-to-r ${getRankBadgeColor(entry.rank)}` : ''
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Rank */}
                        <div className="col-span-1 flex items-center">
                          {getRankIcon(entry.rank || index + 1)}
                        </div>

                        {/* Player Info */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {entry.codeforces_handle ? entry.codeforces_handle.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{entry.codeforces_handle || 'Unknown'}</div>
                            {entry.rank && entry.rank <= 3 && (
                              <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <Star className="w-3 h-3" />
                                Top Performer
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rating Stats */}
                        <div className="col-span-2 text-center">
                          <span className={`font-bold text-lg ${getRatingColor(entry.current_rating || 0)}`}>
                            {entry.current_rating || 0}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`font-medium ${getRatingColor(entry.peak_rating || 0)}`}>
                            {entry.peak_rating || 0}
                          </span>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-white/80">
                            {entry.contests_participated || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 inline-block">
            <div className="flex items-center gap-6 text-white/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{leaderboardData.length} Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Updated Live</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;