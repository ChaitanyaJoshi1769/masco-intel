# 🐳 Docker Deployment Guide - Masco Intel

Complete guide to deploy Masco Intel using Docker and Docker Compose.

## Prerequisites

- Docker installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (usually included with Docker Desktop)
- Git with your repository cloned

## Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/ChaitanyaJoshi1769/masco-intel.git
cd masco-intel
```

### 2. Verify Environment File
```bash
# Copy environment file (already configured)
cp .env.docker .env.production.local

# Verify the JWT_SECRET and other values
cat .env.production.local
```

### 3. Build and Start Services
```bash
# Build the API image (first time only, ~3-5 minutes)
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel:latest .

# Start all services (PostgreSQL, Redis, API)
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### 4. Verify Services Are Running
```bash
# Check status
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# Expected output:
# STATUS: Up X seconds for all three services (postgres, redis, api)
```

### 5. Test API Endpoint
```bash
# Wait 5 seconds for database to initialize
sleep 5

# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","service":"masco-intel-api","version":"0.1.0"}
```

### 6. Check Logs
```bash
# View API logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f api

# View all service logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f

# Ctrl+C to exit logs
```

## Production Deployment

### Option A: Deploy to Your Server

#### Prerequisites
- Ubuntu/Debian server with SSH access
- Docker and Docker Compose installed on server

#### Steps
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/ChaitanyaJoshi1769/masco-intel.git
cd masco-intel

# 3. Configure environment variables for production
nano .env.production.local

# Update these values for your production environment:
DATABASE_URL=postgresql://masco:YOUR_SECURE_PASSWORD@postgres:5432/masco_intel
REDIS_URL=redis://redis:6379
JWT_SECRET=969544f0c20b45b8684c9c36816afa6adda8579b15127baab8f3070be6e96387
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,chrome-extension://*

# 4. Build and start services
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel:latest .
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# 5. Verify
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f api
```

#### Set Up Nginx Reverse Proxy (Optional but Recommended)
```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/masco-intel

# Add this configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/masco-intel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up HTTPS with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option B: Deploy to Cloud (AWS, DigitalOcean, Linode)

#### Create Droplet/Instance
1. Create Ubuntu 22.04 LTS instance (minimum: 2GB RAM, 1 vCPU)
2. SSH into your instance
3. Follow "Deploy to Your Server" steps above

#### Cost Estimates
- **DigitalOcean**: $5-12/month (basic droplet)
- **AWS**: $10-50/month (t3.micro with RDS)
- **Linode**: $5-10/month (Nanode)

### Option C: Docker Hub Deployment

#### Push Image to Docker Hub
```bash
# Login to Docker Hub
docker login

# Tag image
docker tag masco-intel:latest yourusername/masco-intel:latest

# Push image
docker push yourusername/masco-intel:latest

# Your image is now publicly available:
# docker pull yourusername/masco-intel:latest
```

## Database Management

### Create Database Backup
```bash
# Backup PostgreSQL
docker exec masco-intel-postgres pg_dump -U masco masco_intel > backup-$(date +%Y%m%d).sql

# Backup is saved locally, you can restore with:
# cat backup-20260512.sql | docker exec -i masco-intel-postgres psql -U masco masco_intel
```

### Run Database Migrations
```bash
# If schema changes, run:
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec api pnpm migrate
```

### Access Database Console
```bash
# PostgreSQL
docker exec -it masco-intel-postgres psql -U masco -d masco_intel

# Redis
docker exec -it masco-intel-redis redis-cli
```

## Monitoring and Logs

### View Service Status
```bash
# See all containers
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# See detailed stats
docker stats
```

### Monitor Logs
```bash
# API logs with timestamps
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f --timestamps api

# Filter error logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs api | grep ERROR

# Last 100 lines
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs --tail=100 api
```

### Set Up Log Rotation
```bash
# Configure Docker log rotation
sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

sudo systemctl restart docker
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs for errors
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs

# Common fixes:
# 1. Port already in use - change ports in docker-compose.prod.yml
# 2. Database not initialized - wait 10 seconds and try again
# 3. Out of disk space - run: docker system prune -a
```

### Database Connection Failed
```bash
# Verify database is running
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# Check DATABASE_URL in .env.production.local
cat .env.production.local | grep DATABASE_URL

# Test connection
docker exec masco-intel-postgres psql -U masco -d masco_intel -c "SELECT 1"
```

### API Not Responding
```bash
# Check API logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs api

# Restart API service
docker-compose -f infrastructure/docker/docker-compose.prod.yml restart api

# Check port is open
netstat -an | grep 3001
```

### Out of Memory
```bash
# Increase Docker memory limit
# Edit Docker Desktop settings: Preferences → Resources → Memory: 4GB+

# Or set limits in docker-compose.prod.yml:
# services:
#   api:
#     mem_limit: 2g
```

## Maintenance

### Update Code
```bash
# Pull latest changes
git pull origin main

# Rebuild image
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel:latest .

# Restart services
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Clean Up
```bash
# Remove stopped containers
docker-compose -f infrastructure/docker/docker-compose.prod.yml down

# Remove unused images
docker image prune -a

# Remove unused volumes (⚠️ WARNING: Deletes data!)
docker volume prune
```

### Enable Auto-Restart
Services in docker-compose.prod.yml are configured to restart automatically on failure or server reboot.

Verify with:
```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps
# RESTART POLICY should show: always
```

## Security Best Practices

### 1. Change Default Credentials
```bash
# In .env.production.local, change:
DATABASE_URL=postgresql://masco:CHANGE_THIS_PASSWORD@postgres:5432/masco_intel

# Generate secure password:
openssl rand -base64 32
```

### 2. Enable HTTPS
- Use Nginx reverse proxy with Let's Encrypt (see above)
- Or use AWS CloudFront/Cloudflare

### 3. Restrict Network Access
```bash
# In docker-compose.prod.yml, change:
# services:
#   postgres:
#     networks:
#       - internal  # Don't expose to host
```

### 4. Regular Backups
```bash
# Automate daily backups with cron:
0 2 * * * docker exec masco-intel-postgres pg_dump -U masco masco_intel | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### 5. Monitor Access Logs
```bash
# Check who is accessing your API
docker exec masco-intel-postgres psql -U masco -d masco_intel -c "SELECT * FROM logs LIMIT 100"
```

## Performance Tuning

### PostgreSQL Optimization
```bash
# Access postgres container
docker exec -it masco-intel-postgres psql -U masco -d masco_intel

# Create indexes
CREATE INDEX idx_product_brand ON products(brand);
CREATE INDEX idx_price_timestamp ON price_history(timestamp DESC);
CREATE INDEX idx_quality_grade ON quality_analysis(grade);
```

### Redis Optimization
```bash
# Monitor Redis memory
docker exec masco-intel-redis redis-cli info memory

# Set max memory policy
docker exec masco-intel-redis redis-cli CONFIG SET maxmemory 256mb
docker exec masco-intel-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Scaling

### Horizontal Scaling (Multiple Instances)
```bash
# Run multiple API instances with load balancing
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d --scale api=3

# Use Nginx upstream for load balancing
upstream api {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

### Vertical Scaling (More Resources)
```bash
# Increase Docker memory limits
# Or upgrade your server: more CPU, RAM, disk
```

## Support & Documentation

- **Railway Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Quick Reference**: See [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)
- **Project Status**: See [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

**Ready to deploy?** Start with "Quick Start" section above!
