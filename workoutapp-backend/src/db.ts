import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export const connectToDatabase = async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  } 
};
