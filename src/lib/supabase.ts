// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Environment checks
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

console.log('[Database] Environment:', { isDevelopment, isProduction, isVercel, hasSupabaseUrl: !!supabaseUrl });

if (!supabaseUrl) {
  console.error('[Database] NEXT_PUBLIC_SUPABASE_URL environment variable is not defined');
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

if (!supabaseAnonKey) {
  console.error('[Database] NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not defined');
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
}

if (!supabaseServiceKey) {
  console.error('[Database] SUPABASE_SERVICE_ROLE_KEY environment variable is not defined');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin client for server-side operations with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          password: string | null;
          image: string | null;
          provider: 'credentials' | 'google';
          google_id: string | null;
          email_verified: string | null;
          sessions_completed: number;
          total_focus_time: number;
          streak: number;
          last_active_date: string | null;
          preferences: {
            focus_duration: number;
            short_break_duration: number;
            long_break_duration: number;
            theme: string;
            notifications: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          password?: string | null;
          image?: string | null;
          provider?: 'credentials' | 'google';
          google_id?: string | null;
          email_verified?: string | null;
          sessions_completed?: number;
          total_focus_time?: number;
          streak?: number;
          last_active_date?: string | null;
          preferences?: {
            focus_duration: number;
            short_break_duration: number;
            long_break_duration: number;
            theme: string;
            notifications: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          password?: string | null;
          image?: string | null;
          provider?: 'credentials' | 'google';
          google_id?: string | null;
          email_verified?: string | null;
          sessions_completed?: number;
          total_focus_time?: number;
          streak?: number;
          last_active_date?: string | null;
          preferences?: {
            focus_duration: number;
            short_break_duration: number;
            long_break_duration: number;
            theme: string;
            notifications: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      thoughts: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          timestamp: string;
          session: {
            mode: 'focus' | 'shortBreak' | 'longBreak';
            session_number: number;
          } | null;
          tags: string[] | null;
          is_completed: boolean;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          timestamp?: string;
          session?: {
            mode: 'focus' | 'shortBreak' | 'longBreak';
            session_number: number;
          } | null;
          tags?: string[] | null;
          is_completed?: boolean;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          timestamp?: string;
          session?: {
            mode: 'focus' | 'shortBreak' | 'longBreak';
            session_number: number;
          } | null;
          tags?: string[] | null;
          is_completed?: boolean;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: 'focus' | 'shortBreak' | 'longBreak';
          duration: number;
          completed: boolean;
          start_time: string;
          end_time: string | null;
          paused_duration: number;
          thoughts_captured: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: 'focus' | 'shortBreak' | 'longBreak';
          duration: number;
          completed?: boolean;
          start_time: string;
          end_time?: string | null;
          paused_duration?: number;
          thoughts_captured?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: 'focus' | 'shortBreak' | 'longBreak';
          duration?: number;
          completed?: boolean;
          start_time?: string;
          end_time?: string | null;
          paused_duration?: number;
          thoughts_captured?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper function to get Supabase admin client
export async function getSupabaseAdmin() {
  return supabaseAdmin;
}

// Helper function to get regular Supabase client
export async function getSupabase() {
  return supabase;
}

// Test connection function
export async function testConnection() {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('[Database] Connection test failed:', error);
      return false;
    }
    console.log('[Database] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection test error:', error);
    return false;
  }
}

export default getSupabaseAdmin;