# Tracker - Quick Reference Deployment Checklist

## ⚡ Pre-Deployment (Do This First)

### 1. Install Dependencies
```bash
# Backend
cd apps/backend
npm install

# Frontend
cd apps/web
npm install
```

### 2. Environment Setup
```bash
# Copy and configure .env
cp .env .env.production

# Edit .env.production with:
NODE_ENV=production
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[db]
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
SENTRY_DSN=https://...your-sentry-dsn...
VITE_SENTRY_DSN=https://...your-sentry-dsn...
LOG_LEVEL=info
```

### 3. Database Migration
```bash
cd apps/backend
npm run prisma:migrate -- --deploy
npm run prisma:generate
npm run db:seed  # Optional: seed sample data
```

### 4. Build Applications
```bash
# Backend
npm run build

# Frontend
npm run build
```

### 5. Test Build
```bash
# Check for TypeScript errors
npm run build

# Run tests
npm test
```

---

## 🚀 Deployment

### Option A: Docker Compose (Recommended)
```bash
docker-compose up -d
docker-compose logs -f
```

### Option B: Manual Node Deployment
```bash
# Backend
cd apps/backend
NODE_ENV=production npm start

# Frontend (serve dist folder)
cd apps/web
# Serve dist/ folder with nginx/caddy
```

---

## ✅ Post-Deployment Verification

### Health Checks
```bash
# API Health
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

# Check logs
tail -f apps/backend/logs/app-*.log

# Verify database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Functional Tests
1. ✅ Create account
2. ✅ Login with credentials
3. ✅ Create child account
4. ✅ View dashboard
5. ✅ Check real-time updates (WebSocket)

---

## 📊 Monitoring

### Log Locations
- Backend: `apps/backend/logs/app-YYYY-MM-DD.log`
- Frontend: Browser DevTools Console
- Errors: Sentry Dashboard

### Key Metrics to Monitor
- Error rate (Sentry)
- API response times
- Database query times
- Active user sessions
- Real-time connection status

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Database connection fails | Check DATABASE_URL in .env |
| Port 3000 already in use | Change PORT in .env or kill process |
| Sentry not reporting | Verify SENTRY_DSN is set and production mode |
| Logs not written | Check apps/backend/logs/ directory exists |
| Frontend can't reach API | Verify VITE_API_BASE_URL matches backend URL |

---

## 🔐 Security Checklist

- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` is strong (openssl rand -hex 32)
- [ ] `COOKIE_SECRET` is strong
- [ ] HTTPS/SSL configured (reverse proxy)
- [ ] CORS configured for your domain
- [ ] Database user has restricted permissions
- [ ] Secrets not in git history
- [ ] Rate limiting enabled
- [ ] Security headers set (Helmet)

---

## 📈 Scaling Considerations

### For Higher Load
1. Add database connection pooling (PgBouncer)
2. Add Redis for caching
3. Scale to multiple backend instances
4. Use CDN for static assets
5. Monitor with APM (Sentry, DataDog, NewRelic)

### Database Optimization
```bash
# Verify indexes exist
psql $DATABASE_URL -c "\di+ app_sessions"

# Analyze query plans
EXPLAIN ANALYZE SELECT * FROM app_sessions WHERE device_id = 'xxx';
```

---

## 🆘 Emergency Procedures

### Database Backup
```bash
# Before major changes
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore if needed
psql $DATABASE_URL < backup-20260815.sql
```

### Rollback
```bash
# Revert database migration
npm run prisma:migrate resolve --rolled-back migration_name

# Restart services
docker-compose restart
```

### Critical Error
```bash
# Check logs
tail -100 apps/backend/logs/app-*.log

# Check Sentry for error context
# https://sentry.io/...

# Restart service
docker-compose restart backend
```

---

## 📋 Maintenance Tasks

### Daily
- [ ] Check error rates in Sentry
- [ ] Monitor log file sizes
- [ ] Verify backup succeeded

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Test restore from backup

### Monthly
- [ ] Clean old logs
- [ ] Review slow query logs
- [ ] Update dependencies

---

## 🎯 Success Metrics

**System is healthy when:**
- Error rate < 0.1%
- API response time < 200ms (p95)
- WebSocket connections stable
- No unacknowledged critical errors
- Database queries < 100ms (p95)
- User-facing uptime > 99.9%

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| Backend errors | Check logs + Sentry |
| Database issues | DBA/DevOps |
| Security incidents | Security team |
| Performance | DevOps/PM |
| Feature bugs | Development team |

---

## 🔗 Related Documentation

- Full Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Testing Guide: [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)
- Full Report: [PRODUCTION_READINESS_REPORT.md](PRODUCTION_READINESS_REPORT.md)

---

**Last Updated**: August 15, 2026  
**Version**: 1.0.0
