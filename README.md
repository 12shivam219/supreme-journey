# Tracker — Family Life Tracking & Safety Suite

"Tracker" is a production-ready family life tracking and personal management monorepo application built with Fastify, Prisma, PostgreSQL, and React.

## Monorepo Architecture

```
Tracker/
├── apps/
│   ├── backend/        # Node.js + TypeScript + Fastify + Prisma + PostgreSQL
│   ├── web/            # React 18 + TypeScript + Vite + TailwindCSS
│   ├── windows-agent/  # Placeholder for Windows Desktop Agent (Phase 5)
│   └── android-agent/  # Placeholder for Android Mobile Agent (Phase 6)
├── packages/
│   └── shared/         # Shared TypeScript interfaces & types
├── docker-compose.yml  # Local dev database & service orchestrator
├── .env.example        # Environment variable templates
└── README.md
```

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start PostgreSQL Database (Docker)
```bash
docker compose up postgres -d
```

### 4. Run Prisma Database Migrations & Seed Initial Parent Account
```bash
# Generate Prisma Client
npm run prisma:generate --workspace=apps/backend

# Apply schema migrations to PostgreSQL
npm run prisma:migrate --workspace=apps/backend -- --name init

# Seed database with initial parent administrator user
npm run db:seed --workspace=apps/backend
```

### 5. Launch Development Servers
```bash
# Run backend server (http://localhost:3000)
npm run dev:backend

# Run web app dashboard (http://localhost:5173)
npm run dev:web
```

## Database Schema (Prisma PostgreSQL)

- **users**: Parent & child account management.
- **family_links**: Relational mapping between parents and children.
- **devices**: Monitoring targets (Windows/Android).
- **habits & habit_logs**: Habit goals and daily completion logs.
- **mood_logs**: Emotional tracking and daily notes.
- **journal_entries**: Private journal records.
- **tasks**: Family & personal task management with priorities & recurrence.
- **app_sessions**: Fine-grained application usage window sessions.
- **screen_time_daily**: Daily screen time aggregates by app.
- **alerts**: Safety event notifications.
- **screenshots**: Periodic desktop screenshots (Windows agent).

## Full Docker Compose Build
To run the full stack (PostgreSQL, Fastify API, Nginx Web Frontend) in containerized mode:
```bash
docker compose up --build
```
