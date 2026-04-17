'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArenaStats } from '@/components/arena-stats';
import { IBM_Plex_Sans } from 'next/font/google';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

type ArenaType = 'ICPC' | 'IOI' | 'Long';

interface ArenaStats {
  type: ArenaType;
  count: number;
}

interface UserGrowthData {
  date: string;
  users: number;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  participants: number;
}

const AnalyticsPage = () => {
  // Mock data - replace with actual API calls
  const totalUsers = 1245;
  const totalArenasConcluded = 89;
  
  const arenaStats: ArenaStats[] = [
    { type: 'ICPC', count: 45 },
    { type: 'IOI', count: 28 },
    { type: 'Long', count: 16 },
  ];

  const activeArenas = [
    { id: 1, title: 'Weekly Challenge #42', type: 'ICPC', participants: 87 },
    { id: 2, title: 'IOI Practice #15', type: 'IOI', participants: 42 },
    { id: 3, title: 'Marathon #8', type: 'Long', participants: 23 },
  ];

  const userGrowthData: UserGrowthData[] = [
    { date: 'Jan', users: 400 },
    { date: 'Feb', users: 500 },
    { date: 'Mar', users: 600 },
    { date: 'Apr', users: 700 },
    { date: 'May', users: 850 },
    { date: 'Jun', users: 900 },
    { date: 'Jul', users: 950 },
    { date: 'Aug', users: 1050 },
    { date: 'Sep', users: 1100 },
    { date: 'Oct', users: 1245 },
  ];

  const recentEvents: EventData[] = [
    { id: '1', title: 'Code Sprint', date: '2025-10-20', participants: 150 },
    { id: '2', title: 'Algo Showdown', date: '2025-10-15', participants: 98 },
    { id: '3', title: 'Dynamic Programming Challenge', date: '2025-10-10', participants: 124 },
    { id: '4', title: 'Graph Theory Contest', date: '2025-10-05', participants: 87 },
    { id: '5', title: 'Beginner Friendly #12', date: '2025-09-28', participants: 210 },
  ];

  return (
    <div className={`${ibmPlexSans.variable} font-sans`}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      {/* Summary Cards - Compact Layout */}
      <div className="flex flex-wrap gap-2 mt-1 mb-4">
        <Card className="bg-black border-gray-800 shadow-lg w-fit min-w-[200px]">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-sm font-semibold text-white">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-3xl font-bold text-white mb-1">{totalUsers.toLocaleString()}</div>
            <p className="text-sm text-green-400 font-medium">+12% from last month</p>
          </CardContent>
        </Card>

<ArenaStats 
          totalArenasConcluded={totalArenasConcluded} 
          arenaStats={arenaStats} 
        />

        <Card className="bg-black border-gray-800 shadow-lg w-fit min-w-[280px]">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="text-sm font-semibold text-white">Active Arenas</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-center gap-4">
              {/* Total on the left */}
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Total</p>
                <p className="text-3xl font-bold text-white">{activeArenas.length}</p>
              </div>
              
              {/* Divider */}
              <div className="h-16 w-px bg-gray-700"></div>
              
              {/* Types on the right */}
              <div className="flex-1">
                <div className="space-y-2">
                  {(() => {
                    const activeArenaStats = activeArenas.reduce((acc, arena) => {
                      acc[arena.type] = (acc[arena.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const getArenaTypeColor = (type: string) => {
                      switch (type) {
                        case 'ICPC':
                          return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                        case 'IOI':
                          return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                        case 'Long':
                          return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                        default:
                          return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                      }
                    };

                    return Object.entries(activeArenaStats).map(([type, count]) => (
                      <div 
                        key={type} 
                        className={`${getArenaTypeColor(type)} px-3 py-2 rounded-lg border flex items-center justify-between`}
                      >
                        <span className="text-sm font-semibold">{type}</span>
                        <span className="text-lg font-bold">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart and Recent Events Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="bg-black border-gray-800 shadow-lg">
          <CardHeader className="px-6 py-5 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              User Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000000', 
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value: any) => [value.toLocaleString(), 'Users']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Total Users"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3B82F6' }}
                  activeDot={{ r: 7, stroke: '#2563EB', strokeWidth: 2, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-black/50 border-gray-800 shadow-lg backdrop-blur-sm">
          <CardHeader className="px-4 py-3 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">
                Recent Events
              </CardTitle>
              <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                {recentEvents.length} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1.5">
              {recentEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="group relative p-1.5 hover:bg-gray-800/30 rounded-lg transition-colors duration-150"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30' :
                        index === 1 ? 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30' :
                        'bg-gray-700/50 text-gray-300 ring-1 ring-gray-600/30'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 flex items-baseline gap-2">
                        <h3 className="text-[13px] font-medium text-white">{event.title}</h3>
                        <span className="text-[11px] text-gray-400">
                          • {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })} • {event.participants} participants
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
