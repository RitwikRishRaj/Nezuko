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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
      verify: process.env.VERIFY_SERVICE_URL
    }
  });
});

// Service health checks
app.get('/health/services', async (req, res) => {
  const services = {
    room: process.env.ROOM_SERVICE_URL,
    user: process.env.USER_SERVICE_URL,
    question: process.env.QUESTION_SERVICE_URL,
    verify: process.env.VERIFY_SERVICE_URL
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
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      service: req.originalUrl.split('/')[2] // Extract service name
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward authentication headers
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
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
  target: process.env.VERIFY_SERVICE_URL || 'http://localhost:3004',
  pathRewrite: {
    '^/api/verify': '/api/verify'
  },
  ...proxyOptions
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableServices: ['room', 'user', 'questions', 'verify']
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
  console.log(`  /api/verify/* → ${process.env.VERIFY_SERVICE_URL || 'http://localhost:3004'}`);
});

module.exports = app;