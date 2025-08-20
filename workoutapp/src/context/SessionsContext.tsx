import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getAuthToken } from '../api/auth';

export interface UserSession {
  _id: string;
  startedAt: string;
  endedAt: string;
  notes?: string;
  completedWorkouts: Array<{
    templateId: string;
    name: string;
    startedAt: string;
    endedAt: string;
    durationSec?: number;
  }>;
}

interface SessionsContextType {
  sessions: UserSession[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  clearSessions: () => void;
  addSession: (session: UserSession) => void;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

export function useUserSessions() {
  const context = useContext(SessionsContext);
  if (!context) {
    throw new Error('useUserSessions must be used within a SessionsProvider');
  }
  return context;
}

interface SessionsProviderProps {
  children: ReactNode;
}

export function SessionsProvider({ children }: SessionsProviderProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api/sessions';

      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();
      setSessions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    setError(null);
  }, []);

  const addSession = useCallback((session: UserSession) => {
    setSessions(prev => {
      const updated = [session, ...prev.filter(s => s._id !== session._id)];
      return updated;
    });
  }, []);

  const value: SessionsContextType = {
    sessions,
    loading,
    error,
    fetchSessions,
    clearSessions,
    addSession,
  };

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}
