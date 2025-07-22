import express from 'express';
import { WorkoutSequenceTemplate } from '../models/WorkoutSequenceTemplate';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, steps, userId } = req.body;

    const newTemplate = new WorkoutSequenceTemplate({
      name,
      steps,
      userId
    });

    const saved = await newTemplate.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const templates = await WorkoutSequenceTemplate.find();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export default router;
