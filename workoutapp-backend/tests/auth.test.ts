import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import User from '../src/models/User';

beforeEach(async () => {
  try {
    await User.deleteMany({});
  } catch (error) {
    console.error('Error in beforeEach:', error);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'testpassword'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully.');
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test2@example.com', password: 'testpassword' }); // missing username
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should not register with duplicate email', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user3', email: 'duplicate@example.com', password: 'testpassword' });
    // Second registration with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user4', email: 'duplicate@example.com', password: 'testpassword' });
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with wrong password', async () => {
    // Register user
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user5', email: 'user5@example.com', password: 'testpassword' });
    // Attempt login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user5@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@example.com', password: 'testpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should login with correct credentials', async () => {
    // Register user
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user6', email: 'user6@example.com', password: 'testpassword' });
    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user6@example.com', password: 'testpassword' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });
});
