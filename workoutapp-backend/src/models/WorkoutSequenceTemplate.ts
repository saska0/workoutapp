import mongoose from 'mongoose';
import { WorkoutStepSchema } from './WorkoutStepSchema';

const WorkoutSequenceTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  steps: { type: [WorkoutStepSchema], required: true },
});

export const WorkoutSequenceTemplate = mongoose.model('WorkoutSequenceTemplate', WorkoutSequenceTemplateSchema);
