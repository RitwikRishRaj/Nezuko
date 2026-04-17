// API Configuration for Backend Gateway
export const API_CONFIG = {
  // Use Next.js API routes for proper authentication handling
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api.algogym.com'
    : '',
  
  // API Endpoints
  ENDPOINTS: {
    // Room Service
    ROOM: {
      CONFIG: '/api/room/config',
      INVITE: '/api/room/invite',
      STATE: '/api/room/state',
      INVITES_RESPOND: '/api/room/invites/respond',
      INVITES_REMOVE: '/api/room/invites/remove',
      INVITES_CHECK: '/api/room/invites/check',
      START_GAME: '/api/room/start-game',
      DISCARD: '/api/room/discard',
    },
    
    // User Service
    USER: {
      CREATE: '/api/user/create',
      DETAILS: '/api/user/details',
      SEARCH: '/api/user/search',
      UPDATE_RATING: '/api/user/update-rating',
    },
    
    // Question Service (proxy)
    QUESTIONS: {
      FETCH: '/api/questions/fetch',
    },
    
    // Verify Service (proxy)
    VERIFY: '/api/verify',
    
    // Arena Service
    ARENA: {
      SESSION: '/api/arena/session',
      SUBMIT: '/api/arena/submit',
      LEADERBOARD: '/api/arena/session', // Use /api/arena/session/{sessionId}/leaderboard
      TEAM_STATS: '/api/arena/session', // Use /api/arena/session/{sessionId}/team-stats
      PARTICIPANTS: '/api/arena/session', // Use /api/arena/session/{sessionId}/participants
      SUBMISSIONS: '/api/arena/session', // Use /api/arena/session/{sessionId}/submissions
      SYNC: '/api/arena/sync',
    },

    // Points Service
    POINTS: {
      USER_RATING: '/api/points/rating',
      USER_POINTS: '/api/points/user',
      RATING_HISTORY: '/api/points/rating-history',
      CALCULATE_RATINGS: '/api/points/calculate-ratings',
      APPLY_RATINGS: '/api/points/apply-ratings',
      FINALIZE_SESSION: '/api/points/finalize-session',
      LEADERBOARD_RATING: '/api/points/leaderboard/rating'
    },
  }
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  // For development, use relative URLs (Next.js API routes)
  // For production, use the full API gateway URL
  if (process.env.NODE_ENV === 'production') {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  } else {
    // In development, use relative URLs for Next.js API routes
    return endpoint;
  }
}