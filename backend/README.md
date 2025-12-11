# AlgoGym Backend Microservices

This directory contains the backend microservices architecture for AlgoGym, properly separated from the frontend.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │────│   API Gateway    │
│   (Next.js)     │    │   Port: 8080     │
└─────────────────┘    └──────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Room Service │ │ User Service│ │ Question   │
        │ Port: 3001   │ │ Port: 3002  │ │ Service    │
        └──────────────┘ └─────────────┘ │ Port: 3003 │
                                         └────────────┘
                                         ┌─────▼──────┐
                                         │ Verify     │
                                         │ Service    │
                                         │ Port: 3004 │
                                         └────────────┘
```

## Services

### 1. API Gateway (Port: 8080)
- **Purpose**: Routes requests to appropriate microservices
- **Features**: 
  - Request routing and load balancing
  - Rate limiting and security
  - Service health monitoring
  - Authentication forwarding

### 2. Room Service (Port: 3001)
- **Purpose**: Manages room operations and game sessions
- **Endpoints**:
  - `POST /api/room/config` - Create/update room configuration
  - `GET /api/room/config` - Get room configuration
  - `POST /api/room/invite` - Send room invitations
  - `GET /api/room/state` - Get room state and participants
  - `POST /api/room/invites/respond` - Accept/reject invitations
  - `POST /api/room/invites/remove` - Remove users from room
  - `GET /api/room/invites/check` - Check pending invitations
  - `POST /api/room/start-game` - Start game session
  - `POST /api/room/discard` - Delete room

### 3. User Service (Port: 3002)
- **Purpose**: Manages user profiles and authentication
- **Endpoints**:
  - `POST /api/user/create` - Create/update user profile
  - `GET /api/user/details` - Get user details by Clerk ID
  - `GET /api/user/search` - Search users by Codeforces handle
  - `POST /api/user/update-rating` - Update user rating
  - `GET /api/user/exists` - Check if user exists

### 4. Question Service (Port: 3003)
- **Purpose**: Fetches and manages coding problems
- **Endpoints**:
  - `GET /api/questions/fetch` - Fetch problems from Codeforces

### 5. Verify Service (Port: 3004)
- **Purpose**: Verifies Codeforces accounts
- **Endpoints**:
  - `POST /api/verify` - Verify Codeforces handle

## Quick Start

### Development Mode

1. **Install dependencies:**
```bash
cd backend
npm run install-all
```

2. **Set up environment variables:**
```bash
# Copy example files and add your actual values
cp .env.example .env
cp api-gateway/.env.example api-gateway/.env
cp microservices/room-service/.env.example microservices/room-service/.env
cp microservices/user-service/.env.example microservices/user-service/.env
```

3. **Start all services:**
```bash
npm run dev
```

Or start individual services:
```bash
# API Gateway
cd api-gateway && npm run dev

# Room Service
cd microservices/room-service && npm run dev

# User Service
cd microservices/user-service && npm run dev
```

### Production Mode (Docker)

1. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your production values
```

2. **Start with Docker Compose:**
```bash
docker-compose up -d
```

3. **Check service health:**
```bash
curl http://localhost:8080/health/services
```

## Environment Variables

### Required for all services:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `CLERK_SECRET_KEY` - Clerk authentication secret key

### API Gateway specific:
- `PORT` - Gateway port (default: 8080)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `ROOM_SERVICE_URL` - Room service URL
- `USER_SERVICE_URL` - User service URL
- `QUESTION_SERVICE_URL` - Question service URL
- `VERIFY_SERVICE_URL` - Verify service URL

## Health Monitoring

- **Gateway Health**: `GET http://localhost:8080/health`
- **All Services Health**: `GET http://localhost:8080/health/services`
- **Individual Service Health**: `GET http://localhost:300X/health`

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for frontend domain
- **Helmet Security**: Security headers for all services
- **Authentication**: JWT token verification via Clerk
- **Input Validation**: Joi schema validation for all endpoints

## Database Schema

The services expect the following Supabase tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  codeforces_handle TEXT,
  codeforces_rating INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Room Config Table
```sql
CREATE TABLE room_config (
  id SERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  question_count INTEGER NOT NULL,
  minutes INTEGER NOT NULL,
  format TEXT NOT NULL,
  min_rating INTEGER,
  max_rating INTEGER,
  tags TEXT[],
  is_random_tags BOOLEAN DEFAULT FALSE,
  problems JSONB,
  custom_problem_links TEXT[],
  use_custom_links BOOLEAN DEFAULT FALSE,
  game_status TEXT,
  game_started_by TEXT,
  game_started_at TIMESTAMP,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Room Invites Table
```sql
CREATE TABLE room_invites (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  inviter_clerk_id TEXT NOT NULL,
  invited_clerk_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  room_mode TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, slot)
);
```

## Migration from Frontend APIs

The following frontend API routes have been moved to microservices:

### Moved to Room Service:
- `frontend/src/app/api/room/*` → `room-service/src/controllers/roomController.js`

### Moved to User Service:
- `frontend/src/app/api/user/*` → `user-service/src/controllers/userController.js`

### Proxy Routes (remain in frontend):
- `frontend/src/app/api/questions/fetch/route.ts` → Proxies to Question Service
- `frontend/src/app/api/verify/route.ts` → Proxies to Verify Service

## Troubleshooting

### Service Won't Start
1. Check if port is already in use: `netstat -an | findstr :3001`
2. Verify environment variables are set
3. Check service logs for specific errors

### Database Connection Issues
1. Verify Supabase credentials in `.env`
2. Check network connectivity to Supabase
3. Ensure service role key has proper permissions

### Authentication Errors
1. Verify Clerk secret key is correct
2. Check if JWT token is being forwarded properly
3. Ensure frontend is sending Authorization header

## Development Guidelines

### Adding New Endpoints
1. Add route to appropriate service's `routes/` directory
2. Implement controller logic in `controllers/`
3. Add database operations to `services/database.js`
4. Update API Gateway routing if needed

### Error Handling
- All services use centralized error handling middleware
- Database errors are automatically mapped to HTTP status codes
- Validation errors return 400 with detailed messages

### Testing
```bash
# Run tests for specific service
cd microservices/room-service && npm test

# Run all tests
npm run test-all
```

## Performance Considerations

- **Connection Pooling**: Supabase client handles connection pooling
- **Rate Limiting**: Prevents API abuse
- **Caching**: Consider adding Redis for frequently accessed data
- **Load Balancing**: API Gateway can be configured for multiple service instances

## Monitoring and Logging

- All services log to console with structured format
- Health check endpoints for monitoring
- Error tracking with stack traces in development
- Request/response logging for debugging