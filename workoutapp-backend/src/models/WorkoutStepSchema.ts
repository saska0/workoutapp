import mongoose from 'mongoose';

export const WorkoutStepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kind: { 
    type: String, 
    enum: ['prepare', 'rest', 'stretch', 'exercise', 'custom'], 
    required: true 
  },
  durationSec: Number,
  reps: Number,
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', default: null },
  notes: String
}, { _id: false });
