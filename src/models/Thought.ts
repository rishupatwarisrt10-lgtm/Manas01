// src/models/Thought.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IThought extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  timestamp: Date;
  session?: {
    mode: 'focus' | 'shortBreak' | 'longBreak';
    sessionNumber: number;
  };
  tags?: string[];
  isCompleted: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ThoughtSchema = new Schema<IThought>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  session: {
    mode: {
      type: String,
      enum: ['focus', 'shortBreak', 'longBreak'],
    },
    sessionNumber: Number,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for performance
ThoughtSchema.index({ userId: 1, timestamp: -1 });
ThoughtSchema.index({ userId: 1, createdAt: -1 });
ThoughtSchema.index({ userId: 1, isCompleted: 1 });
ThoughtSchema.index({ userId: 1, isDeleted: 1 });

export default mongoose.models.Thought || mongoose.model<IThought>('Thought', ThoughtSchema);