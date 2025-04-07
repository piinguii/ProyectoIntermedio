const express = require('express');
const upload = require('../storage/upload');
const router = express.Router();
const {
  registerUser,
  loginUser,
  validateUserEmail,
  updatePersonalData,
  updateCompanyData,
  uploadUserLogo,
  getUserProfile
} = require('../controllers/userController');
const {
  validateRegisterUser,
  validateLoginUser,
  validateEmailCode,
  validatePersonalData,
  validateCompanyData
} = require('../validators/userValidator');

const authMiddleware = require('../middleware/auth');

router.post('/login', validateLoginUser, loginUser);
router.post('/register', validateRegisterUser, registerUser);
router.put('/validate', validateEmailCode, validateUserEmail);
router.patch('/onboarding/personal', authMiddleware, validatePersonalData, updatePersonalData);
router.patch('/onboarding/company', authMiddleware, validateCompanyData, updateCompanyData);
router.patch(
  '/upload-logo',
  upload.single('logo'),
  uploadUserLogo
);
router.get('/profile', authMiddleware, getUserProfile);

module.exports = router;