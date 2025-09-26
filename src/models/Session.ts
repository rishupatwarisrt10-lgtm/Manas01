// src/models/Session.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
  completed: boolean;
  startTime: Date;
  endTime?: Date;
  pausedDuration?: number; // time spent paused in milliseconds
  thoughtsCaptured: number;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: {
    type: String,
    enum: ['focus', 'shortBreak', 'longBreak'],
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: Date,
  pausedDuration: {
    type: Number,
    default: 0,
  },
  thoughtsCaptured: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance and analytics
SessionSchema.index({ userId: 1, startTime: -1 });
SessionSchema.index({ userId: 1, mode: 1 });
SessionSchema.index({ userId: 1, completed: 1 });

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);