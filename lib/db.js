import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// In-Memory Fallback Data Store for Demo / Serverless without MongoDB
if (!global.inMemoryDb) {
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  global.inMemoryDb = {
    users: [
      {
        _id: 'demo_user_id_1001',
        name: 'Demo Pilot User',
        email: 'demo@postpilot.app',
        passwordHash: defaultPasswordHash,
        isActive: true,
        createdAt: new Date(),
      },
    ],
    socialAccounts: [],
    posts: [],
    analytics: [],
    commentReplies: [],
  };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    return { isFallback: true };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn('[PostPilot DB] Mongoose connection failed. Falling back to in-memory store:', err.message);
        cached.promise = null;
        return { isFallback: true };
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    return { isFallback: true };
  }
}

export default connectDB;
