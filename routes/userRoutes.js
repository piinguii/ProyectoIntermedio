const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  validateUserEmail,
  updatePersonalData,
  updateCompanyData
} = require('../controllers/userController');
const {
  validateRegisterUser,
  validateLoginUser,
  validateEmailCode,
  validatePersonalData,
  validateCompanyData
} = require('../validators/userValidator');



router.post('/login', validateLoginUser, loginUser);
router.post('/register', validateRegisterUser, registerUser);
router.put('/validate', validateEmailCode, validateUserEmail);
router.patch('/onboarding/personal', validatePersonalData, updatePersonalData);
router.patch('/onboarding/company', validateCompanyData, updateCompanyData);

module.exports = router;