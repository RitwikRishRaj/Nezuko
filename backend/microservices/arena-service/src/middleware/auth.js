const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const authMiddleware = (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  // Use Clerk's built-in auth middleware
  const clerkAuth = ClerkExpressRequireAuth({
    onError: (error) => {
      console.error('Arena Service Auth Error:', error);
      return res.status(401).json({ 
        error: 'Authentication required',
        details: error.message 
      });
    }
  });

  clerkAuth(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Extract user ID from Clerk auth
    req.userId = req.auth?.userId;
    
    if (!req.userId) {
      return res.status(401).json({ error: 'User ID not found in authentication' });
    }
    
    console.log('Arena Service - Authenticated user:', req.userId);
    next();
  });
};

module.exports = { authMiddleware };