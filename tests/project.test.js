// tests/project.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const projectRoutes = require('../routes/projectRoutes');
const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const { tokenSign } = require('../utils/handleJWT');
const { encrypt } = require('../utils/handlePassword');
const connectDB = require('../config/mongo');

const app = express();
app.use(express.json());
app.use('/api/project', projectRoutes);

let token;
let user;
let client;

beforeAll(async () => {
  await connectDB();
  const password = await encrypt('test1234');
  user = await User.create({
    email: 'testproject@example.com',
    password,
    status: 'verified'
  });
  client = await Client.create({
    name: 'Client Proj',
    email: 'clientproj@email.com',
    address: {
      street: 'Gran Vía',
      number: 10,
      postal: 28013,
      city: 'Madrid',
      province: 'Madrid'
    },
    createdBy: user._id
  });
  token = tokenSign(user);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Project.deleteMany();
});

describe('Project API', () => {
  it('should create a project', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Proyecto Uno',
        projectCode: 'PRJ001',
        email: 'proj@email.com',
        address: {
          street: 'Avenida A',
          number: 1,
          postal: 28000,
          city: 'Madrid',
          province: 'Madrid'
        },
        code: 'INT001',
        clientId: client._id
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.project.name).toBe('Proyecto Uno');
  });

  it('should get all projects', async () => {
    await Project.create({
      name: 'Proyecto Listado',
      projectCode: 'LIST01',
      email: 'list@email.com',
      address: {
        street: 'Calle Lista',
        number: 2,
        postal: 28002,
        city: 'Madrid',
        province: 'Madrid'
      },
      code: 'INTLIST',
      clientId: client._id,
      createdBy: user._id
    });
    const res = await request(app)
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/project/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Proyecto no encontrado o sin acceso');
  });
});
