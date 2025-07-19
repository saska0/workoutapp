import express from 'express';
import templatesRouter from './routes/templates';
import { connectToDatabase } from './db';

const app = express();
app.use(express.json());
connectToDatabase();

app.use('/api/templates', templatesRouter);

export default app;
