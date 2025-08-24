import express from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/authMiddleware';
import { Types } from 'mongoose';
import { Session } from '../models/Session';
import { UserProgress } from '../models/UserProgress';

type AnalyticsPeriod = '7d' | '30d' | 'all';

const router = express.Router();

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
};

const startOfUTCDay = (d: Date) => {
  const nd = new Date(d);
  nd.setUTCHours(0, 0, 0, 0);
  return nd;
};

const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setUTCDate(nd.getUTCDate() + n);
  return nd;
};

router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = new Types.ObjectId(req.user.userId);

    const period = (String(req.query.period || '7d') as AnalyticsPeriod);
    if (!['7d', '30d', 'all'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const today = startOfUTCDay(new Date());
    const windowDays = period === '7d' ? 7 : period === '30d' ? 30 : undefined;
    const windowStart = windowDays ? addDays(today, -(windowDays - 1)) : undefined;

    // Sessions summary
    const sessionQuery: any = { userId };
    if (windowStart) {
      sessionQuery.startedAt = { $gte: windowStart };
    }
    const sessions = await Session.find(sessionQuery).sort({ startedAt: -1 }).lean();
    let totalSessionSeconds = 0;
    sessions.forEach((s: any) => {
      const start = new Date(s.startedAt);
      const end = new Date(s.endedAt);
      const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
      totalSessionSeconds += duration;
    });
    const avgSessionSeconds = sessions.length > 0 ? Math.floor(totalSessionSeconds / sessions.length) : 0;

    // Progress histories for metrics
    const metrics = ['hang_20mm_7s', 'pullup_1rm', 'weight'] as const;
    const [hangHistory, pullHistory, weightHistory] = await Promise.all(
      metrics.map((m) =>
        UserProgress.find({ userId, metric: m }).sort({ date: 1 }).lean()
      )
    );

    // Build timeline dates
    const buildTimeline = (): Date[] => {
      if (period === '7d') {
        return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
      }
      if (period === '30d') {
        return Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
      }
      // all-time sampled to ~30 points
      const candidates = [hangHistory[0]?.date, pullHistory[0]?.date, weightHistory[0]?.date]
        .filter(Boolean)
        .map((d: any) => startOfUTCDay(new Date(d)));
      const start = candidates.length > 0 ? new Date(Math.min(...candidates.map((d) => d.getTime()))) : addDays(today, -29);
      const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const maxPoints = 30;
      const step = Math.max(1, Math.ceil(totalDays / maxPoints));
      const dates: Date[] = [];
      for (let d = new Date(start); d <= today; d = addDays(d, step)) dates.push(startOfUTCDay(d));
      const last = dates[dates.length - 1];
      if (!last || last.getTime() !== today.getTime()) dates.push(today);
      return dates;
    };

    const timeline = buildTimeline();

    // Utility: build forward-filled series for a metric
    const toSeries = (history: any[]): Array<{ value: number }> => {
      if (!history || history.length === 0) return timeline.map(() => ({ value: 0 }));
      let idx = 0;
      let lastVal = 0;
      const result: Array<{ value: number }> = [];
      for (const t of timeline) {
        while (idx < history.length) {
          const hDate = startOfUTCDay(new Date(history[idx].date));
          if (hDate.getTime() <= t.getTime()) {
            lastVal = Number(history[idx].value) || 0;
            idx++;
          } else break;
        }
        result.push({ value: lastVal });
      }
      return result;
    };

    const chartData = {
      hangData: toSeries(hangHistory),
      pullupData: toSeries(pullHistory),
      weightData: toSeries(weightHistory),
    };

    // Current metrics (latest values)
    const [latestHang, latestPull, latestWeight] = [hangHistory, pullHistory, weightHistory].map((h) =>
      h.length > 0 ? h[h.length - 1] : null
    );

    return res.json({
      totalSessionTime: formatDuration(totalSessionSeconds),
      averageSessionLength: formatDuration(avgSessionSeconds),
      current: {
        maxHang: latestHang ? `${latestHang.value}kg` : '—',
        maxPullup: latestPull ? `${latestPull.value}kg` : '—',
        maxWeight: latestWeight ? `${latestWeight.value}kg` : '—',
      },
      chartData,
    });
  } catch (error) {
    console.error('Analytics route error:', error);
    return res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
