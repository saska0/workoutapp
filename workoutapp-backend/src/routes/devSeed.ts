import mongoose from 'mongoose';
import express from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import { Session } from '../models/Session';
import { UserProgress } from '../models/UserProgress';

const router = express.Router();

router.post('/seed-history', authenticateJWT, async (req: AuthRequest, res) => {
  const { days = 45 } = req.body;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'No user' });
    return;
  }

  await Session.deleteMany({ userId });
  await UserProgress.deleteMany({ userId });

  const now = new Date();
  const sessions = [];
  const progress = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(18, 0, 0, 0);
    
    const progressDate = new Date(day);
    progressDate.setUTCHours(0, 0, 0, 0);

    sessions.push({
      userId,
      startedAt: new Date(day),
      endedAt: new Date(day.getTime() + 60 * 60 * 1000),
      completedWorkouts: [
        {
          templateId: new mongoose.Types.ObjectId(),
          name: 'Test Workout',
          startedAt: new Date(day),
          endedAt: new Date(day.getTime() + 60 * 60 * 1000),
          durationSec: 3600,
        },
      ],
      notes: 'Seeded session',
      createdAt: new Date(day),
      updatedAt: new Date(day),
    });

    progress.push(
      { userId, metric: 'hang_20mm_7s', date: progressDate, value: 10 + (i % 5), createdAt: new Date(day), updatedAt: new Date(day) },
      { userId, metric: 'pullup_1rm', date: progressDate, value: 20 + (i % 7), createdAt: new Date(day), updatedAt: new Date(day) },
      { userId, metric: 'weight', date: progressDate, value: 60 + i, createdAt: new Date(day), updatedAt: new Date(day) },
    );
  }

  await Session.insertMany(sessions);
  await UserProgress.insertMany(progress);

  res.json({ ok: true, sessions: sessions.length, progress: progress.length });
});

export default router;
