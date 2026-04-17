import React from 'react';

export const NotificationSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-start gap-4">
            {/* Icon skeleton */}
            <div className="w-9 h-9 bg-white/10 rounded-lg animate-pulse"></div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-48 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};