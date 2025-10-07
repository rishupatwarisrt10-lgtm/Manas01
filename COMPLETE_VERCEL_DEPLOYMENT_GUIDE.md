# 🚀 Complete Vercel Deployment Guide for Manas App

## 📋 Overview
This guide covers deploying your Manas app (a Pomodoro timer with thought management) to Vercel with Supabase as the database backend.

**Created by:** Rishu Patwari (vibe coder)

## 🎯 Quick Deployment Checklist

### ✅ Prerequisites
- [ ] GitHub/GitLab account with your project
- [ ] Vercel account (free tier available)
- [ ] Supabase account (free tier available)
- [ ] Google OAuth credentials (optional but recommended)

### ✅ Deployment Steps
1. **Database Setup** - Configure Supabase
2. **Environment Variables** - Set up all required variables
3. **Vercel Deployment** - Deploy to production
4. **Domain Configuration** - Set up custom domain (optional)
5. **Monitoring & Maintenance** - Keep your app healthy

---

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name**: `manas-app-production`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for project setup

### 1.2 Configure Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of your `supabase_schema.sql` file
4. Paste and click **"Run"**
5. Verify tables are created in **Table Editor**

### 1.3 Get Supabase Credentials
Navigate to **Settings → API** and copy:
- **Project URL**: `https://your-project-id.supabase.co`
- **Anon (public) key**: `eyJhbGciOiJIUzI1NI...`
- **Service role key**: `eyJhbGciOiJIUzI1NI...` (keep this secret!)

---

## 🔐 Step 2: Google OAuth Setup (Recommended)

### 2.1 Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth 2.0 Client IDs"**
5. Configure consent screen first if prompted:
   - **App name**: `Manas - Focus & Productivity`
   - **User support email**: Your email
   - **Developer contact**: Your email

### 2.2 Configure OAuth Client
1. **Application type**: Web application
2. **Name**: `Manas App Production`
3. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.vercel.app
   https://your-custom-domain.com
   ```
4. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google
   ```
5. Save and copy **Client ID** and **Client Secret**

---

## 🚀 Step 3: Vercel Deployment

### 3.1 Deploy via GitHub (Recommended)

#### Option A: Import from GitHub
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your repository from GitHub
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (keep default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd manas-app
vercel --prod
```

### 3.2 Configure Environment Variables in Vercel

In your Vercel dashboard → **Settings → Environment Variables**, add:

#### 🔐 Authentication Variables
```bash
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-minimum
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 🗄️ Database Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### 🚀 Production Variables
```bash
NODE_ENV=production
```

### 3.3 Deploy and Verify
1. Click **"Deploy"** in Vercel dashboard
2. Wait for deployment to complete (~2-3 minutes)
3. Visit your deployment URL
4. Test user registration and login
5. Test creating thoughts and sessions

---

## 🛠️ Step 4: Environment Variable Configuration

### 4.1 Generate Secure Secrets

#### NEXTAUTH_SECRET
```bash
# Generate a secure 32+ character secret
openssl rand -base64 32
# Or use online generator: https://generate-secret.vercel.app/32
```

#### Examples of Environment Variables
```bash
# ✅ CORRECT Configuration
NEXTAUTH_SECRET=Kj8H9pL2mN4qR7sT1vW3xY6zB0cE5fI8
NEXTAUTH_URL=https://manas-app.vercel.app
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### 4.2 Variable Priority (Based on Memory)
Set environment variables in this order for optimal validation:
1. `NEXTAUTH_SECRET` - Core authentication
2. `NEXTAUTH_URL` - Must match your domain
3. `NODE_ENV` - Environment context
4. `DATABASE_URL` (Supabase URL) - Database connection

---

## 🌐 Step 5: Domain Configuration (Optional)

### 5.1 Custom Domain Setup
1. In Vercel dashboard → **Settings → Domains**
2. Add your custom domain: `your-app.com`
3. Configure DNS records with your domain provider:
   ```
   Type: CNAME
   Name: @ (or your subdomain)
   Value: cname.vercel-dns.com
   ```
4. Update environment variables:
   - `NEXTAUTH_URL=https://your-app.com`
   - Update Google OAuth redirect URIs

### 5.2 SSL Certificate
- Vercel automatically provides SSL certificates
- Your app will be available at `https://your-app.com`

---

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Health Monitoring
Your app includes health check endpoints:
- **Health Check**: `https://your-app.com/api/health`
- **Auth Status**: `https://your-app.com/api/debug/auth` (development only)

### 6.2 Performance Monitoring
Monitor these metrics in Vercel dashboard:
- **Response Time**: Should be < 500ms
- **Error Rate**: Should be < 1%
- **Build Time**: Should be < 2 minutes

### 6.3 Database Monitoring
In Supabase dashboard, monitor:
- **API requests**: Track usage
- **Database performance**: Query speed
- **Storage usage**: Keep under limits

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. "NEXTAUTH_SECRET missing" Error
```bash
# Solution: Generate and set NEXTAUTH_SECRET
openssl rand -base64 32
# Add to Vercel environment variables
```

#### 2. "Database connection failed"
- ✅ Check Supabase URL is correct
- ✅ Verify service role key is set
- ✅ Ensure database schema is deployed
- ✅ Check Supabase project is active

#### 3. "Google OAuth not working"
- ✅ Verify redirect URIs match exactly
- ✅ Check Google OAuth credentials
- ✅ Ensure consent screen is configured

#### 4. "Build failed in Vercel"
- ✅ Check build logs in Vercel dashboard
- ✅ Verify all dependencies in package.json
- ✅ Ensure TypeScript compiles locally

#### 5. "Environment variable not found"
- ✅ Check variable names match exactly
- ✅ Redeploy after adding variables
- ✅ Verify case sensitivity

### Debug Commands
```bash
# Test locally before deploying
npm run build
npm run start

# Check environment variables
npm run dev
# Visit: http://localhost:3000/api/health
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use different secrets for development/production
- ✅ Regularly rotate NEXTAUTH_SECRET
- ✅ Keep service role keys secure

### 2. Domain Security
- ✅ Use HTTPS only in production
- ✅ Set up proper CORS policies
- ✅ Configure security headers (included in vercel.json)

### 3. Database Security
- ✅ Use Row Level Security (already configured)
- ✅ Limit service role key usage
- ✅ Monitor database access logs

---

## 📈 Scaling Considerations

### Current Architecture
- **Frontend**: Next.js on Vercel Edge Network
- **Database**: Supabase PostgreSQL
- **Authentication**: NextAuth with Google OAuth
- **File Storage**: Vercel static assets

### Future Scaling Options
- **CDN**: Vercel Edge Network (included)
- **Caching**: Redis for sessions (upgrade)
- **Analytics**: Vercel Analytics (paid)
- **Monitoring**: Sentry for error tracking

---

## 🎉 Post-Deployment Checklist

### ✅ Final Verification
- [ ] App loads at production URL
- [ ] User registration works
- [ ] Google OAuth login works
- [ ] Pomodoro timer functions
- [ ] Thought creation/editing works
- [ ] Settings page accessible
- [ ] Mobile responsive design
- [ ] SSL certificate active
- [ ] Health check endpoint responds

### ✅ Performance Optimization
- [ ] Images optimized (Next.js handles this)
- [ ] Bundle size under 1MB
- [ ] Initial page load under 3 seconds
- [ ] First contentful paint under 1.5 seconds

---

## 📞 Support & Resources

### Documentation Links
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **NextAuth Docs**: [next-auth.js.org](https://next-auth.js.org)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

### Emergency Rollback
If deployment fails:
1. Go to Vercel dashboard → **Deployments**
2. Find last working deployment
3. Click **"Promote to Production"**
4. Fix issues and redeploy

---

**🚀 Your Manas app is now live on Vercel! Created with ❤️ by Rishu Patwari (vibe coder)**

*Happy coding and productive Pomodoro sessions! 🍅*