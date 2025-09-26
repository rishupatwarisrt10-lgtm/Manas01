# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Security Fixes Applied
- [x] Removed debug endpoints
- [x] Added rate limiting to auth endpoints
- [x] Enhanced input validation
- [x] Added security headers
- [x] Improved password hashing (bcrypt rounds: 12 → 14)
- [x] Added CORS protection
- [x] Implemented proper error handling

### ✅ Performance Optimizations
- [x] Enhanced MongoDB connection with production settings
- [x] Added connection pooling
- [x] Implemented proper connection cleanup
- [x] Added database indexes for performance
- [x] Configured Next.js optimizations

## 🔧 Environment Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Critical Production Variables
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/manas-app
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-secret-32-chars+
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
NODE_ENV=production
```

### 2. Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

## 🏗️ Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Option 2: Docker
```dockerfile
# Dockerfile (create this)
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Traditional VPS
```bash
# Build the application
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "manas-app" -- start
pm2 save
pm2 startup
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account
2. Create cluster
3. Configure network access (whitelist your server IP)
4. Create database user
5. Get connection string
6. Update `DATABASE_URL` in environment

### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use manas-app
db.createUser({
  user: "manas_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## 🔒 Security Considerations

### SSL/TLS Certificate
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirect
- Enable HSTS headers

### Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Monitoring
```bash
# Set up basic monitoring
npm install -g pm2
pm2 install pm2-logrotate

# Monitor logs
pm2 logs
pm2 monit
```

## 🚨 Critical Issues Fixed

### 1. Removed Debug Endpoint ⚠️ HIGH
- **Issue**: `/api/debug/auth` exposed sensitive configuration
- **Fix**: Deleted the endpoint entirely
- **Impact**: Prevents information disclosure

### 2. Added Rate Limiting ⚠️ HIGH
- **Issue**: No protection against brute force attacks
- **Fix**: Implemented rate limiting on auth endpoints
- **Config**: 5 attempts per 15 minutes for auth

### 3. Enhanced Input Validation ⚠️ MEDIUM
- **Issue**: Weak validation allowed malicious input
- **Fix**: Added comprehensive validation and sanitization
- **Features**: Email validation, password strength, XSS prevention

### 4. Database Security ⚠️ MEDIUM
- **Issue**: Basic MongoDB connection without production settings
- **Fix**: Added connection pooling, timeouts, SSL support
- **Performance**: 10x connection pool, proper cleanup

## 📊 Performance Improvements

### Database Optimizations
- Connection pooling (max 10 connections)
- Proper indexes on User, Session, Thought models
- Query optimization with lean() for better performance

### Next.js Optimizations
- Image optimization configured
- Security headers added
- Bundle splitting configured
- Static asset optimization

## 🔍 Monitoring & Maintenance

### Health Checks
Create health check endpoint:
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', error: 'Database connection failed' }, { status: 500 });
  }
}
```

### Log Management
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/manas-app

# Content:
/var/log/manas-app/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
}
```

## 🚀 Go-Live Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] OAuth providers configured with production URLs
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Error tracking configured (Sentry recommended)
- [ ] Performance monitoring setup
- [ ] Load testing completed

## 📈 Scalability Considerations

### Current Limitations
- In-memory rate limiting (use Redis for multi-instance)
- Single database connection (consider read replicas)
- No CDN configured (add Cloudflare/AWS CloudFront)

### Future Enhancements
- Implement Redis for rate limiting and caching
- Add database read replicas
- Configure CDN for static assets
- Implement horizontal scaling with load balancers

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection Timeout**
   - Check MongoDB Atlas network access
   - Verify connection string format
   - Check firewall settings

2. **NextAuth Session Issues**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Ensure OAuth redirects are configured

3. **Rate Limiting Too Aggressive**
   - Adjust limits in `src/lib/rateLimit.ts`
   - Consider implementing IP whitelisting

### Debug Commands
```bash
# Check logs
pm2 logs manas-app

# Check process status
pm2 status

# Restart application
pm2 restart manas-app
```

---

**🎉 Your Manas app is now production-ready with enterprise-grade security and performance optimizations!**