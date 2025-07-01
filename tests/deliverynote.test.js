const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const deliveryNoteRouter = require('../routes/deliveryNoteRoutes');
const DeliveryNote = require('../models/DeliveryNote');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const connectDB = require('../config/mongo');
const { tokenSign } = require('../utils/handleJWT');
const { encrypt } = require('../utils/handlePassword');
const handlePDF = require('../utils/handlePDF');
const app = express();
app.use(express.json());
app.use('/api/deliveryNotes', deliveryNoteRouter);

describe('Rutas de Notas de Entrega', () => {
  let token;
  let userId;
  let clientId;
  let projectId;
  let dataDeliveryNote;

  beforeAll(async () => {
    await connectDB();
 
    const password = await encrypt('password123');
    const user = await User.create({
      name: 'Test User',
      email: 'testdelivery@example.com',
      password,
      status: 'verified',
      address: {
        street: 'Main St',
        number: 1,
        postal: 12345,
        city: 'TestCity',
        province: 'TestProvince'
      }
    });
    userId = user._id;
    token = tokenSign(user);
    
    const client = await Client.create({
      name: 'Test Client',
      email: 'clientdelivery@example.com',
      password: 'clientpass',
      cif: 'A12345678',
      user: userId,
      address: {
        street: 'Main St',
        number: 1,
        postal: 12345,
        city: 'TestCity',
        province: 'TestProvince'
      }
    });
    clientId = client._id;
    const project = await Project.create({
      name: 'Test Project',
      projectCode: 'PRJDN001',
      email: 'projectdelivery@example.com',
      address: {
        street: 'Main St',
        number: 1,
        postal: 12345,
        city: 'TestCity',
        province: 'TestProvince'
      },
      code: 'INTDN001',
      clientId: clientId,
      createdBy: userId
    });
    projectId = project._id;

    dataDeliveryNote = {
      clientId,
      projectId,
      format: 'material',
      material: 'Arena',
      description: 'Entrega de prueba',
      address: {
        street: 'Main St',
        number: 1,
        postal: 12345,
        city: 'TestCity',
        province: 'TestProvince'
      },
      workdate: new Date().toISOString().slice(0, 10),
      signed: false
    };
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await connectDB();  
  });

  afterEach(async () => {
    await DeliveryNote.deleteMany({});
  });

  describe('PATCH /deliveryNotes/:id/sign', () => {
    it('debería firmar una nota de entrega', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega para firmar',
        user: userId
      });
      const res = await request(app)
        .patch(`/api/deliveryNotes/${note._id}/sign`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      const signed = await DeliveryNote.findById(note._id);

      expect(signed.signed).toBe(true);
    });
  });

  describe('POST /deliveryNotes', () => {
    it('debería crear una nueva nota de entrega', async () => {
      const res = await request(app)
        .post('/api/deliveryNotes')
        .set('Authorization', `Bearer ${token}`)
        .send(dataDeliveryNote);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('description', 'Entrega de prueba');
    });

    it('debería fallar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/deliveryNotes')
        .send(dataDeliveryNote);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'NOT_TOKEN');
    });
  });

  describe('GET /deliveryNotes', () => {
    it('debería obtener solo las notas de entrega activas (no eliminadas)', async () => {
      const activeNote = await DeliveryNote.create({...dataDeliveryNote, user: userId});
      const deletedNote = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega eliminada',
        user: userId
      });
      await deletedNote.delete();

      const res = await request(app)
        .get('/api/deliveryNotes')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(n => n.description === 'Entrega de prueba')).toBe(true);
      expect(res.body.some(n => n.description === 'Entrega eliminada')).toBe(false);
    });
  });

  describe('GET /deliveryNotes/archived', () => {
    it('debería obtener solo las notas de entrega eliminadas', async () => {
      const activeNote = await DeliveryNote.create({...dataDeliveryNote, user: userId});
      const deletedNote = await DeliveryNote.create({
        clientId,
        projectId,
        format: 'material',
        material: 'Arena',
        workdate: new Date().toISOString().slice(0, 10),
        hours: 10,
        address: {
          street: 'Main St',
          number: 1,
          postal: 12345,
          city: 'TestCity',
          province: 'TestProvince'
        },
        description: 'Entrega eliminada',
        user: userId
      });
      await deletedNote.delete();

      const res = await request(app)
        .get('/api/deliveryNotes/archived/list')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(n => n.description === 'Entrega eliminada')).toBe(true);
      expect(res.body.some(n => n.description === 'Entrega de prueba')).toBe(false);
    });
  });

  describe('GET /deliveryNotes/:id', () => {
    it('debería obtener una nota de entrega por id', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega por id',
        user: userId
      });
      const res = await request(app)
        .get(`/api/deliveryNotes/${note._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('description', 'Entrega por id');
    });

    it('debería devolver 404 para una nota inexistente', async () => {
      const res = await request(app)
        .get(`/api/deliveryNotes/668888888888888888888888`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /deliveryNotes/restore/:id', () => {
    it('debería restaurar una nota de entrega eliminada', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega eliminada',
        user: userId
      });
      console.log('Created note for restore:', { _id: note._id, user: note.user, userId });

      await note.delete();
      console.log('Note deleted, now trying to restore');
      
      const res = await request(app)
        .patch(`/api/deliveryNotes/${note._id}/restore`)
        .set('Authorization', `Bearer ${token}`);
      
      console.log('Restore response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      const restored = await DeliveryNote.findOne({ _id: note._id });
      expect(restored).not.toBeNull();
      expect(restored.deleted).toBe(false);
    });
  });

  describe('DELETE /deliveryNotes/archive/:id', () => {
    it('debería eliminar suavemente una nota de entrega', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega para eliminar',
        user: userId
      });
      console.log('Created note for archive:', { _id: note._id, user: note.user, userId });
      
      const res = await request(app)
        .delete(`/api/deliveryNotes/${note._id}/archive`)
        .set('Authorization', `Bearer ${token}`);

      console.log('Archive response:', res.statusCode, res.body);
      expect(res.statusCode).toBe(200);
      const deleted = await DeliveryNote.findOneWithDeleted({ _id: note._id });
      expect(deleted.deleted).toBe(true);
    });
  });

  describe('DELETE /deliveryNotes/:id', () => {
    it('debería eliminar permanentemente una nota de entrega', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega para borrar',
        user: userId
      });
      const res = await request(app)
        .delete(`/api/deliveryNotes/${note._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      const deleted = await DeliveryNote.findOne({ _id: note._id });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /deliveryNotes/signed', () => {
    it('debería obtener solo las notas de entrega firmadas', async () => {
      const signedNote = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega firmada',
        signed: true,
        user: userId
      });
      const unsignedNote = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega sin firmar',
        signed: false,
        user: userId
      });
      const res = await request(app)
        .get('/api/deliveryNotes/signed')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.some(n => n.signed === true)).toBe(true);
      expect(res.body.some(n => n.signed === false)).toBe(false);
    });
  });

  describe('GET /deliveryNotes/unsigned', () => {
    it('debería obtener solo las notas de entrega sin firmar', async () => {
      const signedNote = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega firmada',
        signed: true,
        user: userId
      });
      const unsignedNote = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega sin firmar',
        signed: false,
        user: userId
      });
      const res = await request(app)
        .get('/api/deliveryNotes/unsigned')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.some(n => n.signed === false)).toBe(true);
      expect(res.body.some(n => n.signed === true)).toBe(false);
    });
  });

  describe('GET /deliveryNotes/pdf/:id', () => {
    it('debería obtener el pdf de una nota de entrega', async () => {
      const note = await DeliveryNote.create({
        ...dataDeliveryNote,
        description: 'Entrega para firmar',
        signed: true,
        user: userId
      });
      const newNote = await DeliveryNote.findOne({ _id: note._id }).populate('user').populate('clientId').populate('projectId');
      const pdf = await handlePDF(newNote);
      const res = await request(app)
        .get(`/api/deliveryNotes/pdf/${note._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pdf');
      expect(res.body.pdf).toHaveProperty('url');
    });
  });
});
