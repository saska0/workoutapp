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

export default router;
