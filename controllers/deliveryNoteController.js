const DeliveryNote = require('../models/DeliveryNote');
const handlePDF = require('../utils/handlePDF');
const handlePinata = require('../utils/handlePinata');
const { handleHttpError } = require('../utils/handleError');

const createDeliveryNote = async (req, res) => {
  try {
    const { clientId, projectId, format, material, hours, description, workdate } = req.body;
    const user = req.user;
    const deliveryNote = await DeliveryNote.create({
      clientId,
      projectId,
      format,
      material,
      hours,
      description,
      workdate,
      user: user._id
    });
    res.status(201).json(deliveryNote);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al crear albarán');
  }
};

const getDeliveryNotes = async (req, res) => {
  try {
    const deliveryNotes = await DeliveryNote.find({ user: req.user._id });
    res.status(200).json(deliveryNotes);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener albaranes');
  }
};

const getDeliveryNote = async (req, res) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, user: req.user._id })
      .populate('clientId')
      .populate('projectId')
      .populate('user');
    if (!deliveryNote) return handleHttpError(res, 'Albarán no encontrado', 404);
    res.status(200).json(deliveryNote);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al buscar albarán');
  }
};

const getDeliveryNotePDF = async (req, res) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, user: req.user._id, signed: true })
      .populate('user')
      .populate('clientId')
      .populate('projectId');
    if (!deliveryNote) return handleHttpError(res, 'Albarán firmado no encontrado', 404);
    const pdf = await handlePinata.getFile(`${deliveryNote._id}.pdf`);
    res.status(200).json({ message: 'PDF del albarán obtenido', pdf });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener PDF del albarán');
  }
};

const signDeliveryNote = async (req, res) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, user: req.user._id })
      .populate('user')
      .populate('clientId')
      .populate('projectId');
    if (!deliveryNote) return handleHttpError(res, 'Albarán no encontrado', 404);
    await handlePDF(deliveryNote);
    await deliveryNote.updateOne({ signed: true });
    res.status(200).json({ message: 'Albarán firmado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al firmar albarán');
  }
};

const deleteDeliveryNote = async (req, res) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, user: req.user._id, signed: false });
    if (!deliveryNote) return handleHttpError(res, 'No se puede borrar un albarán firmado o inexistente', 404);
    await DeliveryNote.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Albarán eliminado permanentemente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al borrar albarán');
  }
};

const archiveDeliveryNote = async (req, res) => {
  try {
    const query = { _id: req.params.id, user: req.user._id, signed: false };
    const deliveryNote = await DeliveryNote.findOne(query);
    console.log('archive query:', query, 'found:', deliveryNote);
    if (!deliveryNote) return handleHttpError(res, 'No se puede archivar un albarán firmado o inexistente', 404);
    await deliveryNote.delete();
    res.status(200).json({ message: 'Albarán archivado' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al archivar albarán');
  }
};

const restoreDeliveryNote = async (req, res) => {
  try {
    const query = { _id: req.params.id, user: req.user._id };
    const deliveryNote = await DeliveryNote.findOneWithDeleted(query);
    console.log('restore query:', query, 'found:', deliveryNote);
    if (!deliveryNote) return handleHttpError(res, 'Albarán no encontrado para restaurar', 404);
    await deliveryNote.restore();
    res.status(200).json({ message: 'Albarán restaurado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al restaurar albarán');
  }
};

const getArchivedDeliveryNotes = async (req, res) => {
  try {
    const deliveryNotes = await DeliveryNote.findWithDeleted({ user: req.user._id, deleted: true });
    res.status(200).json(deliveryNotes);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener albaranes archivados');
  }
};

const getSignedDeliveryNotes = async (req, res) => {
  try {
    const deliveryNotes = await DeliveryNote.find({ user: req.user._id, signed: true });
    res.status(200).json(deliveryNotes);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener albaranes firmados');
  }
};

const getUnsignedDeliveryNotes = async (req, res) => {
  try {
    const deliveryNotes = await DeliveryNote.find({ user: req.user._id, signed: false });
    res.status(200).json(deliveryNotes);
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener albaranes sin firmar');
  }
};

module.exports = {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  getDeliveryNotePDF,
  signDeliveryNote,
  deleteDeliveryNote,
  archiveDeliveryNote,
  restoreDeliveryNote,
  getArchivedDeliveryNotes,
  getSignedDeliveryNotes,
  getUnsignedDeliveryNotes
};
