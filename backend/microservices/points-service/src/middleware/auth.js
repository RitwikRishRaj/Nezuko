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

module.exports = { authenticateUser };