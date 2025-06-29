const express = require('express');
const router = express.Router();
const { validateCreateClient } = require('../validators/clientValidator');
const auth = require('../middleware/auth');
const {
    createClient,
    updateClient,
    getAllClients,
    getClientById,
    archiveClient,
    deleteClient,
    getArchivedClients,
    unarchiveClient
  } = require('../controllers/clientController');
  


router.post('/', auth, validateCreateClient, createClient);
router.put('/:id', auth, validateCreateClient, updateClient);
router.get('/', auth, getAllClients);


router.get('/archived', auth, getArchivedClients);
router.get('/:id', auth, getClientById);



router.patch('/:id/archive', auth, archiveClient);
router.delete('/:id', auth, deleteClient);
router.patch('/:id/unarchive', auth, unarchiveClient);

module.exports = router;
