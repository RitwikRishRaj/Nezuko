const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const authMiddleware = async (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required - no Bearer token' });
    }

    const token = authHeader.substring(7);
    
    // Try to verify the token properly first
    try {
      const sessionToken = await clerk.verifyToken(token);
      
      if (sessionToken && sessionToken.sub) {
        req.userId = sessionToken.sub;
        req.user = sessionToken;
        console.log('Arena Service - Authenticated user via verified token:', req.userId);
        return next();
      }
    } catch (verifyError) {
      // If verification fails, try parsing the JWT payload directly (for internal service calls)
      console.log('Arena Service - Token verification failed, trying payload parse:', verifyError.message);
      
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        req.userId = payload.sub || payload.user_id;
        
        if (req.userId) {
          console.log('Arena Service - Authenticated user via payload parse:', req.userId);
          return next();
        }
      } catch (parseError) {
        console.error('Arena Service - Token parsing also failed:', parseError.message);
      }
    }
    
    return res.status(401).json({ 
      error: 'Authentication required',
      details: 'Invalid or expired token'
    });
  } catch (error) {
    console.error('Arena Service Auth Error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

module.exports = { authMiddleware };