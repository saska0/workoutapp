export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
  Session: undefined;
  EditMenu: undefined;
  Login: undefined;
  Register: undefined;
  Metrics: undefined;
  Calendar: undefined;
  Agenda: { selectedDate?: string };
  WorkoutTimer: {
    workoutTemplate: {
      _id: string;
      userId?: string;
      name: string;
      steps: Array<{
        name: string;
        kind: 'rest' | 'stretch' | 'exercise';
        durationSec?: number;
        reps?: number;
        restDurationSec?: number;
        workoutId?: string;
        notes?: string;
      }>;
    };
  };
  CreateTemplate: undefined;
  EditTemplate: { templateId: string };
  BrowseTemplates: undefined;
};