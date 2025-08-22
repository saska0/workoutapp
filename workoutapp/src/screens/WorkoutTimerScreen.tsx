import React, { useReducer, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { CompletedWorkout } from '../api/sessions';
import { useSessionTimer } from '../context/SessionTimerContext';
import CircularButton from '../components/CircularButton';

interface WorkoutStep {
  name: string;
  kind: 'rest' | 'stretch' | 'exercise';
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
        _id: string;
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
  timeRemaining: PREPARATION_TIME_SEC,
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
      // If the very first step is a standalone rest step, skip preparation
      if (currentStep?.kind === 'rest') {
        return {
          ...state,
          isActive: true,
          isPaused: false,
          isInPrepare: false,
          isInRest: true,
          timeRemaining: currentStep?.durationSec || 0,
        };
      }
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
      // Transition from intra-exercise rest to preparation when only PREPARATION_TIME_SEC remains
      if (state.isInRest && currentStep?.kind !== 'rest' && state.timeRemaining === PREPARATION_TIME_SEC) {
            return {
              ...state,
              isInRest: false,
              isInPrepare: true,
              timeRemaining: PREPARATION_TIME_SEC,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          }
      if (state.timeRemaining <= 1) {
        if (state.isInPrepare) {
          return {
            ...state,
            isInPrepare: false,
            timeRemaining: currentStep?.durationSec || 0,
            totalElapsedTime: state.totalElapsedTime + 1,
          };
        }
        if (state.isInRest) {
          if (state.currentRep < (currentStep?.reps || 1)) {
            return {
              ...state,
              isInRest: false,
              isInPrepare: true,
              timeRemaining: PREPARATION_TIME_SEC,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          }
          if (isLastStep) {
            return {
              ...state,
              isActive: false,
              timeRemaining: 0,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          }
          // Move to next step; if next is a rest step, go directly into rest (no preparation)
          {
            const nextStep = workoutTemplate.steps[state.currentStepIndex + 1];
            if (nextStep?.kind === 'rest') {
              return {
                ...state,
                currentStepIndex: state.currentStepIndex + 1,
                currentRep: 1,
                isInRest: true,
                isInPrepare: false,
                timeRemaining: nextStep.durationSec || 0,
                totalElapsedTime: state.totalElapsedTime + 1,
              };
            }
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
        // End of exercise
        if (state.currentRep < (currentStep?.reps || 1)) {
          const rest = currentStep?.restDurationSec ?? 0;
          if (rest > PREPARATION_TIME_SEC) {
            return {
              ...state,
              isInRest: true,
              timeRemaining: rest,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          }
          // No or short rest: straight to preparation
          return {
            ...state,
            isInPrepare: true,
            timeRemaining: PREPARATION_TIME_SEC,
            totalElapsedTime: state.totalElapsedTime + 1,
          };
        }
        if (isLastStep) {
          return {
            ...state,
            isActive: false,
            timeRemaining: 0,
            totalElapsedTime: state.totalElapsedTime + 1,
          };
        }
        {
          const nextStep = workoutTemplate.steps[state.currentStepIndex + 1];
          if (nextStep?.kind === 'rest') {
            return {
              ...state,
              currentStepIndex: state.currentStepIndex + 1,
              currentRep: 1,
              isInRest: true,
              isInPrepare: false,
              timeRemaining: nextStep.durationSec || 0,
              totalElapsedTime: state.totalElapsedTime + 1,
            };
          }
          return {
            ...state,
            currentStepIndex: state.currentStepIndex + 1,
            currentRep: 1,
            isInPrepare: true,
            isInRest: false,
            timeRemaining: PREPARATION_TIME_SEC,
            totalElapsedTime: state.totalElapsedTime + 1,
          };
        }
      }
      // Regular tick
      return {
        ...state,
        timeRemaining: state.timeRemaining - 1,
        totalElapsedTime: state.totalElapsedTime + 1,
      };

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
          // Start rest period before next rep, unless restDurationSec is 0 -> go to preparation
          const rest = currentStep?.restDurationSec ?? 0;
          if (rest > 0) {
            return {
              ...state,
              isInRest: true,
              timeRemaining: rest,
            };
          }
          // No rest configured: go straight to preparation
          return {
            ...state,
            isInPrepare: true,
            isInRest: false,
            timeRemaining: PREPARATION_TIME_SEC,
          };
        } else {
          // Move to next exercise
          if (isLastStep) {
            return {
              ...state,
              timeRemaining: 0,
            };
          } else {
            const nextStep = workoutTemplate.steps[state.currentStepIndex + 1];
            if (nextStep?.kind === 'rest') {
              return {
                ...state,
                currentStepIndex: state.currentStepIndex + 1,
                currentRep: 1,
                isInRest: true,
                isInPrepare: false,
                timeRemaining: nextStep.durationSec || 0,
              };
            }
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
      // If current step is a standalone rest step, go to preparation of the previous step
      if (currentStep?.kind === 'rest') {
        if (state.currentStepIndex > 0) {
          return {
            ...state,
            isPaused: true,
            isInPrepare: true,
            isInRest: false,
            currentStepIndex: state.currentStepIndex - 1,
            currentRep: 1,
            timeRemaining: PREPARATION_TIME_SEC,
          };
        }
        // No previous step; just ensure we're in prepare state
        return {
          ...state,
          isPaused: true,
          isInPrepare: true,
          isInRest: false,
          timeRemaining: PREPARATION_TIME_SEC,
        };
      }
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
          if (prevStep?.kind === 'rest') {
            return {
              ...state,
              isPaused: true,
              isInPrepare: false,
              isInRest: true,
              currentStepIndex: state.currentStepIndex - 1,
              currentRep: prevStep.reps || 1,
              timeRemaining: prevStep.durationSec || 0,
            };
          }
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
  const { addCompletedWorkout } = useSessionTimer();
  
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
      
      // Create completed workout data
      const workoutStartTime = new Date(Date.now() - state.totalElapsedTime * 1000);
      const workoutEndTime = new Date();
      
      const completedWorkout: CompletedWorkout = {
        templateId: workoutTemplate._id,
        name: workoutTemplate.name,
        startedAt: workoutStartTime,
        endedAt: workoutEndTime,
        durationSec: state.totalElapsedTime,
      };
      addCompletedWorkout(completedWorkout);
      
      Alert.alert('Workout Complete!', 'Great job! You\'ve finished your workout.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [isWorkoutComplete, state.isActive, addCompletedWorkout, workoutTemplate, state.totalElapsedTime, navigation]);

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
          <Feather name="x" size={24} color={colors.text.primary} />
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
            {state.isInPrepare ? 'Prepare' : state.isInRest ? 'Rest' : currentStep?.name}
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
        <CircularButton
          iconName="skip-back"
          onPress={goBack}
          style={styles.controlButtonSpacing}
          testID="previous-button"
        />

        {!state.isActive ? (
          <CircularButton
            iconName="play"
            onPress={startTimer}
            style={styles.controlButtonSpacing}
            testID="start-button"
          />
        ) : state.isPaused ? (
          <CircularButton
            iconName="play"
            onPress={resumeTimer}
            style={styles.controlButtonSpacing}
            testID="resume-button"
          />
        ) : (
          <CircularButton
            iconName="pause"
            onPress={pauseTimer}
            style={styles.controlButtonSpacing}
            testID="pause-button"
          />
        )}

        <CircularButton
          iconName="skip-forward"
          onPress={skipStep}
          disabled={isWorkoutComplete}
          style={styles.controlButtonSpacing}
          testID="skip-button"
        />
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
    fontSize: typography.fontSize.timerxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.monospace,
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
    borderWidth: 3,
    borderColor: colors.border.primary,
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
  controlButtonSpacing: {
    marginHorizontal: 10,
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
