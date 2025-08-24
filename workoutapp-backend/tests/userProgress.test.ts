import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/User';
import { UserProgress } from '../src/models/UserProgress';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await UserProgress.deleteMany({});
});

describe('User Progress Routes', () => {
  let user1Token: string;
  let user2Token: string;
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    user1 = await User.create({ username: 'u1', email: 'u1@test.com', password: 'hashed' });
    user2 = await User.create({ username: 'u2', email: 'u2@test.com', password: 'hashed' });
    user1Token = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET || 'your_jwt_secret');
    user2Token = jwt.sign({ userId: user2._id }, process.env.JWT_SECRET || 'your_jwt_secret');
  });

  describe('POST /api/progress', () => {
    it('rejects unauthorized access', async () => {
      const res = await request(app)
        .post('/api/progress')
        .send({ metric: 'weight', date: '2025-08-21', value: 75 });
      
      expect(res.status).toBe(401);
    });

    it('creates a new progress entry', async () => {
      const progressData = {
        metric: 'weight',
        date: '2025-08-21',
        value: 75.5
      };

      const res = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(progressData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Progress entry created');
      expect(res.body.result.upsertedCount).toBe(1);
    });

    it('updates existing progress entry for same date and metric', async () => {
      const progressData = {
        metric: 'weight',
        date: '2025-08-21',
        value: 75.5
      };

      await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(progressData);

      const updatedData = {
        metric: 'weight',
        date: '2025-08-21',
        value: 76.0
      };

      const res = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Progress entry updated');
      expect(res.body.result.modifiedCount).toBe(1);
    });

    it('normalizes date to start of day', async () => {
      const progressData = {
        metric: 'weight',
        date: '2025-08-21T14:30:00.000Z',
        value: 75.5
      };

      await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(progressData);

      // Try to create another entry for the same day but different time
      const secondEntry = {
        metric: 'weight',
        date: '2025-08-21T08:00:00.000Z',
        value: 76.0
      };

      const res = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(secondEntry);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Progress entry updated'); // Should update, not create
    });

    it('allows different users to have same metric/date', async () => {
      const progressData = {
        metric: 'weight',
        date: '2025-08-21',
        value: 75.5
      };

      // User 1 creates entry
      const res1 = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(progressData);

      // User 2 creates entry with same metric/date
      const res2 = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ ...progressData, value: 80.0 });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.message).toBe('Progress entry created');
      expect(res2.body.message).toBe('Progress entry created');
    });

    it('validates required fields', async () => {
      const testCases = [
        { metric: 'weight', date: '2025-08-21' }, // missing value
        { date: '2025-08-21', value: 75 }, // missing metric
        { metric: 'weight', value: 75 }, // missing date
        {} // missing all fields
      ];

      for (const testCase of testCases) {
        const res = await request(app)
          .post('/api/progress')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(testCase);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing required fields: metric, date, value');
      }
    });
  });
});
