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

  return response.json();
}
