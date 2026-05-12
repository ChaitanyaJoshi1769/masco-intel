# Deployment Guide

Complete guide for deploying Masco Intel to production.

## Quick Deploy (5 minutes)

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

Railway handles:
- PostgreSQL database
- Redis cache
- Node.js runtime
- Auto-scaling
- SSL/TLS
- Monitoring

### Option 2: Vercel (Dashboard)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy dashboard
cd apps/dashboard
vercel --prod
```

Dashboard runs on Vercel edge network.

## Production Checklist

### Environment Variables
```bash
# Set these in your hosting platform:
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<generate-with: openssl rand -hex 32>
NODE_ENV=production
VITE_API_URL=https://api.yourdom.com
```

### Database Setup
```bash
# Run migrations in production
DATABASE_URL=... pnpm migrate:prod

# Verify data
DATABASE_URL=... pnpm studio
```

### Security Checklist
- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled
- [ ] CORS configured for your domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] API key authentication
- [ ] Database backups scheduled
- [ ] Monitoring & alerting setup

### Monitoring
```bash
# Setup Sentry for error tracking
npm install @sentry/node

# Setup metrics in Vercel/Railway dashboard
```

## Manual Deployment

### Docker
```bash
# Build image
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel:latest .

# Push to registry
docker tag masco-intel:latest myregistry/masco-intel:latest
docker push myregistry/masco-intel:latest

# Deploy with docker-compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up
```

### Heroku
```bash
# Create app
heroku create masco-intel

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main
```

## Scaling in Production

### API Tier 1 (Small)
- 1 API instance
- Shared PostgreSQL
- Shared Redis
- ~100 req/sec

Deploy on:
- Railway Hobby tier
- Vercel (dashboard)
- Heroku free tier

### API Tier 2 (Medium)
- 2-3 API instances
- Dedicated PostgreSQL (prod)
- Dedicated Redis
- ~1,000 req/sec

Deploy on:
- Railway Pro tier
- AWS ECS
- DigitalOcean App Platform

### API Tier 3 (Enterprise)
- 5+ API instances (load balanced)
- PostgreSQL with read replicas
- Redis cluster
- ~10,000 req/sec

Deploy on:
- AWS (ECS/Fargate)
- Google Cloud Run
- Kubernetes (self-managed)

## Chrome Extension Deployment

### Testing Release
1. Load unpacked from `apps/extension/dist`
2. Test on all supported retailers
3. Check console for errors

### Publish to Chrome Web Store
```bash
# Build extension
cd apps/extension
pnpm build

# Package for store
zip -r masco-intel.zip dist/

# Upload to Chrome Web Store
# 1. Go to https://chrome.google.com/webstore/devconsole
# 2. Create new item
# 3. Upload masco-intel.zip
# 4. Fill in store listing
# 5. Submit for review
```

Takes 1-3 days for Google review.

### Auto-Updates
Configure in `apps/extension/manifest.json`:
```json
"update_url": "https://your-update-server.com/updates.xml"
```

## Database Backups

### PostgreSQL Backup
```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240115.sql

# S3 backup script
0 2 * * * pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://backups/db-$(date +%Y%m%d).sql.gz
```

## Monitoring & Alerts

### Setup Sentry
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Setup DataDog (or similar)
```bash
# Logs
tail -f /var/log/app.log | dd_agent

# Metrics
export DD_AGENT_HOST=localhost
npm install node-dogstatsd
```

### Alerting Rules
- Database connection errors
- API response time > 1s
- Error rate > 1%
- Memory usage > 80%
- Disk space < 10%

## Cost Optimization

### Cloud Spend
- **Database**: PostgreSQL managed service (~$15-50/mo)
- **Cache**: Redis managed service (~$5-20/mo)
- **API**: Compute (~$10-100/mo depending on traffic)
- **Dashboard**: Vercel free tier (up to $20 for pro)
- **CDN**: Cloudflare free tier
- **Email**: SendGrid free tier (100/day)

**Estimated monthly: $50-200**

### Reduce Costs
- Use reserved instances
- Scale down during off-hours
- Use serverless (AWS Lambda, Google Cloud Run)
- Cache aggressively
- Compress assets
- Use CDN for static files

## Performance Tips

### API Optimization
```typescript
// Enable Redis caching
redis.set('products:delta', JSON.stringify(products), 'EX', 3600);

// Use database indexes
CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_price_product_date ON price_history(product_id, timestamp DESC);

// Lazy load relationships
.include({ prices: { take: 5, orderBy: { timestamp: 'desc' } } })
```

### Dashboard Optimization
```typescript
// Code splitting
const Dashboard = lazy(() => import('./Dashboard'));

// Image optimization
<img srcSet="small.jpg 400w, medium.jpg 800w" />

// React.memo for expensive components
export const PriceChart = memo(({ data }) => (...))
```

## Troubleshooting

### "Connection refused" on DATABASE_URL
```bash
# Check database is running
psql $DATABASE_URL -c "SELECT 1"

# Verify credentials
echo $DATABASE_URL
```

### "Out of memory" errors
```bash
# Increase Node.js heap
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Check memory usage
ps aux | grep node
```

### Slow API responses
```bash
# Profile with NODE_DEBUG
NODE_DEBUG=http npm start

# Check slow queries
EXPLAIN ANALYZE SELECT ...
```

## Post-Deployment

### Monitor Logs
```bash
# Vercel
vercel logs

# Railway
railway logs

# Heroku
heroku logs --tail
```

### Monitor Metrics
- Response time (p50, p95, p99)
- Error rate
- Database connections
- Cache hit rate
- Traffic patterns

### Regular Maintenance
- [ ] Review error logs weekly
- [ ] Check for updates monthly
- [ ] Rotate secrets quarterly
- [ ] Database maintenance weekly
- [ ] SSL certificate renewal (auto with Let's Encrypt)

---

**Deployed? Let us know!** Share your setup on GitHub discussions.
