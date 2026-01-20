# CareConnect - API Contracts & Real-Time Events

## Table of Contents
1. [REST API Endpoints](#rest-api)
2. [Socket.io Events](#socketio-events)
3. [Request/Response Schemas](#schemas)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [API Versioning](#versioning)

---

## REST API Endpoints

### Base URL
```
Production: https://api.careconnect.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication Header
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### POST /auth/register
**Purpose:** Register a new user

**Request:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "USER",
        "createdAt": "2025-12-18T12:00:00Z"
    }
}
```

**Errors:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Invalid input (validation errors)

---

### POST /auth/login
**Purpose:** Authenticate existing user

**Request:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "USER",
        "photoUrl": "https://s3.../profile.jpg"
    }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 min)

---

### POST /auth/refresh
**Purpose:** Refresh access token using refresh token

**Request:**
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  // New rotated token
}
```

**Errors:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### POST /auth/logout
**Purpose:** Revoke refresh token

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
    "message": "Logged out successfully"
}
```

---

## 2. User Profile Endpoints

### GET /users/me
**Purpose:** Get current user profile

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, San Francisco, CA",
    "photoUrl": "https://s3.../profile.jpg",
    "role": "USER",
    "preferences": {
        "language": "en",
        "notificationPreferences": {
            "push": true,
            "sms": false,
            "email": true
        }
    },
    "createdAt": "2025-12-18T12:00:00Z"
}
```

---

### PUT /users/me
**Purpose:** Update user profile

**Request:**
```json
{
    "name": "John Smith",
    "address": "456 Oak Ave, San Francisco, CA",
    "preferences": {
        "language": "es",
        "notificationPreferences": {
            "push": true,
            "sms": true,
            "email": false
        }
    }
}
```

**Response (200 OK):**
```json
{
    "message": "Profile updated successfully",
    "user": { /* updated user object */ }
}
```

---

### POST /users/location
**Purpose:** Update user's current location

**Request:**
```json
{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10.5
}
```

**Response (200 OK):**
```json
{
    "message": "Location updated successfully",
    "updatedAt": "2025-12-18T12:30:00Z"
}
```

**WHY Separate Endpoint:**
- Location updates are frequent (every 5-30 seconds)
- Lightweight payload reduces bandwidth
- Can be rate-limited independently

---

### POST /users/photo
**Purpose:** Upload profile photo

**Request (multipart/form-data):**
```
Content-Type: multipart/form-data

photo: <binary file data>
```

**Response (200 OK):**
```json
{
    "photoUrl": "https://s3.amazonaws.com/careconnect-uploads/users/550e8400.../profile.jpg"
}
```

**Constraints:**
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Auto-resize to 512x512px

---

## 3. Volunteer Endpoints

### POST /volunteers/register
**Purpose:** Register as a volunteer

**Request:**
```json
{
    "skills": ["FIRST_AID", "CPR"],
    "certifications": [
        {
            "name": "CPR Certification",
            "issuedBy": "American Red Cross",
            "issueDate": "2023-01-15",
            "expiryDate": "2025-01-15"
        }
    ],
    "idProof": {
        "type": "DRIVERS_LICENSE",
        "number": "D1234567",
        "documentUrl": "https://s3.../id.jpg"
    },
    "emergencyContact": {
        "name": "Jane Doe",
        "phone": "+1234567890",
        "relationship": "Spouse"
    }
}
```

**Response (201 Created):**
```json
{
    "message": "Volunteer registration submitted",
    "status": "PENDING_VERIFICATION",
    "volunteerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### PATCH /volunteers/availability
**Purpose:** Toggle volunteer availability

**Request:**
```json
{
    "available": true
}
```

**Response (200 OK):**
```json
{
    "message": "Availability updated",
    "available": true
}
```

**Business Logic:**
- Can only set `available=true` if `verified=true`
- Automatically broadcasts to Socket.io for real-time matching updates

---

### GET /volunteers/stats
**Purpose:** Get volunteer performance statistics

**Response (200 OK):**
```json
{
    "totalSOSHandled": 42,
    "resolvedCount": 40,
    "averageRating": 4.8,
    "averageResponseTime": 180,  // seconds
    "cancellationCount": 2,
    "recentFeedback": [
        {
            "sosId": "...",
            "rating": 5,
            "comment": "Very helpful and quick!",
            "createdAt": "2025-12-17T10:00:00Z"
        }
    ]
}
```

---

## 4. SOS Endpoints

### POST /sos
**Purpose:** Create emergency SOS request

**Request:**
```json
{
    "emergencyType": "MEDICAL",
    "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "accuracy": 10.5
    },
    "description": "Chest pain, difficulty breathing"
}
```

**Response (201 Created):**
```json
{
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "priority": "CRITICAL",
    "createdAt": "2025-12-18T12:45:00Z",
    "volunteersNotified": 8
}
```

**Errors:**
- `429 Too Many Requests`: Exceeded 3 SOS per hour limit
- `400 Bad Request`: Invalid location coordinates

**Side Effects:**
- Triggers matching engine to find nearby volunteers
- Sends push notifications to matched volunteers
- Creates Socket.io room `sos:{sosId}`

---

### GET /sos/:id
**Purpose:** Get SOS details

**Response (200 OK):**
```json
{
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "emergencyType": "MEDICAL",
    "priority": "CRITICAL",
    "status": "ACCEPTED",
    "location": {
        "latitude": 37.7749,
        "longitude": -122.4194
    },
    "description": "Chest pain, difficulty breathing",
    "createdAt": "2025-12-18T12:45:00Z",
    "acceptedAt": "2025-12-18T12:46:30Z",
    "volunteer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "phone": "+1234567890",
        "photoUrl": "https://s3.../volunteer.jpg",
        "skills": ["FIRST_AID", "CPR"],
        "averageRating": 4.9,
        "estimatedArrival": "2025-12-18T12:50:00Z"
    }
}
```

---

### POST /sos/:id/accept
**Purpose:** Volunteer accepts SOS request

**Response (200 OK):**
```json
{
    "message": "SOS accepted successfully",
    "sosId": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
        "name": "John Doe",
        "phone": "+1234567890",
        "location": {
            "latitude": 37.7749,
            "longitude": -122.4194
        }
    }
}
```

**Errors:**
- `409 Conflict`: SOS already accepted by another volunteer
- `403 Forbidden`: Volunteer not verified or not available

**Concurrency Handling:**
- Uses database row-level locking (`SELECT FOR UPDATE`)
- First volunteer to acquire lock wins
- Others receive 409 Conflict

---

### POST /sos/:id/reject
**Purpose:** Volunteer rejects SOS request

**Request:**
```json
{
    "reason": "Too far away"  // Optional
}
```

**Response (200 OK):**
```json
{
    "message": "SOS rejected"
}
```

---

### POST /sos/:id/cancel
**Purpose:** User cancels SOS (before resolution)

**Response (200 OK):**
```json
{
    "message": "SOS cancelled successfully"
}
```

**Side Effects:**
- Notifies volunteer (if accepted)
- Updates volunteer availability back to `true`

---

### POST /sos/:id/resolve
**Purpose:** Mark SOS as resolved (volunteer only)

**Response (200 OK):**
```json
{
    "message": "SOS marked as resolved",
    "resolvedAt": "2025-12-18T13:00:00Z"
}
```

**Side Effects:**
- Sets volunteer `available=true`
- Triggers feedback request to user

---

### POST /sos/:id/feedback
**Purpose:** User provides feedback on volunteer

**Request:**
```json
{
    "rating": 5,
    "comment": "Very helpful and professional!"
}
```

**Response (200 OK):**
```json
{
    "message": "Feedback submitted successfully"
}
```

**Side Effects:**
- Updates volunteer `average_rating` via database trigger

---

### GET /sos/history
**Purpose:** Get user's SOS history

**Query Parameters:**
```
?limit=20&offset=0&status=RESOLVED
```

**Response (200 OK):**
```json
{
    "total": 15,
    "items": [
        {
            "id": "660e8400-e29b-41d4-a716-446655440000",
            "emergencyType": "MEDICAL",
            "status": "RESOLVED",
            "createdAt": "2025-12-18T12:45:00Z",
            "resolvedAt": "2025-12-18T13:00:00Z",
            "duration": 900,  // seconds
            "volunteer": {
                "name": "Jane Smith",
                "rating": 5
            }
        }
    ]
}
```

---

## 5. Chat Endpoints

### GET /sos/:id/messages
**Purpose:** Get chat history for SOS

**Response (200 OK):**
```json
{
    "messages": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440000",
            "senderId": "550e8400-e29b-41d4-a716-446655440000",
            "senderName": "John Doe",
            "content": "I'm at the main entrance",
            "createdAt": "2025-12-18T12:50:00Z",
            "isRead": true
        }
    ]
}
```

**WHY REST Endpoint for Chat:**
- Load initial chat history on page load
- Real-time messages use Socket.io
- Fallback if WebSocket connection fails

---

## 6. Admin Endpoints

### GET /admin/dashboard
**Purpose:** Get admin dashboard metrics

**Authorization:** Admin role required

**Response (200 OK):**
```json
{
    "activeSOS": 12,
    "pendingVerifications": {
        "volunteers": 5,
        "professionals": 2
    },
    "metrics": {
        "avgResponseTime": 180,  // seconds
        "resolutionRate": 0.95,
        "totalVolunteers": 1250,
        "availableVolunteers": 320
    },
    "recentSOS": [
        {
            "id": "...",
            "emergencyType": "MEDICAL",
            "status": "PENDING",
            "createdAt": "2025-12-18T13:00:00Z",
            "location": { "latitude": 37.7749, "longitude": -122.4194 }
        }
    ]
}
```

---

### GET /admin/sos
**Purpose:** Get all SOS requests (with filters)

**Query Parameters:**
```
?status=PENDING&emergencyType=MEDICAL&limit=50&offset=0
```

**Response (200 OK):**
```json
{
    "total": 150,
    "items": [
        {
            "id": "...",
            "user": { "name": "John Doe", "phone": "+1234567890" },
            "emergencyType": "MEDICAL",
            "status": "PENDING",
            "location": { "latitude": 37.7749, "longitude": -122.4194 },
            "createdAt": "2025-12-18T13:00:00Z",
            "elapsedTime": 120  // seconds since creation
        }
    ]
}
```

---

### POST /admin/volunteers/:id/verify
**Purpose:** Verify volunteer application

**Request:**
```json
{
    "verified": true,
    "notes": "All documents verified"
}
```

**Response (200 OK):**
```json
{
    "message": "Volunteer verified successfully"
}
```

**Side Effects:**
- Sends approval notification to volunteer
- Sets `verified=true` in database

---

### POST /admin/sos/:id/escalate
**Purpose:** Manually escalate SOS to authorities

**Request:**
```json
{
    "authority": "POLICE",  // POLICE, FIRE, AMBULANCE
    "notes": "Requires immediate police intervention"
}
```

**Response (200 OK):**
```json
{
    "message": "SOS escalated to authorities",
    "ticketNumber": "POL-2025-12345"
}
```

---

## Socket.io Events

### Connection & Authentication

**Client → Server (on connect):**
```javascript
const socket = io('wss://api.careconnect.com', {
    auth: {
        token: accessToken
    }
});
```

**Server validates JWT and assigns user to socket**

---

## User Events

### Event: `sos:create`
**Direction:** Client → Server  
**Purpose:** Create SOS request (alternative to REST API)

**Payload:**
```javascript
socket.emit('sos:create', {
    emergencyType: 'MEDICAL',
    location: { latitude: 37.7749, longitude: -122.4194 },
    description: 'Chest pain'
});
```

**Server Response:**
```javascript
socket.on('sos:created', (data) => {
    // data = { sosId, status: 'PENDING', volunteersNotified: 8 }
});
```

---

### Event: `sos:matched`
**Direction:** Server → Client  
**Purpose:** Notify user that volunteers have been notified

**Payload:**
```javascript
socket.on('sos:matched', (data) => {
    // data = { sosId, volunteersNotified: 8 }
});
```

---

### Event: `sos:accepted`
**Direction:** Server → Client  
**Purpose:** Notify user that a volunteer accepted

**Payload:**
```javascript
socket.on('sos:accepted', (data) => {
    /*
    data = {
        sosId: '...',
        volunteer: {
            id: '...',
            name: 'Jane Smith',
            phone: '+1234567890',
            photoUrl: '...',
            skills: ['FIRST_AID', 'CPR'],
            averageRating: 4.9
        }
    }
    */
});
```

---

### Event: `volunteer:location`
**Direction:** Server → Client  
**Purpose:** Real-time volunteer location updates

**Payload:**
```javascript
socket.on('volunteer:location', (data) => {
    /*
    data = {
        volunteerId: '...',
        location: { latitude: 37.7750, longitude: -122.4195 },
        timestamp: '2025-12-18T12:50:00Z',
        eta: 180  // seconds
    }
    */
});
```

**Frequency:** Every 5 seconds while volunteer is en route

---

## Volunteer Events

### Event: `sos:new`
**Direction:** Server → Client  
**Purpose:** Notify volunteer of nearby SOS

**Payload:**
```javascript
socket.on('sos:new', (data) => {
    /*
    data = {
        sosId: '...',
        emergencyType: 'MEDICAL',
        priority: 'CRITICAL',
        location: { latitude: 37.7749, longitude: -122.4194 },
        distance: 1200,  // meters
        description: 'Chest pain',
        user: {
            name: 'John Doe',
            photoUrl: '...'
        }
    }
    */
});
```

---

### Event: `sos:accept`
**Direction:** Client → Server  
**Purpose:** Volunteer accepts SOS

**Payload:**
```javascript
socket.emit('sos:accept', { sosId: '...' });
```

**Server Response:**
```javascript
socket.on('sos:accept:success', (data) => {
    // data = { sosId, user: { name, phone, location } }
});

socket.on('sos:accept:error', (error) => {
    // error = { message: 'SOS already accepted' }
});
```

---

### Event: `location:update`
**Direction:** Client → Server  
**Purpose:** Send volunteer's current location

**Payload:**
```javascript
socket.emit('location:update', {
    sosId: '...',
    location: { latitude: 37.7750, longitude: -122.4195 }
});
```

**No response needed (fire-and-forget)**

---

## Chat Events

### Event: `chat:join`
**Direction:** Client → Server  
**Purpose:** Join SOS chat room

**Payload:**
```javascript
socket.emit('chat:join', { sosId: '...' });
```

---

### Event: `chat:message`
**Direction:** Client → Server  
**Purpose:** Send chat message

**Payload:**
```javascript
socket.emit('chat:message', {
    sosId: '...',
    message: "I'm on my way"
});
```

**Server Broadcast:**
```javascript
socket.on('chat:message', (data) => {
    /*
    data = {
        sosId: '...',
        senderId: '...',
        senderName: 'Jane Smith',
        content: "I'm on my way",
        timestamp: '2025-12-18T12:50:00Z'
    }
    */
});
```

---

### Event: `chat:typing`
**Direction:** Client → Server  
**Purpose:** Typing indicator

**Payload:**
```javascript
socket.emit('chat:typing', { sosId: '...', isTyping: true });
```

**Server Broadcast:**
```javascript
socket.on('chat:typing', (data) => {
    // data = { sosId, userId, userName, isTyping: true }
});
```

---

## Status Events

### Event: `sos:status`
**Direction:** Client → Server  
**Purpose:** Update SOS status

**Payload:**
```javascript
socket.emit('sos:status', {
    sosId: '...',
    status: 'EN_ROUTE'  // EN_ROUTE, ARRIVED, IN_PROGRESS
});
```

**Server Broadcast:**
```javascript
socket.on('sos:status', (data) => {
    // data = { sosId, status: 'EN_ROUTE', timestamp: '...' }
});
```

---

## Error Handling

### Standard Error Response

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format"
            }
        ]
    }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., SOS already accepted) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702908000
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/login` | 5 requests | 15 minutes |
| `POST /sos` | 3 requests | 1 hour |
| `POST /users/location` | 60 requests | 1 minute |
| `GET *` | 100 requests | 15 minutes |
| `POST *` (other) | 50 requests | 15 minutes |

**Implementation (Redis):**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

app.use('/api/', limiter);
```

---

## API Versioning

**Strategy:** URL-based versioning

```
/api/v1/sos
/api/v2/sos  // Future version
```

**WHY URL Versioning:**
- Clear and explicit
- Easy to route in load balancers
- Supports multiple versions simultaneously

**Deprecation Policy:**
- New version announced 3 months in advance
- Old version supported for 6 months after new release
- Deprecation warnings in response headers:
  ```http
  Deprecation: true
  Sunset: Sat, 31 Dec 2025 23:59:59 GMT
  Link: <https://api.careconnect.com/v2/sos>; rel="successor-version"
  ```

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-18  
**Total Endpoints:** 25+  
**Total Socket Events:** 15+
