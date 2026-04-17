const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.status = 400;
  }

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case 'PGRST116':
        error.message = 'Resource not found';
        error.status = 404;
        break;
      case '23505':
        error.message = 'Resource already exists';
        error.status = 409;
        break;
      case '23503':
        error.message = 'Referenced resource not found';
        error.status = 400;
        break;
      default:
        error.message = 'Database operation failed';
        error.status = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };