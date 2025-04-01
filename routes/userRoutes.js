
const express = require('express');
const router = express.Router();
const { registerUser, validateUserEmail, loginUser } = require('../controllers/userController');
const { validateRegisterUser, validateLoginUser } = require('../validators/userValidator');

router.post('/register', validateRegisterUser, registerUser);
router.post('/login', validateLoginUser, loginUser);
router.put('/validate', validateUserEmail);

module.exports = router;
