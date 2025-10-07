// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase';
import User from '@/models/User';
import { authLogger } from './logger';

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  authLogger.warn('Google OAuth credentials not configured. Google sign-in will be disabled.');
}

if (!process.env.NEXTAUTH_SECRET) {
  authLogger.error('NEXTAUTH_SECRET is not configured');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required in production');
  }
}

if (!process.env.NEXTAUTH_URL) {
  authLogger.warn('NEXTAUTH_URL is not configured. This may cause issues in production.');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  authLogger.warn('Supabase URL is not configured. Database features will be limited.');
}

// Session configuration
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const JWT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const authOptions: NextAuthOptions = {
  providers: [
    // Only include Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          authLogger.warn('Missing credentials in login attempt');
          return null;
        }

        try {
          // Skip database connection during build or if URL not available
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VERCEL_ENV === 'preview') {
            authLogger.warn('Database not available - skipping credential authentication');
            return null;
          }
          
          // Find user with password field included
          const { data: userData, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .single();

          if (error || !userData || !userData.password) {
            authLogger.warn('Invalid login attempt', { email: credentials.email });
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            userData.password
          );

          if (!isPasswordValid) {
            authLogger.warn('Invalid password attempt', { email: credentials.email });
            return null;
          }

          authLogger.info('Successful credential login', { userId: userData.id, email: userData.email });
          
          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
          };
        } catch (error) {
          authLogger.error('Authentication error', error);
          return null;
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  
  jwt: {
    maxAge: JWT_MAX_AGE,
  },
  
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Skip database connection during build or if URL not available
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VERCEL_ENV === 'preview') {
            authLogger.warn('Database not available - allowing Google sign-in without DB');
            return true;
          }
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email! });
          
          if (!existingUser) {
            // Create new user for Google sign-in
            existingUser = await User.create({
              email: user.email!,
              name: user.name,
              image: user.image,
              provider: 'google',
              google_id: account.providerAccountId,
              email_verified: new Date(),
              sessions_completed: 0,
              total_focus_time: 0,
              streak: 0,
              preferences: {
                focus_duration: 25,
                short_break_duration: 5,
                long_break_duration: 15,
                theme: 'animated-gradient',
                notifications: true,
              },
            });
            authLogger.info('Created new Google user', { userId: existingUser.id, email: existingUser.email });
          } else {
            // Update existing user with Google info if needed
            if (!existingUser.google_id) {
              await User.updateById(existingUser.id, {
                google_id: account.providerAccountId,
                image: user.image || existingUser.image,
                name: user.name || existingUser.name,
              });
              authLogger.info('Linked Google account to existing user', { userId: existingUser.id, email: existingUser.email });
            }
          }
          
          return true;
        } catch (error) {
          authLogger.error('Google sign-in error', error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
        authLogger.debug('JWT token created', { userId: user.id });
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        
        try {
          // Skip database connection during build or if URL not available
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VERCEL_ENV === 'preview') {
            authLogger.warn('Database not available - using default user data');
            session.user.sessionsCompleted = 0;
            session.user.totalFocusTime = 0;
            session.user.streak = 0;
            session.user.preferences = {
              focusDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              theme: 'animated-gradient',
              notifications: true,
            };
            return session;
          }
          
          const user = await User.findById(token.id as string);
          
          if (user) {
            session.user.sessionsCompleted = user.sessions_completed || 0;
            session.user.totalFocusTime = user.total_focus_time || 0;
            session.user.streak = user.streak || 0;
            session.user.preferences = {
              focusDuration: user.preferences?.focus_duration || 25,
              shortBreakDuration: user.preferences?.short_break_duration || 5,
              longBreakDuration: user.preferences?.long_break_duration || 15,
              theme: user.preferences?.theme || 'animated-gradient',
              notifications: user.preferences?.notifications !== false,
            };
            
            // Update last active date
            await User.updateById(user.id, {
              last_active_date: new Date(),
            });
            
            authLogger.debug('Session loaded user data', { userId: user.id });
          } else {
            authLogger.warn('Session callback - user not found in database', { userId: token.id });
            // Set default values if user not found
            session.user.sessionsCompleted = 0;
            session.user.totalFocusTime = 0;
            session.user.streak = 0;
            session.user.preferences = {
              focusDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              theme: 'animated-gradient',
              notifications: true,
            };
          }
        } catch (error) {
          authLogger.error('Session callback error', error);
          // Set default values on error
          session.user.sessionsCompleted = 0;
          session.user.totalFocusTime = 0;
          session.user.streak = 0;
          session.user.preferences = {
            focusDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            theme: 'animated-gradient',
            notifications: true,
          };
        }
      }
      return session;
    },
  },
  
  // Security configuration
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
  
  // Security events logging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      authLogger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ token }) {
      authLogger.info('User signed out', {
        userId: token?.id,
      });
    },
    async createUser({ user }) {
      authLogger.info('User created', {
        userId: user.id,
        email: user.email,
      });
    },
    async linkAccount({ user, account }) {
      authLogger.info('Account linked', {
        userId: user.id,
        provider: account.provider,
      });
    },
    async session({ session, token }) {
      authLogger.debug('Session accessed', {
        userId: session.user?.id,
      });
    },
  },
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      sessionsCompleted: number;
      totalFocusTime: number;
      streak: number;
      preferences: {
        focusDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
        theme: string;
        notifications: boolean;
      };
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    provider?: string;
  }
}