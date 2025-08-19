import express from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/authMiddleware';
import { Session } from '../models/Session';

const router = express.Router();

type CompletedWorkoutInput = {
  templateId: string;
  name: string;
  startedAt: string | Date;
  endedAt: string | Date;
  durationSec?: number;
};

type CreateSessionBody = {
  startedAt: string | Date;
  endedAt: string | Date;
  notes?: string;
  completedWorkouts?: CompletedWorkoutInput[];
};

router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { startedAt, endedAt, notes, completedWorkouts = [] } = (req.body || {}) as CreateSessionBody;

    if (!startedAt || !endedAt) {
      return res.status(400).json({ error: 'startedAt and endedAt are required' });
    }

    const sAt = new Date(startedAt);
    const eAt = new Date(endedAt);
    if (isNaN(sAt.getTime()) || isNaN(eAt.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (eAt < sAt) {
      return res.status(400).json({ error: 'endedAt must be after startedAt' });
    }

  const mappedWorkouts = (completedWorkouts || []).map((w: CompletedWorkoutInput) => {
      const wStart = new Date(w.startedAt);
      const wEnd = new Date(w.endedAt);
      const duration = typeof w.durationSec === 'number' ? w.durationSec : Math.max(0, Math.round((wEnd.getTime() - wStart.getTime()) / 1000));
      return {
        templateId: w.templateId,
        name: w.name,
        startedAt: wStart,
        endedAt: wEnd,
        durationSec: duration,
      };
    });

    const doc = new Session({
      userId: req.user.userId,
      startedAt: sAt,
      endedAt: eAt,
      notes,
      completedWorkouts: mappedWorkouts,
    });

    const saved = await doc.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(400).json({ error: 'Failed to create session' });
  }
});

router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { from, to } = req.query as { from?: string; to?: string };
    const query: any = { userId: req.user.userId };
    if (from || to) {
      query.startedAt = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) query.startedAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) query.startedAt.$lte = d;
      }
      if (Object.keys(query.startedAt).length === 0) delete query.startedAt;
    }

    const sessions = await Session.find(query).sort({ startedAt: -1 }).lean();
    return res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
