# Tracker System Architecture & Implementation Guide

**Version:** 1.0.0  
**Last Updated:** August 2026  
**Status:** Production-Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [API Design](#api-design)
7. [Database Schema](#database-schema)
8. [Security & Privacy](#security--privacy)
9. [Performance Optimizations](#performance-optimizations)
10. [Error Handling & Monitoring](#error-handling--monitoring)
11. [Deployment & DevOps](#deployment--devops)
12. [Development Workflow](#development-workflow)

---

## System Overview

**Tracker** is a comprehensive family wellness application that combines personal habit tracking, task management, and parental monitoring of children's device usage. The system is built with modern full-stack architecture supporting real-time updates, secure data handling, and accessibility.

### Core Features
- **Personal Tracking**: Tasks, habits, mood logs, and journal entries
- **Family Monitoring**: Real-time screen time tracking, app monitoring, and alerts
- **Real-time Alerts**: WebSocket-based instant notifications for anomalies
- **Data Export**: Comprehensive data export with retention policies
- **Audit Logging**: Full audit trail of sensitive operations

---

## Technology Stack

### Backend
- **Framework**: Fastify 4.x (HTTP server)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Refresh tokens with httpOnly cookies
- **Real-time**: Socket.IO for WebSocket communication
- **Logging**: Pino (structured logging)
- **Error Tracking**: Sentry
- **Security**: Helmet, CORS, Rate limiting, bcrypt password hashing
- **Task Scheduling**: node-cron for background jobs
- **Email**: Nodemailer for transactional emails
- **Language**: TypeScript with strict mode

### Frontend
- **Framework**: React 18.x with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Component Library**: Lucide React (icons)
- **Charts**: Recharts
- **Real-time**: Socket.IO client
- **Error Tracking**: Sentry for React
- **Error Boundaries**: Custom React ErrorBoundary

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL container
- **Reverse Proxy**: Can be nginx/Caddy
- **Environment**: Node.js runtime

---

## Architecture Layers

### 1. Presentation Layer (React Frontend)
```
App.tsx (main component)
├── Components/
│   ├── Authenticated Views
│   │   ├── TodayDashboard (personal overview)
│   │   ├── TasksView (task management)
│   │   ├── HabitsView (habit tracking)
│   │   ├── JournalView (journal entries)
│   │   └── MonitoringDashboard (family monitoring)
│   ├── Auth Components
│   │   ├── AuthModal (login/register)
│   │   └── DevicePairingModal
│   ├── Reusable Components
│   │   ├── LoadingStates (spinner, skeleton, empty state)
│   │   ├── ErrorBoundary (error UI)
│   │   └── Modal components
│   └── Layout Components
│       └── Sidebar navigation
├── Hooks/
│   ├── useApiError (API error handling)
│   └── Custom hooks for state management
├── Utils/
│   ├── sentry.ts (error tracking initialization)
│   ├── a11y.ts (accessibility utilities)
│   └── API helpers
└── Styles/
    └── Tailwind CSS configuration
```

### 2. API Layer (Fastify Backend)
```
src/index.ts (main server)
├── Routes/
│   ├── auth.routes.ts → AuthController
│   ├── user.routes.ts → UserController
│   ├── family.routes.ts → FamilyController
│   ├── habit.routes.ts → HabitController
│   ├── mood.routes.ts → MoodController
│   ├── journal.routes.ts → JournalController
│   ├── task.routes.ts → TaskController
│   ├── summary.routes.ts → SummaryController
│   ├── monitoring.routes.ts → MonitoringController
│   └── telemetry.routes.ts → TelemetryController
├── Controllers/
│   ├── Request validation & routing
│   ├── Structured error responses
│   └── HTTP status code handling
├── Services/
│   ├── Business logic layer
│   ├── Database operations
│   └── External service integration
├── Middleware/
│   ├── error-handler.ts (centralized error handling)
│   └── auth.ts (JWT verification)
├── Utils/
│   ├── logger.ts (Pino structured logging)
│   ├── sentry.ts (error tracking)
│   └── Database utilities
└── Config/
    └── db.ts (Prisma client)
```

### 3. Data Layer (PostgreSQL)
```
Database Schema
├── Users (authentication & profiles)
├── Devices (child device tracking)
├── AppSessions (device activity)
├── ScreenTimeDaily (aggregated screen time)
├── Tasks, Habits, Moods, Journals (personal tracking)
├── Alerts (monitoring alerts)
├── AuditLogs (compliance logging)
├── RefreshTokens (session management)
└── Indexes on high-query-volume columns
```

---

## Core Components

### Authentication Flow
```
User Signup/Login
  ↓
JWT Access Token (15 min expiry) + Refresh Token (7 day expiry)
  ↓
Refresh Token stored in httpOnly cookie (secure, sameSite=lax)
  ↓
Access Token in Bearer header or localStorage
  ↓
Automatic token refresh on expiry via POST /api/auth/refresh
```

### Error Handling Flow
```
Fastify Request
  ↓
Controller / Service Operation
  ↓
Exception thrown (ApiError or native Error)
  ↓
Error Handler Middleware catches it
  ↓
Logs with Pino structured logging
  ↓
Sends to Sentry (production only)
  ↓
Returns structured JSON error response with requestId
  ↓
Frontend ErrorBoundary or useApiError hook catches
  ↓
User-friendly error message displayed
```

### Real-time Data Flow (Socket.IO)
```
Backend Service Emits Event
  ↓
Socket.IO broadcasts to subscribed clients
  ↓
Frontend Socket.IO client receives
  ↓
Component state updates
  ↓
React re-renders with latest data
```

---

## API Design

### Base URL
- Development: `http://localhost:3000/api`
- Production: `{domain}/api`

### Response Format (Success)
```json
{
  "data": { /* resource */ },
  "meta": { "timestamp": "2026-08-15T10:00:00Z" }
}
```

### Response Format (Error)
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401,
    "requestId": "req-12345",
    "timestamp": "2026-08-15T10:00:00Z"
  },
  "details": { /* optional context */ }
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request (validation error)
- `401`: Unauthorized (auth failed)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `409`: Conflict (email exists)
- `429`: Rate Limited
- `500`: Internal Server Error

### Rate Limiting
- Applied per-endpoint as needed
- Defaults: 100 requests per minute per IP
- Can be configured per route

---

## Database Schema

### Key Models & Indexes

**Users**
- Indexes: email, role, createdAt
- Purpose: Fast user lookup by email or role

**Devices**
- Indexes: childId, lastSeen, createdAt
- Purpose: Quick device queries by child

**AppSessions**
- Indexes: deviceId, startTime, appName
- Purpose: Fast activity timeline queries

**ScreenTimeDaily**
- Indexes: deviceId, date
- Purpose: Efficient daily report generation

**Alerts**
- Indexes: childId, triggeredAt, acknowledged
- Purpose: Fast alert retrieval and filtering

**AuditLogs**
- Indexes: parentId, childId, action, createdAt
- Purpose: Compliance and security audit trails

### Performance Notes
- All foreign key relationships are indexed
- Date queries optimized with date indexes
- Composite queries on (deviceId, date) possible
- Retention policies delete old data automatically

---

## Security & Privacy

### Authentication
- Passwords: bcrypt with 10 salt rounds
- JWT Secret: 256-bit minimum (configured via env)
- Token Rotation: Refresh token rotated on each use
- Session Timeout: 15 min access, 7 day refresh

### Authorization
- Role-based access control (parent/child)
- User can only access their own data
- Parents can only access child profiles they link
- Audit logging of sensitive operations

### Data Protection
- Encryption Service for sensitive fields (if needed)
- HTTPS enforced in production (via reverse proxy)
- CORS configured to allowed origins only
- Helmet headers for security

### Privacy Features
- User data export capability
- Automatic retention/deletion policies
- Audit logs retention: configurable
- GDPR/CCPA compliance ready

### Sensitive Operations Audited
- VIEW_TIMELINE
- VIEW_SCREENSHOTS
- EXPORT_DATA
- DELETE_DEVICE
- UPDATE_LIMITS

---

## Performance Optimizations

### Database
1. **Indexes**: Added on all frequently queried columns
2. **Query Optimization**: Prisma queries reviewed for N+1 queries
3. **Connection Pooling**: Built into Prisma
4. **Caching**: Consider Redis for frequently accessed data
5. **Pagination**: Implemented in list endpoints

### API
1. **Rate Limiting**: Prevent abuse
2. **Compression**: Fastify compression plugin (optional)
3. **Caching Headers**: Set appropriate Cache-Control
4. **Request Validation**: Early validation prevents wasted DB queries

### Frontend
1. **Code Splitting**: Vite handles dynamic imports
2. **Image Optimization**: Use modern formats (WebP)
3. **Lazy Loading**: Components loaded on demand
4. **Memoization**: React.memo for expensive components
5. **Virtual Scrolling**: For large lists (future optimization)

### Background Jobs
1. **Digest Cron**: Daily summary emails (3 AM daily)
2. **Retention Cron**: Auto-delete old data (30 day configurable)
3. **Scheduled Cleanup**: Stale tokens, expired sessions

---

## Error Handling & Monitoring

### Structured Logging (Pino)
```
Production: JSON format with request context
Development: Pretty-printed with colors
Files: Rotated daily in /logs/app-YYYY-MM-DD.log
```

### Error Tracking (Sentry)
- Automatically captures unhandled exceptions
- Frontend & backend integrated
- Production-only in sensitive environments
- Stores error context, user info, breadcrumbs

### Log Levels
- `debug`: Development details
- `info`: Normal operations (startups, auth)
- `warn`: Warnings (deprecated usage)
- `error`: Errors (exceptions, failed operations)

### Health Checks
- Endpoint: `GET /health`
- Response: `{ "status": "ok", "timestamp": "..." }`

---

## Deployment & DevOps

### Docker Setup
```yaml
Services:
  - backend (Node.js app)
  - web (React app via nginx)
  - postgres (database)
  - redis (optional caching)
```

### Environment Configuration
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SENTRY_DSN=https://...
JWT_SECRET=<generate-with-openssl>
PORT=3000
```

### Database Migrations
```bash
npm run prisma:migrate  # Run migrations
npm run prisma:generate # Generate Prisma client
npm run db:seed         # Seed initial data
```

### Deployment Steps
1. Pull latest code
2. Install dependencies: `npm ci`
3. Run migrations: `npm run prisma:migrate -- --deploy`
4. Build backend: `npm run build`
5. Build frontend: `npm run build`
6. Start services: `docker-compose up -d`

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev

# Terminal 3: Database
docker-compose up postgres

# Terminal 4: Database migrations
cd apps/backend
npm run prisma:migrate
```

### Testing
```bash
# Backend tests
cd apps/backend
npm test

# Frontend (add testing setup)
cd apps/web
npm test
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration (optional)
- Prettier formatting (optional)
- Pre-commit hooks recommended

### Common Tasks

**Add a new API endpoint:**
1. Define route in `routes/feature.routes.ts`
2. Create controller in `controllers/feature.controller.ts`
3. Implement service in `services/feature.service.ts`
4. Update Prisma schema if needed
5. Create migration: `npm run prisma:migrate`

**Add a new database model:**
1. Update `prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate dev --name add_model`
3. Update services to use new model
4. Generate new Prisma client: `npm run prisma:generate`

**Deploy to production:**
1. Create release branch
2. Run full test suite
3. Update version in package.json
4. Create git tag: `git tag v1.x.x`
5. Run deployment pipeline

---

## Future Enhancements

1. **Caching Layer**: Add Redis for session cache & frequently accessed data
2. **Search**: Full-text search on journal entries, tasks
3. **Analytics**: Usage analytics and trending insights
4. **Mobile Apps**: Native Android/iOS apps (already in repo structure)
5. **Advanced Scheduling**: More flexible task recurrence rules
6. **AI Features**: Habit recommendations, mood prediction
7. **Multi-language**: i18n support for internationalization
8. **Dark/Light Mode**: Theme switching (can extend Tailwind setup)

---

## Troubleshooting Guide

### Backend won't start
- Check `DATABASE_URL` is valid
- Ensure PostgreSQL is running
- Check port 3000 is available
- Review logs in console

### Database connection issues
- Verify PostgreSQL is running: `docker-compose ps`
- Check credentials in `.env`
- Test connection: `psql postgresql://...`

### Frontend can't reach API
- Check `VITE_API_BASE_URL` matches backend
- Ensure backend is running
- Check CORS configuration
- Verify firewall isn't blocking

### Sentry not working
- Verify `SENTRY_DSN` is set
- Check environment is production
- Ensure internet connectivity
- Check Sentry dashboard for issues

---

## Support & Maintenance

- **Logs Location**: `/apps/backend/logs/`
- **Database Backups**: Implement automated backups before production
- **Security Updates**: Review dependencies monthly
- **Performance Monitoring**: Enable APM in production
- **On-call Runbook**: Document incident response procedures

---

**Document Maintainers:** Development Team  
**Last Reviewed:** August 2026  
**Next Review:** November 2026
