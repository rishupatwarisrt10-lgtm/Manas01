// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from './database';
import User from '@/models/User';

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Warning: Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('Warning: NEXTAUTH_SECRET is not configured. Please set NEXTAUTH_SECRET in your .env.local file.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Only include Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
          return null;
        }

        try {
          // Skip database connection during build or if URL not available
          if (!process.env.DATABASE_URL || process.env.VERCEL_ENV === 'preview') {
            console.warn('Database not available - skipping credential authentication');
            return null;
          }
          
          await connectToDatabase();
          
          // Find user with password field included
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select('+password');

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Skip database connection during build or if URL not available
          if (!process.env.DATABASE_URL || process.env.VERCEL_ENV === 'preview') {
            console.warn('Database not available - allowing Google sign-in without DB');
            return true;
          }
          
          await connectToDatabase();
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user for Google sign-in
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              provider: 'google',
              googleId: account.providerAccountId,
              emailVerified: new Date(),
              sessionsCompleted: 0,
              totalFocusTime: 0,
              streak: 0,
              preferences: {
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                theme: 'animated-gradient',
                notifications: true,
              },
            });
            console.log('Created new Google user:', existingUser.email);
          } else {
            // Update existing user with Google info if needed
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.image = user.image || existingUser.image;
              existingUser.name = user.name || existingUser.name;
              await existingUser.save();
              console.log('Linked Google account to existing user:', existingUser.email);
            }
          }
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          // Return false to prevent sign-in and show error
          return false;
        }
      }
      
      // For credentials provider, always return true
      return true;
    },
    async jwt({ token, user, account }) {
      // Only set user ID if user is present (first time login)
      if (user) {
        token.id = user.id;
        console.log('JWT callback - setting user ID:', user.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        
        // Fetch additional user data with error handling
        try {
          // Skip database connection during build or if URL not available
          if (!process.env.DATABASE_URL || process.env.VERCEL_ENV === 'preview') {
            console.warn('Database not available - using default user data');
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
          
          await connectToDatabase();
          const user = await User.findById(token.id);
          
          if (user) {
            session.user.sessionsCompleted = user.sessionsCompleted || 0;
            session.user.totalFocusTime = user.totalFocusTime || 0;
            session.user.streak = user.streak || 0;
            session.user.preferences = user.preferences || {
              focusDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              theme: 'animated-gradient',
              notifications: true,
            };
            console.log('Session callback - loaded user data for:', user.email);
          } else {
            console.warn('Session callback - user not found in database:', token.id);
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
          console.error('Session callback error:', error);
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
  secret: process.env.NEXTAUTH_SECRET,
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
  }
}