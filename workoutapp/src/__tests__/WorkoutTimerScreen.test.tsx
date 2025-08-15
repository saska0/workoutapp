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
}); 