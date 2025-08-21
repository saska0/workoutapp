import mongoose, { Schema } from 'mongoose';

const UserProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  metric: { type: String, required: true }, // e.g. "weight", "max_pull"
  date: { type: Date, required: true }, 
  value: { type: Number, required: true }
}, { timestamps: true });

// Unique index: one entry per user/metric/day
UserProgressSchema.index({ userId: 1, metric: 1, date: 1 }, { unique: true });

export const UserProgress = mongoose.model('UserProgress', UserProgressSchema);