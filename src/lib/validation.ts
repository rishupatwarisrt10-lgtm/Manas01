// src/lib/validation.ts

// User registration validation
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ThoughtData {
  text: string;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    sessionNumber: number;
  };
  tags?: string[];
}

export interface SessionData {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  duration: number;
  completed?: boolean;
  startTime: string;
  endTime?: string;
  pausedDuration?: number;
  thoughtsCaptured?: number;
}

export interface PreferencesData {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  theme: string;
  notifications: boolean;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Password validation
export function isValidPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;
  // At least one uppercase, one lowercase, one number
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpper && hasLower && hasNumber;
}

// Name validation
export function isValidName(name: string): boolean {
  if (!name || name.length > 100) return false;
  return /^[a-zA-Z\s]+$/.test(name);
}

// Validate registration data
export function validateRegistration(data: RegisterData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  } else if (!isValidPassword(data.password)) {
    errors.push('Password must be at least 8 characters and contain uppercase, lowercase, and number');
  }
  
  if (data.name && !isValidName(data.name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return { valid: errors.length === 0, errors };
}

// Validate thought data
export function validateThought(data: ThoughtData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.text || data.text.trim().length === 0) {
    errors.push('Thought text is required');
  } else if (data.text.length > 1000) {
    errors.push('Thought text is too long (max 1000 characters)');
  }
  
  if (data.tags && data.tags.length > 10) {
    errors.push('Too many tags (max 10)');
  }
  
  return { valid: errors.length === 0, errors };
}

// Validate session data
export function validateSession(data: SessionData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!['focus', 'shortBreak', 'longBreak'].includes(data.mode)) {
    errors.push('Invalid session mode');
  }
  
  if (!data.duration || data.duration <= 0 || data.duration > 300) {
    errors.push('Duration must be between 1 and 300 minutes');
  }
  
  if (!data.startTime) {
    errors.push('Start time is required');
  }
  
  return { valid: errors.length === 0, errors };
}

// Helper function to sanitize text input
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potential XSS characters
    .slice(0, 1000); // Truncate to prevent overflow
}

// Helper function to validate MongoDB ObjectId
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}