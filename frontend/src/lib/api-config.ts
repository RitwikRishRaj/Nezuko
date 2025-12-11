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
  }
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}