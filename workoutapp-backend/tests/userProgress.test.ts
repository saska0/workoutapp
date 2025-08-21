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

  describe('GET /api/progress/latest/:metric', () => {
    beforeEach(async () => {
      // Create test data
      const testEntries = [
        { metric: 'weight', date: '2025-08-19', value: 74.0 },
        { metric: 'weight', date: '2025-08-21', value: 75.5 },
        { metric: 'weight', date: '2025-08-20', value: 74.8 },
        { metric: 'max_pull', date: '2025-08-21', value: 10 }
      ];

      for (const entry of testEntries) {
        await request(app)
          .post('/api/progress')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(entry);
      }
    });

    it('rejects unauthorized access', async () => {
      const res = await request(app).get('/api/progress/latest/weight');
      expect(res.status).toBe(401);
    });

    it('returns latest entry for specified metric', async () => {
      const res = await request(app)
        .get('/api/progress/latest/weight')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.metric).toBe('weight');
      expect(res.body.value).toBe(75.5); // Latest entry
      expect(new Date(res.body.date).toISOString()).toBe('2025-08-21T00:00:00.000Z');
    });

    it('returns 404 for non-existent metric', async () => {
      const res = await request(app)
        .get('/api/progress/latest/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No progress entries found');
    });

    it('only returns user\'s own data', async () => {
      // User 2 should not see user 1's data
      const res = await request(app)
        .get('/api/progress/latest/weight')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No progress entries found');
    });
  });

  describe('GET /api/progress/last30days/:metric', () => {
    beforeEach(async () => {
      // Create test data spanning different time periods
      const today = new Date('2025-08-21');
      const testEntries = [
        { metric: 'weight', date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 70.0 }, // 45 days ago
        { metric: 'weight', date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 72.0 }, // 25 days ago
        { metric: 'weight', date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 74.0 }, // 15 days ago
        { metric: 'weight', date: today.toISOString().split('T')[0], value: 75.5 }, // today
      ];

      for (const entry of testEntries) {
        await request(app)
          .post('/api/progress')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(entry);
      }
    });

    it('rejects unauthorized access', async () => {
      const res = await request(app).get('/api/progress/last30days/weight');
      expect(res.status).toBe(401);
    });

    it('returns entries from last 30 days only', async () => {
      const res = await request(app)
        .get('/api/progress/last30days/weight')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('Last 30 days');
      expect(res.body.metric).toBe('weight');
      expect(res.body.entries).toHaveLength(3); // Should exclude 45 days ago entry
      expect(res.body.entries[0].value).toBe(72.0); // 25 days ago (earliest in range)
      expect(res.body.entries[2].value).toBe(75.5); // today (latest in range)
    });

    it('returns empty array for metric with no recent entries', async () => {
      const res = await request(app)
        .get('/api/progress/last30days/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(0);
    });
  });

  describe('GET /api/progress/all/:metric', () => {
    beforeEach(async () => {
      const testEntries = [
        { metric: 'weight', date: '2025-07-01', value: 70.0 },
        { metric: 'weight', date: '2025-08-01', value: 72.0 },
        { metric: 'weight', date: '2025-08-21', value: 75.5 },
        { metric: 'max_pull', date: '2025-08-21', value: 10 }
      ];

      for (const entry of testEntries) {
        await request(app)
          .post('/api/progress')
          .set('Authorization', `Bearer ${user1Token}`)
          .send(entry);
      }
    });

    it('rejects unauthorized access', async () => {
      const res = await request(app).get('/api/progress/all/weight');
      expect(res.status).toBe(401);
    });

    it('returns all entries for specified metric', async () => {
      const res = await request(app)
        .get('/api/progress/all/weight')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.metric).toBe('weight');
      expect(res.body.totalEntries).toBe(3);
      expect(res.body.entries).toHaveLength(3);
      expect(res.body.entries[0].value).toBe(70.0); // Earliest
      expect(res.body.entries[2].value).toBe(75.5); // Latest
    });

    it('returns empty array for non-existent metric', async () => {
      const res = await request(app)
        .get('/api/progress/all/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalEntries).toBe(0);
      expect(res.body.entries).toHaveLength(0);
    });
  });
});
