import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutTimerScreen from '../screens/WorkoutTimerScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    workoutTemplate: {
      name: 'Test Workout',
      steps: [
        {
          name: 'exercise1',
          kind: 'stretch' as const,
          durationSec: 30,
          reps: 2,
          restDurationSec: 15,
          notes: '111'
        },
        {
          name: 'exercise2',
          kind: 'stretch' as const,
          durationSec: 45,
          reps: 2,
          restDurationSec: 20,
          notes: '222'
        }
      ],
    },
  },
};

jest.spyOn(require('react-native'), 'Alert').mockImplementation(() => ({
  alert: jest.fn(),
}));

describe('WorkoutTimerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with workout template', () => {
    const { getByText } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText(/Test Workout/)).toBeTruthy();
    expect(getByText(/exercise1/)).toBeTruthy();
  });

  it('starts in preparation mode', () => {
    const { getByText } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText(/Get Ready/)).toBeTruthy();
    expect(getByText(/5/)).toBeTruthy(); // Preparation countdown
  });

  it('starts countdown timer when start is pressed', async () => {
    const { getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );
  
    fireEvent.press(getByTestId('start-button'));
  
    const initialTime = getByTestId('timer-text').props.children;
  
    await waitFor(() => {
      const updatedTime = getByTestId('timer-text').props.children;
      expect(updatedTime).not.toBe(initialTime);
    }, { timeout: 2000 });
  });

  it('pauses and resumes timer correctly', async () => {
    const { getByText, getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('start-button'));
    
    await waitFor(() => {
      expect(getByText(/exercise1/)).toBeTruthy();
    });

    // Pause
    fireEvent.press(getByTestId('pause-button'));
    expect(getByText(/Paused/)).toBeTruthy();

    // Resume
    fireEvent.press(getByTestId('resume-button'));
    expect(getByText(/In Progress/)).toBeTruthy();
  });

  it('skips to next phase when skip button is pressed', async () => {
    const { getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByTestId('rep')).toHaveTextContent('1/2');

    fireEvent.press(getByTestId('skip-button')); // prep -> rep1
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rest
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rep2

    await waitFor(() => {
      expect(getByTestId('rep')).toHaveTextContent('2/2');
    });

    fireEvent.press(getByTestId('skip-button')); // rep2 -> rest
    fireEvent.press(getByTestId('skip-button')); // rest -> step2

    await waitFor(() => {
      expect(getByTestId('step')).toHaveTextContent('2/2');
      expect(getByTestId('rep')).toHaveTextContent('1/2');
    });
  });

  it('pressing previous during prep of 1st rep of 1st step goes back to beginning of prep (5s)', async () => {
    const { getByText, getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Start timer and go back to preparation
    fireEvent.press(getByTestId('start-button'));
    jest.advanceTimersByTime(1000);
    fireEvent.press(getByTestId('previous-button'));
    await waitFor(() => {
      expect(getByText(/Get Ready/)).toBeTruthy();
      expect(getByText(/5/)).toBeTruthy();
    });   
  });

  it('pressing previous during an exercise goes back to prep', async () => {
    const { getByText, getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Skip prep and go back
    fireEvent.press(getByTestId('skip-button'));
    fireEvent.press(getByTestId('previous-button'));
    await waitFor(() => {
      expect(getByText(/Get Ready/)).toBeTruthy();
      expect(getByText(/5/)).toBeTruthy();
    });
  });

  it('pressing previous goes back to previous rep', async () => {
    const { getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Skip to the next rep and go back
    fireEvent.press(getByTestId('skip-button')); // prep -> rep1
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rest
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rep2
    await waitFor(() => {
      expect(getByTestId('rep')).toHaveTextContent('2/2');
    });
    fireEvent.press(getByTestId('previous-button'));
    await waitFor(() => {
      expect(getByTestId('rep')).toHaveTextContent('1/2');
    });
  });

  it('pressing previous goes back to previous step', async () => {
    const { getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );

    // Skip to the next step and go back
    fireEvent.press(getByTestId('skip-button')); // prep -> rep1
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rest
    fireEvent.press(getByTestId('skip-button')); // rep1 -> rep2
    fireEvent.press(getByTestId('skip-button')); // rep2 -> rest
    fireEvent.press(getByTestId('skip-button')); // rest -> step2
    await waitFor(() => {
      expect(getByTestId('step')).toHaveTextContent('2/2');
    });
    fireEvent.press(getByTestId('previous-button'));
    await waitFor(() => {
      expect(getByTestId('step')).toHaveTextContent('1/2');
    });
  });

  it('decrements timeRemaining on each tick', async() => {
    const { getByTestId } = render(
      <WorkoutTimerScreen route={mockRoute} navigation={mockNavigation} />
    );
  
    fireEvent.press(getByTestId('start-button'));

    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(getByTestId('timer-text')).toHaveTextContent('00:02');
    });
  });

  it('starts directly in rest when first step is rest (no preparation)', async () => {
    const routeFirstRest = {
      params: {
        workoutTemplate: {
          name: 'Rest First',
          steps: [
            { name: 'Rest', kind: 'rest' as const, durationSec: 10 },
            { name: 'exercise1', kind: 'exercise' as const, durationSec: 30, reps: 1, restDurationSec: 0 },
          ],
        },
      },
    };

    const { getByText, getByTestId } = render(
      <WorkoutTimerScreen route={routeFirstRest as any} navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('start-button'));

    await waitFor(() => {
      expect(getByText(/Rest Time/)).toBeTruthy();
      expect(getByTestId('timer-text')).toHaveTextContent('00:10');
    });
  });

  it('navigates to a rest step without preparation when next step is rest (skip path)', async () => {
    const routeNextRest = {
      params: {
        workoutTemplate: {
          name: 'Next Is Rest',
          steps: [
            { name: 'exercise1', kind: 'exercise' as const, durationSec: 10, reps: 1, restDurationSec: 0 },
            { name: 'Rest', kind: 'rest' as const, durationSec: 12 },
          ],
        },
      },
    };

    const { getByTestId, getByText } = render(
      <WorkoutTimerScreen route={routeNextRest as any} navigation={mockNavigation} />
    );

    // prep -> exercise -> next step (rest)
    fireEvent.press(getByTestId('skip-button')); // enter exercise
    fireEvent.press(getByTestId('skip-button')); // complete exercise -> should land in rest directly

    await waitFor(() => {
      expect(getByText(/Rest Time/)).toBeTruthy();
      expect(getByTestId('timer-text')).toHaveTextContent('00:12');
    });
  });

  it('pressing previous on a rest step goes to preparation of previous step', async () => {
    const routeWithMiddleRest = {
      params: {
        workoutTemplate: {
          name: 'Prev From Rest',
          steps: [
            { name: 'exercise1', kind: 'exercise' as const, durationSec: 10, reps: 1, restDurationSec: 0 },
            { name: 'Rest', kind: 'rest' as const, durationSec: 7 },
            { name: 'exercise2', kind: 'exercise' as const, durationSec: 10, reps: 1, restDurationSec: 0 },
          ],
        },
      },
    };

    const { getByTestId, getByText } = render(
      <WorkoutTimerScreen route={routeWithMiddleRest as any} navigation={mockNavigation} />
    );

    // Move to rest step
    fireEvent.press(getByTestId('skip-button')); // prep -> exercise1
    fireEvent.press(getByTestId('skip-button')); // exercise1 -> rest step

    await waitFor(() => {
      expect(getByText(/Rest Time/)).toBeTruthy();
    });

    // Go back from rest -> should go to preparation of previous step
    fireEvent.press(getByTestId('previous-button'));

    await waitFor(() => {
      expect(getByText(/Get Ready/)).toBeTruthy();
      expect(getByText('00:05')).toBeTruthy();
    });
  });

  it('intra-exercise rest flips to preparation when reaching preparation threshold', async () => {
    const routeWithIntraRest = {
      params: {
        workoutTemplate: {
          name: 'Intra Rest',
          steps: [
            { name: 'exercise1', kind: 'exercise' as const, durationSec: 5, reps: 2, restDurationSec: 8 },
          ],
        },
      },
    };

    const { getByTestId, getByText } = render(
      <WorkoutTimerScreen route={routeWithIntraRest as any} navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('start-button'));

    // Move to exercise immediately
    fireEvent.press(getByTestId('skip-button'));

    // Finish first rep -> go to rest (8s)
    fireEvent.press(getByTestId('skip-button'));

    // Advance time so the rest reaches 5 seconds remaining, then one more tick to flip to prepare
    jest.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(getByText(/Get Ready/)).toBeTruthy();
      expect(getByTestId('timer-text')).toHaveTextContent('00:05');
    });
  });

  it('no rest between reps defaults to preparation', async () => {
    const routeNoRestBetweenReps = {
      params: {
        workoutTemplate: {
          name: 'No Rest Between Reps',
          steps: [
            { name: 'exercise1', kind: 'exercise' as const, durationSec: 5, reps: 2, restDurationSec: 0 },
          ],
        },
      },
    };

    const { getByTestId, getByText } = render(
      <WorkoutTimerScreen route={routeNoRestBetweenReps as any} navigation={mockNavigation} />
    );

    // prep -> exercise1
    fireEvent.press(getByTestId('skip-button'));
    // exercise1 rep1 -> next phase (no rest configured, should go to preparation)
    fireEvent.press(getByTestId('skip-button'));

    await waitFor(() => {
      expect(getByText(/Get Ready/)).toBeTruthy();
      expect(getByTestId('timer-text')).toHaveTextContent('00:05');
    });
  });
}); 