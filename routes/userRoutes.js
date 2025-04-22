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
  getUserProfile,
  forgotPassword,
  resetPassword,
  inviteUser,
  deleteUser
} = require('../controllers/userController');
const {
  validateRegisterUser,
  validateLoginUser,
  validateEmailCode,
  validatePersonalData,
  validateCompanyData,
  validateForgotPassword,
  validateResetPassword,
  validateInvite
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
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

router.post('/invite', authMiddleware, validateInvite, inviteUser);


router.delete('/', authMiddleware, deleteUser);




module.exports = router;