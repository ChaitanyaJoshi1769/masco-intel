# 🚀 Deployment Quick Reference

Copy-paste commands to deploy Masco Intel to production.

## Prerequisites

```bash
# Install Railway CLI (if using Railway)
npm install -g @railway/cli

# OR install Vercel CLI (if using Vercel)
npm install -g vercel

# Verify Node.js version (need 20+)
node --version
```

## Option 1: Railway (Recommended) - 10 Minutes

### Step 1: Generate Secrets
```bash
# Generate JWT secret (copy the output)
openssl rand -hex 32
```

### Step 2: Initialize Railway Project
```bash
cd /path/to/masco-intel

# Login to Railway
railway login

# Initialize the project
railway init

# Follow prompts:
# - Select "Create a new project"
# - Name it "masco-intel"
# - Select "Node.js"
```

### Step 3: Add Services via Railway Dashboard
Go to [Railway Dashboard](https://railway.app):
1. Click your "masco-intel" project
2. Click "+ New"
3. Add **PostgreSQL**
4. Click "+ New" again
5. Add **Redis**
6. Go back to your project, click "Settings" and note the generated DATABASE_URL and REDIS_URL

### Step 4: Set Environment Variables in Railway
```bash
# In Railway dashboard for your project, set these variables:

DATABASE_URL=<copy from PostgreSQL plugin>
REDIS_URL=<copy from Redis plugin>
JWT_SECRET=<paste the secret from Step 1>
NODE_ENV=production
VITE_API_URL=https://your-railway-url.railway.app
CORS_ORIGINS=https://your-railway-url.railway.app,chrome-extension://*
RATE_LIMIT_REQUESTS=100
```

### Step 5: Deploy
```bash
# From project root
railway up

# Watch deployment
railway logs

# Expected output:
# ✓ Masco Intel API (production) running on http://localhost:3001
```

### Step 6: Verify Deployment
```bash
# Get your production URL from Railway dashboard (something like: https://masco-intel-prod.up.railway.app)
PROD_URL=https://your-railway-url.up.railway.app

# Test health endpoint
curl $PROD_URL/health

# Expected response:
# {"status":"ok","service":"masco-intel-api","version":"0.1.0"}
```

## Option 2: Vercel (Dashboard Only) - 5 Minutes

### Step 1: Push Code to GitHub
```bash
# Initialize git repo if not done
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/yourusername/masco-intel.git
git push -u origin main
```

### Step 2: Deploy Dashboard to Vercel
```bash
cd apps/dashboard

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to link to GitHub repo
```

### Step 3: Set Environment Variables in Vercel
In Vercel dashboard:
1. Go to project settings
2. Environment Variables section
3. Add:
   ```
   VITE_API_URL=https://your-api-url.railway.app
   VITE_EXTENSION_ID=your-chrome-extension-id
   ```

### Step 4: Verify
```bash
# Vercel will give you a production URL (something like: masco-intel.vercel.app)
# Open in browser: https://masco-intel.vercel.app
# Verify all dashboard charts load
```

## Option 3: Manual Docker (Advanced) - 15 Minutes

### Step 1: Build Docker Image
```bash
cd /path/to/masco-intel

# Build the image
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel:latest .

# Tag for your registry (e.g., Docker Hub)
docker tag masco-intel:latest yourusername/masco-intel:latest
docker push yourusername/masco-intel:latest
```

### Step 2: Deploy with Docker Compose
```bash
# Create production environment file
cp .env.production .env.production.local

# Edit with your actual values
nano .env.production.local

# Start services
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Check status
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# View logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f api
```

### Step 3: Verify
```bash
# Check container is running
docker ps | grep masco-intel

# Test health endpoint
curl http://localhost:3001/health
```

## Chrome Extension Deployment - 10 Minutes

### Step 1: Build Extension
```bash
cd apps/extension
pnpm build
```

### Step 2: Create Zip File
```bash
# From apps/extension directory
zip -r masco-intel-release.zip dist/

# Verify size (should be < 150MB, usually 2-5MB)
ls -lh masco-intel-release.zip
```

### Step 3: Submit to Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "Create new item"
3. Upload `masco-intel-release.zip`
4. Fill in:
   - Name: "Masco Intel - Plumbing Intelligence"
   - Short description: "Real-time price tracking and product intelligence for professional plumbers"
   - Category: "Productivity"
   - Icon: 128x128 PNG
   - Screenshots: 2-3 screenshots
5. Submit for review

**Timeline**: 1-3 days for Google review

### Step 4: After Approval
```bash
# Get your Extension ID from the store
# Update environment variables:
VITE_EXTENSION_ID=your-extension-id
CHROME_EXTENSION_URL=chrome-extension://your-extension-id/*
```

## Monitoring & Alerts (Optional but Recommended)

### Setup Sentry for Error Tracking
```bash
# In your Railway/hosting environment, add:
SENTRY_DSN=your-sentry-dsn-from-sentry.io
```

### Check Logs
```bash
# Railway
railway logs

# Vercel (for dashboard)
vercel logs --prod

# Docker Compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f
```

## Post-Deployment Testing

### Test API Endpoints
```bash
# Replace with your actual production URL
API_URL=https://your-production-url

# Health check
curl $API_URL/health

# Search products
curl "$API_URL/api/products/search?q=delta"

# Get pricing
curl "$API_URL/api/pricing/compare?productId=123"

# Analyze quality
curl -X POST "$API_URL/api/quality/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test",
    "material": "brass",
    "warranty": 5,
    "brand": "Delta",
    "price": 89.99
  }'
```

### Test Rate Limiting
```bash
# Send 70 requests rapidly (should fail after 60)
for i in {1..70}; do
  curl -s $API_URL/health > /dev/null
  echo "Request $i"
done

# Check headers on response 61+
curl -i $API_URL/health

# Expected: 429 Too Many Requests
# Header: X-RateLimit-Remaining: 0
```

## Rollback (If Something Goes Wrong)

### Railway
```bash
# See recent deployments
railway deployments

# Rollback to previous version
railway down
railway redeploy [previous-deployment-id]
```

### Vercel (Dashboard)
```bash
# In Vercel dashboard:
# 1. Go to Deployments
# 2. Find the previous working deployment
# 3. Click "Promote to Production"
```

### Docker
```bash
# Stop everything
docker-compose -f infrastructure/docker/docker-compose.prod.yml down

# Revert to previous image tag
docker pull yourusername/masco-intel:previous-tag
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

## Cost Optimization Commands

### Check Current Usage (Railway)
```bash
railway analytics
```

### Reduce Tier if Not Needed
```bash
# In Railway dashboard:
# Project Settings > Plan
# Downgrade from Pro to Hobby (if < 100 req/sec)
```

### Enable Auto-Scaling
```bash
# In railway.json, adjust:
"deploy": {
  "numReplicas": 2,  # Increase for load balancing
  "restartPolicyType": "always"
}
```

## Updating After Deployment

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Fix bug XYZ"
git push origin main

# Railway auto-redeploys on push to main
# Vercel auto-redeploys on GitHub push
```

### Update Secrets
```bash
# Railway: Update in dashboard > Variables
# Vercel: Update in project settings > Environment Variables
# Docker: Update .env.production.local and restart

docker-compose -f infrastructure/docker/docker-compose.prod.yml restart api
```

### Database Migrations
```bash
# On production (requires SSH access or managed interface)
# DO NOT run locally against production database!

# Railway: Use dashboard terminal or:
railway run pnpm migrate:prod

# Docker: Access container and run:
docker-compose exec api pnpm migrate
```

## Troubleshooting

### "Connection refused" on DATABASE_URL
```bash
# Check database is running and accessible
psql $DATABASE_URL -c "SELECT 1"

# If using Railway, verify PostgreSQL service is active in dashboard
```

### "Out of memory" errors
```bash
# Increase Node.js heap (Railway/Docker)
# In environment variables:
NODE_OPTIONS=--max-old-space-size=2048

# Restart service after change
```

### API not responding
```bash
# Check logs
railway logs

# Verify health endpoint
curl https://your-url/health -v

# Check rate limiting isn't blocking you
# Add custom X-RateLimit-Reset header check
```

### Dashboard not loading data
```bash
# Verify VITE_API_URL is correct
# Check browser console for CORS errors
# Ensure API is publicly accessible (not in private subnet)
```

## Final Checklist Before Going Live

- [ ] API health endpoint responds
- [ ] Dashboard loads all charts
- [ ] Rate limiting returns 429 after 60 requests
- [ ] Error messages are sanitized (no stack traces in production)
- [ ] HTTPS is enforced
- [ ] CORS is configured for specific origins only
- [ ] Database backups are scheduled
- [ ] Monitoring is configured (Sentry or similar)
- [ ] Chrome extension is approved and published
- [ ] Team has access to monitoring/logging

---

**Estimated Total Time**: 30-60 minutes depending on method chosen

**Recommended Method**: Railway + Vercel (easiest and most cost-effective)
