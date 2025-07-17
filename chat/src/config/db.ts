import mongoose from "mongoose";

const connectDB = async() => {
  const url = process.env.MONGO_URI;

  if(!url) {
    throw new Error('MONGO_URI missing in environment variables')
  }

  try {
    const conn = await mongoose.connect(url, {dbName: 'ping_chat'})

    console.log(`MongoDB connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('Failed to connect to mongodb', error)
    process.exit(1)
  }
}

export default connectDB