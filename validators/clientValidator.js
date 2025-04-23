const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validateCreateClient = [
  check('name').exists().notEmpty().isString(),
  check('email').optional().isEmail(),
  check('phone').optional().isString(),
  check('address').optional().isString(),
  (req, res, next) => validateResults(req, res, next)
];

module.exports = { validateCreateClient };
