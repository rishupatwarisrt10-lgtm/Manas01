// src/lib/database.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL;

// Graceful handling during build time - don't throw errors
const isDevelopment = process.env.NODE_ENV === 'development';
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL;

if (!MONGODB_URI && isDevelopment) {
  console.warn(
    'DATABASE_URL environment variable is not defined. Database features may not work.'
  );
}

/**
 * Production-ready MongoDB connection configuration
 */
const mongoOptions = {
  // Connection pool settings
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2,  // Minimum number of connections in the pool
  
  // Timeout settings
  serverSelectionTimeoutMS: 5000, // How long to try to connect
  socketTimeoutMS: 45000,         // How long to wait for a response
  connectTimeoutMS: 10000,        // How long to wait for initial connection
  
  // Buffering - FIXED: removed deprecated option
  bufferCommands: false,          // Disable mongoose buffering
  
  // Heartbeat
  heartbeatFrequencyMS: 10000,    // How often to check connection health
  
  // Retry settings
  retryWrites: true,              // Retry failed writes
  retryReads: true,               // Retry failed reads
  
  // Additional production settings
  maxIdleTimeMS: 30000,           // Close connections after 30 seconds of inactivity
  
  // SSL settings (enable for production with MongoDB Atlas)
  ...(process.env.NODE_ENV === 'production' && {
    ssl: true,
    sslValidate: true,
  })
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  // During build time, return a mock connection
  if (isBuildTime || !MONGODB_URI) {
    console.warn('Database connection skipped during build or missing DATABASE_URL');
    return { connection: { db: null } };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, mongoOptions).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  if (cached.conn) {
    await cached.conn.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  }
});

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

export default connectToDatabase;