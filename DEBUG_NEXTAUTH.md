# 🔧 NextAuth CLIENT_FETCH_ERROR Debugging

## 🚨 **The Error You're Seeing**
`[next-auth][error][CLIENT_FETCH_ERROR] "Failed to fetch"`

This typically means NextAuth can't connect to `/api/auth/*` endpoints.

## ✅ **Quick Fixes to Try**

### 1. **Check Your .env.local File**
Make sure you have this in your `.env.local`:

```bash
NEXTAUTH_SECRET=your-secret-here-make-it-long-and-random
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/manas-app
```

### 2. **Generate NEXTAUTH_SECRET**
If you don't have `NEXTAUTH_SECRET`, generate one:

```bash
# In your terminal
openssl rand -base64 32
```

Copy the output and add it to `.env.local`:
```bash
NEXTAUTH_SECRET=the-generated-secret-here
```

### 3. **Restart Your Dev Server**
After adding environment variables:
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. **Test NextAuth Endpoint**
Open your browser and go to:
```
http://localhost:3000/api/auth/providers
```

You should see a JSON response like:
```json
{
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials"
  }
}
```

### 5. **Check Browser Console**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for any additional error details

## 🔍 **If Still Not Working**

### Check These URLs Work:
- `http://localhost:3000/api/auth/session` - Should return session data
- `http://localhost:3000/api/auth/csrf` - Should return CSRF token
- `http://localhost:3000/api/auth/providers` - Should return providers

### Common Causes:
1. **Missing NEXTAUTH_SECRET** - Most common cause
2. **Middleware blocking auth routes** - Fixed in our updates
3. **Port conflicts** - Make sure nothing else uses port 3000
4. **Firewall/Antivirus** - Sometimes blocks local connections

## 🚀 **Expected Result After Fix**
- No more CLIENT_FETCH_ERROR
- Login/logout should work smoothly
- Session management should work properly

## 📞 **Still Having Issues?**
If none of these work, check:
1. Windows Firewall settings
2. Antivirus software blocking localhost
3. Any proxy/VPN software interfering