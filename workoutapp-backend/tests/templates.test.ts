import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/User';
import { WorkoutSequenceTemplate } from '../src/models/WorkoutSequenceTemplate';

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
  await WorkoutSequenceTemplate.deleteMany({});
});

describe('Template Routes', () => {
  let user1Token: string;
  let user2Token: string;
  let user1: any;
  let user2: any;
  
  beforeEach(async () => {
    user1 = await User.create({
      username: 'testuser1',
      email: 'test1@test.com',
      password: 'hashedpassword'
    });
    user2 = await User.create({
      username: 'testuser2',
      email: 'test2@test.com',
      password: 'hashedpassword'
    });
    user1Token = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET || 'your_jwt_secret');
    user2Token = jwt.sign({ userId: user2._id }, process.env.JWT_SECRET || 'your_jwt_secret');
  });

  describe('POST /', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'Test Template',
        steps: [
          {
            name: 'Step 1',
            kind: 'exercise',
            durationSec: 30,
            reps: 3,
            restDurationSec: 60
          }
        ],
        userId: user1._id,
        isPublic: false
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(templateData.name);
      expect(response.body.steps).toHaveLength(1);
      expect(response.body.userId).toBe(user1._id.toString());
    });

    it('should not create template for unauthorized user', async () => {
      const templateData = {
        name: 'Test Template',
        steps: [],
        userId: user1._id,
      };

      const response = await request(app)
        .post('/api/templates')
        .send(templateData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /user', () => {
    it('should get user\'s templates', async () => {
      await WorkoutSequenceTemplate.create({
        name: 'User 1 Template',
        steps: [],
        userId: user1._id
      });
      await WorkoutSequenceTemplate.create({
        name: 'User 2 Template',
        steps: [],
        userId: user2._id
      });

      const response = await request(app)
        .get('/api/templates/user')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('User 1 Template');
    });
  });

  describe('GET /shared', () => {
    it('should get shared templates', async () => {
      await WorkoutSequenceTemplate.create({
        name: 'Private Template',
        steps: [],
        userId: user2._id,
        isPublic: false
      });
      await WorkoutSequenceTemplate.create({
        name: 'Shared Template',
        steps: [],
        userId: user2._id,
        isPublic: true
      });

      const response = await request(app)
        .get('/api/templates/shared')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Shared Template');
    });
  });

  describe('PATCH /:id/share', () => {
    it('should update template sharing status', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Test Template',
        steps: [],
        userId: user1._id,
        isPublic: false
      });

      const response = await request(app)
        .patch(`/api/templates/${template._id}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ isPublic: true });

      expect(response.status).toBe(200);
      expect(response.body.isPublic).toBe(true);
    });

    it('should not allow unauthorized sharing', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Test Template',
        steps: [],
        userId: user1._id,
        isPublic: false
      });

      const response = await request(app)
        .patch(`/api/templates/${template._id}/share`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ isPublic: true });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /:id', () => {
    it('should update an owned template', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Original',
        steps: [{ name: 'S1', kind: 'exercise', durationSec: 10 }],
        userId: user1._id,
        isPublic: false,
      });

      const body = {
        name: 'Updated Name',
        steps: [
          { name: '11', kind: 'prepare', durationSec: 30 },
          { name: '22', kind: 'exercise', reps: 15, restDurationSec: 45 },
        ],
        isPublic: true,
      };

      const res = await request(app)
        .put(`/api/templates/${template._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(body.name);
      expect(res.body.steps).toHaveLength(2);
      expect(res.body.isPublic).toBe(true);
    });

    it('should not allow updating someone else\'s template', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Original',
        steps: [],
        userId: user1._id,
      });

      const res = await request(app)
        .put(`/api/templates/${template._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should 404 for missing template', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/templates/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Nope' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /:id/copy', () => {
    it('should copy a template', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Original Template',
        steps: [{ name: 'Step 1', kind: 'exercise', durationSec: 30 }],
        userId: user1._id,
        isPublic: true
      });

      const response = await request(app)
        .post(`/api/templates/${template._id}/copy`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ userId: user2._id });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Original Template');
      expect(response.body.userId).toBe(user2._id.toString());
      expect(response.body.isPublic).toBe(false);
    });
  });

  describe('GET /selected', () => {
    it('should get user\'s selected templates', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Selected Template',
        steps: [],
        userId: user1._id
      });

      user1.selectedTemplates = [template._id];
      await user1.save();

      const response = await request(app)
        .get('/api/templates/selected')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Selected Template');
    });
  });

  describe('PATCH /selected', () => {
    it('should update user\'s selected templates', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Template to Select',
        steps: [],
        userId: user1._id
      });

      const response = await request(app)
        .patch('/api/templates/selected')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ selectedTemplates: [template._id] });

      expect(response.status).toBe(200);
      expect(response.body.selectedTemplates).toHaveLength(1);
      expect(response.body.selectedTemplates[0].toString()).toBe(template._id.toString());
    });

    it('should ignore selecting templates not owned by the user', async () => {
      const othersTemplate = await WorkoutSequenceTemplate.create({
        name: 'Others Template',
        steps: [],
        userId: user2._id
      });

      const res = await request(app)
        .patch('/api/templates/selected')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ selectedTemplates: [othersTemplate._id] });

      expect(res.status).toBe(200);
      expect(res.body.selectedTemplates).toHaveLength(0);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a template the user owns and remove it from the owner\'s selected list', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'To Delete',
        steps: [],
        userId: user1._id
      });

      user1.selectedTemplates = [template._id];
      await user1.save();

      const res = await request(app)
        .delete(`/api/templates/${template._id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(204);

      const found = await WorkoutSequenceTemplate.findById(template._id);
      expect(found).toBeNull();

      const updatedUser1 = await User.findById(user1._id);
      expect(updatedUser1?.selectedTemplates || []).toHaveLength(0);
    });

    it('should not allow deleting someone else\'s template', async () => {
      const template = await WorkoutSequenceTemplate.create({
        name: 'Not Yours',
        steps: [],
        userId: user1._id
      });

      const res = await request(app)
        .delete(`/api/templates/${template._id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for missing template', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/templates/${fakeId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(404);
    });
  });
});
