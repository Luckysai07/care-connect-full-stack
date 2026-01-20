# CareConnect - Folder Structure

## Project Structure Overview

```
careconnect/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── modules/           # Feature modules (modular monolith)
│   │   ├── shared/            # Shared utilities
│   │   ├── middleware/        # Express middleware
│   │   ├── sockets/           # Socket.io handlers
│   │   └── server.js          # Entry point
│   ├── migrations/            # Database migrations
│   ├── scripts/               # Utility scripts
│   ├── tests/                 # Test files
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React contexts
│   │   ├── api/               # API client functions
│   │   ├── utils/             # Utility functions
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml         # Development environment
├── .github/
│   └── workflows/             # CI/CD pipelines
├── docs/                      # Documentation
└── README.md
```

---

## Backend Structure (Detailed)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js        # PostgreSQL connection pool
│   │   ├── redis.js           # Redis client
│   │   ├── env.js             # Environment variables
│   │   ├── logger.js          # Winston logger
│   │   └── constants.js       # App constants
│   │
│   ├── modules/               # Modular monolith structure
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.validation.js
│   │   │   └── auth.test.js
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   ├── users.routes.js
│   │   │   ├── users.validation.js
│   │   │   └── users.test.js
│   │   │
│   │   ├── volunteers/
│   │   │   ├── volunteers.controller.js
│   │   │   ├── volunteers.service.js
│   │   │   ├── volunteers.routes.js
│   │   │   └── volunteers.validation.js
│   │   │
│   │   ├── professionals/
│   │   │   ├── professionals.controller.js
│   │   │   ├── professionals.service.js
│   │   │   └── professionals.routes.js
│   │   │
│   │   ├── sos/
│   │   │   ├── sos.controller.js
│   │   │   ├── sos.service.js
│   │   │   ├── sos.routes.js
│   │   │   ├── sos.validation.js
│   │   │   └── matching-engine.js     # Volunteer matching logic
│   │   │
│   │   ├── location/
│   │   │   ├── location.controller.js
│   │   │   ├── location.service.js
│   │   │   ├── location.routes.js
│   │   │   └── geo-utils.js           # PostGIS helper functions
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.controller.js
│   │   │   ├── chat.service.js
│   │   │   └── chat.routes.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.service.js
│   │   │   ├── fcm.client.js          # Firebase Cloud Messaging
│   │   │   └── sms.client.js          # Twilio SMS
│   │   │
│   │   └── admin/
│   │       ├── admin.controller.js
│   │       ├── admin.service.js
│   │       ├── admin.routes.js
│   │       └── analytics.service.js
│   │
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── jwt.util.js
│   │   │   ├── bcrypt.util.js
│   │   │   ├── validation.util.js
│   │   │   └── error-handler.util.js
│   │   ├── types/
│   │   │   └── index.d.ts             # TypeScript type definitions
│   │   └── constants/
│   │       ├── roles.js
│   │       ├── sos-types.js
│   │       └── error-codes.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js            # JWT validation
│   │   ├── authorize.js               # RBAC checks
│   │   ├── validate.js                # Zod schema validation
│   │   ├── rate-limit.js              # Rate limiting
│   │   ├── error-handler.js           # Global error handler
│   │   └── request-logger.js          # Request logging
│   │
│   ├── sockets/
│   │   ├── index.js                   # Socket.io setup
│   │   ├── auth.socket.js             # Socket authentication
│   │   ├── sos.socket.js              # SOS events
│   │   ├── chat.socket.js             # Chat events
│   │   └── location.socket.js         # Location tracking
│   │
│   └── server.js                      # Express app setup
│
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_professionals.sql
│   └── migrate.js                     # Migration runner
│
├── scripts/
│   ├── seed-dev-data.js               # Development seed data
│   ├── backup-db.sh                   # Database backup
│   └── cleanup-old-sos.js             # Cleanup job
│
├── tests/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── sos.test.js
│   │   └── matching.test.js
│   ├── unit/
│   │   ├── jwt.test.js
│   │   └── geo-utils.test.js
│   └── setup.js                       # Test setup
│
├── .env.example
├── .gitignore
├── package.json
├── Dockerfile
└── README.md
```

---

## Frontend Structure (Detailed)

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── common/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── map/
│   │   │   ├── Map.tsx                # Google Maps component
│   │   │   ├── UserMarker.tsx
│   │   │   ├── VolunteerMarker.tsx
│   │   │   └── SOSMarker.tsx
│   │   │
│   │   ├── sos/
│   │   │   ├── EmergencyButton.tsx
│   │   │   ├── SOSCard.tsx
│   │   │   ├── SOSDetails.tsx
│   │   │   ├── SOSTracker.tsx
│   │   │   └── FeedbackForm.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── Message.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   └── volunteer/
│   │       ├── VolunteerCard.tsx
│   │       ├── AvailabilityToggle.tsx
│   │       └── StatsCard.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SOSHistoryPage.tsx
│   │   │   └── ActiveSOSPage.tsx
│   │   │
│   │   ├── volunteer/
│   │   │   ├── VolunteerDashboard.tsx
│   │   │   ├── VolunteerRegistration.tsx
│   │   │   ├── ActiveSOSPage.tsx
│   │   │   └── StatsPage.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── SOSMonitor.tsx
│   │   │   ├── VolunteerVerification.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   │
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # Authentication hook
│   │   ├── useSocket.ts               # Socket.io hook
│   │   ├── useGeolocation.ts          # Geolocation hook
│   │   ├── useSOS.ts                  # SOS management hook
│   │   └── useChat.ts                 # Chat hook
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Auth state management
│   │   ├── SocketContext.tsx          # Socket.io context
│   │   └── NotificationContext.tsx    # Notification state
│   │
│   ├── api/
│   │   ├── client.ts                  # Axios instance
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── sos.api.ts
│   │   ├── volunteers.api.ts
│   │   └── admin.api.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts              # Date, distance formatters
│   │   ├── validators.ts              # Form validation
│   │   ├── storage.ts                 # LocalStorage helpers
│   │   └── constants.ts               # App constants
│   │
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── sos.types.ts
│   │   ├── volunteer.types.ts
│   │   └── api.types.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # Entry point
│   └── router.tsx                     # React Router setup
│
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Key File Examples

### backend/src/server.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./config/logger');
const { pool } = require('./config/database');
const redis = require('./config/redis');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const sosRoutes = require('./modules/sos/sos.routes');
const volunteerRoutes = require('./modules/volunteers/volunteers.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Import middleware
const errorHandler = require('./middleware/error-handler');
const requestLogger = require('./middleware/request-logger');
const rateLimiter = require('./middleware/rate-limit');

// Import socket handlers
const setupSockets = require('./sockets');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sos', sosRoutes);
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        await redis.ping();
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.io
setupSockets(io);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        pool.end();
        redis.quit();
        process.exit(0);
    });
});
```

---

### backend/src/modules/sos/sos.service.js

```javascript
const pool = require('../../config/database');
const redis = require('../../config/redis');
const logger = require('../../config/logger');
const matchingEngine = require('./matching-engine');

class SOSService {
    async createSOS(userId, { emergencyType, location, description }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const result = await client.query(`
                INSERT INTO sos_requests (
                    user_id, emergency_type, priority, location, description, status
                ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, 'PENDING')
                RETURNING id, created_at
            `, [
                userId,
                emergencyType,
                this.calculatePriority(emergencyType),
                location.longitude,
                location.latitude,
                description
            ]);
            
            const sosId = result.rows[0].id;
            
            await client.query('COMMIT');
            
            // Cache in Redis
            await redis.setex(
                `sos:${sosId}`,
                3600,
                JSON.stringify({ userId, emergencyType, location, status: 'PENDING' })
            );
            
            // Trigger matching (async)
            matchingEngine.findAndNotifyVolunteers(sosId, location, emergencyType);
            
            logger.info('SOS created', { sosId, userId, emergencyType });
            
            return { id: sosId, status: 'PENDING', createdAt: result.rows[0].created_at };
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('SOS creation failed', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    calculatePriority(emergencyType) {
        const priorities = {
            MEDICAL: 'CRITICAL',
            FIRE: 'CRITICAL',
            ACCIDENT: 'HIGH',
            CRIME: 'HIGH',
            NATURAL_DISASTER: 'CRITICAL',
            OTHER: 'MEDIUM'
        };
        return priorities[emergencyType] || 'MEDIUM';
    }
}

module.exports = new SOSService();
```

---

### frontend/src/hooks/useSocket.ts

```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket() {
    const socketRef = useRef<Socket>();
    const { accessToken } = useAuth();
    
    useEffect(() => {
        if (!accessToken) return;
        
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
            auth: { token: accessToken },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        socketRef.current.on('connect', () => {
            console.log('Socket connected');
        });
        
        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });
        
        return () => {
            socketRef.current?.disconnect();
        };
    }, [accessToken]);
    
    return socketRef.current;
}
```

---

### frontend/src/components/sos/EmergencyButton.tsx

```typescript
import { useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { createSOS } from '../../api/sos.api';
import { useNavigate } from 'react-router-dom';

const EMERGENCY_TYPES = [
    { type: 'MEDICAL', label: 'Medical Emergency', icon: '🏥', color: 'bg-red-600' },
    { type: 'FIRE', label: 'Fire', icon: '🔥', color: 'bg-orange-600' },
    { type: 'ACCIDENT', label: 'Accident', icon: '🚗', color: 'bg-yellow-600' },
    { type: 'CRIME', label: 'Crime', icon: '🚨', color: 'bg-purple-600' }
];

export function EmergencyButton() {
    const [isCreating, setIsCreating] = useState(false);
    const { location, error: locationError } = useGeolocation();
    const navigate = useNavigate();
    
    const handleEmergency = async (type: string) => {
        if (!location) {
            alert('Location access required');
            return;
        }
        
        setIsCreating(true);
        
        try {
            const sos = await createSOS({
                emergencyType: type,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                },
                description: ''
            });
            
            navigate(`/sos/${sos.id}`);
        } catch (error) {
            console.error('SOS creation failed', error);
            alert('Failed to create SOS');
        } finally {
            setIsCreating(false);
        }
    };
    
    return (
        <div className="grid grid-cols-2 gap-4">
            {EMERGENCY_TYPES.map(({ type, label, icon, color }) => (
                <button
                    key={type}
                    onClick={() => handleEmergency(type)}
                    disabled={isCreating || !location}
                    className={`${color} text-white p-6 rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50`}
                >
                    <div className="text-4xl mb-2">{icon}</div>
                    <div className="font-semibold">{label}</div>
                </button>
            ))}
        </div>
    );
}
```

---

## Environment Variables

### backend/.env.example

```bash
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/careconnect

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-256-bit-secret-here

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
FIREBASE_SERVER_KEY=your-firebase-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=careconnect-uploads
AWS_REGION=us-east-1

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### frontend/.env.example

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

---

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: careconnect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/careconnect
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
  
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
      VITE_SOCKET_URL: http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-18
