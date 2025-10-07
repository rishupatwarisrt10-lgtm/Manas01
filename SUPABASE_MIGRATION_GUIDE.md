# MongoDB to Supabase Migration Guide

## ✅ Migration Complete!

Your Manas app has been successfully migrated from MongoDB to Supabase. Here's what was changed:

## Database Migration Summary

### 🗄️ Schema Changes
- **Users table**: Migrated from MongoDB users collection to PostgreSQL users table
- **Thoughts table**: Migrated from MongoDB thoughts collection to PostgreSQL thoughts table  
- **Sessions table**: Migrated from MongoDB sessions collection to PostgreSQL sessions table

### 🔄 Field Name Mappings
| MongoDB Field | Supabase Field |
|---------------|----------------|
| `_id` | `id` (UUID) |
| `userId` | `user_id` |
| `sessionsCompleted` | `sessions_completed` |
| `totalFocusTime` | `total_focus_time` |
| `googleId` | `google_id` |
| `emailVerified` | `email_verified` |
| `lastActiveDate` | `last_active_date` |
| `isCompleted` | `is_completed` |
| `isDeleted` | `is_deleted` |
| `deletedAt` | `deleted_at` |
| `startTime` | `start_time` |
| `endTime` | `end_time` |
| `pausedDuration` | `paused_duration` |
| `thoughtsCaptured` | `thoughts_captured` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## 🛠️ Setup Instructions

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Run the Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_schema.sql` 
4. Execute the SQL to create all tables, indexes, and policies

### 3. Update Environment Variables
Update your `.env.local` file with the following Supabase variables:

```env
# Remove old MongoDB variable
# DATABASE_URL=your_mongodb_connection_string

# Add new Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Keep existing variables
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Install Dependencies
Dependencies have been updated automatically. Run:
```bash
npm install
```

## 🚀 What's Changed

### Files Updated:
- ✅ `package.json` - Removed MongoDB dependencies, added Supabase
- ✅ `src/lib/database.ts` - Now imports from Supabase configuration
- ✅ `src/lib/supabase.ts` - New Supabase client configuration
- ✅ `src/models/User.ts` - Converted to Supabase operations
- ✅ `src/models/Thought.ts` - Converted to Supabase operations  
- ✅ `src/models/Session.ts` - Converted to Supabase operations
- ✅ `src/lib/auth.ts` - Updated authentication to use Supabase
- ✅ All API routes updated to use Supabase instead of MongoDB

### Files Removed:
- ❌ `src/lib/mongodb.ts` - No longer needed

## 🔒 Security Features

The migration includes:
- **Row Level Security (RLS)** - Users can only access their own data
- **Proper indexes** - For optimal query performance
- **Type safety** - Full TypeScript support
- **Connection pooling** - Optimized for serverless environments

## 🧪 Testing the Migration

1. Set up your Supabase project and environment variables
2. Run the development server: `npm run dev`
3. Test user registration and login
4. Test creating thoughts and sessions
5. Verify all existing functionality works

## 🚨 Data Migration

**Important**: This migration creates a new database schema but does NOT migrate existing data. 

If you have existing MongoDB data you want to preserve:

1. Export your MongoDB data
2. Transform the data to match the new Supabase schema
3. Import into your Supabase tables

## 🆘 Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure all Supabase environment variables are set correctly
2. **Database Schema**: Ensure you've run the `supabase_schema.sql` file
3. **Authentication**: Verify your NextAuth configuration is working
4. **CORS Issues**: Check your Supabase project settings for allowed origins

### Need Help?
- Check Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Review the schema file: `supabase_schema.sql`
- Check console logs for detailed error messages

## 🎉 Benefits of Migration

- **Better Performance**: PostgreSQL with optimized queries
- **Real-time Features**: Built-in subscriptions and real-time updates  
- **Better Security**: Row Level Security and built-in auth
- **Easier Scaling**: Managed infrastructure
- **Modern Developer Experience**: Better tooling and dashboard
- **Cost Effective**: Generous free tier

Your app is now powered by Supabase! 🚀