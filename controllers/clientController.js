const Client = require('../models/Client');
const { matchedData } = require('express-validator');
const { handleHttpError } = require('../utils/handleError');

// POST: Crear cliente
const createClient = async (req, res) => {
  const { name, email, address } = matchedData(req);
  const user = req.user;

  try {
    const existing = await Client.findOne({
      email,
      $or: [
        { createdBy: user._id },
        { companyCIF: user.company?.cif }
      ]
    });

    if (existing) return handleHttpError(res, 'Ya existe un cliente con ese email para ti o tu compañía', 409);

    const client = new Client({
      name,
      email,
      address,
      createdBy: user._id,
      companyCIF: user.company?.cif || null
    });

    await client.save();
    res.status(201).json({ message: 'Cliente creado correctamente', client });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al crear cliente');
  }
};

// PUT: Actualizar cliente
const updateClient = async (req, res) => {
  const { id } = req.params;
  const data = matchedData(req);
  const user = req.user;

  try {
    const client = await Client.findById(id);
    if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

    const belongsToUserOrCompany =
      client.createdBy.equals(user._id) || client.companyCIF === user.company?.cif;

    if (!belongsToUserOrCompany)
      return handleHttpError(res, 'No tienes permiso para editar este cliente', 403);

    Object.assign(client, data);
    await client.save();

    res.status(200).json({ message: 'Cliente actualizado', client });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al actualizar cliente');
  }
};

// GET: Todos los clientes
const getAllClients = async (req, res) => {
  const user = req.user;

  try {
    const clients = await Client.find({
      archived: false,
      $or: [
        { createdBy: user._id },
        { companyCIF: user.company?.cif }
      ]
    });

    res.status(200).json({ clients });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener clientes');
  }
};

// GET: Cliente por ID
const getClientById = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (
      !client ||
      client.archived ||
      (!client.createdBy.equals(user._id) && client.companyCIF !== user.company?.cif)
    ) return handleHttpError(res, 'Cliente no encontrado o sin acceso', 404);

    res.status(200).json({ client });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener cliente');
  }
};

// PATCH: Archivar cliente
const archiveClient = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (
      !client ||
      (!client.createdBy.equals(user._id) && client.companyCIF !== user.company?.cif)
    ) return handleHttpError(res, 'No tienes acceso a este cliente', 403);

    client.archived = true;
    await client.save();

    res.status(200).json({ message: 'Cliente archivado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al archivar cliente');
  }
};

// DELETE: Eliminar cliente
const deleteClient = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (
      !client ||
      (!client.createdBy.equals(user._id) && client.companyCIF !== user.company?.cif)
    ) return handleHttpError(res, 'No tienes acceso a este cliente', 403);

    await client.deleteOne();
    res.status(200).json({ message: 'Cliente eliminado permanentemente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al eliminar cliente');
  }
};

// GET: Clientes archivados
const getArchivedClients = async (req, res) => {
  const user = req.user;

  try {
    const clients = await Client.find({
      archived: true,
      $or: [
        { createdBy: user._id },
        { companyCIF: user.company?.cif }
      ]
    });

    res.status(200).json({ clients });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener clientes archivados');
  }
};

// PATCH: Restaurar cliente
const unarchiveClient = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (
      !client ||
      (!client.createdBy.equals(user._id) && client.companyCIF !== user.company?.cif)
    ) return handleHttpError(res, 'No tienes acceso a este cliente', 403);

    client.archived = false;
    await client.save();

    res.status(200).json({ message: 'Cliente restaurado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al restaurar cliente');
  }
};

module.exports = {
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  archiveClient,
  deleteClient,
  getArchivedClients,
  unarchiveClient
};
