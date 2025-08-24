import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getSessions, type Session } from '../api/sessions';

export type UserSession = Session;

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
      const data = await getSessions();
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
