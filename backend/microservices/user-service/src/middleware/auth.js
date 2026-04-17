const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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

// Admin check middleware
const adminMiddleware = async (req, res, next) => {
  try {
    // First run auth middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get user details from Clerk
    if (req.userId) {
      const user = await clerk.users.getUser(req.userId);
      const userEmail = user.emailAddresses?.[0]?.emailAddress;
      
      if (userEmail && ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        req.isAdmin = true;
        return next();
      }
    }
    
    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Admin authentication service error' });
  }
};

// Helper function to check if email is admin
const isAdminEmail = (email) => {
  if (!email || !ADMIN_EMAIL) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

module.exports = { authMiddleware, adminMiddleware, isAdminEmail };