const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateCreateDeliveryNote } = require('../validators/deliveryNoteValidator'); // ✅ Import it
const {
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
} = require('../controllers/deliveryNoteController');

router.post('/', auth, validateCreateDeliveryNote, createDeliveryNote);

// Specific routes first to avoid conflicts with :id parameter
router.get('/archived/list', auth, getArchivedDeliveryNotes);
router.get('/signed', auth, getSignedDeliveryNotes);
router.get('/unsigned', auth, getUnsignedDeliveryNotes);
router.get('/pdf/:id', auth, getDeliveryNotePDF);
router.patch('/:id/sign', auth, signDeliveryNote);
router.delete('/:id/archive', auth, archiveDeliveryNote);
router.patch('/:id/restore', auth, restoreDeliveryNote);

// General routes
router.get('/', auth, getDeliveryNotes);
router.delete('/:id', auth, deleteDeliveryNote);
router.get('/:id', auth, getDeliveryNote);

module.exports = router;
