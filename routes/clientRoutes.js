const express = require('express');
const router = express.Router();
const { createClient } = require('../controllers/clientController');
const { validateCreateClient } = require('../validators/clientValidator');
const auth = require('../middleware/auth');
const { updateClient } = require('../controllers/clientController');

router.post('/client', auth, validateCreateClient, createClient);

const { updateClient } = require('../controllers/clientController');

router.put('/client/:id', auth, validateCreateClient, updateClient);


module.exports = router;
