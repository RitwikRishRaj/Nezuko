const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - More generous limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (increased from 1000)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// No global body parsing - let individual services handle it

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      room: process.env.ROOM_SERVICE_URL,
      user: process.env.USER_SERVICE_URL,
      question: process.env.QUESTION_SERVICE_URL,
      verify: process.env.VERIFY_SERVICE_URL,
      arena: process.env.ARENA_SERVICE_URL,
      points: process.env.POINTS_SERVICE_URL
    }
  });
});

// Service health checks
app.get('/health/services', async (req, res) => {
  const services = {
    room: process.env.ROOM_SERVICE_URL,
    user: process.env.USER_SERVICE_URL,
    question: process.env.QUESTION_SERVICE_URL,
    verify: process.env.VERIFY_SERVICE_URL,
    arena: process.env.ARENA_SERVICE_URL,
    points: process.env.POINTS_SERVICE_URL
  };

  const healthChecks = {};
  
  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await fetch(`${url}/health`);
      healthChecks[name] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: url
      };
    } catch (error) {
      healthChecks[name] = {
        status: 'unreachable',
        url: url,
        error: error.message
      };
    }
  }

  res.json({
    gateway: 'healthy',
    services: healthChecks,
    timestamp: new Date().toISOString()
  });
});

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  secure: false,
  ws: false,
  followRedirects: true,
  selfHandleResponse: false,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message, 'for', req.url);
    if (!res.headersSent) {
      const isConnectionError = err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED');
      res.status(503).json({ 
        error: isConnectionError ? 'Service is starting up, please try again in a moment' : 'Service temporarily unavailable',
        service: req.originalUrl.split('/')[2], // Extract service name
        details: isConnectionError ? 'Service connection refused - likely still starting' : err.message,
        retryAfter: isConnectionError ? 5 : 30 // Suggest retry time in seconds
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward authentication headers
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
    
    console.log(`🔄 Proxying: ${req.method} ${req.url} → ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log successful proxy responses
    console.log(`✅ Proxy response: ${req.method} ${req.url} → ${proxyRes.statusCode}`);
  }
};

// Route to Room Service
app.use('/api/room', createProxyMiddleware({
  target: process.env.ROOM_SERVICE_URL || 'http://localhost:3001',
  pathRewrite: {
    '^/api/room': '/api/room'
  },
  ...proxyOptions
}));

// Route to User Service
app.use('/api/user', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  pathRewrite: {
    '^/api/user': '/api/user'
  },
  ...proxyOptions
}));

// Route to Question Service
app.use('/api/questions', createProxyMiddleware({
  target: process.env.QUESTION_SERVICE_URL || 'http://localhost:3003',
  pathRewrite: {
    '^/api/questions': '/api/questions'
  },
  ...proxyOptions
}));

// Route to Verify Service
app.use('/api/verify', createProxyMiddleware({
  target: process.env.VERIFY_SERVICE_URL || 'http://localhost:3005',
  pathRewrite: {
    '^/api/verify': '/api/verify'
  },
  ...proxyOptions
}));

// Route to Arena Service
app.use('/api/arena', createProxyMiddleware({
  target: process.env.ARENA_SERVICE_URL || 'http://localhost:3004',
  pathRewrite: {
    '^/api/arena': '/api/arena'
  },
  ...proxyOptions
}));

// Route to Points Service
app.use('/api/points', createProxyMiddleware({
  target: process.env.POINTS_SERVICE_URL || 'http://localhost:3006',
  pathRewrite: {
    '^/api/points': '/api/points'
  },
  ...proxyOptions
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableServices: ['room', 'user', 'questions', 'verify', 'arena', 'points']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Internal gateway error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Service health: http://localhost:${PORT}/health/services`);
  console.log('\n📡 Routing:');
  console.log(`  /api/room/* → ${process.env.ROOM_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`  /api/user/* → ${process.env.USER_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`  /api/questions/* → ${process.env.QUESTION_SERVICE_URL || 'http://localhost:3003'}`);
  console.log(`  /api/arena/* → ${process.env.ARENA_SERVICE_URL || 'http://localhost:3004'}`);
  console.log(`  /api/verify/* → ${process.env.VERIFY_SERVICE_URL || 'http://localhost:3005'}`);
  console.log(`  /api/points/* → ${process.env.POINTS_SERVICE_URL || 'http://localhost:3006'}`);
});

module.exports = app;