const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Extract user ID from Bearer token (assuming Clerk JWT format)
    const token = authHeader.substring(7);
    
    // For now, we'll extract user ID from the token payload
    // In production, you'd verify the JWT signature
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.userId = payload.sub || payload.user_id;
      
      if (!req.userId) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      next();
    } catch (tokenError) {
      console.error('Token parsing error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

// Admin check middleware
const adminMiddleware = async (req, res, next) => {
  try {
    // First run auth middleware
    await new Promise((resolve, reject) => {
      authenticateUser(req, res, (err) => {
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

module.exports = { authenticateUser, adminMiddleware, isAdminEmail };