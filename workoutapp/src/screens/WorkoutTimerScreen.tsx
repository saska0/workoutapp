import React, { useReducer, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface WorkoutStep {
  name: string;
  kind: 'prepare' | 'rest' | 'stretch' | 'exercise' | 'custom';
  durationSec?: number;
  reps?: number;
  restDurationSec?: number;
  workoutId?: string;
  notes?: string;
}

interface WorkoutTimerProps {
  route: {
    params: {
      workoutTemplate: {
        userId?: string;
        name: string;
        steps: WorkoutStep[];
      };
    };
  };
  navigation: any;
}

interface WorkoutTimerState {
  currentStepIndex: number;
  currentRep: number;
  isInRest: boolean;
  isInPrepare: boolean;
  timeRemaining: number;
  isPaused: boolean;
  isActive: boolean;
  totalElapsedTime: number;
}

type WorkoutTimerAction =
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'TICK' }
  | { type: 'SKIP_STEP' }
  | { type: 'GO_BACK' }
  | { type: 'COMPLETE_WORKOUT' };

const PREPARATION_TIME_SEC = 5;

const createInitialState = (): WorkoutTimerState => ({
  currentStepIndex: 0,
  currentRep: 1,
  isInRest: false,
  isInPrepare: true,
  timeRemaining: 5,
  isPaused: false,
  isActive: false,
  totalElapsedTime: 0,
});

const workoutTimerReducer = (
  state: WorkoutTimerState,
  action: WorkoutTimerAction,
  workoutTemplate: any
): WorkoutTimerState => {
  const currentStep = workoutTemplate.steps[state.currentStepIndex];
  const isLastStep = state.currentStepIndex === workoutTemplate.steps.length - 1;

  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        isActive: true,
        isPaused: false,
      };

    case 'PAUSE_TIMER':
      return {
        ...state,
        isPaused: true,
      };

    case 'RESUME_TIMER':
      return {
        ...state,
        isPaused: false,
      };

    case 'TICK':
      if (state.timeRemaining <= 1) {
        // Handle state transitions when timer reaches zero
        if (state.isInPrepare) {
          // Preparation finished, start the exercise
          return {
            ...state,
            isInPrepare: false,
            timeRemaining: currentStep?.durationSec || 0,
            totalElapsedTime: state.totalElapsedTime + 1,
          };
        } else if (state.isInRest) {
          // Rest period finished, start preparation for next rep or next step
          if (state.currentRep < (currentStep?.reps || 1)) {
            // Start preparation for next rep of same exercise
            return {
              ...state,
              isInRest: false,
              isInPrepare: true,
              timeRemaining: PREPARATION_TIME_SEC,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          } else {
            if (isLastStep) {
              return {
                ...state,
                isActive: false,
                timeRemaining: 0,
                totalElapsedTime: state.totalElapsedTime + 1,
              };
            } else {
              return {
                ...state,
                currentStepIndex: state.currentStepIndex + 1,
                currentRep: 1,
                isInRest: false,
                isInPrepare: true,
                timeRemaining: PREPARATION_TIME_SEC,
                totalElapsedTime: state.totalElapsedTime + 1,
              };
            }
          }
        } else {
          // Exercise finished, start rest period if there are more reps
          if (state.currentRep < (currentStep?.reps || 1)) {
            return {
              ...state,
              isInRest: true,
              timeRemaining: currentStep?.restDurationSec || 10,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          } else {
            // Move to next step
            if (isLastStep) {
              // Workout complete
              return {
                ...state,
                isActive: false,
                timeRemaining: 0,
                totalElapsedTime: state.totalElapsedTime + 1,
              };
            } else {
              return {
                ...state,
                currentStepIndex: state.currentStepIndex + 1,
                currentRep: 1,
                timeRemaining: workoutTemplate.steps[state.currentStepIndex + 1].durationSec || 0,
                totalElapsedTime: state.totalElapsedTime + 1,
              };
            }
          }
        }
      } else {
        // Regular tick - just decrement timer
        return {
          ...state,
          timeRemaining: state.timeRemaining - 1,
          totalElapsedTime: state.totalElapsedTime + 1,
        };
      }

    case 'SKIP_STEP':
      if (state.isInPrepare) {
        // Skip preparation and start exercise immediately
        return {
          ...state,
          isInPrepare: false,
          timeRemaining: currentStep?.durationSec || 0,
        };
      } else if (state.isInRest) {
        // Skip rest and start preparation for next rep/step
        if (state.currentRep < (currentStep?.reps || 1)) {
          return {
            ...state,
            currentRep: state.currentRep + 1,
            isInRest: false,
            isInPrepare: true,
            timeRemaining: PREPARATION_TIME_SEC,
          };
        } else {
          // Move to next step
          if (isLastStep) {
            return {
              ...state,
              timeRemaining: 0,
            };
          } else {
            return {
              ...state,
              currentStepIndex: state.currentStepIndex + 1,
              currentRep: 1,
              isInPrepare: true,
              timeRemaining: PREPARATION_TIME_SEC,
            };
          }
        }
      } else {
        // During exercise: skip to rest period or next exercise
        if (state.currentRep < (currentStep?.reps || 1)) {
          // Start rest period before next rep
          return {
            ...state,
            isInRest: true,
            timeRemaining: currentStep?.restDurationSec || 10,
          };
        } else {
          // Move to next exercise
          if (isLastStep) {
            return {
              ...state,
              timeRemaining: 0,
            };
          } else {
            return {
              ...state,
              currentStepIndex: state.currentStepIndex + 1,
              currentRep: 1,
              isInPrepare: true,
              timeRemaining: PREPARATION_TIME_SEC,
            };
          }
        }
      }

    case 'GO_BACK':
      const baseBackState = {
        ...state,
        isPaused: true,
        isInPrepare: true,
        timeRemaining: PREPARATION_TIME_SEC,
      };

      if (state.isInPrepare) {
        if (state.currentRep > 1) {
          // Go to previous rep of same exercise
          return {
            ...baseBackState,
            currentRep: state.currentRep - 1,
          };
        } else if (state.currentStepIndex > 0) {
          // Go to previous step's last rep
          const prevStep = workoutTemplate.steps[state.currentStepIndex - 1];
          return {
            ...baseBackState,
            currentStepIndex: state.currentStepIndex - 1,
            currentRep: prevStep.reps || 1,
          };
        }
      } else if (state.isInRest) {
        return {
          ...baseBackState,
          isInRest: false,
        };
      }

      return baseBackState;

    case 'COMPLETE_WORKOUT':
      return {
        ...state,
        isActive: false,
        timeRemaining: 0,
      };

    default:
      return state;
  }
};

const WorkoutTimerScreen: React.FC<WorkoutTimerProps> = ({ route, navigation }) => {
  const { workoutTemplate } = route.params;
  
  const [state, dispatch] = useReducer(
    (state: WorkoutTimerState, action: WorkoutTimerAction) => 
      workoutTimerReducer(state, action, workoutTemplate),
    createInitialState()
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = workoutTemplate.steps[state.currentStepIndex];
  const isLastStep = state.currentStepIndex === workoutTemplate.steps.length - 1;
  const isLastRep = state.currentRep === (currentStep?.reps || 1);
  const isWorkoutComplete = isLastStep && isLastRep && state.timeRemaining === 0;

  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused]);

  useEffect(() => {
    if (isWorkoutComplete && state.isActive) {
      dispatch({ type: 'COMPLETE_WORKOUT' });
      Alert.alert('Workout Complete!', 'Great job! You\'ve finished your workout.');
    }
  }, [isWorkoutComplete, state.isActive]);

  const startTimer = () => {
    dispatch({ type: 'START_TIMER' });
  };

  const pauseTimer = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };

  const resumeTimer = () => {
    dispatch({ type: 'RESUME_TIMER' });
  };

  const skipStep = () => {
    dispatch({ type: 'SKIP_STEP' });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.workoutName}>{workoutTemplate.name}</Text>
        <View style={styles.placeholder} />
      </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>
            {state.isInPrepare ? 'Get Ready' : state.isInRest ? 'Rest Time' : 'Time Remaining'}
          </Text>
          <Text testID="timer-text" style={styles.timerText}>
            {formatTime(state.timeRemaining)}
          </Text>
        </View>

        <View style={styles.exerciseContainer}>
          <Text style={styles.exerciseName}>
            {state.isInPrepare ? 'Prepare for Exercise' : state.isInRest ? 'Rest' : currentStep?.name}
          </Text>
          {state.isInPrepare ? (
            <Text style={styles.exerciseDescription}>
              Get ready for {currentStep?.name}
            </Text>
          ) : state.isInRest ? (
            <Text style={styles.exerciseDescription}>
              Rest between reps {state.currentRep} and {state.currentRep + 1}
            </Text>
          ) : (
            currentStep?.notes && (
              <Text style={styles.exerciseDescription}>{currentStep.notes}</Text>
            )
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rep</Text>
            <Text testID="rep" style={styles.statValue}>{state.currentRep}/{currentStep?.reps || 1}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Step</Text>
            <Text testID="step" style={styles.statValue}>{state.currentStepIndex + 1}/{workoutTemplate.steps.length}</Text>
          </View>
        </View>

      <View style={styles.totalTimeContainer}>
        <Text style={styles.totalTimeLabel}>Total Time</Text>
        <Text style={styles.totalTimeText}>{formatTotalTime(state.totalElapsedTime)}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
           style={[styles.controlButton, styles.backButton]}
           onPress={goBack}
           testID="previous-button"
         >
          <Text style={styles.controlButtonText}>prev</Text>
        </TouchableOpacity>

        {!state.isActive ? (
          <TouchableOpacity
            style={[styles.controlButton]}
            onPress={startTimer}
            testID="start-button"
          >
            <Text style={styles.controlButtonText}>play</Text>
          </TouchableOpacity>
        ) : state.isPaused ? (
          <TouchableOpacity
            style={[styles.controlButton]}
            onPress={resumeTimer}
            testID="resume-button"
          >
            <Text style={styles.controlButtonText}>play</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton]}
            onPress={pauseTimer}
            testID="pause-button"
          >
            <Text style={styles.controlButtonText}>pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton]}
          onPress={skipStep}
          disabled={isWorkoutComplete}
          testID="skip-button"
        >
          <Text style={styles.controlButtonText}>next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isWorkoutComplete 
            ? 'Workout Complete!' 
            : state.isActive 
              ? state.isPaused 
                ? 'Paused' 
                : 'In Progress'
              : 'Ready to Start'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  workoutName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 60,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.button.primary,
    borderRadius: 4,
  },
  progressText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    marginBottom: 10,
  },
  timerText: {
    color: colors.text.primary,
    fontSize: 72,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'monospace',
  },
  exerciseContainer: {
    alignItems: 'center',
    marginVertical: 10,
    minHeight: 80,
  },
  exerciseName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  exerciseDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: 3,
    marginTop: 20,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  totalTimeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  totalTimeLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  totalTimeText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    backgroundColor: colors.background.secondary,
  },
  controlButtonText: {
    color: colors.text.primary,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});

export default WorkoutTimerScreen;
