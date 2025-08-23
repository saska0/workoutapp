import { getAuthToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type ProgressMetric = 'weight' | 'pullup_1rm' | 'hang_20mm_7s';

export async function postProgress(metric: ProgressMetric, value: number, date: Date = new Date()) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const body = {
    metric,
    value,
    date: date.toISOString(),
  };

  const res = await fetch(`${BASE_URL}/api/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to log progress');
  }
  return res.json();
}
