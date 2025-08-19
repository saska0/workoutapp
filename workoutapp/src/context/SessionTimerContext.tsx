import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CompletedWorkout } from '../api/sessions';

export type SessionTimerContextType = {
  startTime: Date | null;
  isRunning: boolean;
  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;
  elapsedSec: number;
  completedWorkouts: CompletedWorkout[];
  addCompletedWorkout: (workout: CompletedWorkout) => void;
  clearCompletedWorkouts: () => void;
};

const SessionTimerContext = createContext<SessionTimerContextType | undefined>(undefined);

export const SessionTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const startSession = () => {
    setStartTime(new Date());
    setIsRunning(true);
    setElapsedSec(0);
  };

  const endSession = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSec(0);
  };

  const resetSession = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSec(0);
  };

  const addCompletedWorkout = (workout: CompletedWorkout) => {
    setCompletedWorkouts(prev => [...prev, workout]);
  };

  const clearCompletedWorkouts = () => {
    setCompletedWorkouts([]);
  };

  return (
    <SessionTimerContext.Provider value={{ 
      startTime, 
      isRunning, 
      startSession, 
      endSession, 
      resetSession, 
      elapsedSec,
      completedWorkouts,
      addCompletedWorkout,
      clearCompletedWorkouts
    }}>
      {children}
    </SessionTimerContext.Provider>
  );
};

export const useSessionTimer = () => {
  const context = useContext(SessionTimerContext);
  if (!context) throw new Error('useSessionTimer must be used within a SessionTimerProvider');
  return context;
};