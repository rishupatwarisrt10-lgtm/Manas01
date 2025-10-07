// src/models/Thought.ts
import { supabaseAdmin } from '@/lib/supabase';

export interface IThought {
  id: string;
  user_id: string;
  text: string;
  timestamp: Date;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    session_number: number;
  };
  tags?: string[];
  is_completed: boolean;
  is_deleted: boolean;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface IThoughtCreate {
  user_id: string;
  text: string;
  timestamp?: Date;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    session_number: number;
  };
  tags?: string[];
  is_completed?: boolean;
  is_deleted?: boolean;
  deleted_at?: Date | null;
}

export interface IThoughtUpdate {
  text?: string;
  timestamp?: Date;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    session_number: number;
  };
  tags?: string[];
  is_completed?: boolean;
  is_deleted?: boolean;
  deleted_at?: Date | null;
}

class Thought {
  static async find(filter: { user_id?: string; is_deleted?: boolean } = {}) {
    try {
      let query = supabaseAdmin.from('thoughts').select('*');
      
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      
      if (filter.is_deleted !== undefined) {
        if (filter.is_deleted) {
          query = query.eq('is_deleted', true);
        } else {
          query = query.neq('is_deleted', true);
        }
      }
      
      query = query.order('timestamp', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Thought.find error:', error);
        throw error;
      }
      
      return data ? data.map(this.formatThought) : [];
    } catch (error) {
      console.error('Thought.find error:', error);
      throw error;
    }
  }

  static async findById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('thoughts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Thought.findById error:', error);
        throw error;
      }
      
      return data ? this.formatThought(data) : null;
    } catch (error) {
      console.error('Thought.findById error:', error);
      throw error;
    }
  }

  static async create(thoughtData: IThoughtCreate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('thoughts')
        .insert({
          user_id: thoughtData.user_id,
          text: thoughtData.text.trim(),
          timestamp: thoughtData.timestamp ? thoughtData.timestamp.toISOString() : new Date().toISOString(),
          session: thoughtData.session || null,
          tags: thoughtData.tags || null,
          is_completed: thoughtData.is_completed || false,
          is_deleted: thoughtData.is_deleted || false,
          deleted_at: thoughtData.deleted_at ? thoughtData.deleted_at.toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Thought.create error:', error);
        throw error;
      }

      return this.formatThought(data);
    } catch (error) {
      console.error('Thought.create error:', error);
      throw error;
    }
  }

  static async updateById(id: string, updates: IThoughtUpdate) {
    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Convert dates to ISO strings
      if (updateData.timestamp && updateData.timestamp instanceof Date) {
        updateData.timestamp = updateData.timestamp.toISOString();
      }
      if (updateData.deleted_at && updateData.deleted_at instanceof Date) {
        updateData.deleted_at = updateData.deleted_at.toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('thoughts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Thought.updateById error:', error);
        throw error;
      }

      return this.formatThought(data);
    } catch (error) {
      console.error('Thought.updateById error:', error);
      throw error;
    }
  }

  static async deleteById(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('thoughts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Thought.deleteById error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Thought.deleteById error:', error);
      throw error;
    }
  }

  static async countDocuments(filter: { user_id?: string; is_deleted?: boolean } = {}) {
    try {
      let query = supabaseAdmin.from('thoughts').select('*', { count: 'exact', head: true });
      
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      
      if (filter.is_deleted !== undefined) {
        if (filter.is_deleted) {
          query = query.eq('is_deleted', true);
        } else {
          query = query.neq('is_deleted', true);
        }
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Thought.countDocuments error:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Thought.countDocuments error:', error);
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

  private static formatThought(data: Record<string, any>): IThought {
    return {
      id: data.id,
      user_id: data.user_id,
      text: data.text,
      timestamp: new Date(data.timestamp),
      session: data.session,
      tags: data.tags,
      is_completed: data.is_completed,
      is_deleted: data.is_deleted,
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}

export default Thought;