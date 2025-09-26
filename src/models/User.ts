// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  image?: string;
  provider: 'credentials' | 'google';
  googleId?: string;
  emailVerified?: Date;
  sessionsCompleted: number;
  totalFocusTime: number;
  streak: number;
  lastActiveDate?: Date;
  preferences: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    theme: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't return password by default
  },
  image: String,
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    required: true,
    default: 'credentials',
  },
  googleId: String,
  emailVerified: Date,
  sessionsCompleted: {
    type: Number,
    default: 0,
  },
  totalFocusTime: {
    type: Number,
    default: 0,
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: Date,
  preferences: {
    focusDuration: {
      type: Number,
      default: 25, // minutes
    },
    shortBreakDuration: {
      type: Number,
      default: 5, // minutes
    },
    longBreakDuration: {
      type: Number,
      default: 15, // minutes
    },
    theme: {
      type: String,
      default: 'animated-gradient',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Index for performance - email index is created automatically by unique: true
// Only add googleId index to avoid duplication warning
UserSchema.index({ googleId: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);