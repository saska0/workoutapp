import express from 'express';
import { UserProgress } from '../models/UserProgress';
import { Types } from 'mongoose';
import { AuthRequest, authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

// POST - Update or create progress entry
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { metric, date, value } = req.body;
    const userId = req.user.userId;

    if (!metric || !date || value === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: metric, date, value' 
      });
    }

    // Convert date to start of day to ensure one entry per day
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const result = await UserProgress.updateOne(
      { 
        userId: new Types.ObjectId(userId), 
        metric, 
        date: dateObj 
      },
      { 
        $set: { value: Number(value) } 
      },
      { upsert: true }
    );

    return res.json({ 
      success: true, 
      message: result.upsertedCount > 0 ? 'Progress entry created' : 'Progress entry updated',
      result 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to update progress', details: errorMessage });
  }
});

router.get('/latest/:metric', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { metric } = req.params;
    const userId = req.user.userId;

    const latestEntry = await UserProgress.findOne({
      userId: new Types.ObjectId(userId),
      metric
    }).sort({ date: -1 });

    if (!latestEntry) {
      return res.status(404).json({ error: 'No progress entries found' });
    }

    return res.json(latestEntry);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to fetch latest progress', details: errorMessage });
  }
});

router.get('/last30days/:metric', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { metric } = req.params;
    const userId = req.user.userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentEntries = await UserProgress.find({
      userId: new Types.ObjectId(userId),
      metric,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    return res.json({
      period: 'Last 30 days',
      metric,
      entries: recentEntries
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to fetch recent progress', details: errorMessage });
  }
});

router.get('/all/:metric', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { metric } = req.params;
    const userId = req.user.userId;

    const allEntries = await UserProgress.find({
      userId: new Types.ObjectId(userId),
      metric
    }).sort({ date: 1 });

    return res.json({
      metric,
      totalEntries: allEntries.length,
      entries: allEntries
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to fetch all progress', details: errorMessage });
  }
});

// GET - All metrics for a user (overview)
router.get('/overview', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const userId = req.user.userId;

    const pipeline = [
      { $match: { userId: new Types.ObjectId(userId) } },
      { $sort: { date: -1 as const } },
      {
        $group: {
          _id: '$metric',
          latestEntry: { $first: '$$ROOT' },
          totalEntries: { $sum: 1 }
        }
      }
    ];

    const overview = await UserProgress.aggregate(pipeline);

    return res.json({
      userId,
      metrics: overview.map((item: any) => ({
        metric: item._id,
        latestValue: item.latestEntry.value,
        latestDate: item.latestEntry.date,
        totalEntries: item.totalEntries
      }))
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to fetch progress overview', details: errorMessage });
  }
});

export default router;
