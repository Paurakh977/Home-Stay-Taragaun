import mongoose from 'mongoose';

/**
 * Global variable to maintain mongoose connection instance across hot reloads
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/HomestayDB';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain connection across hot reloads
 */
const globalWithMongoose = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

// Check if we're in build/static generation phase
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.NEXT_PHASE === 'phase-export';

/**
 * Connect to MongoDB and cache the connection
 */
async function dbConnect() {
  // Skip actual connection during build time
  if (isBuildTime) {
    console.log('Build time detected, skipping MongoDB connection');
    return {} as typeof mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 20000, // Increase timeout to 20 seconds
      connectTimeoutMS: 30000, // Connection timeout
      socketTimeoutMS: 45000, // Socket timeout
      // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    };

    console.log(`Connecting to MongoDB at ${MONGODB_URI}`);
    
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('New MongoDB connection established');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', error);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

// Only check connection on module load if not in build time
if (!isBuildTime) {
  dbConnect()
    .then(() => console.log('Initial MongoDB connection check successful'))
    .catch(err => console.error('Initial MongoDB connection check failed:', err));
}

export default dbConnect; 