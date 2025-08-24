import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import templatesRouter from './routes/templates';
import sessionsRouter from './routes/sessions';
import userProgressRouter from './routes/userProgress';
import analyticsRouter from './routes/analytics';
import { connectToDatabase } from './db';
import authRouter from './routes/auth';
import devSeedRouter from './routes/devSeed';

const app = express();
app.use(express.json());
connectToDatabase();


if (process.env.NODE_ENV !== 'production') {
	app.use('/api/dev', devSeedRouter);
}
app.use('/api/templates', templatesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/progress', userProgressRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);

export default app;
