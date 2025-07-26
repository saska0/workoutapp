import mongoose from 'mongoose';

const MONGODB_URI = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI
export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  } 
};
