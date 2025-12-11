# Backend Setup Guide

This guide will help you migrate from the frontend-embedded APIs to the new microservices architecture.

## 🚀 Quick Migration Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm run install-all
```

### 2. Set Up Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp api-gateway/.env.example api-gateway/.env
cp microservices/room-service/.env.example microservices/room-service/.env
cp microservices/user-service/.env.example microservices/user-service/.env

# Edit each .env file with your actual values:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY  
# - SUPABASE_ANON_KEY
# - CLERK_SECRET_KEY
```

### 3. Start All Services

```bash
# Start all microservices
npm run dev

# Or start with Docker
npm run docker:up
```

### 4. Update Frontend Configuration

Update your frontend to point to the API Gateway instead of internal APIs:

```typescript
// Before (frontend/src/app/api/*)
const response = await fetch('/api/room/config', { ... });

// After (point to API Gateway)
const response = await fetch('http://localhost:8080/api/room/config', { 
  headers: {
    'Authorization': `Bearer ${await getToken()}`,
    'Content-Type': 'application/json'
  },
  ...
});
```

## 📋 Migration Checklist

### ✅ Completed Migrations

- [x] **Room Service** - All room management APIs moved
  - Room configuration (create/update/get)
  - Room invitations (send/accept/reject)
  - Room state management
  - Game start notifications
  - Room deletion

- [x] **User Service** - All user management APIs moved
  - User creation and profile management
  - User search functionality
  - User details retrieval
  - Rating updates

- [x] **API Gateway** - Central routing and security
  - Request routing to microservices
  - Authentication forwarding
  - Rate limiting and CORS
  - Health monitoring

### 🔄 Services to Update

- [ ] **Question Service** - Update routing (already exists)
- [ ] **Verify Service** - Update routing (already exists)

### 🗑️ Frontend APIs to Remove

After confirming the backend services work, remove these frontend API files:

```bash
# Room-related APIs (moved to Room Service)
rm -rf frontend/src/app/api/room/

# User-related APIs (moved to User Service)  
rm -rf frontend/src/app/api/user/

# Keep these as proxies for now:
# frontend/src/app/api/questions/fetch/route.ts
# frontend/src/app/api/verify/route.ts
```

## 🔧 Service Configuration

### API Gateway (Port 8080)
```env
PORT=8080
FRONTEND_URL=http://localhost:3000
ROOM_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
QUESTION_SERVICE_URL=http://localhost:3003
VERIFY_SERVICE_URL=http://localhost:3004
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Room Service (Port 3001)
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:3000
```

### User Service (Port 3002)
```env
PORT=3002
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing the Migration

### 1. Health Checks
```bash
# Check all services
curl http://localhost:8080/health/services

# Individual service health
curl http://localhost:3001/health  # Room Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Question Service
curl http://localhost:3004/health  # Verify Service
```

### 2. API Testing
```bash
# Test room creation (requires auth token)
curl -X POST http://localhost:8080/api/room/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "test-room",
    "questionCount": 5,
    "minutes": 60,
    "format": "icpc",
    "minRating": 800,
    "maxRating": 1500,
    "tags": [],
    "isRandomTags": false
  }'

# Test user search (public endpoint)
curl "http://localhost:8080/api/user/search?handle=tourist"
```

### 3. Frontend Integration Testing

Update your frontend API calls to use the gateway:

```typescript
// utils/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-gateway.com' 
  : 'http://localhost:8080';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getToken(); // Get Clerk token
  
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

// Usage
const response = await apiCall('/api/room/config', {
  method: 'POST',
  body: JSON.stringify(roomConfig)
});
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check if port is in use
netstat -an | findstr :3001

# Check logs
npm run docker:logs

# Restart specific service
cd microservices/room-service && npm run dev
```

### Authentication Issues
1. Verify Clerk secret key is correct in all services
2. Check that JWT token is being sent in Authorization header
3. Ensure token format is `Bearer <token>`

### Database Connection Issues
1. Verify Supabase credentials
2. Check service role key permissions
3. Test connection manually:
```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/users?select=*"
```

### CORS Issues
1. Verify FRONTEND_URL is set correctly in all services
2. Check that frontend is sending requests to correct gateway URL
3. Ensure preflight OPTIONS requests are handled

## 📊 Monitoring

### Service Status Dashboard
Visit `http://localhost:8080/health/services` for a complete service status overview.

### Logs
```bash
# All services (Docker)
npm run docker:logs

# Individual service logs
cd microservices/room-service && npm run dev
```

### Performance Monitoring
- API Gateway handles rate limiting (100 req/15min per IP)
- Each service has health check endpoints
- Database connection pooling via Supabase client

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build all services
npm run docker:build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
# ... other production values
```

### Load Balancing
Consider using a load balancer (nginx, AWS ALB) in front of the API Gateway for production.

## 📈 Next Steps

1. **Remove Frontend APIs**: After confirming backend works, delete moved API routes
2. **Add Monitoring**: Implement proper logging and monitoring (e.g., Winston, Prometheus)
3. **Add Caching**: Consider Redis for frequently accessed data
4. **Add Tests**: Implement unit and integration tests for each service
5. **CI/CD Pipeline**: Set up automated deployment pipeline

## 🆘 Need Help?

If you encounter issues during migration:

1. Check service logs for specific error messages
2. Verify all environment variables are set correctly
3. Test individual services before testing through gateway
4. Ensure database schema matches expected format (see README.md)

The new architecture provides better separation of concerns, improved scalability, and easier maintenance compared to the previous frontend-embedded approach.