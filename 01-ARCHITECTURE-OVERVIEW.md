# CareConnect - High-Level Architecture Overview

## Executive Summary

CareConnect is a **production-grade, real-time emergency response platform** designed to connect people in distress with nearby volunteers and professionals. The system is architected as a **modular monolith** with clear service boundaries, enabling future microservice extraction while maintaining development velocity and operational simplicity.

---

## System Architecture

### Architecture Pattern: Modular Monolith

**WHY THIS CHOICE:**
- **Faster Development**: Single deployment unit reduces DevOps complexity
- **Lower Latency**: In-process communication for non-real-time operations
- **Easier Debugging**: Unified logging and tracing
- **Microservice-Ready**: Clear module boundaries enable future extraction
- **Cost-Effective**: Single server instance for MVP, horizontal scaling when needed

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[React SPA]
        MOBILE[Mobile Browser]
    end
    
    subgraph "CDN/Load Balancer"
        LB[NGINX/CloudFlare]
    end
    
    subgraph "Application Layer - Node.js Monolith"
        API[Express API Gateway]
        
        subgraph "Core Services"
            AUTH[Auth Service]
            USER[User Service]
            LOC[Location Service]
            SOS[SOS Service]
            MATCH[Matching Engine]
            NOTIF[Notification Service]
            CHAT[Chat Service]
            ADMIN[Admin Service]
        end
        
        SOCKET[Socket.io Server]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary DB)]
        REDIS[(Redis<br/>Cache + PubSub)]
        S3[S3/Storage<br/>Media Files]
    end
    
    subgraph "External Services"
        FCM[Firebase Cloud<br/>Messaging]
        MAPS[Google Maps API]
        SMS[Twilio SMS]
    end
    
    WEB --> LB
    MOBILE --> LB
    LB --> API
    LB --> SOCKET
    
    API --> AUTH
    API --> USER
    API --> LOC
    API --> SOS
    API --> MATCH
    API --> NOTIF
    API --> CHAT
    API --> ADMIN
    
    SOCKET --> REDIS
    MATCH --> REDIS
    LOC --> REDIS
    
    AUTH --> PG
    USER --> PG
    SOS --> PG
    CHAT --> PG
    ADMIN --> PG
    
    NOTIF --> FCM
    NOTIF --> SMS
    LOC --> MAPS
    USER --> S3
```

---

## Core Components

### 1. API Gateway (Express.js)
**Responsibilities:**
- Request routing to service modules
- JWT validation middleware
- Rate limiting (express-rate-limit)
- Request/response logging
- CORS configuration
- Input validation (Zod schemas)

**WHY:**
- Centralized security enforcement
- Single entry point for monitoring
- Consistent error handling

---

### 2. Authentication & Authorization Service

**Responsibilities:**
- User registration/login
- JWT access token generation (15min expiry)
- Refresh token rotation (7-day expiry)
- Role-based access control (RBAC)
- Password hashing (bcrypt, 12 rounds)
- Session management via Redis

**Key Features:**
- **Token Strategy**: Short-lived access tokens + long-lived refresh tokens
- **RBAC Roles**: `USER`, `VOLUNTEER`, `PROFESSIONAL`, `ADMIN`
- **Security**: Rate-limited login attempts, token blacklisting on logout

**Database Tables:**
- `users` (id, email, password_hash, role, created_at)
- `refresh_tokens` (token_hash, user_id, expires_at, revoked)

**WHY JWT + Refresh Tokens:**
- Stateless authentication scales horizontally
- Refresh tokens enable secure long sessions
- Token revocation via Redis blacklist

---

### 3. User & Volunteer Profile Service

**Responsibilities:**
- Profile CRUD operations
- Volunteer registration & verification
- Professional credential management
- Availability status management
- Profile photo upload to S3

**Key Features:**
- **Volunteer Verification**: Admin approval workflow
- **Professional Credentials**: Document upload + manual verification
- **Availability Toggle**: Real-time status updates via Socket.io

**Database Tables:**
- `user_profiles` (user_id, name, phone, address, photo_url)
- `volunteers` (user_id, skills[], certifications[], verified, available)
- `professionals` (user_id, license_number, specialization, hospital_affiliation)

---

### 4. Location Tracking Service

**Responsibilities:**
- Real-time location updates from clients
- Geo-spatial queries (find nearby volunteers)
- Location history for SOS tracking
- Privacy controls (location sharing consent)

**Key Features:**
- **PostGIS Extension**: Efficient geo-queries using `ST_DWithin`
- **Redis Geo Commands**: `GEOADD`, `GEORADIUS` for real-time lookups
- **Dual Storage**: PostgreSQL for persistence, Redis for speed

**Database Schema:**
```sql
CREATE EXTENSION postgis;

CREATE TABLE user_locations (
    user_id UUID PRIMARY KEY,
    location GEOGRAPHY(POINT, 4326),
    updated_at TIMESTAMP DEFAULT NOW(),
    accuracy_meters FLOAT
);

CREATE INDEX idx_location_gist ON user_locations USING GIST(location);
```

**Redis Structure:**
```
GEOADD volunteers:available <longitude> <latitude> <user_id>
GEORADIUS volunteers:available <long> <lat> 5 km WITHDIST
```

**WHY Dual Storage:**
- Redis: Sub-millisecond geo-queries for matching
- PostgreSQL: Audit trail and historical analysis

---

### 5. SOS Management Service

**Responsibilities:**
- SOS creation with location + emergency type
- SOS lifecycle management (PENDING → ACCEPTED → IN_PROGRESS → RESOLVED)
- Automatic escalation if no response in 2 minutes
- SOS cancellation by user
- Rate limiting (max 3 SOS per user per hour)

**Key Features:**
- **Emergency Types**: Medical, Fire, Accident, Crime, Natural Disaster
- **Priority Levels**: Critical, High, Medium (based on type)
- **Auto-Escalation**: Expands search radius + notifies more volunteers

**Database Tables:**
```sql
CREATE TABLE sos_requests (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    emergency_type VARCHAR(50),
    priority VARCHAR(20),
    location GEOGRAPHY(POINT, 4326),
    description TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_sos_status ON sos_requests(status);
CREATE INDEX idx_sos_location ON sos_requests USING GIST(location);
```

**State Machine:**
```
PENDING → ACCEPTED → IN_PROGRESS → RESOLVED
    ↓         ↓
CANCELLED  EXPIRED (auto-escalate)
```

---

### 6. Matching & Notification Engine

**Responsibilities:**
- Find nearby volunteers within radius (1km → 5km → 10km)
- Filter by skills/certifications if specified
- Send push notifications to matched volunteers
- Handle accept/reject responses
- Re-match if all volunteers reject

**Matching Algorithm:**
```javascript
async function matchVolunteers(sosRequest) {
    const radiusSteps = [1000, 3000, 5000, 10000]; // meters
    
    for (const radius of radiusSteps) {
        const volunteers = await findNearbyVolunteers({
            location: sosRequest.location,
            radius,
            skills: sosRequest.requiredSkills,
            limit: 10
        });
        
        if (volunteers.length > 0) {
            await notifyVolunteers(volunteers, sosRequest);
            return volunteers;
        }
    }
    
    // Escalate to admins if no volunteers found
    await notifyAdmins(sosRequest);
}
```

**Notification Priority:**
1. **Immediate**: Push notification via FCM
2. **Fallback**: SMS if push fails (Twilio)
3. **Escalation**: Email to admins if no response in 2 minutes

**WHY Progressive Radius:**
- Prioritizes closest responders
- Balances response time vs. coverage
- Prevents notification spam

---

### 7. Real-Time Communication Service

**Technology:** Socket.io with Redis Adapter

**Responsibilities:**
- Real-time chat between user and responder
- Live location sharing during active SOS
- Status updates (volunteer en route, arrived, etc.)
- Typing indicators
- Read receipts

**Socket.io Events:**
```javascript
// Client → Server
socket.emit('sos:create', { location, type, description });
socket.emit('sos:accept', { sosId });
socket.emit('sos:reject', { sosId });
socket.emit('chat:message', { sosId, message });
socket.emit('location:update', { location });

// Server → Client
socket.on('sos:matched', { sosId, volunteers });
socket.on('sos:accepted', { sosId, volunteer });
socket.on('chat:message', { sosId, message, sender });
socket.on('volunteer:location', { location, eta });
socket.on('sos:status', { sosId, status });
```

**Redis Adapter Configuration:**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**WHY Redis Adapter:**
- Enables horizontal scaling of Socket.io servers
- Messages broadcast across all server instances
- Shared connection state

---

### 8. Admin Monitoring & Analytics Dashboard

**Responsibilities:**
- Real-time SOS monitoring dashboard
- Volunteer verification workflow
- System metrics (response times, success rates)
- User management (ban/suspend)
- Geographic heat maps of SOS requests

**Key Metrics:**
- Average response time (time to first volunteer accept)
- Resolution rate (% of SOS resolved successfully)
- Volunteer utilization (active vs. idle)
- Geographic coverage gaps

**Database Views:**
```sql
CREATE VIEW sos_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) AS hour,
    emergency_type,
    COUNT(*) AS total_requests,
    AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) AS avg_response_time_sec,
    COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) AS resolved_count
FROM sos_requests
GROUP BY hour, emergency_type;
```

---

## Data Flow: SOS Request Lifecycle

```mermaid
sequenceDiagram
    participant U as User (React)
    participant API as API Gateway
    participant SOS as SOS Service
    participant MATCH as Matching Engine
    participant REDIS as Redis
    participant DB as PostgreSQL
    participant SOCKET as Socket.io
    participant V as Volunteer (React)
    participant FCM as Firebase FCM
    
    U->>API: POST /api/sos (location, type)
    API->>SOS: createSOS()
    SOS->>DB: INSERT sos_request
    SOS->>REDIS: Cache SOS data
    SOS->>MATCH: findVolunteers(location, radius=1km)
    MATCH->>REDIS: GEORADIUS volunteers:available
    REDIS-->>MATCH: [volunteer_ids]
    MATCH->>FCM: Send push notifications
    MATCH->>SOCKET: Emit 'sos:new' to volunteers
    SOCKET-->>V: Receive SOS alert
    
    V->>API: POST /api/sos/:id/accept
    API->>SOS: acceptSOS(sosId, volunteerId)
    SOS->>DB: UPDATE sos_request SET accepted_by
    SOS->>SOCKET: Emit 'sos:accepted' to user
    SOCKET-->>U: Show volunteer details
    
    U->>SOCKET: Emit 'chat:message'
    SOCKET->>REDIS: Publish message
    REDIS-->>SOCKET: Broadcast to room
    SOCKET-->>V: Receive message
    
    V->>SOCKET: Emit 'location:update' (every 5s)
    SOCKET-->>U: Show volunteer location on map
    
    V->>API: POST /api/sos/:id/resolve
    API->>SOS: resolveSOS(sosId)
    SOS->>DB: UPDATE sos_request SET status='RESOLVED'
    SOS->>SOCKET: Emit 'sos:resolved'
    SOCKET-->>U: Show completion screen
```

---

## Technology Stack Justification

### Frontend: React.js + Tailwind CSS
**WHY:**
- **React**: Component reusability, virtual DOM for real-time updates
- **Tailwind**: Rapid UI development, consistent design system
- **React Router**: Client-side routing for SPA
- **React Query**: Server state management, caching, optimistic updates
- **Socket.io-client**: Real-time bidirectional communication

### Backend: Node.js + Express.js
**WHY:**
- **Event-Driven**: Perfect for real-time, I/O-heavy operations
- **JavaScript Everywhere**: Shared validation logic (Zod schemas)
- **Rich Ecosystem**: Mature libraries for auth, WebSockets, geo-queries
- **Horizontal Scaling**: Stateless design + Redis adapter

### Database: PostgreSQL + PostGIS
**WHY:**
- **ACID Compliance**: Critical for financial/emergency data
- **PostGIS**: Industry-standard for geo-spatial queries
- **JSON Support**: Flexible schema for metadata (skills, certifications)
- **Mature Ecosystem**: Robust backup, replication, monitoring tools

### Cache: Redis
**WHY:**
- **Sub-millisecond Latency**: Geo-queries, session storage
- **Pub/Sub**: Socket.io adapter, real-time events
- **Atomic Operations**: Rate limiting, distributed locks
- **Persistence**: RDB snapshots for cache warm-up

---

## Scalability Strategy

### Horizontal Scaling
```mermaid
graph LR
    LB[Load Balancer<br/>NGINX]
    
    subgraph "Application Tier"
        APP1[Node.js Instance 1]
        APP2[Node.js Instance 2]
        APP3[Node.js Instance 3]
    end
    
    subgraph "Data Tier"
        PG_PRIMARY[(PostgreSQL<br/>Primary)]
        PG_REPLICA[(PostgreSQL<br/>Read Replica)]
        REDIS_CLUSTER[(Redis Cluster)]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> PG_PRIMARY
    APP2 --> PG_PRIMARY
    APP3 --> PG_PRIMARY
    
    APP1 --> PG_REPLICA
    APP2 --> PG_REPLICA
    APP3 --> PG_REPLICA
    
    APP1 --> REDIS_CLUSTER
    APP2 --> REDIS_CLUSTER
    APP3 --> REDIS_CLUSTER
```

### Database Optimization
- **Read Replicas**: Offload analytics queries to replicas
- **Connection Pooling**: PgBouncer (max 100 connections per instance)
- **Partitioning**: Partition `sos_requests` by month for archival
- **Indexing**: Composite indexes on `(status, created_at)` for dashboard queries

### Caching Strategy
```javascript
// Cache-Aside Pattern
async function getVolunteerProfile(userId) {
    const cacheKey = `volunteer:${userId}`;
    
    // Try cache first
    let profile = await redis.get(cacheKey);
    if (profile) return JSON.parse(profile);
    
    // Cache miss - fetch from DB
    profile = await db.query('SELECT * FROM volunteers WHERE user_id = $1', [userId]);
    
    // Update cache (TTL: 5 minutes)
    await redis.setex(cacheKey, 300, JSON.stringify(profile));
    
    return profile;
}
```

---

## Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Gateway
    participant AUTH as Auth Service
    participant REDIS as Redis
    participant DB as PostgreSQL
    
    C->>API: POST /auth/login (email, password)
    API->>AUTH: validateCredentials()
    AUTH->>DB: SELECT password_hash FROM users
    DB-->>AUTH: password_hash
    AUTH->>AUTH: bcrypt.compare(password, hash)
    AUTH->>AUTH: generateTokens()
    AUTH->>DB: INSERT refresh_token
    AUTH->>REDIS: SET session:{userId}
    AUTH-->>API: { accessToken, refreshToken }
    API-->>C: Set httpOnly cookie + return tokens
    
    Note over C: Access token expires (15min)
    
    C->>API: POST /auth/refresh (refreshToken)
    API->>AUTH: validateRefreshToken()
    AUTH->>DB: SELECT * FROM refresh_tokens
    AUTH->>AUTH: Rotate refresh token
    AUTH->>DB: UPDATE refresh_tokens
    AUTH-->>C: New access + refresh tokens
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| **Transport** | HTTPS Only | HSTS headers, redirect HTTP → HTTPS |
| **Authentication** | JWT + Refresh Tokens | 15min access, 7-day refresh, rotation on use |
| **Authorization** | RBAC Middleware | Role checks on protected routes |
| **Input Validation** | Zod Schemas | Validate all request bodies/params |
| **Rate Limiting** | Token Bucket | 100 req/15min per IP, 3 SOS/hour per user |
| **SQL Injection** | Parameterized Queries | pg library with $1, $2 placeholders |
| **XSS Prevention** | Content Security Policy | CSP headers, sanitize user input |
| **CSRF Protection** | SameSite Cookies | `SameSite=Strict` for refresh tokens |
| **Location Spoofing** | IP Geolocation Check | Compare claimed location with IP-based location |

### Environment Variables (.env)
```bash
# Never commit to Git
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/careconnect
REDIS_URL=redis://localhost:6379

# JWT Secrets (rotate monthly)
JWT_ACCESS_SECRET=<256-bit random string>
JWT_REFRESH_SECRET=<256-bit random string>

# External APIs
GOOGLE_MAPS_API_KEY=<key>
FIREBASE_SERVER_KEY=<key>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
AWS_S3_BUCKET=careconnect-uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Reliability & Fault Tolerance

### Graceful Degradation
```javascript
// Notification Service with Fallbacks
async function notifyVolunteer(volunteer, sosRequest) {
    try {
        // Primary: Push notification
        await fcm.send({
            token: volunteer.fcmToken,
            notification: { title: 'Emergency Alert', body: sosRequest.description }
        });
    } catch (error) {
        logger.error('FCM failed', error);
        
        try {
            // Fallback: SMS
            await twilio.messages.create({
                to: volunteer.phone,
                body: `Emergency: ${sosRequest.description}. Open CareConnect app.`
            });
        } catch (smsError) {
            logger.error('SMS failed', smsError);
            
            // Last resort: Email (async, not blocking)
            emailQueue.add({ to: volunteer.email, sosRequest });
        }
    }
}
```

### Circuit Breaker Pattern
```javascript
const CircuitBreaker = require('opossum');

const mapsApiBreaker = new CircuitBreaker(googleMapsAPI.geocode, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
});

mapsApiBreaker.fallback(() => {
    // Use cached geocoding data or return approximate location
    return { lat: 0, lng: 0, accuracy: 'low' };
});
```

### Database Connection Resilience
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Retry logic
    retry: {
        max: 3,
        backoff: 'exponential'
    }
});

pool.on('error', (err) => {
    logger.error('Unexpected database error', err);
    // Alert monitoring system
    monitoring.alert('database_connection_error', err);
});
```

---

## Monitoring & Observability

### Metrics to Track
```javascript
// Prometheus metrics
const promClient = require('prom-client');

const sosResponseTime = new promClient.Histogram({
    name: 'sos_response_time_seconds',
    help: 'Time from SOS creation to volunteer acceptance',
    buckets: [5, 10, 30, 60, 120, 300]
});

const activeSOSGauge = new promClient.Gauge({
    name: 'active_sos_requests',
    help: 'Number of currently active SOS requests'
});

const volunteerAvailability = new promClient.Gauge({
    name: 'available_volunteers',
    help: 'Number of volunteers currently available',
    labelNames: ['region']
});
```

### Logging Strategy
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'careconnect-api' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        // Production: Send to ELK/Datadog
        new winston.transports.Http({ host: 'logs.example.com' })
    ]
});

// Structured logging
logger.info('SOS created', {
    sosId: sos.id,
    userId: user.id,
    location: sos.location,
    type: sos.emergencyType,
    timestamp: new Date().toISOString()
});
```

### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        checks: {}
    };
    
    // Database check
    try {
        await db.query('SELECT 1');
        health.checks.database = 'healthy';
    } catch (error) {
        health.checks.database = 'unhealthy';
    }
    
    // Redis check
    try {
        await redis.ping();
        health.checks.redis = 'healthy';
    } catch (error) {
        health.checks.redis = 'unhealthy';
    }
    
    const isHealthy = Object.values(health.checks).every(status => status === 'healthy');
    res.status(isHealthy ? 200 : 503).json(health);
});
```

---

## Deployment Architecture

### Containerization (Docker)
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build:frontend

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

CMD ["node", "src/server.js"]
```

### Docker Compose (Development)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/careconnect
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: careconnect
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production Deployment (AWS Example)
```mermaid
graph TB
    subgraph "AWS Cloud"
        CF[CloudFront CDN]
        ALB[Application Load Balancer]
        
        subgraph "ECS Cluster"
            APP1[ECS Task 1]
            APP2[ECS Task 2]
            APP3[ECS Task 3]
        end
        
        RDS[(RDS PostgreSQL<br/>Multi-AZ)]
        ELASTICACHE[(ElastiCache Redis<br/>Cluster Mode)]
        S3[S3 Bucket]
        
        CF --> ALB
        ALB --> APP1
        ALB --> APP2
        ALB --> APP3
        
        APP1 --> RDS
        APP2 --> RDS
        APP3 --> RDS
        
        APP1 --> ELASTICACHE
        APP2 --> ELASTICACHE
        APP3 --> ELASTICACHE
        
        APP1 --> S3
        APP2 --> S3
        APP3 --> S3
    end
```

---

## Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Modular Monolith | Faster development, lower ops complexity, microservice-ready |
| **Backend** | Node.js + Express | Event-driven, real-time support, JavaScript ecosystem |
| **Database** | PostgreSQL + PostGIS | ACID compliance, geo-spatial queries, mature tooling |
| **Cache** | Redis | Sub-ms latency, pub/sub, geo commands |
| **Real-Time** | Socket.io + Redis Adapter | Horizontal scaling, bidirectional communication |
| **Auth** | JWT + Refresh Tokens | Stateless, scalable, secure long sessions |
| **Geo-Queries** | PostGIS + Redis Geo | Dual storage for speed + persistence |
| **Notifications** | FCM + Twilio SMS | Multi-channel, high reliability |
| **Frontend** | React + Tailwind | Component reusability, rapid UI development |

---

## Next Steps

This document establishes the **foundational architecture**. The following documents will detail:

1. **Detailed Workflows** (User, Volunteer, Admin journeys)
2. **Database Schema** (Complete ERD with constraints)
3. **API Contracts** (REST endpoints + request/response schemas)
4. **Socket.io Event Design** (Real-time event specifications)
5. **Folder Structure** (Clean, scalable codebase organization)
6. **Implementation Plan** (Phase-wise development roadmap)
7. **Interview Guide** (System design explanation for interviews)
8. **Future Extensions** (AI/ML integration points)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-18  
**Author:** Principal Software Architect
