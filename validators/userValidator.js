const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

// Validaciones completas para el registro
// Definir validador para que sea un email válido.
// Definir validador para que la password contenga al menos 8 caracteres.
const validateRegisterUser = [
  check("name")
    .exists().notEmpty().isLength({ min: 3, max: 99 })
    .withMessage('El nombre debe tener entre 3 y 99 caracteres'),

  check("age")
    .optional().isNumeric()
    .withMessage('La edad ha de ser un numero'),

  check("email")
    .exists().notEmpty().isEmail()
    .withMessage('Email no válido'),

  check("password")
    .exists().notEmpty().isLength({ min: 8, max: 16 })
    .withMessage('La contraseña debe tener entre 8 y 16 caracteres'),

  (req, res, next) => {
    return validateResults(req, res, next);
  }
];

const validateEmailCode = [
  check('code')
    .exists().notEmpty().isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener exactamente 6 dígitos'),
  (req, res, next) => validateResults(req, res, next)
];

const validateLoginUser = [
    check("email")
      .exists().notEmpty().isEmail()
      .withMessage('Debe proporcionar un email válido'),
  
    check("password")
      .exists().notEmpty()
      .withMessage('Debe proporcionar una contraseña'),
  
    (req, res, next) => {
      return validateResults(req, res, next);
    }
  ];
  

const validatePersonalData = [
    check('name').exists().notEmpty().isString(),
    check('lastname').exists().notEmpty().isString(),
    check('nif').exists().notEmpty().isLength({min: 9, max: 9}),
    (req, res, next) => validateResults(req, res, next)
  ];
  
  const validateCompanyData = [
    check('name').exists().notEmpty().isString(),
    check('cif').exists().notEmpty().isString(),
    check('address').exists().notEmpty().isString(),
    check('isFreelancer').optional().isBoolean(),
    (req, res, next) => validateResults(req, res, next)
  ];
  
  module.exports = {
    validateRegisterUser,
    validateEmailCode,
    validateLoginUser,
    validatePersonalData,
    validateCompanyData
  };
  

