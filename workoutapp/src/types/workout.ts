export type WorkoutStep = {
  name: string;
  kind: 'rest' | 'stretch' | 'exercise';
  durationSec?: number;
  reps?: number;
  restDurationSec?: number;
  notes?: string;
};

export type WorkoutTemplate = {
  _id: string;
  name: string;
  steps: WorkoutStep[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};
