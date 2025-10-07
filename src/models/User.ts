// src/models/User.ts
import { supabaseAdmin } from '@/lib/supabase';

export interface IUser {
  id: string;
  email: string;
  name?: string | null;
  password?: string | null;
  image?: string | null;
  provider: 'credentials' | 'google';
  google_id?: string | null;
  email_verified?: Date | null;
  sessions_completed: number;
  total_focus_time: number;
  streak: number;
  last_active_date?: Date | null;
  preferences: {
    focus_duration: number;
    short_break_duration: number;
    long_break_duration: number;
    theme: string;
    notifications: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

export interface IUserCreate {
  email: string;
  name?: string | null;
  password?: string | null;
  image?: string | null;
  provider?: 'credentials' | 'google';
  google_id?: string | null;
  email_verified?: Date | null;
  sessions_completed?: number;
  total_focus_time?: number;
  streak?: number;
  last_active_date?: Date | null;
  preferences?: {
    focus_duration: number;
    short_break_duration: number;
    long_break_duration: number;
    theme: string;
    notifications: boolean;
  };
}

export interface IUserUpdate {
  email?: string;
  name?: string | null;
  password?: string | null;
  image?: string | null;
  provider?: 'credentials' | 'google';
  google_id?: string | null;
  email_verified?: Date | null;
  sessions_completed?: number;
  total_focus_time?: number;
  streak?: number;
  last_active_date?: Date | null;
  preferences?: {
    focus_duration: number;
    short_break_duration: number;
    long_break_duration: number;
    theme: string;
    notifications: boolean;
  };
}

class User {
  static async findOne(filter: { email?: string; id?: string; google_id?: string }) {
    try {
      let query = supabaseAdmin.from('users').select('*');
      
      if (filter.email) {
        query = query.eq('email', filter.email.toLowerCase());
      } else if (filter.id) {
        query = query.eq('id', filter.id);
      } else if (filter.google_id) {
        query = query.eq('google_id', filter.google_id);
      }
      
      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('User.findOne error:', error);
        throw error;
      }
      
      return data ? this.formatUser(data) : null;
    } catch (error) {
      console.error('User.findOne error:', error);
      throw error;
    }
  }

  static async findById(id: string) {
    return this.findOne({ id });
  }

  static async create(userData: IUserCreate) {
    try {
      const defaultPreferences = {
        focus_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        theme: 'animated-gradient',
        notifications: true,
      };

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: userData.email.toLowerCase(),
          name: userData.name || null,
          password: userData.password || null,
          image: userData.image || null,
          provider: userData.provider || 'credentials',
          google_id: userData.google_id || null,
          email_verified: userData.email_verified ? userData.email_verified.toISOString() : null,
          sessions_completed: userData.sessions_completed || 0,
          total_focus_time: userData.total_focus_time || 0,
          streak: userData.streak || 0,
          last_active_date: userData.last_active_date ? userData.last_active_date.toISOString() : null,
          preferences: userData.preferences || defaultPreferences,
        })
        .select()
        .single();

      if (error) {
        console.error('User.create error:', error);
        throw error;
      }

      return this.formatUser(data);
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    }
  }

  static async updateById(id: string, updates: IUserUpdate) {
    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Convert dates to ISO strings
      if (updateData.email_verified && updateData.email_verified instanceof Date) {
        updateData.email_verified = updateData.email_verified.toISOString();
      }
      if (updateData.last_active_date && updateData.last_active_date instanceof Date) {
        updateData.last_active_date = updateData.last_active_date.toISOString();
      }
      if (updateData.email && typeof updateData.email === 'string') {
        updateData.email = updateData.email.toLowerCase();
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('User.updateById error:', error);
        throw error;
      }

      return this.formatUser(data);
    } catch (error) {
      console.error('User.updateById error:', error);
      throw error;
    }
  }

  static async save(user: IUser) {
    return this.updateById(user.id, user);
  }

  private static formatUser(data: Record<string, any>): IUser {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      password: data.password,
      image: data.image,
      provider: data.provider,
      google_id: data.google_id,
      email_verified: data.email_verified ? new Date(data.email_verified) : null,
      sessions_completed: data.sessions_completed,
      total_focus_time: data.total_focus_time,
      streak: data.streak,
      last_active_date: data.last_active_date ? new Date(data.last_active_date) : null,
      preferences: data.preferences,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}

export default User;