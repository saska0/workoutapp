import { getAuthToken } from './auth';
import { BACKEND_URL } from '../config/runtime';
const baseUrl = BACKEND_URL;

export type AnalyticsPeriod = '7d' | '30d' | 'all';

export type AnalyticsResponse = {
	totalSessionTime: string;
	averageSessionLength: string;
	current: {
		maxHang: string;
		maxPullup: string;
		maxWeight: string;
	};
	chartData: {
		hangData: Array<{ value: number }>;
		pullupData: Array<{ value: number }>;
		weightData: Array<{ value: number }>;
	};
};

export async function fetchAnalytics(period: AnalyticsPeriod): Promise<AnalyticsResponse> {
	const token = await getAuthToken();
	if (!token) throw new Error('No auth token');

	const res = await fetch(`${baseUrl}/api/analytics?period=${encodeURIComponent(period)}` as string, {
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as any)?.error || 'Failed to fetch analytics');
	}

	const data = (await res.json()) as Partial<AnalyticsResponse>;

	return {
		totalSessionTime: data.totalSessionTime ?? '—',
		averageSessionLength: data.averageSessionLength ?? '—',
		current: {
			maxHang: data.current?.maxHang ?? '—',
			maxPullup: data.current?.maxPullup ?? '—',
			maxWeight: data.current?.maxWeight ?? '—',
		},
		chartData: {
			hangData: data.chartData?.hangData?.map((p: any) => ({ value: Number(p?.value) || 0 })) ?? [{ value: 0 }],
			pullupData: data.chartData?.pullupData?.map((p: any) => ({ value: Number(p?.value) || 0 })) ?? [{ value: 0 }],
			weightData: data.chartData?.weightData?.map((p: any) => ({ value: Number(p?.value) || 0 })) ?? [{ value: 0 }],
		},
	};
}
