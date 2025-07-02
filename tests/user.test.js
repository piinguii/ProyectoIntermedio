const request = require('supertest');
const app = require('../index'); // adjust path if needed
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/mongo');

// MOCK THE EMAIL SENDER
jest.mock('../utils/handleMail', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

beforeAll(async () => {
  await connectDB();
  // Wait for the connection to be ready
  await new Promise(resolve => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) return resolve();
    mongoose.connection.once('open', resolve);
  });
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Auth Routes', () => {
  const userData = {
    email: 'testuser@example.com',
    password: 'Password123',
    name: 'Test',
    age: 30
  };

  let token = '';
  let verificationCode = '';

  it('should register a user', async () => {
    const res = await request(app).post('/api/user/register').send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userData.email);
    token = res.body.token;

    const user = await User.findOne({ email: userData.email });
    verificationCode = user.code || user.verificationCode;
    expect(user).not.toBeNull();
  });

  it('should verify the user email', async () => {
    const res = await request(app)
      .put('/api/user/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: verificationCode });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Email verificado correctamente');
  });

  it('should fail to register the same verified user again', async () => {
    const res = await request(app).post('/api/user/register').send(userData);
    expect(res.statusCode).toBe(409);
  });

  it('should login the user', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: userData.email,
      password: userData.password
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(userData.email);
  });

  it('should not login with wrong password', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: userData.email,
      password: 'WrongPassword'
    });

    expect(res.statusCode).toBe(401);
  });

  it('should not login with non-existing email', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: 'nonexistent@example.com',
      password: 'Password123'
    });

    expect(res.statusCode).toBe(401);
  });
});

console.log('Registered routes:');
if (app._router && app._router.stack) {
  app._router.stack.forEach((middleware) => {
    // ...
  });
}
