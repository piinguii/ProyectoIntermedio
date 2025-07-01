// tests/client.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const clientRoutes = require('../routes/clientRoutes');
const Client = require('../models/Client');
const User = require('../models/User');
const { tokenSign } = require('../utils/handleJWT');
const { encrypt } = require('../utils/handlePassword');
const connectDB = require('../config/mongo');

const app = express();
app.use(express.json());
app.use('/api/client', clientRoutes);

let token;
let user;

beforeAll(async () => {
  await connectDB();
  const password = await encrypt('test1234');
  user = await User.create({
    email: 'test@example.com',
    password,
    status: 'verified',
    company: {
      name: 'Test Company',
      cif: 'TEST-CIF',
      address: 'Company Address'
    }
  });
  token = tokenSign(user);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Client.deleteMany();
});

describe('Client API', () => {
  it('should create a client', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente 1',
        email: 'cliente1@email.com',
        address: {
          street: 'Calle 123',
          number: 12,
          postal: 28001,
          city: 'Madrid',
          province: 'Madrid'
        }
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.client.email).toBe('cliente1@email.com');
  });

  it('should update a client', async () => {
    const client = await Client.create({
      name: 'Original',
      email: 'original@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      address: {
        street: 'Calle 1',
        number: 1,
        postal: 28000,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
    .put(`/api/client/${client._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Actualizado',
      address: {
        street: 'Calle Actualizada',
        number: 100,
        postal: 28010,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.client.name).toBe('Actualizado');
  });

  it('should get all clients for the user or company', async () => {
    await Client.create({
      name: 'Cliente Visible',
      email: 'visible@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      address: {
        street: 'Calle 2',
        number: 2,
        postal: 28002,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.clients.length).toBeGreaterThan(0);
  });

  it('should get client by ID', async () => {
    const client = await Client.create({
      name: 'Cliente ID',
      email: 'clienteid@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      address: {
        street: 'Calle 3',
        number: 3,
        postal: 28003,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .get(`/api/client/${client._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.client.name).toBe('Cliente ID');
  });

  it('should archive a client', async () => {
    const client = await Client.create({
      name: 'Cliente Archivar',
      email: 'archivar@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      address: {
        street: 'Calle 4',
        number: 4,
        postal: 28004,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .patch(`/api/client/${client._id}/archive`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const updated = await Client.findById(client._id);
    expect(updated.archived).toBe(true);
  });

  it('should delete a client', async () => {
    const client = await Client.create({
      name: 'Cliente Eliminar',
      email: 'eliminar@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      address: {
        street: 'Calle 5',
        number: 5,
        postal: 28005,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .delete(`/api/client/${client._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const exists = await Client.findById(client._id);
    expect(exists).toBeNull();
  });

  it('should list archived clients', async () => {
    await Client.create({
      name: 'Cliente Archivado',
      email: 'archivado@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      archived: true,
      address: {
        street: 'Calle 6',
        number: 6,
        postal: 28006,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.clients.length).toBeGreaterThan(0);
  });

  it('should unarchive a client', async () => {
    const client = await Client.create({
      name: 'Cliente Restaurar',
      email: 'restaurar@email.com',
      createdBy: user._id,
      companyCIF: user.company.cif,
      archived: true,
      address: {
        street: 'Calle 7',
        number: 7,
        postal: 28007,
        city: 'Madrid',
        province: 'Madrid'
      }
    });
    const res = await request(app)
      .patch(`/api/client/${client._id}/unarchive`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const unarchived = await Client.findById(client._id);
    expect(unarchived.archived).toBe(false);
  });

  it('should return 404 for non-existent client', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/client/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
  
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Cliente no encontrado o sin acceso');
  });
  
});
