const errorHandler = (err, req, res, next) => {
  console.error('Arena Service Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
  } else if (err.code === 'PGRST116') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.message) {
    message = err.message;
    
    // Set appropriate status codes based on error message
    if (message.toLowerCase().includes('not found')) {
      statusCode = 404;
    } else if (message.toLowerCase().includes('unauthorized')) {
      statusCode = 401;
    } else if (message.toLowerCase().includes('forbidden')) {
      statusCode = 403;
    } else if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
      statusCode = 400;
    }
  }

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url
  });
};

module.exports = { errorHandler };