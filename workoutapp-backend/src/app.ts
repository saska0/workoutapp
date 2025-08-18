import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import templatesRouter from './routes/templates';
import sessionsRouter from './routes/sessions';
import { connectToDatabase } from './db';
import authRouter from './routes/auth';

const app = express();
app.use(express.json());
connectToDatabase();

app.use('/api/templates', templatesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/auth', authRouter);

export default app;
