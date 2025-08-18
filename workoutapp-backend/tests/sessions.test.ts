import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/User';
import { Session } from '../src/models/Session';

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
  await Session.deleteMany({});
});

describe('Sessions Routes', () => {
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

  it('rejects unauthorized access', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(401);
  });

  it('creates a session without completedWorkouts', async () => {
    const body = {
      startedAt: '2025-08-18T09:00:00.000Z',
      endedAt: '2025-08-18T10:00:00.000Z',
      location: 'Home Gym',
    };
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(String(user1._id));
    expect(new Date(res.body.startedAt).toISOString()).toBe('2025-08-18T09:00:00.000Z');
    expect(new Date(res.body.endedAt).toISOString()).toBe('2025-08-18T10:00:00.000Z');
    expect(res.body.completedWorkouts).toEqual([]);
  });

  it('creates a session with completedWorkouts and derives durationSec when missing', async () => {
    const body = {
      startedAt: '2025-08-18T09:00:00.000Z',
      endedAt: '2025-08-18T10:15:00.000Z',
      completedWorkouts: [
        {
          templateId: new mongoose.Types.ObjectId().toString(),
          name: 'Leg Day',
          startedAt: '2025-08-18T09:05:00.000Z',
          endedAt: '2025-08-18T10:00:00.000Z',
        },
      ],
    };

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.completedWorkouts).toHaveLength(1);
    expect(res.body.completedWorkouts[0].name).toBe('Leg Day');
    expect(res.body.completedWorkouts[0].durationSec).toBe(55 * 60);
  });

  it('validates dates on create', async () => {
    const bad1 = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ endedAt: '2025-08-18T10:00:00.000Z' });
    expect(bad1.status).toBe(400);

    const bad2 = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ startedAt: 'not-a-date', endedAt: '2025-08-18T10:00:00.000Z' });
    expect(bad2.status).toBe(400);

    const bad3 = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ startedAt: '2025-08-18T11:00:00.000Z', endedAt: '2025-08-18T10:00:00.000Z' });
    expect(bad3.status).toBe(400);
  });

  it('lists sessions for the user and supports from/to filters', async () => {
    // user1 sessions on three different days
    const mk = async (isoStart: string, isoEnd: string) => {
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ startedAt: isoStart, endedAt: isoEnd });
    };
    await mk('2025-08-10T09:00:00.000Z', '2025-08-10T10:00:00.000Z');
    await mk('2025-08-15T09:00:00.000Z', '2025-08-15T10:00:00.000Z');
    await mk('2025-08-20T09:00:00.000Z', '2025-08-20T10:00:00.000Z');

    // another user's session should not appear
    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ startedAt: '2025-08-18T09:00:00.000Z', endedAt: '2025-08-18T10:00:00.000Z' });

    // no filters => all 3 for user1
    const all = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(3);

    // from filter => sessions on/after 2025-08-15
    const fromRes = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .query({ from: '2025-08-15T00:00:00.000Z' });
    expect(fromRes.status).toBe(200);
    expect(fromRes.body).toHaveLength(2);

    // to filter => sessions on/before 2025-08-15
    const toRes = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .query({ to: '2025-08-15T23:59:59.000Z' });
    expect(toRes.status).toBe(200);
    expect(toRes.body).toHaveLength(2);

    // from + to => only 2025-08-15
    const rangeRes = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${user1Token}`)
      .query({ from: '2025-08-15T00:00:00.000Z', to: '2025-08-15T23:59:59.000Z' });
    expect(rangeRes.status).toBe(200);
    expect(rangeRes.body).toHaveLength(1);
  });
});
