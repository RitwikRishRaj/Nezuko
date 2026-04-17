import React from 'react';

export const LeaderboardSkeleton = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Header Row */}
      <div className="bg-white/10 px-6 py-4 border-b border-white/10">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-1 h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="col-span-4 h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="col-span-2 h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="col-span-2 h-4 bg-white/10 rounded animate-pulse"></div>
          <div className="col-span-3 h-4 bg-white/10 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton Entries */}
      <div className="divide-y divide-white/5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Rank */}
              <div className="col-span-1">
                <div className="w-6 h-6 bg-white/10 rounded animate-pulse"></div>
              </div>

              {/* Player Info */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Stats */}
              <div className="col-span-2 text-center">
                <div className="h-6 w-16 bg-white/10 rounded animate-pulse mx-auto"></div>
              </div>
              <div className="col-span-2 text-center">
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse mx-auto"></div>
              </div>
              <div className="col-span-3 text-center">
                <div className="h-4 w-8 bg-white/10 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};