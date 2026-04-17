const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const { clerkId } = req.body || req.query || {};
    
    // Try JWT token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const sessionToken = await clerk.verifyToken(token);
        
        if (sessionToken && sessionToken.sub) {
          req.userId = sessionToken.sub;
          req.user = sessionToken;
          return next();
        }
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
      }
    }
    
    // Fallback to clerkId in body (for direct API calls)
    if (clerkId) {
      req.userId = clerkId;
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required - provide Bearer token or clerkId' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

module.exports = { authMiddleware };