# CareConnect - Community-Based Emergency Help Platform

> **A production-ready, scalable, real-time emergency response system designed for high-paying product-based company interviews**

[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue)](./01-ARCHITECTURE-OVERVIEW.md)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-green)](./03-DATABASE-SCHEMA.md)
[![Real-Time](https://img.shields.io/badge/Real--Time-Socket.io-orange)](./04-API-CONTRACTS.md)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Documentation](#documentation)
6. [Quick Start](#quick-start)
7. [Project Structure](#project-structure)
8. [Contributing](#contributing)
9. [License](#license)

---

## 🎯 Overview

**CareConnect** is a **production-grade emergency response platform** that connects people in distress with nearby volunteers and professionals in real-time. Designed as a **modular monolith** with clear service boundaries, it demonstrates enterprise-level architecture patterns suitable for city/state-level scaling.

### Problem Statement

In emergencies, every second counts. CareConnect bridges the gap between emergency services and community support by:
- **Instantly matching** users with nearby volunteers (< 5 seconds)
- **Real-time communication** via chat and live location tracking
- **Intelligent routing** using geo-spatial queries and progressive radius search
- **Admin monitoring** with analytics and intervention capabilities

### Target Audience

This project is designed for:
- ✅ **Software Engineers** preparing for system design interviews
- ✅ **Backend Developers** learning scalable architecture patterns
- ✅ **Full-Stack Developers** building real-time applications
- ✅ **Students** studying distributed systems and databases

---

## ✨ Key Features

### Core Functionality

| Feature | Description | Technology |
|---------|-------------|------------|
| **SOS Management** | Create, track, and resolve emergency requests | PostgreSQL + PostGIS |
| **Geo-Spatial Matching** | Find volunteers within 1-10km radius | Redis Geo + PostGIS |
| **Real-Time Communication** | Live chat and location tracking | Socket.io + Redis Pub/Sub |
| **Role-Based Access Control** | USER, VOLUNTEER, PROFESSIONAL, ADMIN | JWT + Middleware |
| **Volunteer Verification** | Admin approval workflow for volunteers | PostgreSQL + S3 |
| **Analytics Dashboard** | Real-time metrics and heat maps | PostgreSQL Views + Redis |
| **Push Notifications** | Multi-channel alerts (FCM, SMS) | Firebase + Twilio |
| **Feedback System** | User ratings for volunteers | PostgreSQL Triggers |

### Advanced Features

- **Progressive Radius Search** (1km → 3km → 5km → 10km)
- **Auto-Escalation** (if no response in 2 minutes)
- **Optimistic Locking** (prevent double-acceptance)
- **Circuit Breakers** (graceful degradation)
- **Rate Limiting** (prevent abuse)
- **Location Spoofing Detection** (IP geolocation validation)

---

## 🛠️ Tech Stack

### Frontend
```
React.js (SPA)
TypeScript
Tailwind CSS
React Query (server state)
Socket.io-client (real-time)
Google Maps API (mapping)
```

### Backend
```
Node.js + Express.js
Socket.io (WebSockets)
JWT + Refresh Tokens (auth)
Zod (validation)
Winston (logging)
```

### Data Layer
```
PostgreSQL 15 + PostGIS (primary database)
Redis 7 (caching + pub/sub + geo-queries)
AWS S3 (file storage)
```

### External Services
```
Firebase Cloud Messaging (push notifications)
Twilio (SMS fallback)
Google Maps API (geocoding + directions)
```

### DevOps
```
Docker + Docker Compose
GitHub Actions (CI/CD)
AWS ECS / Kubernetes (deployment)
Datadog / Sentry (monitoring)
```

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────┐
│   Clients   │ (React SPA)
└──────┬──────┘
       │
┌──────▼──────┐
│Load Balancer│ (NGINX)
└──────┬──────┘
       │
┌──────▼──────────────────┐
│  Node.js API Gateway    │
│  + Socket.io Server     │
└──────┬──────────────────┘
       │
       ├──> PostgreSQL + PostGIS (persistent storage)
       ├──> Redis (cache + real-time coordination)
       └──> External APIs (Maps, FCM, SMS)
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Modular Monolith | Faster development, lower ops complexity, microservice-ready |
| **Database** | PostgreSQL + PostGIS | ACID compliance, mature geo-spatial support |
| **Cache** | Redis | Sub-millisecond geo-queries, pub/sub for Socket.io |
| **Real-Time** | Socket.io + Redis Adapter | Horizontal scaling, automatic fallbacks |
| **Auth** | JWT + Refresh Tokens | Stateless, scalable, secure long sessions |

**For detailed architecture, see:** [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md)

---

## 📚 Documentation

This project includes **8 comprehensive documents** covering every aspect of the system:

| Document | Description | Pages |
|----------|-------------|-------|
| [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md) | High-level system design, components, data flow | 15 |
| [02-USER-WORKFLOWS.md](./02-USER-WORKFLOWS.md) | Detailed workflows for all user types with sequence diagrams | 20 |
| [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) | Complete ERD, table definitions, indexes, migrations | 18 |
| [04-API-CONTRACTS.md](./04-API-CONTRACTS.md) | REST endpoints + Socket.io events with request/response schemas | 16 |
| [05-FOLDER-STRUCTURE.md](./05-FOLDER-STRUCTURE.md) | Modular monolith organization with code examples | 12 |
| [06-IMPLEMENTATION-PLAN.md](./06-IMPLEMENTATION-PLAN.md) | Phase-wise development roadmap (12 weeks) | 14 |
| [07-INTERVIEW-GUIDE.md](./07-INTERVIEW-GUIDE.md) | System design interview preparation with Q&A | 22 |
| [08-FUTURE-AI-ML-EXTENSIONS.md](./08-FUTURE-AI-ML-EXTENSIONS.md) | ML features: fraud detection, predictive analytics, NLP | 16 |

**Total:** 133+ pages of production-grade documentation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/careconnect.git
cd careconnect

# Start all services
docker-compose up -d

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run migrate

# Start server
npm run dev
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with API URL

# Start dev server
npm run dev
```

### Default Credentials

```
Admin:
  Email: admin@careconnect.com
  Password: admin123

Test User:
  Email: user@test.com
  Password: password123

Test Volunteer:
  Email: volunteer@test.com
  Password: password123
```

---

## 📁 Project Structure

```
careconnect/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── sos/
│   │   │   ├── volunteers/
│   │   │   └── admin/
│   │   ├── sockets/           # Socket.io handlers
│   │   ├── middleware/        # Express middleware
│   │   └── config/            # Configuration
│   ├── migrations/            # Database migrations
│   └── tests/                 # Test files
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── api/               # API client
│   │   └── contexts/          # React contexts
│   └── public/
│
├── docs/                      # Documentation (this folder)
│   ├── 01-ARCHITECTURE-OVERVIEW.md
│   ├── 02-USER-WORKFLOWS.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-API-CONTRACTS.md
│   ├── 05-FOLDER-STRUCTURE.md
│   ├── 06-IMPLEMENTATION-PLAN.md
│   ├── 07-INTERVIEW-GUIDE.md
│   └── 08-FUTURE-AI-ML-EXTENSIONS.md
│
└── docker-compose.yml
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# Frontend tests
cd frontend
npm test

# E2E tests (Playwright)
npm run test:e2e
```

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

**Expected Performance:**
- API Response Time: < 500ms (p95)
- SOS Creation: < 3 seconds
- Volunteer Notification: < 5 seconds
- Concurrent Users: 1000+

---

## 📊 Scalability

### Horizontal Scaling

```
Load Balancer
    │
    ├──> App Server 1 ──┐
    ├──> App Server 2 ──┼──> PostgreSQL Primary
    └──> App Server 3 ──┘       │
                                └──> Read Replica
         │
         └──> Redis Cluster
```

### Database Optimization

- **Indexes:** 25+ optimized indexes on hot queries
- **Partitioning:** `sos_requests` partitioned by month
- **Connection Pooling:** PgBouncer (max 100 connections)
- **Read Replicas:** Offload analytics to replicas

### Caching Strategy

- **Redis Geo-Index:** Volunteer locations (TTL: 5 min)
- **User Sessions:** JWT blacklist (TTL: 15 min)
- **API Responses:** Cache-aside pattern (TTL: 1 min)

**For detailed scalability discussion, see:** [07-INTERVIEW-GUIDE.md](./07-INTERVIEW-GUIDE.md#scalability-discussion)

---

## 🔒 Security

### Authentication
- JWT access tokens (15min expiry)
- Refresh token rotation (7-day expiry)
- httpOnly cookies (XSS protection)

### Authorization
- Role-Based Access Control (RBAC)
- Middleware checks on all protected routes

### Input Validation
- Zod schemas on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (Content Security Policy)

### Rate Limiting
- 3 SOS per hour per user
- 5 login attempts per 15 minutes
- Token bucket algorithm (Redis)

**For security details, see:** [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md#security-architecture)

---

## 🎓 Learning Resources

### For Interviews

1. **Read:** [07-INTERVIEW-GUIDE.md](./07-INTERVIEW-GUIDE.md)
   - Practice explaining the architecture in 30 minutes
   - Memorize key design decisions and trade-offs
   - Review common interview questions

2. **Understand:**
   - Why modular monolith over microservices?
   - How does geo-spatial matching work?
   - What happens if database fails?

3. **Practice:**
   - Draw the architecture diagram from memory
   - Explain SOS lifecycle end-to-end
   - Discuss scalability to 1M users

### For Implementation

1. **Start with:** [06-IMPLEMENTATION-PLAN.md](./06-IMPLEMENTATION-PLAN.md)
2. **Follow:** Phase 1 → Phase 2 → ... → Phase 6
3. **Test:** Write tests for each module before moving forward

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **Backend:** ESLint + Prettier
- **Frontend:** ESLint + Prettier + TypeScript strict mode
- **Tests:** Minimum 80% coverage
- **Documentation:** Update relevant .md files

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **PostGIS** for geo-spatial queries
- **Socket.io** for real-time communication
- **React** for frontend framework
- **PostgreSQL** for reliable data storage

---

## 📧 Contact

**Project Maintainer:** Your Name  
**Email:** your.email@example.com  
**LinkedIn:** [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)

---

## 🌟 Star This Repository

If you found this project helpful for interview preparation or learning, please give it a ⭐!

---

**Built with ❤️ for engineers preparing for top product companies**

**Last Updated:** 2025-12-18  
**Version:** 1.0.0  
**Status:** Production-Ready Documentation
