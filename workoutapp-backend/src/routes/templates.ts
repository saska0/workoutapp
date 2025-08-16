import express from 'express';
import { WorkoutSequenceTemplate } from '../models/WorkoutSequenceTemplate';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';

const router = express.Router();

router.get('/selected', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(req.user.userId).populate('selectedTemplates');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user.selectedTemplates || []);
  } catch (error) {
    console.error('Error fetching selected templates:', error);
    return res.status(500).json({ error: 'Failed to fetch selected templates' });
  }
});

router.patch('/selected', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { selectedTemplates } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.selectedTemplates = selectedTemplates;
    await user.save();
    return res.json({ success: true, selectedTemplates: user.selectedTemplates });
  } catch (error) {
    console.error('Error updating selected templates:', error);
    return res.status(500).json({ error: 'Failed to update selected templates' });
  }
});

router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { name, steps, isPublic = false } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const newTemplate = new WorkoutSequenceTemplate({
      name,
      steps,
      userId: req.user.userId,
      isPublic
    });
    const saved = await newTemplate.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(400).json({ error: 'Invalid data' });
  }
});

router.get('/user', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const templates = await WorkoutSequenceTemplate.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.json(templates);
  } catch (error) {
    console.error('Error fetching user templates:', error);
    return res.status(500).json({ error: 'Failed to fetch user templates' });
  }
});

router.get('/shared', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const templates = await WorkoutSequenceTemplate.find({ isPublic: true, userId: { $ne: req.user.userId } }).sort({ createdAt: -1 });
    return res.json(templates);
  } catch (error) {
    console.error('Error fetching shared templates:', error);
    return res.status(500).json({ error: 'Failed to fetch shared templates' });
  }
});

router.patch('/:id/share', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { isPublic } = req.body;
    const template = await WorkoutSequenceTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!req.user || template.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    template.isPublic = !!isPublic;
    await template.save();
    return res.json(template);
  } catch (error) {
    console.error('Error sharing workout:', error);
    return res.status(400).json({ error: 'Failed to update sharing status' });
  }
});

router.post('/:id/copy', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const template = await WorkoutSequenceTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const copy = new WorkoutSequenceTemplate({
      name: template.name,
      steps: template.steps,
      userId,
      isPublic: false
    });
    const saved = await copy.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error copying template:', error);
    return res.status(400).json({ error: 'Failed to copy template' });
  }
});

export default router;
