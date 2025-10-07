-- Supabase Database Schema for Manas App
-- Run this SQL in your Supabase SQL editor to create the database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255), -- Hashed password for credentials provider
  image TEXT,
  provider VARCHAR(20) DEFAULT 'credentials' CHECK (provider IN ('credentials', 'google')),
  google_id VARCHAR(255),
  email_verified TIMESTAMPTZ,
  sessions_completed INTEGER DEFAULT 0,
  total_focus_time INTEGER DEFAULT 0, -- in minutes
  streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  preferences JSONB DEFAULT '{
    "focus_duration": 25,
    "short_break_duration": 5,
    "long_break_duration": 15,
    "theme": "animated-gradient",
    "notifications": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session JSONB, -- JSON object containing mode and session_number
  tags TEXT[], -- Array of tags
  is_completed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('focus', 'shortBreak', 'longBreak')),
  duration INTEGER NOT NULL, -- in minutes
  completed BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  paused_duration INTEGER DEFAULT 0, -- in milliseconds
  thoughts_captured INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_timestamp ON thoughts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_completed ON thoughts(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_thoughts_deleted ON thoughts(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(user_id, mode);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(user_id, completed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at 
  BEFORE UPDATE ON thoughts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Enable insert for new users" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for thoughts table
CREATE POLICY "Users can view own thoughts" ON thoughts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own thoughts" ON thoughts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own thoughts" ON thoughts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own thoughts" ON thoughts FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for sessions table
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid()::text = user_id::text);