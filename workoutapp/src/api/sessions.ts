import { getAuthToken } from './auth';
import { invalidateAnalyticsCache } from '../context/AnalyticsContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api/sessions';

export interface CompletedWorkout {
  templateId: string;
  name: string;
  startedAt: Date;
  endedAt: Date;
  durationSec?: number;
}

export interface SessionData {
  startedAt: Date;
  endedAt: Date;
  completedWorkouts: CompletedWorkout[];
  notes?: string;
}

export interface Session {
  _id: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  completedWorkouts: CompletedWorkout[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSessionsOptions {
  from?: Date;
  to?: Date;
}

export async function getSessions(options?: GetSessionsOptions): Promise<Session[]> {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');

  const params = new URLSearchParams();
  if (options?.from) {
    params.append('from', options.from.toISOString());
  }
  if (options?.to) {
    params.append('to', options.to.toISOString());
  }

  const url = `${API_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return response.json();
}

export async function postSession(token: string, sessionData: SessionData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    throw new Error('Failed to save session');
  }

  const result = response.json();
  
  // Invalidate analytics cache since new session affects analytics
  invalidateAnalyticsCache();
  
  return result;
}
