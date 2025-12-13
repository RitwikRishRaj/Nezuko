// API Configuration for Backend Gateway
export const API_CONFIG = {
  // API Gateway URL
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api.algogym.com'
    : 'http://localhost:8080',
  
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
      LEADERBOARD: '/api/arena/leaderboard',
      TEAM_STATS: '/api/arena/team-stats',
      PARTICIPANTS: '/api/arena/participants',
      SUBMISSIONS: '/api/arena/submissions',
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
      LEADERBOARD_RATING: '/api/points/leaderboard/rating',
      LEADERBOARD_GLOBAL: '/api/points/leaderboard/global'
    },
  }
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}