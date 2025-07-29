export type RootStackParamList = {
    Welcome: undefined;
    Main: undefined;
    Session: undefined;
    EditMenu: undefined;
    Login: undefined;
    Register: undefined;
    WorkoutTimer: {
      workoutTemplate: {
        userId?: string;
        name: string;
        steps: Array<{
          name: string;
          kind: 'prepare' | 'rest' | 'stretch' | 'exercise' | 'custom';
          durationSec?: number;
          reps?: number;
          restDurationSec?: number;
          workoutId?: string;
          notes?: string;
        }>;
      };
    };
  };