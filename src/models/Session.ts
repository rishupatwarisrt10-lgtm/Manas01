// src/models/Session.ts
import { supabaseAdmin } from '@/lib/supabase';

export interface ISession {
  id: string;
  user_id: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
  completed: boolean;
  start_time: Date;
  end_time?: Date | null;
  paused_duration?: number; // time spent paused in milliseconds
  thoughts_captured: number;
  created_at: Date;
  updated_at: Date;
}

export interface ISessionCreate {
  user_id: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  duration: number;
  completed?: boolean;
  start_time: Date;
  end_time?: Date | null;
  paused_duration?: number;
  thoughts_captured?: number;
}

export interface ISessionUpdate {
  mode?: 'focus' | 'shortBreak' | 'longBreak';
  duration?: number;
  completed?: boolean;
  start_time?: Date;
  end_time?: Date | null;
  paused_duration?: number;
  thoughts_captured?: number;
}

class Session {
  static async find(filter: { user_id?: string; mode?: string; completed?: boolean } = {}) {
    try {
      let query = supabaseAdmin.from('sessions').select('*');
      
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      
      if (filter.mode) {
        query = query.eq('mode', filter.mode);
      }
      
      if (filter.completed !== undefined) {
        query = query.eq('completed', filter.completed);
      }
      
      query = query.order('start_time', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Session.find error:', error);
        throw error;
      }
      
      return data ? data.map(this.formatSession) : [];
    } catch (error) {
      console.error('Session.find error:', error);
      throw error;
    }
  }

  static async findById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Session.findById error:', error);
        throw error;
      }
      
      return data ? this.formatSession(data) : null;
    } catch (error) {
      console.error('Session.findById error:', error);
      throw error;
    }
  }

  static async create(sessionData: ISessionCreate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .insert({
          user_id: sessionData.user_id,
          mode: sessionData.mode,
          duration: sessionData.duration,
          completed: sessionData.completed || false,
          start_time: sessionData.start_time.toISOString(),
          end_time: sessionData.end_time ? sessionData.end_time.toISOString() : null,
          paused_duration: sessionData.paused_duration || 0,
          thoughts_captured: sessionData.thoughts_captured || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Session.create error:', error);
        throw error;
      }

      return this.formatSession(data);
    } catch (error) {
      console.error('Session.create error:', error);
      throw error;
    }
  }

  static async updateById(id: string, updates: ISessionUpdate) {
    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Convert dates to ISO strings
      if (updateData.start_time && updateData.start_time instanceof Date) {
        updateData.start_time = updateData.start_time.toISOString();
      }
      if (updateData.end_time && updateData.end_time instanceof Date) {
        updateData.end_time = updateData.end_time.toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Session.updateById error:', error);
        throw error;
      }

      return this.formatSession(data);
    } catch (error) {
      console.error('Session.updateById error:', error);
      throw error;
    }
  }

  static async deleteById(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Session.deleteById error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Session.deleteById error:', error);
      throw error;
    }
  }

  static async countDocuments(filter: { user_id?: string; mode?: string; completed?: boolean } = {}) {
    try {
      let query = supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true });
      
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      
      if (filter.mode) {
        query = query.eq('mode', filter.mode);
      }
      
      if (filter.completed !== undefined) {
        query = query.eq('completed', filter.completed);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Session.countDocuments error:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Session.countDocuments error:', error);
      throw error;
    }
  }

  static lean() {
    return this; // For compatibility with Mongoose syntax
  }

  static sort(_sortOptions: unknown) {
    return this; // For compatibility with Mongoose syntax
  }

  static skip(_skipCount: number) {
    return this; // For compatibility with Mongoose syntax
  }

  static limit(_limitCount: number) {
    return this; // For compatibility with Mongoose syntax
  }

  private static formatSession(data: Record<string, any>): ISession {
    return {
      id: data.id,
      user_id: data.user_id,
      mode: data.mode,
      duration: data.duration,
      completed: data.completed,
      start_time: new Date(data.start_time),
      end_time: data.end_time ? new Date(data.end_time) : null,
      paused_duration: data.paused_duration,
      thoughts_captured: data.thoughts_captured,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}

export default Session;