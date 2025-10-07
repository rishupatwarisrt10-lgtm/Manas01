// src/lib/database.ts - Compatibility wrapper for Supabase
import { getSupabaseAdmin } from './supabase';

// Re-export for backward compatibility
export { supabase, supabaseAdmin, getSupabase, testConnection } from './supabase';

// Default export matches old MongoDB pattern
export default getSupabaseAdmin;