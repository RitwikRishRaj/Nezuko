const errorHandler = (err, req, res, next) => {
  console.error('Points Service Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({ 
          error: 'Duplicate entry',
          details: err.details || err.message 
        });
      case '23503': // Foreign key violation
        return res.status(400).json({ 
          error: 'Invalid reference',
          details: err.details || err.message 
        });
      case 'PGRST116': // Not found
        return res.status(404).json({ 
          error: 'Resource not found',
          details: err.details || err.message 
        });
      default:
        return res.status(500).json({ 
          error: 'Database error',
          code: err.code,
          details: err.details || err.message 
        });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: err.message 
    });
  }

  // Default error
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = { errorHandler };