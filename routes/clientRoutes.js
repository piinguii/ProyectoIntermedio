const express = require('express');
const router = express.Router();
const { createClient } = require('../controllers/clientController');
const { validateCreateClient } = require('../validators/clientValidator');
const auth = require('../middleware/auth');

router.post('/client', auth, validateCreateClient, createClient);

module.exports = router;
