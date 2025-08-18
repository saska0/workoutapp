import mongoose from 'mongoose';

const CompletedWorkoutSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSequenceTemplate', required: true },
    name: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    durationSec: { type: Number },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    location: { type: String }, // free-text location entered by user
    completedWorkouts: { type: [CompletedWorkoutSchema], default: [] },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1, startedAt: -1 });

export const Session = mongoose.model('Session', SessionSchema);
